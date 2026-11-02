import os
import secrets
from datetime import datetime, timedelta, timezone
from html import escape

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from lib.brand import BRAND
from lib.auth import (SESSION_COOKIE, aware, create_session, get_optional_user, hash_password,
                      sha, verify_password)
from lib.db import db
from lib.email import send_email
from models.schemas import (ForgotIn, LoginIn, MessageOut, RegisterIn, ResetIn, UserPublic,
                            new_id, now_utc)

router = APIRouter(prefix="/auth", tags=["auth"])


def public(u: dict) -> UserPublic:
    return UserPublic(id=u["id"], email=u["email"], name=u["name"], role=u.get("role", "user"),
                      verified_military=is_mil(u["email"]))


def is_mil(email: str) -> bool:
    return email.lower().endswith(BRAND["verified"])


@router.post("/register", response_model=UserPublic)
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = {"id": new_id(), "email": email, "name": body.name.strip(), "role": "user",
            "password_hash": hash_password(body.password), "created_at": now_utc()}
    await db.users.insert_one(user)
    await create_session(response, user["id"])
    return public(user)


@router.post("/login", response_model=UserPublic)
async def login(body: LoginIn, response: Response):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await create_session(response, user["id"])
    return public(user)


@router.post("/logout", response_model=MessageOut)
async def logout(request: Request, response: Response):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        await db.sessions.delete_one({"token_hash": sha(token)})
    response.delete_cookie(SESSION_COOKIE, path="/")
    return MessageOut(message="Signed out")


@router.get("/me", response_model=Optional[UserPublic])
async def me(user: Optional[dict] = Depends(get_optional_user)):
    """Returns null for guests (200) so the frontend doesn't log 401s on every page."""
    return public(user) if user else None


def site_base(request: Request) -> str:
    """Reset links point at the domain the user is on — but only allow-listed hosts
    (SITE_HOSTS + APP_URL host), so a spoofed Host header can't redirect tokens."""
    app_url = os.environ.get("APP_URL", "").rstrip("/")
    allowed = {h.strip().lower() for h in os.environ.get("SITE_HOSTS", "").split(",") if h.strip()}
    host = (request.headers.get("x-forwarded-host") or request.headers.get("host") or "").split(",")[0].strip().lower()
    if host and host in allowed:
        return f"https://{host}"
    return app_url


@router.post("/forgot-password", response_model=MessageOut)
async def forgot_password(body: ForgotIn, request: Request):
    generic = MessageOut(message="If an account exists for that email, a reset link is on its way.")
    user = await db.users.find_one({"email": body.email.lower()})
    if not user:
        return generic
    # Rate-limit: one outstanding request per 2 minutes per user.
    recent = await db.password_resets.find_one({
        "user_id": user["id"],
        "created_at": {"$gt": datetime.now(timezone.utc) - timedelta(minutes=2)},
    })
    if recent:
        return generic
    token = secrets.token_urlsafe(32)
    await db.password_resets.insert_one({
        "token_hash": sha(token), "user_id": user["id"], "used": False,
        "created_at": now_utc(), "expires_at": now_utc() + timedelta(hours=1),
    })
    base = site_base(request)
    link = f"{base}/reset-password?token={token}"
    brand = escape(os.environ["EMAIL_FROM_NAME"])
    html = (
        '<table role="presentation" width="100%" style="background:#F8FAFC"><tr><td style="padding:32px;'
        'font-family:Arial,sans-serif;color:#0F172A">'
        f'<p style="font-size:18px;font-weight:bold;margin:0 0 16px">{brand}</p>'
        f'<p>Hi {escape(user["name"])},</p>'
        '<p>We received a request to reset the password on your account. This link expires in 1 hour.</p>'
        f'<p><a href="{escape(link)}" style="display:inline-block;background:#1E3A8A;color:#ffffff;'
        'padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Reset my password</a></p>'
        '<p style="font-size:13px;color:#475569">If you did not request this, you can ignore this email.</p>'
        f'<p style="font-size:12px;color:#94A3B8">Sent by {brand}, an independent marketplace for military '
        f'families. Not affiliated with the U.S. {BRAND["branch"]} or DoD. We never ask for your password by email.</p>'
        '</td></tr></table>'
    )
    await send_email(to=user["email"], subject=f"Reset your {os.environ['EMAIL_FROM_NAME']} password",
                     html=html)
    return generic


@router.post("/reset-password", response_model=MessageOut)
async def reset_password(body: ResetIn):
    rec = await db.password_resets.find_one({"token_hash": sha(body.token), "used": False})
    if not rec or aware(rec["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")
    await db.users.update_one({"id": rec["user_id"]},
                              {"$set": {"password_hash": hash_password(body.password)}})
    await db.password_resets.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    await db.sessions.delete_many({"user_id": rec["user_id"]})
    return MessageOut(message="Password updated. You can sign in now.")
