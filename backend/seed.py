"""Run `cd /app/backend && python seed.py` — idempotent; same seed the server runs at startup."""

import asyncio

from lib.db import ensure_indexes
from lib.seed_data import seed


async def main() -> None:
    await ensure_indexes()
    await seed()
    print("seed complete")


if __name__ == "__main__":
    asyncio.run(main())
