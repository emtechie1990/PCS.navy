"""Smoke: brand, installations, listings, local pages and sitemap against a seeded server."""


def test_brand(client):
    b = client.get("/brand").json()
    assert b["slug"] in ("army", "navy", "airforce")
    assert b["domain"].startswith("PCS.") and b["resources"]


def test_installations_and_listings(client):
    insts = client.get("/installations").json()
    assert len(insts) >= 18 and all(i["areas"] for i in insts)
    page = client.get("/listings").json()
    assert page["total"] >= 1 and page["items"][0]["status"] == "approved"


def test_listing_not_found(client):
    assert client.get("/listings/nope").status_code == 404


def test_local_pages(site, client):
    inst = client.get("/installations").json()[0]
    r = site.get(f"/near/{inst['id']}")
    assert r.status_code == 200 and inst["name"] in r.text
    assert site.get(f"/near/{inst['id']}/no-such-town").status_code == 404


PNG_1PX = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000"
                        "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082")


def test_photo_upload_roundtrip(client):
    r = client.post("/photos", files={"file": ("dot.png", PNG_1PX, "image/png")})
    assert r.status_code == 200 and r.json()["url"].startswith("/api/photos/")
    got = client.get(r.json()["url"].removeprefix("/api"))
    assert got.status_code == 200 and got.headers["content-type"] == "image/png" and got.content == PNG_1PX
    assert client.post("/photos", files={"file": ("x.txt", b"not an image", "text/plain")}).status_code == 415


def test_payments_config_lists_all_methods(client):
    cfg = client.get("/payments/config").json()
    assert {p["id"] for p in cfg["providers"]} == {"stripe", "apple_pay", "google_pay", "cash_app", "paypal", "venmo"}
    assert len(cfg["plans"]) == 3


def test_sitemap_and_robots(site):
    sm = site.get("/sitemap.xml")
    assert sm.status_code == 200 and sm.text.count("<loc>") > 1000
    assert "Sitemap:" in site.get("/robots.txt").text
    assert site.get("/manifest.webmanifest").json()["icons"]
