-- 005_domain_verification.sql — Custom domain ownership verification

alter table tenants add column domain_verified boolean not null default false;
alter table tenants add column domain_verification_token text;

-- A domain saved but not yet verified should never serve tenant content.
-- (Enforced in application code via getTenantByDomain — see lib/tenant.ts —
--  this index just keeps the verified lookup fast.)
create index idx_tenants_custom_domain_verified
  on tenants(custom_domain)
  where custom_domain is not null and domain_verified = true;
