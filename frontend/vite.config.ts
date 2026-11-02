import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const BACKEND = "http://localhost:8001";

// index.html carries __PCS_*__ tokens that the backend fills in production (lib/pages.py).
// In dev, Vite serves index.html itself, so fill them from the running backend's /api/brand.
function brandTokens(): Plugin {
  return {
    name: "brand-tokens",
    apply: "serve",
    async transformIndexHtml(html) {
      type B = { slug: string; domain: string; branch: string; station: string; url: string; theme: string; hero: { image: string } };
      const b = await fetch(`${BACKEND}/api/brand`).then((r) => r.json() as Promise<B>).catch(() => null);
      if (!b) return html;
      const t: Record<string, string> = {
        __PCS_BRAND__: b.slug, __PCS_DOMAIN__: b.domain, __PCS_BRANCH__: b.branch, __PCS_STATION__: b.station,
        __PCS_URL__: b.url, __PCS_THEME__: b.theme, __PCS_HERO__: b.hero.image,
      };
      return html.replace(/__PCS_[A-Z]+__/g, (m) => t[m] ?? m);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), brandTokens()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    host: true,
    port: 3000,
    // Frontend code calls relative /api/*; the backend also owns the server-rendered /near pages.
    proxy: Object.fromEntries(
      ["/api", "/near", "/sitemap.xml", "/robots.txt", "/manifest.webmanifest", "/offline.html"].map((p) => [p, { target: BACKEND, changeOrigin: true }]),
    ),
  },
});
