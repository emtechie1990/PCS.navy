"""Client pricing, prepaid plans, renewals, the housing slot rule, ad tracking and the catalog feed.

Runs against the local MongoDB in a throwaway database; Stripe and Resend are never contacted.
"""

import asyncio
import os
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

from lib.catalog import PRODUCTS, add_months, quote
from models.schemas import now_utc
from routers import business, payments

MONGO = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
OWNER = {"id": "owner-1", "email": "owner@example.com", "role": "user"}


def test_property_quotes_match_client_pricing():
    expected = {
        "apartment_community": (150000, 300000),
        "military_homeowner": (15000, 30000),
        "civilian_homeowner": (30000, 60000),
        "property_management_company": (6600, 13200),
    }
    for customer_type, (initial, renewal) in expected.items():
        result = quote(customer_type, 2)
        assert result["status"] == "ready_for_payment_setup"
        assert result["initial_amount_cents"] == initial * 2
        assert result["annual_renewal_cents"] == renewal * 2
        assert PRODUCTS[customer_type]["initial_term_months"] == 6
        assert PRODUCTS[customer_type]["monthly_per_property"] * 6 == initial


def test_real_estate_campaigns_require_market_quote():
    result = quote("real_estate_company", 1)
    assert result["status"] == "pricing_required"
    assert "priced by selected market" in result["message"]


def test_add_months_clamps_to_month_end():
    assert add_months(datetime(2026, 8, 31, tzinfo=timezone.utc), 6) == datetime(2027, 2, 28, tzinfo=timezone.utc)
    assert add_months(datetime(2027, 2, 28, tzinfo=timezone.utc), 12) == datetime(2028, 2, 28, tzinfo=timezone.utc)


def _run(monkeypatch, scenario):
    """Point both routers at a fresh database, run the scenario, drop the database."""
    async def main():
        client = AsyncIOMotorClient(MONGO, tz_aware=True, serverSelectionTimeoutMS=3000)
        db = client[f"pcs_test_{os.getpid()}"]
        monkeypatch.setattr(business, "db", db)
        monkeypatch.setattr(payments, "db", db)
        try:
            await scenario(db)
        finally:
            await client.drop_database(db.name)
            client.close()
    asyncio.run(main())


def _payments(monkeypatch, on: bool):
    monkeypatch.setenv("PAYMENTS_ENABLED", "true" if on else "false")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_dummy")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_dummy")


async def _profile(db, customer_type="military_homeowner"):
    await db.account_profiles.insert_one({"id": "acct-1", "owner_id": OWNER["id"], "customer_type": customer_type,
                                          "business_name": "Test Co", "billing_email": "billing@example.com",
                                          "phone": None, "created_at": now_utc(), "updated_at": now_utc()})


def test_plan_checkout_is_inert_while_payments_are_off(monkeypatch):
    _payments(monkeypatch, on=False)

    async def stripe_must_not_run(*a, **k):
        raise AssertionError("Stripe called while payments are off")
    monkeypatch.setattr(payments, "_stripe_post", stripe_must_not_run)

    async def scenario(db):
        await _profile(db)
        out = await payments.plan_checkout(payments.PlanCheckoutIn(property_count=3), OWNER)
        assert out.status == "not_configured" and not out.checkout_url
        assert await db.billing_plans.count_documents({}) == 0
        await business.require_housing_slot(None)  # no-op: anyone may post housing while payments are off
    _run(monkeypatch, scenario)


def test_plan_purchase_renewal_and_slots(monkeypatch):
    _payments(monkeypatch, on=True)
    sent = {}

    async def fake_stripe(path, form):
        sent.update(form)
        return {"id": "cs_1", "url": "https://checkout.stripe.test/cs_1"}
    monkeypatch.setattr(payments, "_stripe_post", fake_stripe)

    async def scenario(db):
        await _profile(db, "apartment_community")
        out = await payments.plan_checkout(payments.PlanCheckoutIn(property_count=2), OWNER)
        assert out.status == "requires_redirect"
        # 6-month fee now, $3,000/yr per property renewing automatically when the 6 months end
        assert sent["mode"] == "subscription"
        assert sent["line_items[0][price_data][unit_amount]"] == "150000"
        assert sent["line_items[1][price_data][unit_amount]"] == "300000"
        assert sent["line_items[1][price_data][recurring][interval]"] == "year"
        assert sent["line_items[0][quantity]"] == sent["line_items[1][quantity]"] == "2"
        intent = await db.payment_intents.find_one({"provider_ref": "cs_1"})
        assert int(intent["term_end"].timestamp()) == int(sent["subscription_data[trial_end]"])
        assert await business.paid_properties(OWNER["id"]) == 0  # nothing covered until Stripe says paid

        await payments._fulfil(intent, "sub_1")
        plan = await db.billing_plans.find_one({})
        assert plan["status"] == "active" and plan["paid_through"] == intent["term_end"]
        assert await business.paid_properties(OWNER["id"]) == 2

        renewal = {"id": "in_2", "billing_reason": "subscription_cycle",
                   "parent": {"subscription_details": {"subscription": "sub_1"}}}
        await payments._subscription_event("invoice.paid", renewal)
        await payments._subscription_event("invoice.paid", renewal)  # Stripe resend: no second year
        plan = await db.billing_plans.find_one({})
        assert plan["paid_through"] == add_months(intent["term_end"], 12)

        await payments._subscription_event("invoice.paid", {"id": "in_1", "billing_reason": "subscription_create",
                                                            "subscription": "sub_1"})
        assert (await db.billing_plans.find_one({}))["paid_through"] == add_months(intent["term_end"], 12)

        # two slots: two housing listings fit, the third is refused
        for i in range(2):
            await business.require_housing_slot(OWNER)
            await db.listings.insert_one({"id": f"l{i}", "owner_id": OWNER["id"], "category": "housing", "status": "approved"})
        with pytest.raises(HTTPException) as err:
            await business.require_housing_slot(OWNER)
        assert err.value.status_code == 402
        await business.require_housing_slot({"id": "admin", "role": "admin"})  # admins are never blocked
        with pytest.raises(HTTPException) as err:
            await business.require_housing_slot(None)
        assert err.value.status_code == 401

        await payments._subscription_event("customer.subscription.deleted", {"id": "sub_1"})
        plan = await db.billing_plans.find_one({})
        assert plan["status"] == "canceled" and not plan["auto_renew"]
        assert await business.paid_properties(OWNER["id"]) == 2  # paid coverage runs to paid_through
    _run(monkeypatch, scenario)


def test_campaign_quote_payment_delivery_and_tracking(monkeypatch):
    _payments(monkeypatch, on=True)
    monkeypatch.delenv("RESEND_API_KEY", raising=False)

    async def fake_stripe(path, form):
        assert form["line_items[0][price_data][unit_amount]"] == "45000"
        return {"id": "cs_ad", "url": "https://checkout.stripe.test/cs_ad"}
    monkeypatch.setattr(payments, "_stripe_post", fake_stripe)

    async def scenario(db):
        await _profile(db, "real_estate_company")
        await db.installations.insert_one({"id": "fort-test"})
        today = now_utc().date()
        c = await business.create_campaign(business.CampaignIn(
            name="Spring PCS homes", installation_id="fort-test", market="Test Town", starts_on=today,
            ends_on=today + timedelta(days=30), inquiry_email="agent@example.com",
            website_url="https://agency.example.com/"), OWNER)
        assert c.status == "pending_quote"
        with pytest.raises(HTTPException):  # cannot pay before an admin prices it
            await payments.campaign_checkout(c.id, OWNER)
        assert await business.ads("fort-test") == []  # not shown until paid

        # metrics are not admin-editable: an injected "impressions" is ignored
        priced = await business.admin_update_campaign(c.id, business.CampaignPatch(**{"price_cents": 45000, "impressions": 999}))
        assert priced.status == "awaiting_payment" and priced.impressions == 0

        await payments.campaign_checkout(c.id, OWNER)
        await payments._fulfil(await db.payment_intents.find_one({"provider_ref": "cs_ad"}))

        shown = await business.ads("fort-test")
        assert [a.business_name for a in shown] == ["Test Co"]
        await business.ads("fort-test")
        assert (await business.ad_click(c.id)) == {"url": "https://agency.example.com/"}
        out = await business.ad_inquiry(c.id, business.InquiryIn(name="Sgt Test", email="sgt@example.com",
                                                                  message="Is the 3BR still open?"))
        assert out.emailed is False  # no email key locally: stored, and honestly reported as not emailed
        stored = await db.ad_campaigns.find_one({"id": c.id})
        assert (stored["impressions"], stored["clicks"], stored["inquiries"]) == (2, 1, 1)
        assert len(await business.campaign_inquiries(c.id, OWNER)) == 1
    _run(monkeypatch, scenario)


def test_catalog_feed_lists_only_promoted_real_listings(monkeypatch):
    async def scenario(db):
        base = {"status": "approved", "category": "housing", "description": "Three bedrooms near the gate",
                "price": 1500.0, "photos": ["/api/photos/p1"], "created_at": now_utc()}
        await db.listings.insert_many([
            {**base, "id": "real", "title": "Real 3BR", "promote": True},
            {**base, "id": "sample", "title": "Sample 3BR", "promote": True, "sample": True},
            {**base, "id": "unpromoted", "title": "Quiet 2BR"},
        ])
        with pytest.raises(HTTPException):
            await business.admin_promote("sample", business.PromotePatch(promote=True))
        body = (await business.catalog_feed()).body.decode()
        assert "Real 3BR" in body and "1500.00 USD" in body
        assert "Sample 3BR" not in body and "Quiet 2BR" not in body
    _run(monkeypatch, scenario)
