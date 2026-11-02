from lib.security import SecurityHeadersMiddleware, allowed_hosts, configured_origins


def test_rejects_wildcard_cors(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "*, https://pcs.army, https://www.pcs.army/")
    assert configured_origins() == ["https://pcs.army", "https://www.pcs.army"]


def test_allows_configured_and_local_hosts(monkeypatch):
    monkeypatch.setenv("SITE_HOSTS", "pcs.army,www.pcs.army")
    monkeypatch.delenv("RENDER_EXTERNAL_HOSTNAME", raising=False)
    assert allowed_hosts() == ["pcs.army", "www.pcs.army", "localhost", "127.0.0.1", "testserver"]


def test_security_headers_cover_browser_basics():
    headers = dict(SecurityHeadersMiddleware._HEADERS)
    assert headers[b"x-content-type-options"] == b"nosniff"
    assert headers[b"x-frame-options"] == b"DENY"
    assert b"frame-ancestors 'none'" in headers[b"content-security-policy"]
