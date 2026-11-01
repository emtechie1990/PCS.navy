-- PCS.army initial schema
-- Run in Supabase SQL editor

create table if not exists bases (
  id      uuid primary key default gen_random_uuid(),
  name    text not null,
  slug    text not null unique,
  state   text not null,
  bah_e5  integer,
  lat     numeric,
  lng     numeric,
  branch  text default 'army'
);

create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text not null,
  rank             text,
  current_base_id  uuid references bases(id),
  pcs_date         date,
  verified_at      timestamptz,
  avatar_url       text,
  created_at       timestamptz default now()
);

create table if not exists listings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  base_id        uuid references bases(id),
  category       text not null check (category in ('housing','vehicle','goods')),
  title          text not null,
  description    text not null,
  price          integer,
  photos         text[],
  status         text default 'active' check (status in ('active','sold','expired')),
  tier           text default 'free' check (tier in ('free','basic','featured','bundle')),
  available_date date,
  metadata       jsonb default '{}',
  created_at     timestamptz default now(),
  expires_at     timestamptz
);

create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  from_id     uuid not null references profiles(id),
  to_id       uuid not null references profiles(id),
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz default now()
);

create table if not exists payments (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid references listings(id),
  user_id           uuid references profiles(id),
  stripe_session_id text unique,
  amount_cents      integer not null,
  tier              text not null,
  created_at        timestamptz default now()
);

create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references listings(id),
  reporter_id uuid references profiles(id),
  reason      text not null,
  status      text default 'open',
  created_at  timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table listings enable row level security;
alter table messages enable row level security;
alter table payments enable row level security;
alter table reports enable row level security;

-- Profiles policies
create policy "profiles_owner_all" on profiles for all using (auth.uid() = id);
create policy "profiles_public_read" on profiles for select using (true);

-- Listings policies
create policy "listings_public_read" on listings for select using (status = 'active');
create policy "listings_owner_insert" on listings for insert with check (auth.uid() = user_id);
create policy "listings_owner_update" on listings for update using (auth.uid() = user_id);
create policy "listings_owner_delete" on listings for delete using (auth.uid() = user_id);

-- Messages policies
create policy "messages_thread_access" on messages for all
  using (auth.uid() = from_id or auth.uid() = to_id);

-- Payments policies
create policy "payments_owner_all" on payments for all using (auth.uid() = user_id);

-- Reports policies
create policy "reports_auth_insert" on reports for insert with check (auth.uid() = reporter_id);
create policy "reports_owner_read" on reports for select using (auth.uid() = reporter_id);
