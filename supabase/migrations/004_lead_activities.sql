-- 004_lead_activities.sql — Internal notes + auto-logged status timeline for leads

create table lead_activities (
  id          uuid primary key default uuid_generate_v4(),
  lead_id     uuid references leads(id) on delete cascade not null,
  tenant_id   uuid references tenants(id) on delete cascade not null,
  type        text not null default 'note',   -- 'note' | 'status_change'
  content     text not null,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

create index idx_lead_activities_lead on lead_activities(lead_id, created_at desc);

alter table lead_activities enable row level security;

create policy "lead_activities_owner_all" on lead_activities
  for all using (
    tenant_id in (select id from tenants where user_id = auth.uid())
  );

-- ─── AUTO-LOG STATUS CHANGES ────────────────────────────────────────────────
-- Fires regardless of whether the update comes from the dashboard, an API
-- route, or a future integration — keeps the timeline reliable.

create or replace function log_lead_status_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into lead_activities (lead_id, tenant_id, type, content, created_by)
    values (
      new.id,
      new.tenant_id,
      'status_change',
      old.status || ' → ' || new.status,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger leads_status_change_log
  after update on leads
  for each row execute function log_lead_status_change();
