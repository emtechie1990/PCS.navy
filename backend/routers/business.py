"""Business accounts, prepaid property plans, geographic advertising and the marketing catalog feed.

Money moves only through routers/payments.py (fail-closed); this module stores and reports what was paid.
"""

import csv
import html
import io
from datetime import date, datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr, Field, HttpUrl

from lib.auth import get_current_user, require_admin
from lib.brand import BRAND
from lib.catalog import PRODUCTS, CustomerType, quote
from lib.db import db
from lib.email import send_email
from models.schemas import Listing, new_id, now_utc
from routers.payments import app_url, live, stop_stripe_renewal

router = APIRouter(tags=["business"])

CampaignStatus = Literal["pending_quote", "awaiting_payment", "active", "paused", "ended"]
PlanStatus = Literal["pending", "active", "past_due", "canceled"]


# ---------- models ----------
class AccountProfileIn(BaseModel):
    customer_type: CustomerType
    business_name: str = Field(min_length=1, max_length=120)
    billing_email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=40)


class AccountProfile(AccountProfileIn):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime


class QuoteIn(BaseModel):
    property_count: int = Field(ge=1, le=10_000)


class Plan(BaseModel):
    id: str
    owner_id: str
    account_id: str
    customer_type: CustomerType
    property_count: int
    initial_amount_cents: int
    annual_renewal_cents: int
    status: PlanStatus = "pending"
    auto_renew: bool = True
    paid_through: Optional[datetime] = None
    stripe_subscription_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class Usage(BaseModel):
    paid_properties: int
    housing_listings: int
    enforced: bool  # True only while live payments are switched on


class CampaignIn(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    installation_id: str
    market: str = Field(min_length=2, max_length=120)
    starts_on: date
    ends_on: date
    inquiry_email: EmailStr
    website_url: Optional[HttpUrl] = None
    notes: str = Field(default="", max_length=2_000)


class Campaign(BaseModel):
    id: str
    owner_id: str
    account_id: str
    name: str
    installation_id: str
    market: str
    starts_on: str
    ends_on: str
    inquiry_email: str
    website_url: Optional[str] = None
    notes: str = ""
    status: CampaignStatus = "pending_quote"
    price_cents: Optional[int] = None
    paid_at: Optional[datetime] = None
    impressions: int = 0
    clicks: int = 0
    inquiries: int = 0
    created_at: datetime
    updated_at: datetime


class CampaignPatch(BaseModel):
    status: Optional[CampaignStatus] = None
    price_cents: Optional[int] = Field(default=None, ge=100, le=10_000_000)


class Ad(BaseModel):
    id: str
    business_name: str
    name: str
    market: str
    notes: str
    website_url: Optional[str] = None


class InquiryIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=40)
    message: str = Field(min_length=5, max_length=2_000)


class Inquiry(InquiryIn):
    id: str
    campaign_id: str
    emailed: bool
    created_at: datetime


class InquiryOut(BaseModel):
    emailed: bool
    message: str


class AdminAccount(AccountProfile):
    email: str
    housing_listings: int
    paid_properties: int
    plan_status: Optional[PlanStatus] = None


class PromotePatch(BaseModel):
    promote: bool


# ---------- shared helpers ----------
async def profile_for(user: dict) -> dict:
    profile = await db.account_profiles.find_one({"owner_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=409, detail="Complete business onboarding before using this feature")
    return profile


async def paid_properties(owner_id: str) -> int:
    """Property slots covered right now: every paid plan whose coverage has not run out."""
    plans = db.billing_plans.find({"owner_id": owner_id, "status": {"$ne": "pending"},
                                   "paid_through": {"$gt": now_utc()}}, {"property_count": 1})
    return sum([p["property_count"] async for p in plans])


async def housing_count(owner_id: str) -> int:
    return await db.listings.count_documents({"owner_id": owner_id, "category": "housing",
                                              "status": {"$ne": "hidden"}})


async def require_housing_slot(user: Optional[dict]) -> None:
    """Called before a housing listing is created. A no-op until live payments are switched on."""
    if not live("stripe") or (user and user.get("role") == "admin"):
        return
    if not user:
        raise HTTPException(status_code=401, detail="Sign in and choose a property plan to list housing")
    covered, used = await paid_properties(user["id"]), await housing_count(user["id"])
    if used >= covered:
        noun = "property" if covered == 1 else "properties"
        raise HTTPException(status_code=402, detail=f"Your plan covers {covered} {noun}. "
                                                    "Add properties in the Business center to list more.")


def _running() -> dict:
    today = now_utc().date().isoformat()
    return {"status": "active", "starts_on": {"$lte": today}, "ends_on": {"$gte": today}}


# ---------- accounts ----------
@router.get("/accounts/me", response_model=Optional[AccountProfile])
async def account_me(user: dict = Depends(get_current_user)):
    doc = await db.account_profiles.find_one({"owner_id": user["id"]}, {"_id": 0})
    return AccountProfile(**doc) if doc else None


@router.put("/accounts/me", response_model=AccountProfile)
async def save_account(body: AccountProfileIn, user: dict = Depends(get_current_user)):
    now = now_utc()
    existing = await db.account_profiles.find_one({"owner_id": user["id"]}, {"_id": 0})
    if existing and existing["customer_type"] != body.customer_type and \
            await db.billing_plans.count_documents({"owner_id": user["id"], "status": {"$ne": "pending"}}):
        raise HTTPException(status_code=409, detail="Customer type is locked once a plan is paid. Contact support to change it.")
    values = body.model_dump()
    if existing:
        await db.account_profiles.update_one({"owner_id": user["id"]}, {"$set": {**values, "updated_at": now}})
        values = {**existing, **values, "updated_at": now}
    else:
        values = {"id": new_id(), "owner_id": user["id"], **values, "created_at": now, "updated_at": now}
        await db.account_profiles.insert_one(values)
    return AccountProfile(**values)


# ---------- billing ----------
@router.get("/billing/catalog")
async def billing_catalog():
    return {"currency": "usd", "products": PRODUCTS, "payments_enabled": live("stripe")}


@router.post("/billing/quote")
async def billing_quote(body: QuoteIn, user: dict = Depends(get_current_user)):
    profile = await profile_for(user)
    return {**quote(profile["customer_type"], body.property_count), "payments_enabled": live("stripe")}


@router.get("/billing/plans/mine", response_model=list[Plan])
async def my_plans(user: dict = Depends(get_current_user)):
    docs = await db.billing_plans.find({"owner_id": user["id"], "status": {"$ne": "pending"}},
                                       {"_id": 0}).sort("created_at", -1).to_list(200)
    return [Plan(**d) for d in docs]


@router.get("/billing/usage", response_model=Usage)
async def usage(user: dict = Depends(get_current_user)):
    return Usage(paid_properties=await paid_properties(user["id"]), housing_listings=await housing_count(user["id"]),
                 enforced=live("stripe"))


# ---------- campaigns (owner) ----------
@router.get("/campaigns/mine", response_model=list[Campaign])
async def my_campaigns(user: dict = Depends(get_current_user)):
    docs = await db.ad_campaigns.find({"owner_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Campaign(**d) for d in docs]


@router.post("/campaigns", response_model=Campaign)
async def create_campaign(body: CampaignIn, user: dict = Depends(get_current_user)):
    profile = await profile_for(user)
    if profile["customer_type"] != "real_estate_company":
        raise HTTPException(status_code=403, detail="Geographic advertising is available to real estate company accounts")
    if body.ends_on < body.starts_on:
        raise HTTPException(status_code=422, detail="Campaign end date must be on or after start date")
    if not await db.installations.find_one({"id": body.installation_id}):
        raise HTTPException(status_code=400, detail="Unknown installation")
    now = now_utc()
    fields = {**body.model_dump(), "starts_on": body.starts_on.isoformat(), "ends_on": body.ends_on.isoformat(),
              "website_url": str(body.website_url) if body.website_url else None}
    campaign = Campaign(id=new_id(), owner_id=user["id"], account_id=profile["id"], created_at=now, updated_at=now, **fields)
    await db.ad_campaigns.insert_one(campaign.model_dump())
    return campaign


@router.get("/campaigns/{campaign_id}/inquiries", response_model=list[Inquiry])
async def campaign_inquiries(campaign_id: str, user: dict = Depends(get_current_user)):
    c = await db.ad_campaigns.find_one({"id": campaign_id}, {"owner_id": 1})
    if not c or (c["owner_id"] != user["id"] and user.get("role") != "admin"):
        raise HTTPException(status_code=404, detail="Campaign not found")
    docs = await db.ad_inquiries.find({"campaign_id": campaign_id}, {"_id": 0}).sort("created_at", -1).to_list(1_000)
    return [Inquiry(**d) for d in docs]


# ---------- ad delivery + tracking (public) ----------
@router.get("/ads", response_model=list[Ad])
async def ads(installation_id: str):
    """Running campaigns for one installation. Each call counts one impression per ad returned."""
    docs = await db.ad_campaigns.find({**_running(), "installation_id": installation_id}, {"_id": 0}).to_list(3)
    if not docs:
        return []
    await db.ad_campaigns.update_many({"id": {"$in": [d["id"] for d in docs]}}, {"$inc": {"impressions": 1}})
    names = {p["id"]: p["business_name"] async for p in
             db.account_profiles.find({"id": {"$in": [d["account_id"] for d in docs]}}, {"id": 1, "business_name": 1})}
    return [Ad(id=d["id"], business_name=names.get(d["account_id"], ""), name=d["name"], market=d["market"],
               notes=d.get("notes", ""), website_url=d.get("website_url")) for d in docs]


@router.post("/ads/{campaign_id}/click")
async def ad_click(campaign_id: str):
    c = await db.ad_campaigns.find_one_and_update({**_running(), "id": campaign_id}, {"$inc": {"clicks": 1}},
                                                  projection={"website_url": 1})
    if not c or not c.get("website_url"):
        raise HTTPException(status_code=404, detail="Ad not found")
    return {"url": c["website_url"]}


@router.post("/ads/{campaign_id}/inquiries", response_model=InquiryOut)
async def ad_inquiry(campaign_id: str, body: InquiryIn):
    c = await db.ad_campaigns.find_one({**_running(), "id": campaign_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Ad not found")
    e = html.escape
    phone = f"<p>Phone: {e(body.phone)}</p>" if body.phone else ""
    try:
        await send_email(to=c["inquiry_email"], subject=f"{BRAND['domain']} inquiry: {c['name']}",
                         html=f"<p>From {e(body.name)} &lt;{e(body.email)}&gt;</p>{phone}<p>{e(body.message)}</p>")
        emailed = True
    except HTTPException:
        emailed = False  # stored below either way; the advertiser also sees it in the Business center
    await db.ad_inquiries.insert_one(Inquiry(id=new_id(), campaign_id=campaign_id, emailed=emailed,
                                             created_at=now_utc(), **body.model_dump()).model_dump())
    await db.ad_campaigns.update_one({"id": campaign_id}, {"$inc": {"inquiries": 1}})
    return InquiryOut(emailed=emailed, message="Inquiry sent to the advertiser" if emailed
                      else "Inquiry saved; the advertiser will see it in their Business center")


# ---------- marketing catalog feed (Meta / TikTok catalog CSV columns) ----------
@router.get("/feeds/catalog.csv")
async def catalog_feed():
    base = app_url()
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand"])
    async for d in db.listings.find({"promote": True, "status": "approved", "sample": {"$ne": True}}, {"_id": 0}):
        if not d.get("photos"):
            continue
        photo = d["photos"][0]
        w.writerow([d["id"], d["title"][:150], d["description"][:5000], "in stock", "used",
                    f"{d['price']:.2f} USD", f"{base}/listing/{d['id']}",
                    photo if photo.startswith("http") else f"{base}{photo}", BRAND["domain"]])
    return Response(out.getvalue(), media_type="text/csv")


# ---------- admin ----------
admin = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@admin.get("/accounts", response_model=list[AdminAccount])
async def admin_accounts():
    profiles = await db.account_profiles.find({}, {"_id": 0}).sort("created_at", -1).to_list(5_000)
    emails = {u["id"]: u["email"] async for u in
              db.users.find({"id": {"$in": [p["owner_id"] for p in profiles]}}, {"id": 1, "email": 1})}
    latest = {pl["owner_id"]: pl["status"] async for pl in
              db.billing_plans.find({"status": {"$ne": "pending"}}, {"owner_id": 1, "status": 1}).sort("created_at", 1)}
    return [AdminAccount(**p, email=emails.get(p["owner_id"], ""), housing_listings=await housing_count(p["owner_id"]),
                         paid_properties=await paid_properties(p["owner_id"]), plan_status=latest.get(p["owner_id"]))
            for p in profiles]


@admin.get("/billing/plans", response_model=list[Plan])
async def admin_plans():
    docs = await db.billing_plans.find({"status": {"$ne": "pending"}}, {"_id": 0}).sort("paid_through", 1).to_list(5_000)
    return [Plan(**d) for d in docs]


@admin.post("/billing/plans/{plan_id}/stop-renewal", response_model=Plan)
async def admin_stop_renewal(plan_id: str):
    plan = await db.billing_plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if plan.get("stripe_subscription_id"):
        await stop_stripe_renewal(plan["stripe_subscription_id"])
    upd = {"auto_renew": False, "updated_at": now_utc()}
    await db.billing_plans.update_one({"id": plan_id}, {"$set": upd})
    return Plan(**{**plan, **upd})


@admin.get("/campaigns", response_model=list[Campaign])
async def admin_campaigns():
    docs = await db.ad_campaigns.find({}, {"_id": 0}).sort("created_at", -1).to_list(1_000)
    return [Campaign(**d) for d in docs]


@admin.patch("/campaigns/{campaign_id}", response_model=Campaign)
async def admin_update_campaign(campaign_id: str, body: CampaignPatch):
    """Price a request (moves it to awaiting_payment) or change its status. Metrics are never editable."""
    upd = body.model_dump(exclude_none=True)
    if not upd:
        raise HTTPException(status_code=422, detail="Nothing to update")
    if "price_cents" in upd and "status" not in upd:
        upd["status"] = "awaiting_payment"
    upd["updated_at"] = now_utc()
    res = await db.ad_campaigns.find_one_and_update({"id": campaign_id}, {"$set": upd}, projection={"_id": 0},
                                                    return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return Campaign(**res)


@admin.patch("/listings/{listing_id}/promote", response_model=Listing)
async def admin_promote(listing_id: str, body: PromotePatch):
    doc = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Listing not found")
    if body.promote and (doc.get("sample") or doc.get("status") != "approved" or not doc.get("photos")):
        raise HTTPException(status_code=409, detail="Only approved, real listings with a photo can be promoted")
    await db.listings.update_one({"id": listing_id}, {"$set": {"promote": body.promote, "updated_at": now_utc()}})
    return Listing(**{**doc, "promote": body.promote})
