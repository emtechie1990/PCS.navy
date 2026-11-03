"""Spotlight payments with an explicit, fail-closed activation gate.

Provider credentials alone never activate checkout. ``PAYMENTS_ENABLED`` must
be exactly ``true`` before a server can create a provider session or order.
"""

import hmac
import hashlib
import json
import logging
import os
import time
from datetime import timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from lib.auth import aware, get_current_user
from lib.brand import BRAND
from lib.catalog import INITIAL_TERM_MONTHS, PRODUCTS, RENEWAL_TERM_MONTHS, add_months
from lib.db import db
from models.schemas import (CheckoutIn, CheckoutOut, FeaturePlan, PaymentConfig, PaymentProvider,
                            new_id, now_utc)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])

STRIPE = "https://api.stripe.com/v1"
# Wallet availability is decided inside the provider-hosted checkout.  Do not
# advertise a wallet separately unless this app requests it explicitly.
PROVIDERS = [("stripe", "Card / eligible wallets"), ("paypal", "PayPal / eligible wallets")]
PLANS = [
    FeaturePlan(id="boost-7", label="7-day Spotlight", days=7, amount=4.99),
    FeaturePlan(id="boost-14", label="14-day Spotlight", days=14, amount=7.99),
    FeaturePlan(id="boost-30", label="30-day PCS Season", days=30, amount=12.99),
]


def _stripe_key() -> str | None:
    return os.environ.get("STRIPE_SECRET_KEY")


def _paypal_keys() -> tuple[str | None, str | None]:
    return os.environ.get("PAYPAL_CLIENT_ID"), os.environ.get("PAYPAL_CLIENT_SECRET")


def _paypal_api() -> str:
    return "https://api-m.paypal.com" if os.environ.get("PAYPAL_ENV") == "live" else "https://api-m.sandbox.paypal.com"


def _payments_enabled() -> bool:
    """Fail closed: only the exact string ``true`` authorizes payment traffic."""
    return os.environ.get("PAYMENTS_ENABLED", "").strip().lower() == "true"


def _provider_configured(provider: str) -> bool:
    if provider == "stripe":
        # A Stripe session without a signing secret would make asynchronous
        # confirmation unverifiable. Treat that as not configured.
        return bool(_stripe_key() and os.environ.get("STRIPE_WEBHOOK_SECRET"))
    return all(_paypal_keys())


def live(provider: str) -> bool:
    return _payments_enabled() and _provider_configured(provider)


def app_url() -> str:
    return os.environ.get("APP_URL", "").rstrip("/") or BRAND["url"]


@router.get("/config", response_model=PaymentConfig)
async def config():
    providers = [PaymentProvider(id=i, label=label, enabled=live(i)) for i, label in PROVIDERS]
    return PaymentConfig(providers=providers, plans=PLANS, live=any(p.enabled for p in providers))


@router.post("/checkout", response_model=CheckoutOut)
async def checkout(body: CheckoutIn, user: dict = Depends(get_current_user)):
    plan = next((p for p in PLANS if p.id == body.plan_id), None)
    if not plan:
        raise HTTPException(status_code=400, detail="Unknown plan")
    listing = await db.listings.find_one({"id": body.listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not listing.get("owner_id"):
        raise HTTPException(status_code=409, detail="Only account-owned listings can buy Spotlight")
    if user["id"] != listing["owner_id"]:
        raise HTTPException(status_code=403, detail="Only the listing owner can buy Spotlight for it")
    if not live(body.provider):
        return CheckoutOut(intent_id=new_id(), status="not_configured",
                           message="Payments are not working yet. No charge was made.")
    intent = {"id": new_id(), "listing_id": listing["id"], "owner_id": user["id"], "plan_id": plan.id,
              "amount": plan.amount, "provider": body.provider, "status": "pending",
              "payment_authorized": True, "created_at": now_utc()}
    url, ref = await (_stripe_session if body.provider == "stripe" else _paypal_order)(intent, plan, listing)
    intent["provider_ref"] = ref
    await db.payment_intents.insert_one(intent)
    return CheckoutOut(intent_id=intent["id"], status="requires_redirect", message="Taking you to secure checkout…", checkout_url=url)


def _done_url(intent: dict) -> str:
    kind = intent.get("kind", "spotlight")
    return f"/listing/{intent['listing_id']}?spotlight=1" if kind == "spotlight" else f"/business?paid={kind}"


def _cancel_url(intent: dict) -> str:
    if intent.get("kind", "spotlight") == "spotlight":
        return f"/upgrade/{intent['listing_id']}?cancelled=1"
    return "/business?cancelled=1"


async def _fulfil(intent: dict, subscription_id: str | None = None) -> None:
    """Idempotent. Spotlight pins the listing (extending any running Spotlight); a property plan starts its
    prepaid term; a campaign goes live. Then the intent is marked paid."""
    if intent.get("status") == "paid" or not intent.get("payment_authorized"):
        logger.warning("refused fulfilment for unauthorised payment intent %s", intent.get("id"))
        return
    now = now_utc()
    kind = intent.get("kind", "spotlight")
    if kind == "plan":
        await db.billing_plans.update_one({"id": intent["plan_id"]}, {"$set": {
            "status": "active", "paid_through": intent["term_end"], "stripe_subscription_id": subscription_id,
            "updated_at": now}})
    elif kind == "campaign":
        await db.ad_campaigns.update_one({"id": intent["campaign_id"]},
                                         {"$set": {"status": "active", "paid_at": now, "updated_at": now}})
    if kind != "spotlight":
        await db.payment_intents.update_one({"id": intent["id"]}, {"$set": {"status": "paid", "paid_at": now}})
        return
    plan = next(p for p in PLANS if p.id == intent["plan_id"])
    listing = await db.listings.find_one({"id": intent["listing_id"]}, {"featured_until": 1}) or {}
    current = listing.get("featured_until")
    start = current if current and current.tzinfo and current > now else now
    await db.listings.update_one({"id": intent["listing_id"]},
                                 {"$set": {"featured": True, "featured_until": start + timedelta(days=plan.days), "updated_at": now}})
    await db.payment_intents.update_one({"id": intent["id"]}, {"$set": {"status": "paid", "paid_at": now}})


# ---------- Stripe ----------
async def _stripe_post(path: str, form: dict) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{STRIPE}{path}", data=form, auth=(_stripe_key() or "", ""))
    if r.status_code >= 400:
        logger.error("Stripe %s %s: %s", path, r.status_code, r.text)
        raise HTTPException(status_code=502, detail="Stripe request failed")
    return r.json()


async def stop_stripe_renewal(subscription_id: str) -> None:
    """Coverage already paid for stays; Stripe simply does not bill the next renewal."""
    await _stripe_post(f"/subscriptions/{subscription_id}", {"cancel_at_period_end": "true"})


def _session_urls(intent: dict) -> dict:
    return {"client_reference_id": intent["id"], "metadata[intent_id]": intent["id"],
            "success_url": f"{app_url()}/api/payments/stripe/return?session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": f"{app_url()}{_cancel_url(intent)}"}


class PlanCheckoutIn(BaseModel):
    property_count: int = Field(ge=1, le=10_000)


NOT_LIVE = "Payments are not working yet. No charge was made."


@router.post("/plan-checkout", response_model=CheckoutOut)
async def plan_checkout(body: PlanCheckoutIn, user: dict = Depends(get_current_user)):
    """Stripe subscription: the 6-month fee is charged now; the annual fee is charged automatically when
    those 6 months end (expressed to Stripe as a trial that ends on the renewal date)."""
    profile = await db.account_profiles.find_one({"owner_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=409, detail="Complete business onboarding first")
    product = PRODUCTS[profile["customer_type"]]
    if product["initial_amount_per_property"] is None:
        raise HTTPException(status_code=409, detail="Real estate companies buy geographic advertising, not property plans")
    if not live("stripe"):
        return CheckoutOut(intent_id=new_id(), status="not_configured", message=NOT_LIVE)
    n, now = body.property_count, now_utc()
    term_end = add_months(now, INITIAL_TERM_MONTHS)
    plan = {"id": new_id(), "owner_id": user["id"], "account_id": profile["id"], "customer_type": profile["customer_type"],
            "property_count": n, "initial_amount_cents": product["initial_amount_per_property"] * n,
            "annual_renewal_cents": product["annual_renewal_per_property"] * n, "status": "pending",
            "auto_renew": True, "paid_through": None, "stripe_subscription_id": None, "created_at": now, "updated_at": now}
    intent = {"id": new_id(), "kind": "plan", "plan_id": plan["id"], "owner_id": user["id"], "provider": "stripe",
              "amount": plan["initial_amount_cents"] / 100, "term_end": term_end, "status": "pending",
              "payment_authorized": True, "created_at": now}
    label = f"{BRAND['domain']} {product['label']} listing"
    session = await _stripe_post("/checkout/sessions", {
        **_session_urls(intent), "mode": "subscription", "customer_email": profile["billing_email"],
        "line_items[0][quantity]": str(n),
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": str(product["initial_amount_per_property"]),
        "line_items[0][price_data][product_data][name]": f"{label}: first {INITIAL_TERM_MONTHS} months",
        "line_items[1][quantity]": str(n),
        "line_items[1][price_data][currency]": "usd",
        "line_items[1][price_data][unit_amount]": str(product["annual_renewal_per_property"]),
        "line_items[1][price_data][recurring][interval]": "year",
        "line_items[1][price_data][product_data][name]": f"{label}: annual renewal",
        "subscription_data[trial_end]": str(int(term_end.timestamp())),
        "subscription_data[metadata][plan_id]": plan["id"],
    })
    intent["provider_ref"] = session["id"]
    await db.billing_plans.insert_one(plan)
    await db.payment_intents.insert_one(intent)
    return CheckoutOut(intent_id=intent["id"], status="requires_redirect", message="Taking you to secure checkout…",
                       checkout_url=session["url"])


@router.post("/campaign-checkout/{campaign_id}", response_model=CheckoutOut)
async def campaign_checkout(campaign_id: str, user: dict = Depends(get_current_user)):
    c = await db.ad_campaigns.find_one({"id": campaign_id, "owner_id": user["id"]}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if c["status"] != "awaiting_payment" or not c.get("price_cents"):
        raise HTTPException(status_code=409, detail="This campaign has not been priced for payment")
    if not live("stripe"):
        return CheckoutOut(intent_id=new_id(), status="not_configured", message=NOT_LIVE)
    intent = {"id": new_id(), "kind": "campaign", "campaign_id": c["id"], "owner_id": user["id"], "provider": "stripe",
              "amount": c["price_cents"] / 100, "status": "pending", "payment_authorized": True, "created_at": now_utc()}
    session = await _stripe_post("/checkout/sessions", {
        **_session_urls(intent), "mode": "payment",
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": str(c["price_cents"]),
        "line_items[0][price_data][product_data][name]":
            f"{BRAND['domain']} advertising: {c['market']} ({c['starts_on']} to {c['ends_on']})",
    })
    intent["provider_ref"] = session["id"]
    await db.payment_intents.insert_one(intent)
    return CheckoutOut(intent_id=intent["id"], status="requires_redirect", message="Taking you to secure checkout…",
                       checkout_url=session["url"])


async def _stripe_session(intent: dict, plan: FeaturePlan, listing: dict) -> tuple[str, str]:
    form = {
        "mode": "payment",
        "client_reference_id": intent["id"],
        "success_url": f"{app_url()}/api/payments/stripe/return?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{app_url()}/upgrade/{listing['id']}?cancelled=1",
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": str(round(plan.amount * 100)),
        "line_items[0][price_data][product_data][name]": f"{BRAND['domain']} Spotlight — {plan.label}",
        "line_items[0][price_data][product_data][description]": listing["title"][:200],
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{STRIPE}/checkout/sessions", data=form, auth=(_stripe_key(), ""))
    if r.status_code >= 400:
        logger.error("Stripe %s: %s", r.status_code, r.text)
        raise HTTPException(status_code=502, detail="Stripe checkout could not be started")
    j = r.json()
    return j["url"], j["id"]


@router.get("/stripe/return")
async def stripe_return(session_id: str):
    intent = await db.payment_intents.find_one({"provider_ref": session_id})
    if not intent or not intent.get("payment_authorized"):
        raise HTTPException(status_code=404, detail="Unknown checkout")
    if intent.get("status") == "paid":
        return RedirectResponse(_done_url(intent))
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{STRIPE}/checkout/sessions/{session_id}", auth=(_stripe_key() or "", ""))
    session = r.json() if r.status_code < 400 else {}
    if session.get("client_reference_id") != intent["id"]:
        raise HTTPException(status_code=400, detail="Checkout reference did not match")
    if session.get("payment_status") == "paid":
        await _fulfil(intent, session.get("subscription"))
        return RedirectResponse(_done_url(intent))
    return RedirectResponse(_cancel_url(intent))


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="Webhook secret not configured")
    body = await request.body()
    parts = [p.split("=", 1) for p in request.headers.get("stripe-signature", "").split(",") if "=" in p]
    timestamp = next((value for key, value in parts if key == "t"), "")
    signatures = [value for key, value in parts if key == "v1"]
    try:
        timely = abs(time.time() - int(timestamp)) <= 300
    except ValueError:
        timely = False
    expected = hmac.new(secret.encode(), f"{timestamp}.".encode() + body, hashlib.sha256).hexdigest()
    if not timely or not any(hmac.compare_digest(expected, signature) for signature in signatures):
        raise HTTPException(status_code=400, detail="Bad signature")
    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Bad payload")
    obj, etype = event.get("data", {}).get("object", {}), event.get("type")
    if etype == "checkout.session.completed" and obj.get("payment_status") == "paid":
        intent = await db.payment_intents.find_one({"provider_ref": obj.get("id")})
        if intent and intent.get("payment_authorized") and obj.get("client_reference_id") == intent["id"]:
            await _fulfil(intent, obj.get("subscription"))
    elif etype in ("invoice.paid", "invoice.payment_failed", "customer.subscription.deleted"):
        await _subscription_event(etype, obj)
    return {"received": True}


def _invoice_subscription(invoice: dict) -> str | None:
    """Older Stripe API versions put the id on the invoice; newer ones nest it under parent."""
    nested = ((invoice.get("parent") or {}).get("subscription_details") or {}).get("subscription")
    return invoice.get("subscription") or nested


async def _subscription_event(etype: str, obj: dict) -> None:
    sub_id = obj.get("id") if etype == "customer.subscription.deleted" else _invoice_subscription(obj)
    plan = await db.billing_plans.find_one({"stripe_subscription_id": sub_id}, {"_id": 0}) if sub_id else None
    if not plan:
        return
    now = now_utc()
    if etype == "invoice.paid":
        if obj.get("billing_reason") != "subscription_cycle":  # only the annual renewal adds coverage
            return
        start = max(aware(plan["paid_through"]), now) if plan.get("paid_through") else now
        # recorded invoice ids make a resent webhook a no-op instead of a second year of coverage
        await db.billing_plans.update_one({"id": plan["id"], "invoice_ids": {"$ne": obj.get("id")}}, {
            "$set": {"status": "active", "paid_through": add_months(start, RENEWAL_TERM_MONTHS), "updated_at": now},
            "$addToSet": {"invoice_ids": obj.get("id")}})
        return
    upd = {"status": "canceled", "auto_renew": False} if etype == "customer.subscription.deleted" else {"status": "past_due"}
    await db.billing_plans.update_one({"id": plan["id"]}, {"$set": {**upd, "updated_at": now}})


# ---------- PayPal (also carries Venmo) ----------
async def _paypal_token(client: httpx.AsyncClient) -> str:
    cid, secret = _paypal_keys()
    r = await client.post(f"{_paypal_api()}/v1/oauth2/token", data={"grant_type": "client_credentials"}, auth=(cid or "", secret or ""))
    if r.status_code >= 400:
        logger.error("PayPal auth %s: %s", r.status_code, r.text)
        raise HTTPException(status_code=502, detail="PayPal checkout could not be started")
    return r.json()["access_token"]


async def _paypal_order(intent: dict, plan: FeaturePlan, listing: dict) -> tuple[str, str]:
    body = {
        "intent": "CAPTURE",
        "purchase_units": [{"reference_id": intent["id"], "custom_id": intent["id"],
                            "description": f"{BRAND['domain']} Spotlight — {plan.label}",
                            "amount": {"currency_code": "USD", "value": f"{plan.amount:.2f}"}}],
        "payment_source": {"paypal": {"experience_context": {
            "brand_name": BRAND["domain"], "user_action": "PAY_NOW",
            "return_url": f"{app_url()}/api/payments/paypal/return",
            "cancel_url": f"{app_url()}/upgrade/{listing['id']}?cancelled=1"}}},
    }
    async with httpx.AsyncClient(timeout=30) as client:
        token = await _paypal_token(client)
        r = await client.post(f"{_paypal_api()}/v2/checkout/orders", json=body, headers={"Authorization": f"Bearer {token}"})
    if r.status_code >= 400:
        logger.error("PayPal order %s: %s", r.status_code, r.text)
        raise HTTPException(status_code=502, detail="PayPal checkout could not be started")
    j = r.json()
    url = next(l["href"] for l in j["links"] if l["rel"] in ("payer-action", "approve"))
    return url, j["id"]


@router.get("/paypal/return")
async def paypal_return(token: str):
    intent = await db.payment_intents.find_one({"provider_ref": token})
    if not intent or not intent.get("payment_authorized"):
        raise HTTPException(status_code=404, detail="Unknown checkout")
    if intent.get("status") == "paid":  # refresh of the return page must not capture twice
        return RedirectResponse(f"/listing/{intent['listing_id']}?spotlight=1")
    async with httpx.AsyncClient(timeout=30) as client:
        access = await _paypal_token(client)
        r = await client.post(f"{_paypal_api()}/v2/checkout/orders/{token}/capture", json={}, headers={"Authorization": f"Bearer {access}"})
    if r.status_code < 400 and r.json().get("status") == "COMPLETED":
        await _fulfil(intent)
        return RedirectResponse(f"/listing/{intent['listing_id']}?spotlight=1")
    logger.error("PayPal capture %s: %s", r.status_code, r.text)
    return RedirectResponse(f"/upgrade/{intent['listing_id']}?cancelled=1")
