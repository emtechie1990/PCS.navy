/* Service worker — keeps the app shell available offline.
   Rules: /api and /near are NEVER cached (listings, auth and admin are always live).
   Pages: network-first, fall back to the cached shell when offline.
   Static assets (/assets, /brand, /img, fonts, images): stale-while-revalidate. */
const VERSION = "pcs-v2";
const SHELL = ["/", "/manifest.webmanifest", "/offline.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (url) =>
  url.origin === self.location.origin &&
  (/^\/(assets|brand|img)\//.test(url.pathname) || /\.(woff2?|png|jpe?g|svg|webp)$/.test(url.pathname));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/near")) return; // always network

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || caches.match("/offline.html"))),
    );
    return;
  }

  if (isStatic(url)) {
    e.respondWith(
      caches.open(VERSION).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((res) => {
          if (res.ok) c.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      }),
    );
  }
});
