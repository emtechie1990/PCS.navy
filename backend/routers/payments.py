"""Spotlight payments. Stripe Checkout carries card, Apple Pay, Google Pay and Cash App Pay;
PayPal Checkout carries PayPal and Venmo. A provider goes live the moment its keys are in the environment —
no code change. Fulfilment (featured + featured_until on the listing) happens on the provider's confirmation:
Stripe return/webhook, PayPal capture on return."""

import hmac
import hashlib
import logging
import os
import time
from datetime import timedelta

import httpx
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse

from lib.auth import get_optional_user
from lib.brand import BRAND
from lib.db import db
from models.schemas import (CheckoutIn, CheckoutOut, FeaturePlan, PaymentConfig, PaymentProvider,
                            new_id, now_utc)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])

STRIPE = "https://api.stripe.com/v1"
PROVIDERS = [("stripe", "Card"), ("apple_pay", "Apple Pay"), ("google_pay", "Google Pay"), ("cash_app", "Cash App Pay"),
             ("paypal", "PayPal"), ("venmo", "Venmo")]
VIA = {"stripe": "stripe", "apple_pay": "stripe", "google_pay": "stripe", "cash_app": "stripe", "paypal": "paypal", "venmo": "paypal"}
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
    return "https://api-m.sandbox.paypal.com" if os.environ.get("PAYPAL_ENV") == "sandbox" else "https://api-m.paypal.com"


def _live(via: str) -> bool:
    return bool(_stripe_key()) if via == "stripe" else all(_paypal_keys())


def _app_url() -> str:
    return os.environ.get("APP_URL", "").rstrip("/") or BRAND["url"]


@router.get("/config", response_model=PaymentConfig)
async def config():
    providers = [PaymentProvider(id=i, label=label, enabled=_live(VIA[i])) for i, label in PROVIDERS]
    return PaymentConfig(providers=providers, plans=PLANS, live=any(p.enabled for p in providers))


@router.post("/checkout", response_model=CheckoutOut)
async def checkout(body: CheckoutIn, user: Optional[dict] = Depends(get_optional_user)):
    plan = next((p for p in PLANS if p.id == body.plan_id), None)
    if not plan:
        raise HTTPException(status_code=400, detail="Unknown plan")
    listing = await db.listings.find_one({"id": body.listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("owner_id") and not (user and (user["id"] == listing["owner_id"] or user.get("role") == "admin")):
        raise HTTPException(status_code=403, detail="Only the listing owner can buy Spotlight for it")
    via = VIA[body.provider]
    intent = {"id": new_id(), "listing_id": listing["id"], "plan_id": plan.id, "amount": plan.amount,
              "provider": body.provider, "via": via, "status": "pending", "created_at": now_utc()}
    if not _live(via):
        intent["status"] = "not_configured"
        await db.payment_intents.insert_one(intent)
        return CheckoutOut(intent_id=intent["id"], status="not_configured",
                           message="This payment method is not switched on yet. Your interest was recorded — no charge was made.")
    url, ref = await (_stripe_session if via == "stripe" else _paypal_order)(intent, plan, listing)
    intent["provider_ref"] = ref
    await db.payment_intents.insert_one(intent)
    return CheckoutOut(intent_id=intent["id"], status="requires_redirect", message="Taking you to secure checkout…", checkout_url=url)


async def _fulfil(intent: dict) -> None:
    """Idempotent: pins the listing for the plan's days and marks the intent paid."""
    if intent.get("status") == "paid":
        return
    plan = next(p for p in PLANS if p.id == intent["plan_id"])
    now = now_utc()
    await db.listings.update_one({"id": intent["listing_id"]},
                                 {"$set": {"featured": True, "featured_until": now + timedelta(days=plan.days), "updated_at": now}})
    await db.payment_intents.update_one({"id": intent["id"]}, {"$set": {"status": "paid", "paid_at": now}})


# ---------- Stripe ----------
async def _stripe_session(intent: dict, plan: FeaturePlan, listing: dict) -> tuple[str, str]:
    form = {
        "mode": "payment",
        "client_reference_id": intent["id"],
        "success_url": f"{_app_url()}/api/payments/stripe/return?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{_app_url()}/upgrade/{listing['id']}?cancelled=1",
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": str(round(plan.amount * 100)),
        "line_items[0][price_data][product_data][name]": f"{BRAND['domain']} Spotlight — {plan.label}",
        "line_items[0][price_data][product_data][description]": listing["title"][:200],
    }
    if intent["provider"] == "cash_app":
        form["payment_method_types[0]"] = "cashapp"
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{STRIPE}/checkout/sessions", data=form, auth=(_stripe_key(), ""))
    if r.status_code >= 400:
        logger.error("Stripe %s: %s", r.status_code, r.text)
        raise HTTPException(status_code=502, detail="Stripe checkout could not be started")
    j = r.json()
    return j["url"], j["id"]


@router.get("/stripe/return")
async def stripe_return(session_id: str):
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{STRIPE}/checkout/sessions/{session_id}", auth=(_stripe_key() or "", ""))
    intent = await db.payment_intents.find_one({"provider_ref": session_id})
    if not intent:
        raise HTTPException(status_code=404, detail="Unknown checkout")
    if r.status_code < 400 and r.json().get("payment_status") == "paid":
        await _fulfil(intent)
        return RedirectResponse(f"/listing/{intent['listing_id']}?spotlight=1")
    return RedirectResponse(f"/upgrade/{intent['listing_id']}?cancelled=1")


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="Webhook secret not configured")
    body = await request.body()
    parts = dict(p.split("=", 1) for p in request.headers.get("stripe-signature", "").split(",") if "=" in p)
    expected = hmac.new(secret.encode(), f"{parts.get('t', '')}.".encode() + body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, parts.get("v1", "")) or abs(time.time() - int(parts.get("t", "0") or 0)) > 300:
        raise HTTPException(status_code=400, detail="Bad signature")
    event = await request.json()
    session = event.get("data", {}).get("object", {})
    if event.get("type") == "checkout.session.completed" and session.get("payment_status") == "paid":
        intent = await db.payment_intents.find_one({"provider_ref": session.get("id")})
        if intent:
            await _fulfil(intent)
    return {"received": True}


# ---------- PayPal (also carries Venmo) ----------
async def _paypal_token(client: httpx.AsyncClient) -> str:
    cid, secret = _paypal_keys()
    r = await client.post(f"{_paypal_api()}/v1/oauth2/token", data={"grant_type": "client_credentials"}, auth=(cid or "", secret or ""))
    if r.status_code >= 400:
        logger.error("PayPal auth %s: %s", r.status_code, r.text)
        raise HTTPException(status_code=502, detail="PayPal checkout could not be started")
    return r.json()["access_token"]


async def _paypal_order(intent: dict, plan: FeaturePlan, listing: dict) -> tuple[str, str]:
    source = "venmo" if intent["provider"] == "venmo" else "paypal"
    body = {
        "intent": "CAPTURE",
        "purchase_units": [{"reference_id": intent["id"], "custom_id": intent["id"],
                            "description": f"{BRAND['domain']} Spotlight — {plan.label}",
                            "amount": {"currency_code": "USD", "value": f"{plan.amount:.2f}"}}],
        "payment_source": {source: {"experience_context": {
            "brand_name": BRAND["domain"], "user_action": "PAY_NOW",
            "return_url": f"{_app_url()}/api/payments/paypal/return",
            "cancel_url": f"{_app_url()}/upgrade/{listing['id']}?cancelled=1"}}},
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
    if not intent:
        raise HTTPException(status_code=404, detail="Unknown checkout")
    async with httpx.AsyncClient(timeout=30) as client:
        access = await _paypal_token(client)
        r = await client.post(f"{_paypal_api()}/v2/checkout/orders/{token}/capture", json={}, headers={"Authorization": f"Bearer {access}"})
    if r.status_code < 400 and r.json().get("status") == "COMPLETED":
        await _fulfil(intent)
        return RedirectResponse(f"/listing/{intent['listing_id']}?spotlight=1")
    logger.error("PayPal capture %s: %s", r.status_code, r.text)
    return RedirectResponse(f"/upgrade/{intent['listing_id']}?cancelled=1")
