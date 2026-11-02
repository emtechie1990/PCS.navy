"""Public marketplace: site settings, installations, listings, reports."""

import re
from datetime import timedelta
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from lib import brand
from lib.auth import get_current_user, get_optional_user
from lib.db import db
from models.schemas import (Installation, Listing, ListingIn, ListingPage, MessageOut, Report,
                            ReportIn, SiteSettings, now_utc)

router = APIRouter(tags=["market"])


async def get_settings() -> SiteSettings:
    doc = await db.settings.find_one({"id": "site"}, {"_id": 0})
    return SiteSettings(**doc) if doc else SiteSettings()


@router.get("/brand")
async def brand_info():
    return brand.public()


@router.get("/site", response_model=SiteSettings)
async def site():
    return await get_settings()


@router.get("/installations", response_model=list[Installation])
async def installations(include_unlaunched: bool = False):
    q = {} if include_unlaunched else {"launched": True}
    docs = await db.installations.find(q, {"_id": 0}).sort("sort", 1).to_list(200)
    return [Installation(**d) for d in docs]


@router.get("/installations/{id}", response_model=Installation)
async def installation(id: str):
    doc = await db.installations.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Installation not found")
    return Installation(**doc)


@router.get("/listings", response_model=ListingPage)
async def search_listings(
    installation_id: Optional[str] = None,
    category: Optional[Literal["housing", "vehicle", "goods"]] = None,
    area: Optional[str] = None,
    q: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    available_by: Optional[str] = None,
    posted_within_days: Optional[int] = None,
    sort: Literal["newest", "oldest", "price_asc", "price_desc"] = "newest",
    limit: int = Query(60, le=200),
):
    f: dict = {"status": "approved"}
    if installation_id:
        f["installation_id"] = installation_id
    if category:
        f["category"] = category
    if area:
        f["area"] = area
    if q:
        rx = re.escape(q.strip())
        f["$or"] = [{"title": {"$regex": rx, "$options": "i"}},
                    {"description": {"$regex": rx, "$options": "i"}}]
    price: dict = {}
    if min_price is not None:
        price["$gte"] = min_price
    if max_price is not None:
        price["$lte"] = max_price
    if price:
        f["price"] = price
    if available_by:
        f["$and"] = [{"$or": [{"available_date": None}, {"available_date": {"$lte": available_by}}]}]
    if posted_within_days:
        f["created_at"] = {"$gte": now_utc() - timedelta(days=posted_within_days)}
    order = {"newest": [("featured", -1), ("created_at", -1)], "oldest": [("created_at", 1)],
             "price_asc": [("price", 1)], "price_desc": [("price", -1)]}[sort]
    total = await db.listings.count_documents(f)
    docs = await db.listings.find(f, {"_id": 0}).sort(order).to_list(limit)
    return ListingPage(items=[Listing(**d) for d in docs], total=total)


@router.get("/listings/mine", response_model=list[Listing])
async def my_listings(user: dict = Depends(get_current_user)):
    docs = await db.listings.find({"owner_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Listing(**d) for d in docs]


@router.get("/listings/{id}", response_model=Listing)
async def get_listing(id: str, user: Optional[dict] = Depends(get_optional_user)):
    doc = await db.listings.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Listing not found")
    visible = doc["status"] == "approved" or (user and (user.get("role") == "admin" or user["id"] == doc.get("owner_id")))
    if not visible:
        raise HTTPException(status_code=404, detail="Listing not found")
    return Listing(**doc)


@router.post("/listings", response_model=Listing)
async def create_listing(body: ListingIn, user: Optional[dict] = Depends(get_optional_user)):
    inst = await db.installations.find_one({"id": body.installation_id})
    if not inst:
        raise HTTPException(status_code=400, detail="Unknown installation")
    settings = await get_settings()
    listing = Listing(**body.model_dump(), owner_id=user["id"] if user else None,
                      seller_verified=bool(user and user["email"].lower().endswith(brand.BRAND["verified"])),
                      status="pending" if settings.require_approval else "approved")
    await db.listings.insert_one(listing.model_dump())
    return listing


@router.delete("/listings/{id}", response_model=MessageOut)
async def delete_listing(id: str, user: dict = Depends(get_current_user)):
    doc = await db.listings.find_one({"id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="Listing not found")
    if user.get("role") != "admin" and doc.get("owner_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    await db.listings.delete_one({"id": id})
    return MessageOut(message="Listing removed")


@router.post("/listings/{id}/report", response_model=Report)
async def report_listing(id: str, body: ReportIn):
    doc = await db.listings.find_one({"id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="Listing not found")
    report = Report(**body.model_dump(), listing_id=id, listing_title=doc["title"])
    await db.reports.insert_one(report.model_dump())
    await db.listings.update_one({"id": id}, {"$inc": {"report_count": 1}})
    return report
