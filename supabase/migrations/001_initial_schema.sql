-- ═══════════════════════════════════════════════════════════════════
-- StudioLaunch — Complete Database Schema
-- Migration: 001_initial_schema
-- ═══════════════════════════════════════════════════════════════════

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for text search

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

create type plan_type    as enum ('starter', 'studio', 'agency');
create type plan_status  as enum ('active', 'trialing', 'past_due', 'canceled');
create type finish_tier  as enum ('premium', 'luxury', 'ultra');
create type lead_status  as enum ('new', 'contacted', 'qualified', 'converted', 'lost');
create type project_category as enum ('villa', 'apartment', 'commercial', 'other');

-- ─── TENANTS ─────────────────────────────────────────────────────────────────

create table tenants (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid references auth.users(id) on delete cascade not null,
  subdomain              text unique not null,
  custom_domain          text unique,

  -- Plan
  plan                   plan_type not null default 'starter',
  plan_status            plan_status not null default 'trialing',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  trial_ends_at          timestamptz default (now() + interval '14 days'),

  -- Branding (JSONB for flexibility)
  branding               jsonb not null default '{
    "business_name": "",
    "tagline": "Architectural Design Studio",
    "logo_letter": "A",
    "primary_color": "#0A0A0A",
    "accent_color": "#C8A96E"
  }'::jsonb,

  -- Contact
  contact                jsonb not null default '{
    "phone_number": "",
    "phone_display": "",
    "email": "",
    "instagram_handle": "",
    "houzz_handle": ""
  }'::jsonb,

  -- Location
  location               jsonb not null default '{
    "street_address": "",
    "local_city": "",
    "state": "",
    "pin_code": "",
    "geo_latitude": "0",
    "geo_longitude": "0",
    "service_radius_km": 60
  }'::jsonb,

  -- Stats
  stats                  jsonb not null default '{
    "project_count": 0,
    "years_active": 1,
    "sqft_total": "1",
    "city_radius": 60
  }'::jsonb,

  -- Hero content
  content                jsonb not null default '{
    "hero_headline_line1": "Space",
    "hero_headline_line2": "designed",
    "hero_headline_line3": "with precision",
    "hero_subtext": "We transform residential and commercial spaces into considered environments.",
    "hero_image_url": ""
  }'::jsonb,

  -- SEO
  seo_enriched           boolean default false,
  meta_description       text,
  faq_generated          boolean default false,

  -- Onboarding
  onboarding_completed   boolean default false,
  onboarding_step        integer default 1,

  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- ─── PORTFOLIO PROJECTS ───────────────────────────────────────────────────────

create table portfolio_projects (
  id             uuid primary key default uuid_generate_v4(),
  tenant_id      uuid references tenants(id) on delete cascade not null,
  title          text not null,
  category       project_category not null default 'villa',
  location       text,
  area_sqft      integer,
  finish_tier    finish_tier not null default 'premium',
  year           integer,
  cover_image_url text,
  images         text[] default '{}',
  tags           text[] default '{}',
  display_order  integer default 0,
  published      boolean default false,
  created_at     timestamptz default now()
);

-- ─── CASE STUDIES ────────────────────────────────────────────────────────────

create table case_studies (
  id                   uuid primary key default uuid_generate_v4(),
  tenant_id            uuid references tenants(id) on delete cascade not null,
  title                text not null,
  subtitle             text,
  -- Project Arc phases
  brief_heading        text,
  brief_body           text,
  challenge_heading    text,
  challenge_body       text,
  solution_heading     text,
  solution_body        text,
  outcome_heading      text,
  outcome_body         text,
  -- Metadata
  client_type          text,
  location             text,
  area_sqft            integer,
  scope                text,
  duration_weeks       integer,
  finish_tier          finish_tier default 'premium',
  primary_materials    text[] default '{}',
  year                 integer,
  -- Outcome stats
  stat_1_value         text,
  stat_1_label         text,
  stat_2_value         text,
  stat_2_label         text,
  stat_3_value         text,
  stat_3_label         text,
  -- Images
  hero_image_url       text,
  before_image_url     text,
  after_image_url      text,
  solution_images      text[] default '{}',
  published            boolean default false,
  created_at           timestamptz default now()
);

-- ─── FAQ ITEMS ────────────────────────────────────────────────────────────────

create table faq_items (
  id             uuid primary key default uuid_generate_v4(),
  tenant_id      uuid references tenants(id) on delete cascade not null,
  question       text not null,
  answer         text not null,
  display_order  integer default 0,
  created_at     timestamptz default now()
);

-- ─── LEADS ───────────────────────────────────────────────────────────────────

create table leads (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid references tenants(id) on delete cascade not null,
  name             text not null,
  phone            text not null,
  email            text,
  property_type    text,
  scope            text,
  budget_tier      text,
  project_location text,
  notes            text,
  status           lead_status not null default 'new',
  source           text default 'website',
  created_at       timestamptz default now()
);

-- ─── PAGE VIEWS (lightweight analytics) ──────────────────────────────────────

create table page_views (
  id         bigserial primary key,
  tenant_id  uuid references tenants(id) on delete cascade not null,
  path       text not null default '/',
  referrer   text,
  country    text,
  created_at timestamptz default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

create index idx_tenants_user_id       on tenants(user_id);
create index idx_tenants_subdomain     on tenants(subdomain);
create index idx_tenants_custom_domain on tenants(custom_domain) where custom_domain is not null;
create index idx_portfolio_tenant      on portfolio_projects(tenant_id, display_order);
create index idx_case_studies_tenant   on case_studies(tenant_id);
create index idx_faq_tenant            on faq_items(tenant_id, display_order);
create index idx_leads_tenant          on leads(tenant_id, created_at desc);
create index idx_page_views_tenant     on page_views(tenant_id, created_at desc);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at
  before update on tenants
  for each row execute function update_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

alter table tenants           enable row level security;
alter table portfolio_projects enable row level security;
alter table case_studies       enable row level security;
alter table faq_items          enable row level security;
alter table leads              enable row level security;
alter table page_views         enable row level security;

-- Tenants: owner-only read/write
create policy "tenant_owner_select" on tenants
  for select using (auth.uid() = user_id);
create policy "tenant_owner_insert" on tenants
  for insert with check (auth.uid() = user_id);
create policy "tenant_owner_update" on tenants
  for update using (auth.uid() = user_id);

-- Portfolio: owner write, public read (published only)
create policy "portfolio_owner_all" on portfolio_projects
  for all using (
    tenant_id in (select id from tenants where user_id = auth.uid())
  );
create policy "portfolio_public_read" on portfolio_projects
  for select using (published = true);

-- Case studies: owner write, public read (published only)
create policy "case_studies_owner_all" on case_studies
  for all using (
    tenant_id in (select id from tenants where user_id = auth.uid())
  );
create policy "case_studies_public_read" on case_studies
  for select using (published = true);

-- FAQ: owner write, public read
create policy "faq_owner_all" on faq_items
  for all using (
    tenant_id in (select id from tenants where user_id = auth.uid())
  );
create policy "faq_public_read" on faq_items
  for select using (true);

-- Leads: owner only
create policy "leads_owner_all" on leads
  for all using (
    tenant_id in (select id from tenants where user_id = auth.uid())
  );
-- Allow anonymous insert (from public site form)
create policy "leads_public_insert" on leads
  for insert with check (true);

-- Page views: allow anon insert, owner read
create policy "pageviews_public_insert" on page_views
  for insert with check (true);
create policy "pageviews_owner_read" on page_views
  for select using (
    tenant_id in (select id from tenants where user_id = auth.uid())
  );

-- ─── DEFAULT FAQ SEEDER FUNCTION ─────────────────────────────────────────────

create or replace function seed_default_faqs(p_tenant_id uuid, p_city text)
returns void language plpgsql as $$
begin
  insert into faq_items (tenant_id, question, answer, display_order) values
  (p_tenant_id,
   'How much does interior design cost in ' || p_city || '?',
   'Interior design costs in ' || p_city || ' typically range from ₹800 to ₹3,500 per square foot depending on the finish tier — Premium (₹800–₹1,500/sq.ft) or Luxury (₹1,500–₹3,000/sq.ft). We provide a detailed estimate after a complimentary site consultation.',
   1),
  (p_tenant_id,
   'How long does a full home interior design project take?',
   'A full-home project typically takes 12 to 20 weeks from concept approval to handover — design development (4–6 weeks), procurement (2–4 weeks), and execution (6–10 weeks). We establish a fixed schedule before work begins.',
   2),
  (p_tenant_id,
   'Do you handle turnkey projects or design-only?',
   'Both. We offer end-to-end turnkey projects (design, procurement, supervision, handover) and design-only consultancy for clients with their own contractors.',
   3),
  (p_tenant_id,
   'What areas near ' || p_city || ' do you service?',
   'We primarily serve clients in ' || p_city || ' and within a 60 km radius. For larger projects we consider locations beyond this range on a case-by-case basis.',
   4),
  (p_tenant_id,
   'Can I see 3D renders before any work begins?',
   'Yes — always. All projects include photorealistic 3D renders of every room before any material is ordered or civil work begins. Multiple revision rounds are included.',
   5);
end;
$$;
