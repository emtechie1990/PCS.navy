"""Listing photos: visitors upload from phone or PC, bytes live in MongoDB (GridFS), served back from /api/photos/{id}."""

from datetime import timedelta
from typing import Literal

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

from lib.db import db
from models.schemas import PhotoOut, new_id, now_utc

router = APIRouter(prefix="/photos", tags=["photos"])
MAX_BYTES = 8 * 1024 * 1024


def bucket() -> AsyncIOMotorGridFSBucket:
    """Built per request: a bucket created at import time binds Mongo to the wrong event loop."""
    return AsyncIOMotorGridFSBucket(db, bucket_name="photos")


def _kind(head: bytes) -> str | None:
    """Real image type from the bytes, never from the filename or the client's content-type."""
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp"
    return None


@router.post("", response_model=PhotoOut)
async def upload(file: UploadFile = File(...), purpose: Literal["listing", "inventory"] = "listing"):
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Each photo must be under 8 MB")
    kind = _kind(data[:16])
    if not kind:
        raise HTTPException(status_code=415, detail="Use a JPEG, PNG or WebP image")
    pid = new_id()
    await bucket().upload_from_stream_with_id(pid, pid, data, metadata={"content_type": kind, "purpose": purpose, "created_at": now_utc()})
    return PhotoOut(id=pid, url=f"/api/photos/{pid}")


async def sweep_orphans() -> int:
    """Listing photos that never ended up on a listing within a day are dropped (abandoned forms, abuse)."""
    cutoff = now_utc() - timedelta(days=1)
    used = set()
    async for l in db.listings.find({}, {"photos": 1}):
        used.update(l.get("photos", []))
    removed = 0
    async for f in db["photos.files"].find({"metadata.purpose": "listing", "metadata.created_at": {"$lt": cutoff}}, {"_id": 1}):
        if f"/api/photos/{f['_id']}" not in used:
            await bucket().delete(f["_id"])
            removed += 1
    return removed


@router.get("/{pid}")
async def photo(pid: str):
    try:
        stream = await bucket().open_download_stream(pid)
    except Exception:
        raise HTTPException(status_code=404, detail="Photo not found")
    data = await stream.read()
    return Response(data, media_type=stream.metadata["content_type"],
                    headers={"Cache-Control": "public, max-age=31536000, immutable"})
