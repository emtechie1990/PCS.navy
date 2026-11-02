"""Everything served outside /api: the built React app, brand-specific PWA files, and the
server-rendered local pages (/near/<station>/<town>/<topic>) plus sitemap/robots.

The local pages are real content for search engines: live listings for one town and topic,
links into the app to browse or post, and the surrounding towns and topics."""

import re
from html import escape as e
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response

from lib.brand import BRAND, SIBLINGS, disclaimer
from lib.db import db

router = APIRouter()
DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
PUBLIC_URL = BRAND["url"]
C = BRAND["colors"]
CAMO = BRAND["camo"]

# Same mark as frontend/src/components/Brand.tsx, inlined for the server-rendered pages.
MARK = ('<svg viewBox="0 0 40 46" class="mark"><path d="M20 1 L38 7 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V7 Z" fill="#1A1A1A" stroke="#C8A951" stroke-width="2"/>'
        '<polygon points="20,11 22.6,18.2 30.2,18.4 24.2,23 26.4,30.2 20,26 13.6,30.2 15.8,23 9.8,18.4 17.4,18.2" fill="#C8A951"/>'
        '<path d="M11 34 L20 29.5 L29 34" fill="none" stroke="#F5F4F0" stroke-width="2"/></svg>')
HERO_OPEN = (f'<section class="hero camo"><img class="photo" src="{BRAND["hero"]["image"]}" alt="{e(BRAND["hero"]["alt"])}">'
             '<div class="veil"></div><div class="wrap"><div class="inner"><div class="crumbs">%CRUMBS%</div>')
HERO_CLOSE = '</div></div><div class="bar"></div></section>'

# (slug, label, category, extra Mongo filter) — the filter narrows a category to the topic.
_rx = lambda *words: {"$regex": "|".join(words), "$options": "i"}  # noqa: E731
TOPICS = [
    ("homes-for-rent", "Homes for rent", "housing", {"details.listing_type": "rent"}),
    ("homes-for-sale", "Homes for sale", "housing", {"details.listing_type": "sale"}),
    ("apartments", "Apartments", "housing", {"title": _rx("apartment", "apt", "condo", "loft")}),
    ("cars", "Cars & vehicles", "vehicle", {}),
    ("trucks", "Trucks", "vehicle", {"title": _rx("truck", "f-150", "f150", "silverado", "ram 1500", "tacoma", "tundra", "sierra")}),
    ("suvs", "SUVs", "vehicle", {"title": _rx("suv", "explorer", "tahoe", "4runner", "highlander", "pilot", "cr-v", "rav4", "wrangler")}),
    ("motorcycles", "Motorcycles", "vehicle", {"title": _rx("motorcycle", "harley", "yamaha", "kawasaki", "ducati", "sportbike")}),
    ("rvs-campers", "RVs & campers", "vehicle", {"title": _rx("rv", "camper", "trailer", "fifth wheel", "motorhome")}),
    ("furniture", "Furniture", "goods", {"$or": [{"details.item_type": "Furniture"}, {"title": _rx("sofa", "couch", "sectional", "table", "dresser", "desk", "bed frame")}]}),
    ("appliances", "Appliances", "goods", {"$or": [{"details.item_type": "Appliances"}, {"title": _rx("washer", "dryer", "fridge", "refrigerator", "stove", "microwave", "freezer")}]}),
    ("electronics", "Electronics", "goods", {"$or": [{"details.item_type": "Electronics"}, {"title": _rx("tv", "television", "laptop", "monitor", "xbox", "playstation", "console")}]}),
    ("baby-kids", "Baby & kids", "goods", {"title": _rx("baby", "crib", "stroller", "kids", "toddler", "car seat")}),
    ("outdoor-tools", "Outdoor & tools", "goods", {"title": _rx("grill", "tools", "mower", "patio", "bike", "bicycle", "kayak")}),
]
TOPIC = {t[0]: t for t in TOPICS}
CATEGORY_LABEL = {"housing": "Housing", "vehicle": "Vehicles", "goods": "Household goods"}


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


async def _installations() -> list[dict]:
    return await db.installations.find({}, {"_id": 0}).sort("sort", 1).to_list(500)


async def _inst(inst_id: str) -> dict:
    doc = await db.installations.find_one({"id": inst_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404)
    return doc


def _area(inst: dict, area_slug: str) -> str:
    for a in inst["areas"]:
        if slug(a) == area_slug:
            return a
    raise HTTPException(status_code=404)


def _money(l: dict) -> str:
    return f"${l['price']:,.0f}" + ("/mo" if l["price_unit"] == "month" else "")


def _card(l: dict) -> str:
    img = f'<img src="{e(l["photos"][0])}" alt="" loading="lazy">' if l["photos"] else '<div class="noimg"></div>'
    return (f'<a class="card" href="/listing/{e(l["id"])}">{img}<div class="bd"><b>{_money(l)}</b>'
            f'<span>{e(l["title"])}</span><small>{e(l["area"])}'
            f'{" · Sample listing" if l.get("sample") else ""}</small></div></a>')


def _page(title: str, description: str, path: str, crumbs: list[tuple[str, str]], body: str) -> HTMLResponse:
    crumb_html = " › ".join(f'<a href="{e(h)}">{e(t)}</a>' for t, h in crumbs)
    crumb_ld = ",".join(f'{{"@type":"ListItem","position":{i + 1},"name":"{e(t)}","item":"{PUBLIC_URL}{e(h)}"}}'
                        for i, (t, h) in enumerate(crumbs))
    sibs = " · ".join(f'<a href="{u}">{d}</a>' for d, u in SIBLINGS)
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)} | {BRAND['domain']}</title>
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{PUBLIC_URL}{e(path)}">
<meta name="theme-color" content="{C['primary']}">
<link rel="icon" href="/brand/{BRAND['slug']}/icons/icon-32.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{PUBLIC_URL}{e(path)}"><meta property="og:site_name" content="{BRAND['domain']}">
<meta property="og:image" content="{PUBLIC_URL}{BRAND['hero']['image']}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Oswald:wght@600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{crumb_ld}]}}</script>
<style>
:root{{--p:{C['primary']};--pd:{C['primary_dark']};--a:{C['accent']};--al:{CAMO['accent_light']};--ink:{C['ink']};--paper:{C['paper']};--sand:{C['sand']};--muted:{C['muted']};--border:{C['border']}}}
*{{box-sizing:border-box;margin:0;padding:0}}body{{font-family:Inter,system-ui,sans-serif;background:var(--paper);color:var(--ink);line-height:1.5;-webkit-font-smoothing:antialiased}}
a{{color:inherit;text-decoration:none}}h1,h2,h3{{font-family:Oswald,'Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.02em;line-height:1.05}}
img{{display:block;max-width:100%}}.wrap{{max-width:1240px;margin:0 auto;padding:0 24px}}
.banner{{background:var(--ink);color:rgba(255,255,255,.72);font-size:11px}}.banner .wrap{{display:flex;align-items:center;gap:8px;padding-top:6px;padding-bottom:6px}}
.banner .dot{{width:8px;height:8px;border-radius:50%;background:var(--al);flex-shrink:0}}.banner a{{margin-left:auto;color:var(--al);white-space:nowrap}}
header{{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--paper) 90%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}}
header .wrap{{display:flex;align-items:center;height:64px;gap:16px}}.logo{{display:flex;align-items:center;gap:10px}}.mark{{height:36px;width:auto}}
.logo-text{{font-family:Oswald;font-weight:700;font-size:21px;letter-spacing:.06em;text-transform:uppercase}}.logo-text b{{color:var(--a)}}
.navs{{display:flex;gap:2px;margin-left:16px}}.navs a{{padding:8px 12px;font-size:14px;font-weight:500;color:color-mix(in srgb,var(--ink) 75%,transparent)}}.navs a:hover{{color:var(--ink)}}
.hdr-right{{margin-left:auto;display:flex;gap:8px;align-items:center}}
.btn{{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:14px;border-radius:6px;padding:10px 16px;border:1px solid transparent}}
.btn-primary{{background:var(--p);color:#fff}}.btn-primary:hover{{background:var(--pd)}}.btn-outline{{background:#fff;border-color:var(--border);color:var(--ink)}}.btn-outline:hover{{background:var(--sand)}}
.camo{{background-color:{CAMO['base']};background-image:
  conic-gradient(from 90deg at 12px 12px,{CAMO['blocks'][0]} 25%,transparent 0) 0 0/48px 36px,
  conic-gradient(from 180deg at 18px 6px,{CAMO['blocks'][1]} 25%,transparent 0) 20px 14px/64px 44px,
  conic-gradient(from 0deg at 8px 8px,{CAMO['blocks'][2]} 25%,transparent 0) 6px 22px/40px 52px,
  conic-gradient(from 270deg at 10px 16px,{CAMO['blocks'][3]} 25%,transparent 0) 30px 4px/72px 60px}}
.hero{{position:relative;overflow:hidden;color:#fff}}.hero .photo{{position:absolute;inset:0 0 0 auto;width:58%;height:100%;object-fit:cover;object-position:{BRAND['hero']['position']}}}
.hero .veil{{position:absolute;inset:0;background:linear-gradient(100deg,rgba({CAMO['veil']},0.97) 0%,rgba({CAMO['veil']},0.88) 45%,rgba({CAMO['veil']},0.35) 100%)}}
.hero .inner{{position:relative;padding:72px 0 100px;max-width:720px}}.hero .crumbs{{font-size:13px;color:rgba(255,255,255,.7)}}.hero .crumbs a:hover{{color:#fff}}
.hero h1{{margin-top:18px;font-size:clamp(40px,6vw,72px);font-weight:700;line-height:.95;letter-spacing:.03em}}.hero p{{margin-top:22px;font-size:18px;color:rgba(255,255,255,.8);max-width:600px}}
.hero .cta{{margin-top:28px;display:flex;gap:12px;flex-wrap:wrap}}.hero .btn{{height:52px;padding:0 22px;font-size:16px;background:var(--al);color:var(--ink)}}
.hero .btn.o{{background:transparent;border-color:rgba(255,255,255,.35);color:#fff}}.hero .bar{{position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--a)}}
.wrap>section{{margin-top:40px}}section h2{{font-size:26px;margin-bottom:12px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}}
.card{{background:#fff;border:1px solid var(--border);border-radius:6px;overflow:hidden;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s}}.card:hover{{transform:translateY(-4px);box-shadow:0 16px 32px rgba(10,20,40,.12)}}
.card img,.noimg{{aspect-ratio:4/3;object-fit:cover;width:100%;background:var(--sand)}}.card .bd{{padding:12px;display:grid;gap:4px}}.card b{{font-family:Oswald;font-size:22px}}.card small{{color:var(--muted)}}
.links{{display:flex;flex-wrap:wrap;gap:8px}}.links a{{background:#fff;border:1px solid var(--border);border-left:3px solid var(--p);border-radius:4px;padding:8px 12px;font-size:14px}}.links a:hover{{background:var(--sand)}}
.empty{{background:#fff;border:1px dashed var(--border);padding:28px;text-align:center;border-radius:6px;max-width:420px}}.empty .btn{{background:var(--p);color:#fff;margin-top:8px}}
footer{{position:relative;margin-top:96px;color:#fff}}footer .shade{{position:absolute;inset:0;background:rgba(5,10,20,.9)}}footer .wrap{{position:relative;padding:32px 24px;font-size:12px;color:rgba(255,255,255,.7)}}footer a{{color:var(--al)}}
@media (max-width:1100px){{.navs{{display:none}}}}@media (max-width:900px){{.hero .photo{{width:100%;opacity:.3}}}}
</style></head><body>
<div class="banner"><div class="wrap"><span class="dot"></span><span>{e(disclaimer())}</span><a href="/safety">Learn more</a></div></div>
<header><div class="wrap">
<a href="/" class="logo">{MARK}<span class="logo-text">{BRAND['domain'].split('.')[0]}<b>.</b>{BRAND['domain'].split('.')[1]}</span></a>
<nav class="navs"><a href="/search?category=housing">Find housing</a><a href="/search?category=vehicle">Vehicles</a><a href="/search?category=goods">Household goods</a><a href="/near">{e(BRAND['stations'].capitalize())}</a><a href="/resources">PCS resources</a><a href="/safety">Safety</a></nav>
<div class="hdr-right"><a href="/login" class="btn btn-outline">Sign in</a><a href="/create" class="btn btn-primary">+ Post listing</a></div>
</div></header>
<main>{body.replace('%CRUMBS%', crumb_html)}</main>
<footer class="camo"><div class="shade"></div><div class="wrap">{e(disclaimer())} Always verify listings in person and never wire money or pay with gift cards.<br>Also serving: {sibs}</div></footer>
</body></html>"""
    return HTMLResponse(html)


@router.get("/near", response_class=HTMLResponse)
async def near_index():
    insts = await _installations()
    links = "".join(f'<a href="/near/{i["id"]}">{e(i["name"])} — {e(i["city"])}, {e(i["state"])}</a>' for i in insts)
    body = f"""{HERO_OPEN}
<h1>Housing, vehicles and household goods near every {BRAND['branch']} {e(BRAND['station'])}</h1>
<p>Pick your {e(BRAND['station'])} to see the towns around the gate and what {BRAND['members']} are listing there right now.</p>{HERO_CLOSE}
<div class="wrap"><section><h2>{e(BRAND['stations']).capitalize()}</h2><div class="links">{links}</div></section></div>"""
    return _page(f"Near every {BRAND['branch']} {BRAND['station']}",
                 f"Local PCS boards for every {BRAND['branch']} {BRAND['station']}: housing, vehicles and household goods by town.",
                 "/near", [("Home", "/"), (BRAND["stations"].capitalize(), "/near")], body)


@router.get("/near/{inst_id}", response_class=HTMLResponse)
async def near_installation(inst_id: str):
    inst = await _inst(inst_id)
    listings = await db.listings.find({"status": "approved", "installation_id": inst_id}, {"_id": 0}).sort("created_at", -1).to_list(12)
    areas = "".join(f'<a href="/near/{inst_id}/{slug(a)}">{e(a)}</a>' for a in inst["areas"])
    topics = "".join(f'<a href="/near/{inst_id}/{slug(inst["areas"][0])}/{s}">{e(l)}</a>' for s, l, _, _ in TOPICS)
    cards = "".join(_card(l) for l in listings) or f'<div class="empty">Nothing posted at {e(inst["name"])} yet. <a class="btn" href="/create?base={inst_id}">Be the first</a></div>'
    body = f"""{HERO_OPEN}
<h1>PCS to {e(inst['name'])}: housing, vehicles and household goods</h1>
<p>{e(inst['tagline'])} {e(inst['name'])} sits by {e(inst['city'])}, {e(inst['state'])}. Browse rentals, homes for sale, cars, trucks and
furniture listed by {BRAND['members']} and families in {e(", ".join(a for a in inst['areas'] if not a.startswith('On ')))}.</p>
<div class="cta"><a class="btn" href="/installation/{inst_id}">Open the {e(inst['short_name'])} board</a><a class="btn o" href="/create?base={inst_id}">Post a listing</a></div>{HERO_CLOSE}
<div class="wrap"><section><h2>Latest at {e(inst['short_name'])}</h2><div class="grid">{cards}</div></section>
<section><h2>Towns around {e(inst['short_name'])}</h2><div class="links">{areas}</div></section>
<section><h2>Browse by topic</h2><div class="links">{topics}</div></section>
<section><h2>Official {e(inst['short_name'])} housing</h2><p>On-{e(BRAND['station'].split()[-1])} and privatized housing is handled by the housing office — <a href="{e(inst['housing_office_url'])}" rel="noopener">HOMES.mil</a> (DoD). {BRAND['domain']} is the off-{e(BRAND['station'].split()[-1])} marketplace layer.</p></section></div>"""
    return _page(f"PCS to {inst['name']} — housing & marketplace",
                 f"Rentals, homes for sale, vehicles and household goods near {inst['name']} ({inst['city']}, {inst['state']}), listed by {BRAND['members']} and military families.",
                 f"/near/{inst_id}", [("Home", "/"), (BRAND["stations"].capitalize(), "/near"), (inst["name"], f"/near/{inst_id}")], body)


@router.get("/near/{inst_id}/{area_slug}", response_class=HTMLResponse)
async def near_area(inst_id: str, area_slug: str):
    inst = await _inst(inst_id)
    area = _area(inst, area_slug)
    listings = await db.listings.find({"status": "approved", "installation_id": inst_id, "area": area}, {"_id": 0}).sort("created_at", -1).to_list(12)
    topics = "".join(f'<a href="/near/{inst_id}/{area_slug}/{s}">{e(l)} in {e(area)}</a>' for s, l, _, _ in TOPICS)
    others = "".join(f'<a href="/near/{inst_id}/{slug(a)}">{e(a)}</a>' for a in inst["areas"] if a != area)
    cards = "".join(_card(l) for l in listings) or f'<div class="empty">Nothing posted in {e(area)} yet. <a class="btn" href="/create?base={inst_id}">Be the first</a></div>'
    body = f"""{HERO_OPEN}
<h1>{e(area)} near {e(inst['name'])}</h1>
<p>Everything {BRAND['members']} and families are listing in {e(area)}, {e(inst['state'])} — a {e(inst['short_name'])} commute. Rentals and homes for sale,
cars and trucks before an OCONUS move, and furniture over the weight allowance.</p>
<div class="cta"><a class="btn" href="/search?installation_id={inst_id}&area={e(area)}">Browse all in {e(area)}</a><a class="btn o" href="/create?base={inst_id}">Post in {e(area)}</a></div>{HERO_CLOSE}
<div class="wrap"><section><h2>Latest in {e(area)}</h2><div class="grid">{cards}</div></section>
<section><h2>{e(area)} by topic</h2><div class="links">{topics}</div></section>
<section><h2>Other towns near {e(inst['short_name'])}</h2><div class="links">{others}</div></section></div>"""
    return _page(f"{area} near {inst['name']} — PCS housing & marketplace",
                 f"Housing, vehicles and household goods in {area}, {inst['state']} near {inst['name']}, listed by {BRAND['members']} and military families.",
                 f"/near/{inst_id}/{area_slug}",
                 [("Home", "/"), (BRAND["stations"].capitalize(), "/near"), (inst["name"], f"/near/{inst_id}"), (area, f"/near/{inst_id}/{area_slug}")], body)


@router.get("/near/{inst_id}/{area_slug}/{topic}", response_class=HTMLResponse)
async def near_topic(inst_id: str, area_slug: str, topic: str):
    if topic not in TOPIC:
        raise HTTPException(status_code=404)
    inst = await _inst(inst_id)
    area = _area(inst, area_slug)
    _, label, category, extra = TOPIC[topic]
    q = {"status": "approved", "installation_id": inst_id, "area": area, "category": category, **extra}
    listings = await db.listings.find(q, {"_id": 0}).sort("created_at", -1).to_list(24)
    siblings = "".join(f'<a href="/near/{inst_id}/{area_slug}/{s}">{e(l)}</a>' for s, l, c, _ in TOPICS if s != topic and c == category)
    nearby = "".join(f'<a href="/near/{inst_id}/{slug(a)}/{topic}">{e(label)} in {e(a)}</a>' for a in inst["areas"] if a != area)
    cards = "".join(_card(l) for l in listings) or (
        f'<div class="empty">No {e(label.lower())} listed in {e(area)} right now. Check <a href="/search?installation_id={inst_id}&category={category}">all {e(inst["short_name"])} {e(CATEGORY_LABEL[category].lower())}</a> '
        f'or <a class="btn" href="/create?base={inst_id}&type={category}">post yours</a>.</div>')
    title = f"{label} in {area} near {inst['name']}"
    body = f"""{HERO_OPEN}
<h1>{e(title)}</h1>
<p>{e(label)} in {e(area)}, {e(inst['state'])}, listed by {BRAND['members']} and military families PCSing to or from {e(inst['name'])}.
Contact sellers directly — no fees to browse. Sellers who sign up with a {e(BRAND['verified'])} email carry the Verified Military ribbon.</p>
<div class="cta"><a class="btn" href="/search?installation_id={inst_id}&area={e(area)}&category={category}">Browse in the app</a><a class="btn o" href="/create?base={inst_id}&type={category}">Post {e(label.lower())}</a></div>{HERO_CLOSE}
<div class="wrap"><section><h2>{len(listings)} listed now</h2><div class="grid">{cards}</div></section>
<section><h2>More {e(CATEGORY_LABEL[category].lower())} in {e(area)}</h2><div class="links">{siblings}</div></section>
<section><h2>{e(label)} in other towns near {e(inst['short_name'])}</h2><div class="links">{nearby}</div></section></div>"""
    return _page(title,
                 f"{label} in {area}, {inst['state']} near {inst['name']} — listed by {BRAND['members']} and families during PCS season. Browse, contact the seller, or post your own.",
                 f"/near/{inst_id}/{area_slug}/{topic}",
                 [("Home", "/"), (BRAND["stations"].capitalize(), "/near"), (inst["name"], f"/near/{inst_id}"), (area, f"/near/{inst_id}/{area_slug}"), (label, f"/near/{inst_id}/{area_slug}/{topic}")], body)


@router.get("/sitemap.xml")
async def sitemap():
    urls = ["/", "/search", "/resources", "/safety", "/near"]
    for i in await _installations():
        urls += [f"/installation/{i['id']}", f"/near/{i['id']}"]
        for a in i["areas"]:
            urls.append(f"/near/{i['id']}/{slug(a)}")
            urls += [f"/near/{i['id']}/{slug(a)}/{t}" for t, _, _, _ in TOPICS]
    body = "".join(f"<url><loc>{PUBLIC_URL}{e(u)}</loc></url>" for u in urls)
    return Response(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>',
                    media_type="application/xml")


@router.get("/robots.txt")
async def robots():
    return Response(f"User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /reset-password\nSitemap: {PUBLIC_URL}/sitemap.xml\n",
                    media_type="text/plain")


@router.get("/manifest.webmanifest")
async def manifest():
    icons = f"/brand/{BRAND['slug']}/icons"
    sizes = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512]
    return JSONResponse({
        "id": "/", "name": f"{BRAND['domain']} — Housing & PCS Marketplace", "short_name": BRAND["domain"],
        "description": f"Find housing, list your home, and buy or sell vehicles and household goods at your {BRAND['branch']} {BRAND['station']}.",
        "start_url": "/?source=pwa", "scope": "/", "display": "standalone",
        "display_override": ["window-controls-overlay", "standalone", "minimal-ui"], "orientation": "any",
        "background_color": C["ink"], "theme_color": C["primary"], "lang": "en-US", "dir": "ltr",
        "categories": ["lifestyle", "shopping", "travel"],
        "icons": [{"src": f"{icons}/icon-{s}.png", "sizes": f"{s}x{s}", "type": "image/png"} for s in sizes]
                 + [{"src": f"{icons}/maskable-{s}.png", "sizes": f"{s}x{s}", "type": "image/png", "purpose": "maskable"} for s in (192, 512)],
        "shortcuts": [
            {"name": "Find housing", "url": "/search?category=housing&source=pwa", "icons": [{"src": f"{icons}/icon-96.png", "sizes": "96x96"}]},
            {"name": "Post a listing", "url": "/create?source=pwa", "icons": [{"src": f"{icons}/icon-96.png", "sizes": "96x96"}]},
            {"name": "Vehicles", "url": "/search?category=vehicle&source=pwa", "icons": [{"src": f"{icons}/icon-96.png", "sizes": "96x96"}]},
            {"name": "PCS resources", "url": "/resources?source=pwa", "icons": [{"src": f"{icons}/icon-96.png", "sizes": "96x96"}]},
        ],
    }, media_type="application/manifest+json")


@router.get("/offline.html", response_class=HTMLResponse)
async def offline():
    return HTMLResponse(f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="{C['ink']}"><title>{BRAND['domain']} — Offline</title>
<style>body{{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:{C['ink']};color:{C['paper']};font-family:system-ui,sans-serif;text-align:center;padding:24px}}
img{{width:72px;height:72px;border-radius:16px}}h1{{font-family:"Arial Narrow",sans-serif;text-transform:uppercase;letter-spacing:.06em;margin:20px 0 8px}}p{{opacity:.7;max-width:320px;margin:0 auto}}
button{{margin-top:24px;background:{C['accent']};color:{C['ink']};border:0;border-radius:6px;padding:12px 22px;font-weight:700;font-size:15px}}</style></head>
<body><div><img src="/brand/{BRAND['slug']}/icons/icon-192.png" alt=""><h1>You're offline</h1><p>{BRAND['domain']} needs a connection to load listings. Check your signal and try again.</p>
<button onclick="location.reload()">Try again</button></div></body></html>""")


@router.get("/favicon.ico")
@router.get("/apple-touch-icon.png")
async def brand_icon(request: Request):
    size = 180 if request.url.path.endswith(".png") else 32
    return FileResponse(DIST / "brand" / BRAND["slug"] / "icons" / f"icon-{size}.png")


_INDEX_TOKENS = {
    "__PCS_BRAND__": BRAND["slug"], "__PCS_DOMAIN__": BRAND["domain"], "__PCS_BRANCH__": BRAND["branch"],
    "__PCS_STATION__": BRAND["station"], "__PCS_URL__": PUBLIC_URL, "__PCS_THEME__": C["primary"],
    "__PCS_HERO__": BRAND["hero"]["image"],
}


def index_html() -> str:
    html = (DIST / "index.html").read_text(encoding="utf-8")
    for token, value in _INDEX_TOKENS.items():
        html = html.replace(token, value)
    return html


@router.get("/{path:path}", include_in_schema=False)
async def spa(path: str):
    """Built frontend: a real file from dist, else the app shell (client-side routing)."""
    if DIST.is_dir():
        target = (DIST / path).resolve()
        if path and target.is_file() and DIST in target.parents:
            return FileResponse(target)
        if (DIST / "index.html").is_file():
            return HTMLResponse(index_html())
    raise HTTPException(status_code=404)
