"""Cookie-session auth helpers (stdlib PBKDF2 hashing, opaque session tokens in Mongo)."""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, Response

from lib.db import db

SESSION_COOKIE = "pcs_session"
SESSION_DAYS = 14


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    return f"{salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split("$", 1)
    except ValueError:
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    return hmac.compare_digest(dk.hex(), digest)


def sha(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


async def create_session(response: Response, user_id: str) -> None:
    token = secrets.token_urlsafe(32)
    await db.sessions.insert_one({
        "token_hash": sha(token),
        "user_id": user_id,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS),
    })
    response.set_cookie(
        SESSION_COOKIE, token, httponly=True, secure=True, samesite="lax",
        max_age=SESSION_DAYS * 86400, path="/",
    )


async def get_optional_user(request: Request) -> Optional[dict]:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    sess = await db.sessions.find_one({"token_hash": sha(token)})
    if not sess or aware(sess["expires_at"]) < datetime.now(timezone.utc):
        return None
    return await db.users.find_one({"id": sess["user_id"]}, {"_id": 0})


async def get_current_user(user: Optional[dict] = Depends(get_optional_user)) -> dict:
    if not user:
        raise HTTPException(status_code=401, detail="Not signed in")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
