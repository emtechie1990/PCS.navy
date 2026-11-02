"""Idempotent seed: installations, site settings, owner admin, sample listings.
Called at startup (server lifespan) and by `python seed.py`."""

import os
from datetime import timedelta

from lib.auth import hash_password
from lib.brand import BRAND
from lib.db import db
from models.schemas import Listing, Report, new_id, now_utc

HOUSE = ["/img/house-1.jpg", "/img/house-2.jpg", "/img/house-3.jpg"]
CARS = ["/img/car-1.jpg", "/img/car-2.jpg", "/img/car-3.jpg"]
GOODS = ["/img/goods-1.jpg", "/img/goods-2.jpg", "/img/goods-3.jpg"]


def _installations() -> list[dict]:
    return [{
        "id": id_, "name": name, "short_name": short, "former_name": former, "city": city, "state": state,
        "tagline": tagline, "areas": areas, "housing_office_url": "https://www.homes.mil",
        "hero_image": HOUSE[i % 3], "sort": i,
    } for i, (id_, name, short, former, city, state, tagline, areas) in enumerate(BRAND["installations"])]


def _sample_listings() -> list[dict]:
    """Placeholder postings on the first four {stations}; every row is flagged sample=True."""
    now = now_utc()
    soon = lambda d: (now + timedelta(days=d)).strftime("%Y-%m-%d")  # noqa: E731
    inst = BRAND["installations"]
    rank = BRAND["ranks"]
    oconus = BRAND["oconus"]
    base = lambda i: inst[i][0]  # noqa: E731
    area = lambda i, k: inst[i][7][k]  # noqa: E731
    rows = [
        dict(category="housing", installation_id=base(0), area=area(0, 0),
             title="3BR townhouse, 12 min to the main gate", price=1650, price_unit="month",
             photos=[HOUSE[0], HOUSE[2]], contact_name=f"{rank[0]} M. Alvarez", contact_method="text",
             contact_value="(555) 010-0142", available_date=soon(21),
             description="Freshly painted 3 bed / 2.5 bath townhouse in a quiet cul-de-sac. Fenced yard, 2-car driveway, washer/dryer included. Military clause in lease. Within BAH for E-6 w/ dependents.",
             details={"listing_type": "rent", "beds": 3, "baths": 2.5, "sqft": 1540, "pets": "Cats & dogs under 50 lbs", "lease_term": "12 months", "military_clause": True}),
        dict(category="vehicle", installation_id=base(0), area=area(0, 1),
             title="2019 Ford F-150 XLT 4x4 — PCSing OCONUS", price=28900, price_unit="total",
             photos=[CARS[0]], contact_name=f"{rank[1]} J. Reyes", contact_method="email",
             contact_value="jreyes.pcs@example.com", available_date=soon(5),
             description=f"Orders to {oconus[0]}, truck has to go. Clean title, all maintenance records, new tires at 60k. Tow package, spray-in bedliner. Can meet at the Exchange.",
             details={"year": 2019, "make": "Ford", "model": "F-150 XLT", "mileage": 64200, "transmission": "Automatic", "title_status": "Clean", "drivetrain": "4x4"}),
        dict(category="goods", installation_id=base(0), area=area(0, 2),
             title="Sectional sofa + coffee table — weight allowance sale", price=450, price_unit="total",
             photos=[GOODS[0], GOODS[2]], contact_name="Jessica T.", contact_method="phone",
             contact_value="(555) 010-0177", available_date=soon(2),
             description="Over our HHG weight. L-shaped sectional (no pets, no smoke) and matching solid oak coffee table. Must pick up — we can help load.",
             details={"item_type": "Furniture", "condition": "Like new", "pcs_deadline": soon(14), "pickup_only": True}),
        dict(category="housing", installation_id=base(1), area=area(1, 1),
             title="4BR single-family home for sale, VA-loan ready", price=289000, price_unit="total",
             photos=[HOUSE[1], HOUSE[0]], contact_name=f"{rank[2]} D. Brooks", contact_method="email",
             contact_value="dbrooks.home@example.com", available_date=soon(45),
             description=f"Owner-occupied, PCSing to {inst[4][1]}. 4 bed / 2 bath, open kitchen, covered patio, great schools. 15 minutes to the gate.",
             details={"listing_type": "sale", "beds": 4, "baths": 2, "sqft": 2020, "pets": "N/A", "lease_term": "N/A", "military_clause": False}),
        dict(category="vehicle", installation_id=base(1), area=area(1, 0),
             title="2017 RAM 1500 Big Horn", price=21500, price_unit="total",
             photos=[CARS[1]], contact_name=f"{rank[3]} K. Nguyen", contact_method="text",
             contact_value="(555) 010-0110", available_date=soon(1),
             description="Reliable daily driver, Hemi V8, crew cab. Minor scuff on rear bumper. Title in hand.",
             details={"year": 2017, "make": "RAM", "model": "1500 Big Horn", "mileage": 88400, "transmission": "Automatic", "title_status": "Clean", "drivetrain": "4x2"}),
        dict(category="goods", installation_id=base(1), area=area(1, 2),
             title="Gray 3-piece sofa set", price=300, price_unit="total",
             photos=[GOODS[1]], contact_name="Amanda R.", contact_method="text",
             contact_value="(555) 010-0198", available_date=soon(3),
             description="Sofa, loveseat, and chair. Moving to quarters overseas that come furnished.",
             details={"item_type": "Furniture", "condition": "Good", "pcs_deadline": soon(10), "pickup_only": True}),
        dict(category="housing", installation_id=base(2), area=area(2, 1),
             title="2BR apartment, walk to the gate", price=1895, price_unit="month",
             photos=[HOUSE[2]], contact_name="Gateway Leasing", contact_method="phone",
             contact_value="(555) 010-0133", available_date=soon(10),
             description="Updated 2 bed / 2 bath on the 2nd floor with a great view. Garage parking, pet friendly, military discount on admin fee.",
             details={"listing_type": "rent", "beds": 2, "baths": 2, "sqft": 1050, "pets": "Yes, with deposit", "lease_term": "6 or 12 months", "military_clause": True}),
        dict(category="goods", installation_id=base(2), area=area(2, 0),
             title="Washer & dryer pair — Samsung", price=500, price_unit="total",
             photos=[GOODS[2]], contact_name=f"{rank[4]} L. Park", contact_method="email",
             contact_value="lpark.moves@example.com", available_date=soon(7),
             description="Front-load pair, 4 years old, works perfectly. New house already has appliances.",
             details={"item_type": "Appliances", "condition": "Good", "pcs_deadline": soon(20), "pickup_only": True}),
        dict(category="vehicle", installation_id=base(3), area=area(3, 0),
             title="2020 Chevy Silverado Z71 — low miles", price=33900, price_unit="total",
             photos=[CARS[2]], contact_name=f"{rank[5]} A. Carter", contact_method="text",
             contact_value="(555) 010-0165", available_date=soon(4),
             description=f"Single owner, garage-kept, Z71 off-road package. Selling before PCS to {oconus[1]}.",
             details={"year": 2020, "make": "Chevrolet", "model": "Silverado 1500 Z71", "mileage": 31800, "transmission": "Automatic", "title_status": "Clean", "drivetrain": "4x4"}),
        dict(category="housing", installation_id=base(3), area=area(3, 1),
             title="3BR ranch, fenced yard, 5 min to the gate", price=1450, price_unit="month",
             photos=[HOUSE[0]], contact_name="Mrs. Hall", contact_method="phone",
             contact_value="(555) 010-0120", available_date=soon(30),
             description=f"Single-story home, 1-car garage, large fenced backyard. Landlord is a retired {BRAND['branch']} family and accepts a military clause.",
             details={"listing_type": "rent", "beds": 3, "baths": 2, "sqft": 1350, "pets": "Dogs OK", "lease_term": "12 months", "military_clause": True}),
    ]
    out = []
    for i, r in enumerate(rows):
        lst = Listing(**r, featured=i in (0, 6), seller_verified=i in (0, 1, 3, 8), sample=True)
        d = lst.model_dump()
        d["created_at"] = now - timedelta(days=i * 2, hours=i)
        d["updated_at"] = d["created_at"]
        out.append(d)
    return out


async def seed() -> None:
    for inst in _installations():
        await db.installations.update_one({"id": inst["id"]},
                                          {"$set": inst, "$setOnInsert": {"launched": True}}, upsert=True)
    await db.settings.update_one({"id": "site"}, {"$setOnInsert": {
        "id": "site", "require_approval": False, "default_installation_id": BRAND["default_installation"]}}, upsert=True)

    admin_email = os.environ.get("ADMIN_EMAIL", "").lower()
    if admin_email:
        existing = await db.users.find_one({"email": admin_email})
        if not existing:
            await db.users.insert_one({
                "id": new_id(), "email": admin_email, "name": "Site Owner", "role": "admin",
                "password_hash": hash_password(os.environ["ADMIN_INITIAL_PASSWORD"]),
                "created_at": now_utc()})
        elif existing.get("role") != "admin":
            await db.users.update_one({"email": admin_email}, {"$set": {"role": "admin"}})

    if await db.listings.count_documents({}) == 0:
        listings = _sample_listings()
        await db.listings.insert_many(listings)
        target = listings[4]
        rep = Report(reason="misleading", details="Mileage in photo looks different from listed mileage.",
                     listing_id=target["id"], listing_title=target["title"])
        await db.reports.insert_one(rep.model_dump())
        await db.listings.update_one({"id": target["id"]}, {"$inc": {"report_count": 1}})
