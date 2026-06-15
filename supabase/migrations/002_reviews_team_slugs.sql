-- ═══════════════════════════════════════════════════════════════════
-- StudioLaunch — Day 5 Migration
-- 002_reviews_team_slugs.sql
-- Run this in Supabase SQL Editor after 001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── Add slug + seo fields to portfolio_projects ──────────────────────────────

alter table portfolio_projects
  add column if not exists slug              text,
  add column if not exists seo_title         text,
  add column if not exists seo_description   text,
  add column if not exists full_description  text,
  add column if not exists challenge_text    text,
  add column if not exists solution_text     text,
  add column if not exists testimonial_quote text,
  add column if not exists testimonial_name  text;

-- Unique slug per tenant
create unique index if not exists idx_portfolio_slug
  on portfolio_projects(tenant_id, slug)
  where slug is not null;

-- Auto-generate slug from title if not set
create or replace function auto_slug_portfolio()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := lower(regexp_replace(
      regexp_replace(new.title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ));
    -- Ensure uniqueness by appending short id if needed
    if exists (
      select 1 from portfolio_projects
      where tenant_id = new.tenant_id
        and slug = new.slug
        and id != new.id
    ) then
      new.slug := new.slug || '-' || substr(new.id::text, 1, 6);
    end if;
  end if;
  return new;
end;
$$;

create trigger portfolio_auto_slug
  before insert or update on portfolio_projects
  for each row execute function auto_slug_portfolio();

-- ─── GOOGLE REVIEWS CACHE ─────────────────────────────────────────────────────

create table if not exists google_reviews (
  id             uuid primary key default uuid_generate_v4(),
  tenant_id      uuid references tenants(id) on delete cascade not null,
  google_place_id text,
  author_name    text not null,
  author_photo   text,
  rating         integer not null check (rating between 1 and 5),
  text           text,
  time           bigint,    -- Unix timestamp from Google
  relative_time  text,      -- e.g. "3 months ago"
  display_order  integer default 0,
  is_featured    boolean default false,
  created_at     timestamptz default now()
);

alter table google_reviews enable row level security;

create policy "reviews_owner_all" on google_reviews
  for all using (
    tenant_id in (select id from tenants where user_id = auth.uid())
  );

create policy "reviews_public_read" on google_reviews
  for select using (true);

create index if not exists idx_reviews_tenant
  on google_reviews(tenant_id, display_order);

-- Add Google Place ID to tenants
alter table tenants
  add column if not exists google_place_id     text,
  add column if not exists google_rating       numeric(3,1),
  add column if not exists google_review_count integer,
  add column if not exists reviews_last_synced timestamptz;

-- ─── TEAM MEMBERS ─────────────────────────────────────────────────────────────

create type team_role as enum ('owner', 'editor');

create table if not exists team_members (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid references tenants(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade,
  email       text not null,
  role        team_role not null default 'editor',
  name        text,
  invite_token text unique,
  invite_accepted boolean default false,
  invited_at  timestamptz default now(),
  accepted_at timestamptz,
  created_at  timestamptz default now()
);

alter table team_members enable row level security;

create policy "team_owner_all" on team_members
  for all using (
    tenant_id in (select id from tenants where user_id = auth.uid())
  );

-- Allow invited users to see their own invite
create policy "team_invite_read" on team_members
  for select using (email = auth.jwt() ->> 'email');

create index if not exists idx_team_tenant
  on team_members(tenant_id);
create index if not exists idx_team_invite
  on team_members(invite_token) where invite_token is not null;

-- ─── SERVICE AREAS (for multi-city local SEO) ─────────────────────────────────

create table if not exists service_areas (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid references tenants(id) on delete cascade not null,
  city        text not null,
  state       text,
  pin_codes   text[] default '{}',
  is_primary  boolean default false,
  display_order integer default 0
);

alter table service_areas enable row level security;

create policy "service_areas_owner_all" on service_areas
  for all using (
    tenant_id in (select id from tenants where user_id = auth.uid())
  );
create policy "service_areas_public_read" on service_areas
  for select using (true);

create index if not exists idx_service_areas_tenant
  on service_areas(tenant_id, display_order);
