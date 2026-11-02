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


def test_sitemap_and_robots(site):
    sm = site.get("/sitemap.xml")
    assert sm.status_code == 200 and sm.text.count("<loc>") > 1000
    assert "Sitemap:" in site.get("/robots.txt").text
    assert site.get("/manifest.webmanifest").json()["icons"]
