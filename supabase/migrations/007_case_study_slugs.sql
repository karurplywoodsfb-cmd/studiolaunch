-- supabase/migrations/007_case_study_slugs.sql
-- Adds slug + SEO fields to case_studies, mirroring 002_reviews_team_slugs.sql's
-- portfolio_projects pattern. Case studies previously had no public URL at all —
-- this is what makes /[domain]/case-studies/[slug] possible.

alter table case_studies
  add column if not exists slug             text,
  add column if not exists seo_title        text,
  add column if not exists seo_description  text;

-- Unique slug per tenant
create unique index if not exists idx_case_study_slug
  on case_studies(tenant_id, slug)
  where slug is not null;

-- Auto-generate slug from title if not set
create or replace function auto_slug_case_study()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := lower(regexp_replace(
      regexp_replace(new.title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ));
    if exists (
      select 1 from case_studies
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

drop trigger if exists case_study_auto_slug on case_studies;
create trigger case_study_auto_slug
  before insert or update on case_studies
  for each row execute function auto_slug_case_study();
