from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import require_admin
from lib.db import db
from models.schemas import (AdminStats, Installation, InstallationPatch, Listing,
                            ListingStatus, ListingStatusPatch, Report, ReportPatch, ReportStatus,
                            SiteSettings, now_utc)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/stats", response_model=AdminStats)
async def stats():
    c = db.listings.count_documents
    return AdminStats(
        total_listings=await c({}),
        pending=await c({"status": "pending"}),
        investigating=await c({"status": "investigating"}),
        hidden=await c({"status": "hidden"}),
        open_reports=await db.reports.count_documents({"status": {"$in": ["open", "investigating"]}}),
        users=await db.users.count_documents({}),
        launched_installations=await db.installations.count_documents({"launched": True}),
    )


@router.get("/listings", response_model=list[Listing])
async def admin_listings(status: Optional[ListingStatus] = None, reported: bool = False):
    f: dict = {}
    if status:
        f["status"] = status
    if reported:
        f["report_count"] = {"$gt": 0}
    docs = await db.listings.find(f, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Listing(**d) for d in docs]


@router.patch("/listings/{id}", response_model=Listing)
async def set_listing_status(id: str, body: ListingStatusPatch):
    upd = {"status": body.status, "updated_at": now_utc()}
    if body.admin_note is not None:
        upd["admin_note"] = body.admin_note
    res = await db.listings.find_one_and_update({"id": id}, {"$set": upd}, projection={"_id": 0},
                                                return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail="Listing not found")
    return Listing(**res)


@router.get("/reports", response_model=list[Report])
async def reports(status: Optional[ReportStatus] = None):
    f = {"status": status} if status else {}
    docs = await db.reports.find(f, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Report(**d) for d in docs]


@router.patch("/reports/{id}", response_model=Report)
async def update_report(id: str, body: ReportPatch):
    upd = body.model_dump(exclude_none=True)
    res = await db.reports.find_one_and_update({"id": id}, {"$set": upd}, projection={"_id": 0},
                                               return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail="Report not found")
    return Report(**res)


@router.patch("/installations/{id}", response_model=Installation)
async def toggle_installation(id: str, body: InstallationPatch):
    res = await db.installations.find_one_and_update({"id": id}, {"$set": {"launched": body.launched}},
                                                     projection={"_id": 0}, return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail="Installation not found")
    return Installation(**res)


@router.put("/settings", response_model=SiteSettings)
async def put_settings(body: SiteSettings):
    if not await db.installations.find_one({"id": body.default_installation_id}):
        raise HTTPException(status_code=400, detail="Unknown installation")
    await db.installations.update_one({"id": body.default_installation_id}, {"$set": {"launched": True}})
    await db.settings.update_one({"id": "site"}, {"$set": body.model_dump()}, upsert=True)
    return body
