-- ═══════════════════════════════════════════════════════════════════
-- StudioLaunch — Day 6 Migration
-- 003_service_areas_admin.sql
-- Run AFTER 002_reviews_team_slugs.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── SERVICE AREAS (already created in 002, seed helper here) ────────────────

-- Function to auto-seed service areas from tenant location
create or replace function seed_default_service_area(p_tenant_id uuid)
returns void language plpgsql as $$
declare
  v_city text;
  v_state text;
begin
  select (location->>'local_city'), (location->>'state')
  into v_city, v_state
  from tenants where id = p_tenant_id;

  -- Insert primary city if not already present
  insert into service_areas (tenant_id, city, state, is_primary, display_order)
  values (p_tenant_id, v_city, v_state, true, 0)
  on conflict do nothing;
end;
$$;

-- ─── ADMIN TABLE (track super-admin users) ────────────────────────────────────

create table if not exists admin_users (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade unique not null,
  created_at timestamptz default now()
);

alter table admin_users enable row level security;

-- Only the admin themselves can read their own record
create policy "admin_self_read" on admin_users
  for select using (auth.uid() = user_id);

-- ─── TENANT EVENTS (audit log for admin view) ─────────────────────────────────

create table if not exists tenant_events (
  id         bigserial primary key,
  tenant_id  uuid references tenants(id) on delete cascade not null,
  event_type text not null,  -- 'plan_upgrade', 'plan_cancel', 'lead_received', etc.
  metadata   jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_tenant_events_tenant
  on tenant_events(tenant_id, created_at desc);
create index if not exists idx_tenant_events_type
  on tenant_events(event_type, created_at desc);

alter table tenant_events enable row level security;

-- Admin only (no public policy — accessed via service role)

-- ─── ADD WHITE-LABEL COLUMN TO TENANTS ───────────────────────────────────────

alter table tenants
  add column if not exists white_label boolean default false,
  add column if not exists custom_footer_text text;

-- ─── ADD AREA PAGE SEO CONTENT COLUMN TO SERVICE AREAS ───────────────────────

alter table service_areas
  add column if not exists seo_h1          text,
  add column if not exists seo_intro       text,
  add column if not exists seo_description text,
  add column if not exists nearby_cities   text[] default '{}';

-- ─── FUNCTION: log tenant event ──────────────────────────────────────────────

create or replace function log_tenant_event(
  p_tenant_id uuid,
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
) returns void language plpgsql as $$
begin
  insert into tenant_events(tenant_id, event_type, metadata)
  values (p_tenant_id, p_event_type, p_metadata);
end;
$$;
