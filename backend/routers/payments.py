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

from lib.auth import get_current_user
from lib.brand import BRAND
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


def _live(provider: str) -> bool:
    return _payments_enabled() and _provider_configured(provider)


def _app_url() -> str:
    return os.environ.get("APP_URL", "").rstrip("/") or BRAND["url"]


@router.get("/config", response_model=PaymentConfig)
async def config():
    providers = [PaymentProvider(id=i, label=label, enabled=_live(i)) for i, label in PROVIDERS]
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
    if not _live(body.provider):
        return CheckoutOut(intent_id=new_id(), status="not_configured",
                           message="Payments are not working yet. No charge was made.")
    intent = {"id": new_id(), "listing_id": listing["id"], "owner_id": user["id"], "plan_id": plan.id,
              "amount": plan.amount, "provider": body.provider, "status": "pending",
              "payment_authorized": True, "created_at": now_utc()}
    url, ref = await (_stripe_session if body.provider == "stripe" else _paypal_order)(intent, plan, listing)
    intent["provider_ref"] = ref
    await db.payment_intents.insert_one(intent)
    return CheckoutOut(intent_id=intent["id"], status="requires_redirect", message="Taking you to secure checkout…", checkout_url=url)


async def _fulfil(intent: dict) -> None:
    """Idempotent: pins the listing for the plan's days (added to any Spotlight still running) and marks the intent paid."""
    if intent.get("status") == "paid" or not intent.get("payment_authorized"):
        logger.warning("refused fulfilment for unauthorised payment intent %s", intent.get("id"))
        return
    plan = next(p for p in PLANS if p.id == intent["plan_id"])
    now = now_utc()
    listing = await db.listings.find_one({"id": intent["listing_id"]}, {"featured_until": 1}) or {}
    current = listing.get("featured_until")
    start = current if current and current.tzinfo and current > now else now
    await db.listings.update_one({"id": intent["listing_id"]},
                                 {"$set": {"featured": True, "featured_until": start + timedelta(days=plan.days), "updated_at": now}})
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
        return RedirectResponse(f"/listing/{intent['listing_id']}?spotlight=1")
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{STRIPE}/checkout/sessions/{session_id}", auth=(_stripe_key() or "", ""))
    session = r.json() if r.status_code < 400 else {}
    if session.get("client_reference_id") != intent["id"]:
        raise HTTPException(status_code=400, detail="Checkout reference did not match")
    if session.get("payment_status") == "paid":
        await _fulfil(intent)
        return RedirectResponse(f"/listing/{intent['listing_id']}?spotlight=1")
    return RedirectResponse(f"/upgrade/{intent['listing_id']}?cancelled=1")


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
    session = event.get("data", {}).get("object", {})
    if event.get("type") == "checkout.session.completed" and session.get("payment_status") == "paid":
        intent = await db.payment_intents.find_one({"provider_ref": session.get("id")})
        if intent and intent.get("payment_authorized") and session.get("client_reference_id") == intent["id"]:
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
    body = {
        "intent": "CAPTURE",
        "purchase_units": [{"reference_id": intent["id"], "custom_id": intent["id"],
                            "description": f"{BRAND['domain']} Spotlight — {plan.label}",
                            "amount": {"currency_code": "USD", "value": f"{plan.amount:.2f}"}}],
        "payment_source": {"paypal": {"experience_context": {
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
