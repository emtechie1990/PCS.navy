# PCS.army — Codex Build Brief

> **Instruction for Codex:** Read this entire file before writing any code. All decisions here are final unless marked `[TBD]`. Build tasks are in Section 10 — work them in order.

---

## 01. What We Are Building

**PCS.army** is a verified military marketplace where US Army service members can list and find:
- Housing (rent or sale near base)
- Vehicles (cars, trucks, motorcycles, RVs)
- Household goods (furniture, appliances, electronics)

All in one place, tied to the user's PCS (Permanent Change of Station) move date.

**Domains owned:** PCS.army (Phase 1), PCS.navy (Phase 2), PCS.airforce (Phase 3). Same codebase, same repo — branch is controlled by the `NEXT_PUBLIC_BRANCH` env var.

**Why this exists:** When orders drop, a service member has to use HOMES.mil for housing, Craigslist/Facebook for their car, and base-specific buy/sell groups for goods. Each platform is open to scammers. No single platform owns the full PCS move lifecycle. PCS.army fixes that with `.mil email verification` — every seller gets a Verified Military badge that no general marketplace can offer.

**What we are NOT:** We are not competing with Plan My Move, My Army PCS, or HOMES.mil. Those are official government tools. We are the marketplace layer they are missing — the place to list your car, sell your couch, and find a rental near base.

---

## 02. Tech Stack — Do Not Deviate

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) | TypeScript, SSR on listing + base pages |
| Styling | Tailwind CSS | No CSS-in-JS |
| Forms | React Hook Form + Zod | All forms use this combo |
| Backend / Auth / DB | Supabase | Postgres, Auth, Storage, Real-time |
| Payments | Stripe | One-time listing fees, Stripe Checkout |
| Deploy | Vercel | Connect to GitHub repo |
| Images | next/image + Supabase Storage | All listing photos |

---

## 03. Visual Design Brief

**This is a military-community product. The design must feel trusted and familiar to service members.**

### Color Palette
```
--army-green:   #4B5320   /* OCP green — primary */
--coyote-tan:   #81613C   /* secondary */
--army-gold:    #C8A951   /* accent / CTA */
--near-black:   #1A1A1A   /* text */
--off-white:    #F5F4F0   /* background */
--verified:     #2E7D32   /* Verified Military badge */
```

### Typography (Google Fonts)
- **Headings:** Oswald (weight 600–700) — reads like military stencil, strong authority
- **Body:** Inter (weight 400–500) — clean and readable on mobile

### Visual Identity Rules
- Logo: Shield or hexagon shape (unit patch style) with "PCS" large + ".army" small
- Subtle OCP camo texture allowed in hero/header backgrounds only (CSS-generated, not an image)
- "Verified Military ✓" badge styled like a service ribbon — green pill with star icon
- 3px army-green accent bar on active navigation items and cards
- NO red/white/blue flag graphics — military community finds that corny; use the actual Army color palette

### Tone
Functional and trusted. Think the Army's official website aesthetic — modern, clean, purposeful — not a surplus store or camouflage-everything overdone.

---

## 04. File Structure

```
pcs-army/
├── app/
│   ├── layout.tsx                 # Root layout, nav, footer
│   ├── page.tsx                   # Homepage — search bar + 3 category tiles
│   ├── auth/
│   │   ├── register/page.tsx      # Sign up + .mil email gate
│   │   ├── verify/page.tsx        # Email verification landing
│   │   └── login/page.tsx
│   ├── dashboard/
│   │   └── page.tsx               # User dashboard — listings, messages, move date
│   ├── listings/
│   │   ├── page.tsx               # Browse / search all listings
│   │   ├── [id]/page.tsx          # Single listing detail (SSR)
│   │   └── create/page.tsx        # Create listing wizard (4 steps)
│   ├── bases/
│   │   ├── page.tsx               # Base directory index
│   │   └── [slug]/page.tsx        # Base landing page (SSR for SEO)
│   ├── messages/
│   │   └── page.tsx               # Inbox — all conversations
│   ├── checklist/
│   │   └── page.tsx               # PCS move checklist
│   └── api/
│       ├── webhooks/stripe/route.ts
│       └── verify-mil/route.ts    # .mil email domain check
├── components/
│   ├── ui/                        # Button, Input, Select, Modal, Toast, Badge
│   ├── listing/                   # ListingCard, ListingForm, PhotoUpload, ReportModal
│   ├── search/                    # SearchBar, FilterPanel, ResultsGrid
│   ├── messaging/                 # MessageThread, InboxList, ComposeForm
│   └── nav/                       # Header, Footer, MobileNav
├── lib/
│   ├── supabase.ts                # Supabase client (server + browser exports)
│   ├── stripe.ts                  # Stripe client
│   ├── pricing.ts                 # Pricing constants (see Section 09)
│   ├── schemas.ts                 # Zod schemas for all forms
│   └── utils.ts                   # formatPrice, formatDate, slugify, getBranchName
├── data/
│   └── bases.ts                   # Static Army installation data
├── types/
│   └── index.ts                   # User, Listing, Base, Message, Payment types
└── supabase/
    └── migrations/
        └── 001_init.sql           # Full schema + RLS policies
```

---

## 05. Database Schema

Run this migration first. RLS must be enabled before any data is inserted.

```sql
-- PROFILES (extends Supabase auth.users)
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text not null,
  rank             text,                        -- E-4, CPT, SSG, etc.
  current_base_id  uuid references bases(id),
  pcs_date         date,
  verified_at      timestamptz,                 -- null = unverified .mil email
  avatar_url       text,
  created_at       timestamptz default now()
);

-- BASES (Army installations)
create table bases (
  id      uuid primary key default gen_random_uuid(),
  name    text not null,
  slug    text not null unique,                 -- fort-liberty, fort-campbell
  state   text not null,
  bah_e5  integer,                              -- BAH rate E-5 w/dependents (cents)
  lat     numeric,
  lng     numeric,
  branch  text default 'army'                   -- army | navy | airforce
);

-- LISTINGS
create table listings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  base_id        uuid references bases(id),
  category       text not null check (category in ('housing', 'vehicle', 'goods')),
  title          text not null,
  description    text not null,
  price          integer,                       -- cents; null = make offer
  photos         text[],                        -- Supabase Storage URLs
  status         text default 'active' check (status in ('active','sold','expired')),
  tier           text default 'free' check (tier in ('free','basic','featured','bundle')),
  available_date date,
  metadata       jsonb default '{}',            -- category-specific fields (see Section 07)
  created_at     timestamptz default now(),
  expires_at     timestamptz
);

-- MESSAGES (in-app only — no personal contact info exposed)
create table messages (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  from_id     uuid not null references profiles(id),
  to_id       uuid not null references profiles(id),
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz default now()
);

-- PAYMENTS
create table payments (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid references listings(id),
  user_id           uuid references profiles(id),
  stripe_session_id text unique,
  amount_cents      integer not null,
  tier              text not null,
  created_at        timestamptz default now()
);

-- REPORTS (flag a listing)
create table reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references listings(id),
  reporter_id uuid references profiles(id),
  reason      text not null,
  status      text default 'open',
  created_at  timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table listings enable row level security;
alter table messages enable row level security;
alter table payments enable row level security;
alter table reports enable row level security;

-- Profiles: owner full access, public can read display_name + rank only
create policy "owner_all" on profiles for all using (auth.uid() = id);
create policy "public_read" on profiles for select using (true);

-- Listings: public read, owner write
create policy "public_read" on listings for select using (status = 'active');
create policy "owner_insert" on listings for insert with check (auth.uid() = user_id);
create policy "owner_update" on listings for update using (auth.uid() = user_id);
create policy "owner_delete" on listings for delete using (auth.uid() = user_id);

-- Messages: only sender and receiver
create policy "thread_access" on messages for all
  using (auth.uid() = from_id or auth.uid() = to_id);

-- Payments: owner only
create policy "owner_all" on payments for all using (auth.uid() = user_id);

-- Reports: authenticated users can insert, owner can read their own
create policy "auth_insert" on reports for insert with check (auth.uid() = reporter_id);
create policy "owner_read" on reports for select using (auth.uid() = reporter_id);
```

---

## 06. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
SUPABASE_SERVICE_ROLE_KEY=[service role key]   # server-side only, never expose

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=https://pcs.army
NEXT_PUBLIC_BRANCH=army     # army | navy | airforce — controls all branch-specific text
```

---

## 07. Listing Metadata (jsonb per category)

### Housing
```json
{
  "type": "rent",
  "bedrooms": 3,
  "bathrooms": 2,
  "sqft": 1400,
  "pets_ok": true,
  "utilities_included": false,
  "available_date": "2026-12-15"
}
```

### Vehicle
```json
{
  "make": "Toyota",
  "model": "Tacoma",
  "year": 2021,
  "mileage": 42000,
  "type": "truck",
  "condition": "good",
  "vin_last4": "3F2P"
}
```

### Goods
```json
{
  "subcategory": "furniture",
  "condition": "like-new",
  "quantity": 1,
  "pcs_reason": true
}
```

---

## 08. Pricing Constants

```typescript
// lib/pricing.ts
export const LISTING_PRICES = {
  housing: {
    basic:    1299,   // $12.99 — 60 days, 3 photos
    featured: 3999,   // $39.99 — 90 days, 15 photos
  },
  vehicle: {
    basic:    999,    // $9.99  — 30 days, verified badge
    featured: 1999,   // $19.99 — 60 days, photo gallery
  },
  goods: {
    free:     0,      // $0     — supply builder
    featured: 499,    // $4.99  — boosted visibility
  },
  bundle: {
    pcs: 2999,        // $29.99 — all categories, one move, 90 days
  }
} as const;

export const LISTING_DURATIONS_DAYS = {
  housing: { basic: 60, featured: 90 },
  vehicle: { basic: 30, featured: 60 },
  goods:   { free: 30, featured: 45 },
  bundle:  { pcs: 90 },
} as const;
```

---

## 09. .mil Email Verification

```typescript
// app/api/verify-mil/route.ts
export async function POST(req: Request) {
  const { email } = await req.json();
  const domain = email.split('@')[1]?.toLowerCase();
  const valid = domain?.endsWith('.mil');
  return Response.json({ valid });
}
```

On registration:
1. User submits .mil email
2. Server checks domain ends in `.mil`
3. Supabase sends magic link to that email
4. On link click → set `profiles.verified_at = now()`
5. All listings from verified users show "Verified Military ✓" badge

---

## 10. Multi-Branch Support

**Never hardcode "Army" in UI copy.**

```typescript
// lib/utils.ts
export function getBranchName(): 'Army' | 'Navy' | 'Air Force' {
  const branch = process.env.NEXT_PUBLIC_BRANCH;
  if (branch === 'navy') return 'Navy';
  if (branch === 'airforce') return 'Air Force';
  return 'Army';
}
```

Use `getBranchName()` everywhere a branch name appears in copy. When we fork this repo for PCS.navy, only the env var and base data change — nothing else.

---

## 11. Feature Build Order

Complete tasks in this order. Each task should be a separate PR.

| # | Task | Files | Depends On |
|---|---|---|---|
| 1 | Supabase migration + RLS | `supabase/migrations/001_init.sql` | — |
| 2 | Seed bases.ts (top 20 Army installations) | `data/bases.ts` | Task 1 |
| 3 | Auth: register (.mil gate) + login + verify | `app/auth/*`, `api/verify-mil` | Task 1 |
| 4 | Listing create wizard (4 steps) | `app/listings/create/*` | Task 3 |
| 5 | Listing detail page (SSR) | `app/listings/[id]/page.tsx` | Task 4 |
| 6 | Search + filter page | `app/listings/page.tsx` | Task 5 |
| 7 | Base directory + base landing pages (SSR) | `app/bases/*` | Tasks 2, 6 |
| 8 | Stripe checkout + webhook | `lib/stripe.ts`, `api/webhooks/stripe` | Task 4 |
| 9 | In-app messaging (real-time) | `app/messages/*` | Task 3 |
| 10 | User dashboard | `app/dashboard/*` | Tasks 4, 9 |
| 11 | PCS move checklist | `app/checklist/page.tsx` | Task 3 |
| 12 | Report a listing | `components/listing/ReportModal.tsx` | Task 5 |

---

## 12. Rules — Non-Negotiable

1. **Never expose personal contact info** on listing pages. All contact goes through in-app messaging. This is the core fraud-prevention feature.
2. **All listing + base pages must be SSR.** Google will index these. Client-side only breaks SEO.
3. **Mobile-first always.** Service members use this on phones. Every component must work at 375px.
4. **RLS on every table** before inserting any data.
5. **Use `NEXT_PUBLIC_BRANCH` env var** for all branch-specific text. Never hardcode "Army".
6. **No map embeds in Phase 1.** Show location as text only ("near Fort Liberty, NC"). Maps are Phase 2.
7. **Photos stored in Supabase Storage,** not base64 in the database.

---

## 13. Scope for emergent.sh Scaffold (Phase 1 only)

emergent.sh builds the **minimum viable scaffold** only:
- Next.js 14 project with Tailwind + TypeScript configured
- Supabase connected (auth + database client)
- Auth flow working (.mil email gate, magic link, verify page)
- One listing category working end-to-end (start with `goods` — free tier, no payment needed)
- Basic search/browse page
- Stripe skeleton in place (not fully wired)
- Push to GitHub repo named `pcs-army`

**Codex then expands from the scaffold** using the task order in Section 11.

---

*Owner: prescottmanisela@gmail.com*  
*Lead AI Coordinator: Claude Sonnet 4.6*  
*Last updated: 2026-11-01*  
*Questions → open a GitHub issue tagged `[codex-question]`*
