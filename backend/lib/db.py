"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "users": [IndexModel([("email", ASCENDING)], name="email", unique=True),
              IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "sessions": [IndexModel([("token_hash", ASCENDING)], name="token_hash", unique=True),
                 IndexModel([("expires_at", ASCENDING)], name="expires_ttl", expireAfterSeconds=0)],
    "password_resets": [IndexModel([("token_hash", ASCENDING)], name="token_hash"),
                        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created")],
    "installations": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                      IndexModel([("launched", ASCENDING), ("sort", ASCENDING)], name="launched_sort")],
    "listings": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                 IndexModel([("status", ASCENDING), ("installation_id", ASCENDING), ("category", ASCENDING),
                             ("created_at", DESCENDING)], name="status_inst_cat_created"),
                 IndexModel([("owner_id", ASCENDING), ("created_at", DESCENDING)], name="owner_created")],
    "reports": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                IndexModel([("status", ASCENDING), ("created_at", DESCENDING)], name="status_created")],
    "settings": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "payment_intents": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                        IndexModel([("provider_ref", ASCENDING)], name="provider_ref", unique=True,
                                   sparse=True)],
    "account_profiles": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                         IndexModel([("owner_id", ASCENDING)], name="owner_id", unique=True),
                         IndexModel([("customer_type", ASCENDING)], name="customer_type")],
    "ad_campaigns": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                     IndexModel([("owner_id", ASCENDING), ("created_at", DESCENDING)], name="owner_created"),
                     IndexModel([("installation_id", ASCENDING), ("status", ASCENDING)], name="installation_status")],
    "billing_plans": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                      IndexModel([("owner_id", ASCENDING), ("paid_through", ASCENDING)], name="owner_paid_through"),
                      IndexModel([("stripe_subscription_id", ASCENDING)], name="stripe_subscription_id", sparse=True)],
    "ad_inquiries": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                     IndexModel([("campaign_id", ASCENDING), ("created_at", DESCENDING)], name="campaign_created")],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
