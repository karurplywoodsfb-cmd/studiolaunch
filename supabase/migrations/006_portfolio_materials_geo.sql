-- supabase/migrations/006_portfolio_materials_geo.sql
-- Adds the "Materials & Specifications" sheet and per-project GPS coordinates
-- to portfolio_projects, supporting the materials editor and hyper-local
-- geo-tagging added to the dashboard + tenant site.

alter table portfolio_projects
  add column if not exists materials      jsonb default '[]',   -- [{ "label": "Flooring", "value": "Italian marble" }, ...]
  add column if not exists geo_latitude   text,
  add column if not exists geo_longitude  text;
