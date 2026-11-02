"""Transactional email through Resend (password resets only)."""

import logging
import os

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

RESEND_URL = "https://api.resend.com/emails"


async def send_email(*, to: str, subject: str, html: str) -> str | None:
    key = os.environ.get("RESEND_API_KEY")
    if not key:
        logger.warning("RESEND_API_KEY not set; email to %s dropped", to)
        raise HTTPException(status_code=503, detail="Email is not configured yet")
    payload = {"from": f"{os.environ['EMAIL_FROM_NAME']} <{os.environ['EMAIL_FROM']}>",
               "to": [to], "subject": subject, "html": html}
    reply_to = os.environ.get("EMAIL_REPLY_TO")
    if reply_to:
        payload["reply_to"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(RESEND_URL, headers={"Authorization": f"Bearer {key}"}, json=payload)
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        logger.error("Resend %s: %s", e.response.status_code, e.response.text)
        raise HTTPException(status_code=502, detail="Failed to send email")
    except httpx.HTTPError as e:
        logger.error("Email send error: %s", e)
        raise HTTPException(status_code=502, detail="Failed to send email")
