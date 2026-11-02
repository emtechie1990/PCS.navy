"""Featured-listing payments — SCAFFOLDED ONLY. Providers are wired as config but no
processor is called yet. Flip `enabled` + implement `_start_checkout` once API keys exist."""

from fastapi import APIRouter, HTTPException

from lib.db import db
from models.schemas import (CheckoutIn, CheckoutOut, FeaturePlan, PaymentConfig, PaymentProvider,
                            new_id, now_utc)

router = APIRouter(prefix="/payments", tags=["payments"])

PROVIDERS = [
    PaymentProvider(id="stripe", label="Card (Stripe)", enabled=False),
    PaymentProvider(id="apple_pay", label="Apple Pay", enabled=False),
    PaymentProvider(id="google_pay", label="Google Pay", enabled=False),
    PaymentProvider(id="paypal", label="PayPal", enabled=False),
]
PLANS = [
    FeaturePlan(id="boost-7", label="7-day Spotlight", days=7, amount=4.99),
    FeaturePlan(id="boost-14", label="14-day Spotlight", days=14, amount=7.99),
    FeaturePlan(id="boost-30", label="30-day PCS Season", days=30, amount=12.99),
]


@router.get("/config", response_model=PaymentConfig)
async def config():
    return PaymentConfig(providers=PROVIDERS, plans=PLANS, live=any(p.enabled for p in PROVIDERS))


@router.post("/checkout", response_model=CheckoutOut)
async def checkout(body: CheckoutIn):
    plan = next((p for p in PLANS if p.id == body.plan_id), None)
    if not plan:
        raise HTTPException(status_code=400, detail="Unknown plan")
    if not await db.listings.find_one({"id": body.listing_id}):
        raise HTTPException(status_code=404, detail="Listing not found")
    intent = {"id": new_id(), "listing_id": body.listing_id, "plan_id": plan.id,
              "amount": plan.amount, "provider": body.provider, "status": "not_configured",
              "created_at": now_utc()}
    await db.payment_intents.insert_one(intent)
    return CheckoutOut(intent_id=intent["id"], status="not_configured",
                       message="Payments are not live yet. Your interest was recorded — no charge was made.")
