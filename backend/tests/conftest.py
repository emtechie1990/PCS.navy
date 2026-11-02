"""Pytest fixtures: tests hit a running server (BACKEND_URL, default http://localhost:8001)."""

import os

import httpx
import pytest
import pytest_asyncio

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
API_URL = f"{BACKEND_URL}/api"


@pytest.fixture
def client():
    with httpx.Client(base_url=API_URL, timeout=30.0) as c:
        yield c


@pytest_asyncio.fixture
async def aclient():
    async with httpx.AsyncClient(base_url=API_URL, timeout=30.0) as c:
        yield c


@pytest.fixture
def site():
    """Client rooted at the site itself, for the non-/api pages."""
    with httpx.Client(base_url=BACKEND_URL, timeout=30.0) as c:
        yield c
