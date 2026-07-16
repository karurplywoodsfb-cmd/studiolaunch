-- ═══════════════════════════════════════════════════════════════════
-- MaSpace — Onboarding: persona, design system, brand logo
-- Migration: 008_onboarding_branding
-- ═══════════════════════════════════════════════════════════════════

-- ─── Design system template ────────────────────────────────────────────────
create type template_id as enum ('atelier', 'forma', 'terra', 'renaissance', 'gallery', 'noir');

alter table tenants
  add column if not exists template_id template_id not null default 'atelier';

-- ─── Persona captured at onboarding (personalization only, not rendered) ───
alter table tenants
  add column if not exists persona text
    check (persona in ('architect', 'interior_designer', 'design_studio', 'other'));

-- ─── Logo file + accent color live inside the existing `branding` jsonb ────
-- (keeps every branding field read/written in one place, matching the
--  existing business_name / tagline / logo_letter / accent_color pattern)
alter table tenants
  alter column branding set default '{
    "business_name": "",
    "tagline": "Architectural Design Studio",
    "logo_letter": "A",
    "logo_url": "",
    "primary_color": "#0A0A0A",
    "accent_color": "#C8A96E"
  }'::jsonb;

-- Backfill logo_url key for any tenant created before this migration
update tenants
  set branding = branding || '{"logo_url": ""}'::jsonb
  where not (branding ? 'logo_url');
