# PCS.army · PCS.navy · PCS.airforce

Independent PCS marketplace for military families: housing, vehicles and household goods, organized by
installation. One codebase runs all three sites — the `BRAND` environment variable (`army`, `navy`,
`airforce`) picks the copy, colors, logo, installations, nearby towns and official resources
(`backend/lib/brand.py`). Each site lives in its own repo and its own Render service.

## Layout

```
backend/   FastAPI + MongoDB (motor). All API routes under /api. Also serves the built app,
           the PWA manifest, and ~1,500 server-rendered local pages (/near/<station>/<town>/<topic>)
           with /sitemap.xml and /robots.txt.
frontend/  Vite + React 19 + TypeScript + Tailwind v4. Installable PWA (manifest, sw.js, icons per brand).
Dockerfile Builds the frontend, then runs uvicorn serving everything on one port.
render.yaml Render Blueprint for this site.
```

## Keeping the three sites identical

PCS.army is the only place code changes are made. After any change, run `scripts/sync-brands.sh "message"`
from this repo (with `../pcs-navy` and `../pcs-airforce` checked out beside it): it commits and pushes Army, then
mirrors the tree into both siblings, swapping only `render.yaml`, `backend/.env.example` and the README domain
line, and pushes them. Render auto-deploys each site from its `main`.

## Run locally

```bash
# MongoDB must be running (mongodb://localhost:27017)
cd backend && cp .env.example .env            # set BRAND, ADMIN_INITIAL_PASSWORD; RESEND_API_KEY optional
pip install -r requirements.txt && uvicorn server:app --port 8001 --reload

cd frontend && npm install && npm run dev     # http://localhost:3000 (proxies /api and /near to :8001)
```

Production build: `cd frontend && npm run build`, then run the backend alone — it serves `frontend/dist`.
Checks: `cd frontend && npm run typecheck && npm run lint`; `cd backend && pytest` (against a running server).
Icons for all brands: `cd frontend && npm run icons`.

## Environment (backend/.env or Render env vars)

| Var | Purpose |
|---|---|
| `BRAND` | `army` / `navy` / `airforce` |
| `MONGO_URL`, `DB_NAME` | MongoDB connection (MongoDB Atlas in production) |
| `APP_URL`, `SITE_HOSTS` | Public URL and allow-listed hosts for password-reset links |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO` | Resend transactional email (password reset) |
| `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` | Owner admin created on first boot |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe credentials; enter only by the payment-account owner in Render |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV` | PayPal credentials and `sandbox`/`live` environment |
| `PAYMENTS_ENABLED` | Fail-closed payment switch. Missing or anything other than exact `true` disables every checkout route. Keep `false` through sandbox checkout and webhook tests. |

## Deploy (Render + MongoDB Atlas)

1. MongoDB Atlas: one cluster, three databases (`pcs_army`, `pcs_navy`, `pcs_airforce`), a database user,
   network access open to Render's egress IPs. Copy the connection string.
2. Render → New → Blueprint → connect this repo. `render.yaml` creates the web service; fill in the
   secrets it asks for (`MONGO_URL`, `RESEND_API_KEY`, `ADMIN_INITIAL_PASSWORD`).
3. Render → service → Settings → Custom Domains: add `pcs.navy` and `www.pcs.navy`.
4. GoDaddy DNS for the domain: `A @ → 216.24.57.1` (Render's apex IP shown in the dashboard) and
   `CNAME www → <service>.onrender.com`. Remove conflicting A/CNAME records. Render issues TLS automatically.
5. Resend: add and verify the sending domain (DNS records Resend shows), create an API key.
6. Check: home loads, `/api/installations` returns JSON, `/sitemap.xml` lists the local pages,
   sign in as the admin at `/login`, open `/admin`.

## Data

Seed runs idempotently at boot: all installations for the brand (every board open), site settings, the
owner admin, and 10 sample listings flagged `sample: true` (shown with a "Sample" tag; delete from Admin
when real listings arrive). Admin can toggle installations, require approval for new posts, and work the
report queue.

Payments are disabled by default. The payment-account owner enters provider credentials directly in Render; never in source control, GoDaddy, email, or chat. Add `PAYMENTS_ENABLED=false` to the `pcs-shared` environment group so the switch is visible, and set it to `true` only after sandbox checkout and webhook tests pass. Configure the Stripe webhook at `https://<live-domain>/api/payments/stripe/webhook` and store its signing secret in Render.
