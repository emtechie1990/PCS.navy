"""Payment safety checks that do not call a real provider or database."""

import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from models.schemas import CheckoutIn
from routers import payments


def test_config_requires_explicit_enablement(monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "present-but-not-live")
    monkeypatch.setenv("PAYPAL_CLIENT_ID", "present-but-not-live")
    monkeypatch.setenv("PAYPAL_CLIENT_SECRET", "present-but-not-live")
    monkeypatch.setenv("PAYMENTS_ENABLED", "false")

    config = asyncio.run(payments.config())

    assert not config.live
    assert not any(provider.enabled for provider in config.providers)


def test_config_only_enables_configured_provider_after_approval(monkeypatch):
    monkeypatch.setenv("PAYMENTS_ENABLED", "true")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "present")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "present")
    monkeypatch.delenv("PAYPAL_CLIENT_ID", raising=False)
    monkeypatch.delenv("PAYPAL_CLIENT_SECRET", raising=False)

    config = asyncio.run(payments.config())

    assert config.live
    assert {provider.id: provider.enabled for provider in config.providers} == {"stripe": True, "paypal": False}


def test_stripe_requires_a_webhook_signing_secret(monkeypatch):
    monkeypatch.setenv("PAYMENTS_ENABLED", "true")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "present")
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)

    config = asyncio.run(payments.config())

    assert not config.live
    assert not any(provider.enabled for provider in config.providers)


class _Listings:
    async def find_one(self, query):
        return {"id": query["id"], "owner_id": "owner", "title": "A real listing"}


class _Intents:
    def __init__(self):
        self.writes = []

    async def insert_one(self, document):
        self.writes.append(document)


def test_disabled_checkout_makes_no_provider_call_or_database_write(monkeypatch):
    intents = _Intents()
    monkeypatch.setattr(payments, "db", SimpleNamespace(listings=_Listings(), payment_intents=intents))
    monkeypatch.setenv("PAYMENTS_ENABLED", "false")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "present-but-disabled")

    async def unexpected_provider_call(*args, **kwargs):
        raise AssertionError("provider must not be called while payments are disabled")

    monkeypatch.setattr(payments, "_stripe_session", unexpected_provider_call)
    result = asyncio.run(payments.checkout(CheckoutIn(listing_id="listing", plan_id="boost-7", provider="stripe"), {"id": "owner", "role": "user"}))

    assert result.status == "not_configured"
    assert not result.checkout_url
    assert intents.writes == []


@pytest.mark.parametrize("user", [
    {"id": "other-user", "role": "user"},
    {"id": "admin-user", "role": "admin"},
])
def test_checkout_never_allows_a_non_owner_to_start_a_provider_charge(monkeypatch, user):
    intents = _Intents()
    monkeypatch.setattr(payments, "db", SimpleNamespace(listings=_Listings(), payment_intents=intents))
    monkeypatch.setenv("PAYMENTS_ENABLED", "true")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "present")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "present")

    async def unexpected_provider_call(*args, **kwargs):
        raise AssertionError("provider must not be called for a non-owner")

    monkeypatch.setattr(payments, "_stripe_session", unexpected_provider_call)
    with pytest.raises(HTTPException) as error:
        asyncio.run(payments.checkout(CheckoutIn(listing_id="listing", plan_id="boost-7", provider="stripe"), user))

    assert error.value.status_code == 403
    assert intents.writes == []


class _Store:
    """Minimal async stand-in for the two collections the return handlers touch."""

    def __init__(self, intent, listing):
        self.intent, self.listing, self.sets = intent, listing, []

    @property
    def payment_intents(self):
        store = self

        class C:
            async def find_one(self, q): return store.intent
            async def update_one(self, q, u): store.sets.append(("intent", u["$set"]))
        return C()

    @property
    def listings(self):
        store = self

        class C:
            async def find_one(self, q, proj=None): return store.listing
            async def update_one(self, q, u): store.sets.append(("listing", u["$set"]))
        return C()


@pytest.mark.parametrize("handler, kwargs", [
    (payments.stripe_return, {"session_id": "cs_1"}),
    (payments.paypal_return, {"token": "ORDER1"}),
])
def test_return_page_refresh_after_payment_never_contacts_the_provider(monkeypatch, handler, kwargs):
    paid = {"id": "i1", "listing_id": "L1", "status": "paid", "payment_authorized": True, "provider_ref": "cs_1"}
    monkeypatch.setattr(payments, "db", _Store(paid, {"id": "L1"}))

    class NoNetwork:
        def __init__(self, *a, **k): raise AssertionError("provider must not be called for a paid intent")
    monkeypatch.setattr(payments.httpx, "AsyncClient", NoNetwork)

    response = asyncio.run(handler(**kwargs))
    assert response.status_code == 307 and response.headers["location"] == "/listing/L1?spotlight=1"


def test_fulfil_adds_to_a_spotlight_that_is_still_running():
    from datetime import timedelta
    from models.schemas import now_utc
    remaining_until = now_utc() + timedelta(days=5)
    store = _Store({"id": "i1", "listing_id": "L1", "plan_id": "boost-7", "status": "pending", "payment_authorized": True},
                   {"id": "L1", "featured_until": remaining_until})
    payments.db = store
    asyncio.run(payments._fulfil(store.intent))
    listing_set = dict(store.sets)["listing"]
    assert listing_set["featured"] and listing_set["featured_until"] == remaining_until + timedelta(days=7)
    assert dict(store.sets)["intent"]["status"] == "paid"
