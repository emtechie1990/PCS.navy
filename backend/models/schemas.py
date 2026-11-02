"""Pydantic models. Every model here has a hand-written twin in frontend/src/lib/types.ts."""

import uuid
from datetime import datetime, timezone
from typing import Any, Literal, Optional

from pydantic import BaseModel, EmailStr, Field

from lib.brand import BRAND

Category = Literal["housing", "vehicle", "goods"]
ListingStatus = Literal["pending", "approved", "hidden", "investigating"]
ContactMethod = Literal["email", "phone", "text"]
ReportStatus = Literal["open", "investigating", "resolved", "dismissed"]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


# ---------- auth ----------
class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    role: Literal["user", "admin"] = "user"
    verified_military: bool = False


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


class MessageOut(BaseModel):
    message: str


# ---------- installations ----------
class Installation(BaseModel):
    id: str
    name: str
    short_name: str
    former_name: Optional[str] = None
    city: str
    state: str
    tagline: str
    areas: list[str]
    housing_office_url: str
    hero_image: str
    launched: bool = False
    sort: int = 0


class InstallationPatch(BaseModel):
    launched: bool


# ---------- listings ----------
class ListingIn(BaseModel):
    category: Category
    installation_id: str
    area: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10, max_length=5000)
    price: float = Field(ge=0, le=10_000_000)
    price_unit: Literal["month", "total"] = "total"
    photos: list[str] = Field(default_factory=list, max_length=10)
    contact_name: str = Field(min_length=1, max_length=80)
    contact_method: ContactMethod
    contact_value: str = Field(min_length=3, max_length=120)
    available_date: Optional[str] = None  # YYYY-MM-DD; move-in date for housing
    details: dict[str, Any] = Field(default_factory=dict)


class Listing(ListingIn):
    id: str = Field(default_factory=new_id)
    status: ListingStatus = "approved"
    featured: bool = False
    featured_until: Optional[datetime] = None  # Spotlight expiry
    seller_verified: bool = False
    sample: bool = False  # placeholder posting shown until real listings replace it
    owner_id: Optional[str] = None
    report_count: int = 0
    admin_note: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class ListingPage(BaseModel):
    items: list[Listing]
    total: int


class ListingStatusPatch(BaseModel):
    status: ListingStatus
    admin_note: Optional[str] = None


# ---------- reports ----------
class ReportIn(BaseModel):
    reason: Literal["scam", "prohibited", "misleading", "duplicate", "unavailable", "other"]
    details: str = Field(default="", max_length=2000)
    reporter_email: Optional[EmailStr] = None


class Report(ReportIn):
    id: str = Field(default_factory=new_id)
    listing_id: str
    listing_title: str = ""
    status: ReportStatus = "open"
    admin_note: Optional[str] = None
    created_at: datetime = Field(default_factory=now_utc)


class ReportPatch(BaseModel):
    status: ReportStatus
    admin_note: Optional[str] = None


# ---------- site / admin ----------
class SiteSettings(BaseModel):
    require_approval: bool = False
    default_installation_id: str = BRAND["default_installation"]


class AdminStats(BaseModel):
    total_listings: int
    pending: int
    investigating: int
    hidden: int
    open_reports: int
    users: int
    launched_installations: int


# ---------- photos ----------
class PhotoOut(BaseModel):
    id: str
    url: str


# ---------- payments ----------
ProviderId = Literal["stripe", "paypal"]


class PaymentProvider(BaseModel):
    id: ProviderId
    label: str
    enabled: bool


class FeaturePlan(BaseModel):
    id: str
    label: str
    days: int
    amount: float


class PaymentConfig(BaseModel):
    providers: list[PaymentProvider]
    plans: list[FeaturePlan]
    live: bool


class CheckoutIn(BaseModel):
    listing_id: str
    plan_id: str
    provider: ProviderId


class CheckoutOut(BaseModel):
    intent_id: str
    status: Literal["not_configured", "requires_redirect", "succeeded"]
    message: str
    checkout_url: Optional[str] = None
