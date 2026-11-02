"""Small, dependency-free HTTP security controls shared by the PCS sites."""

import os

from starlette.types import ASGIApp, Message, Receive, Scope, Send


def configured_origins() -> list[str]:
    """Return explicit browser origins only; a credentialed wildcard is never valid."""
    raw = os.environ.get("CORS_ORIGINS", "")
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip() and origin.strip() != "*"]


def allowed_hosts() -> list[str]:
    configured = [host.strip().lower() for host in os.environ.get("SITE_HOSTS", "").split(",") if host.strip()]
    return [*configured, "localhost", "127.0.0.1", "testserver"]


class SecurityHeadersMiddleware:
    """Set browser hardening headers without changing application responses."""

    _HEADERS = (
        (b"x-content-type-options", b"nosniff"),
        (b"x-frame-options", b"DENY"),
        (b"referrer-policy", b"strict-origin-when-cross-origin"),
        (b"permissions-policy", b"camera=(), microphone=(), geolocation=(), payment=()"),
        (b"content-security-policy", b"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' https: data: blob:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; connect-src 'self'"),
    )

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = message.setdefault("headers", [])
                existing = {key.lower() for key, _ in headers}
                headers.extend((key, value) for key, value in self._HEADERS if key not in existing)
            await send(message)

        await self.app(scope, receive, send_with_headers)
