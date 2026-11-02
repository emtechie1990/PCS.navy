import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from lib import pages  # noqa: E402
from lib.brand import BRAND  # noqa: E402
from lib.db import client, ensure_indexes  # noqa: E402
from lib.seed_data import seed  # noqa: E402
from lib.security import SecurityHeadersMiddleware, allowed_hosts, configured_origins  # noqa: E402
from routers import admin, auth, market, payments  # noqa: E402

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def _boot() -> None:
    await ensure_indexes()
    try:
        await seed()
    except Exception as exc:  # never block boot on seeding
        logger.error("seed failed: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.boot_task = asyncio.create_task(_boot())
    yield
    client.close()


app = FastAPI(lifespan=lifespan, title=BRAND["domain"])
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": f"{BRAND['domain']} API", "brand": BRAND["slug"]}


api_router.include_router(auth.router)
api_router.include_router(market.router)
api_router.include_router(admin.router)
api_router.include_router(payments.router)

origins = configured_origins()
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=origins,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Content-Type"],
    )
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts())

app.include_router(api_router)
app.include_router(pages.router)  # last: ends in the SPA catch-all
