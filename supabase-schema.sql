-- Wish Craft production schema for Supabase/PostgreSQL
create extension if not exists pgcrypto;

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  short_id text not null unique,
  name text not null default 'Someone Special',
  relation text not null default 'Special Person',
  style text,
  qr_theme text not null default 'birthday',
  html text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  view_count bigint not null default 0,
  qr_scan_count bigint not null default 0,
  photo_url text,
  photo_path text,
  delete_photo_on_expire boolean not null default true
);

-- Safe upgrades for existing Wish Craft installations. These do not touch existing wish data.
alter table public.wishes add column if not exists photo_url text;
alter table public.wishes add column if not exists photo_path text;
alter table public.wishes add column if not exists delete_photo_on_expire boolean not null default true;

create index if not exists wishes_short_id_idx on public.wishes(short_id);
create index if not exists wishes_expires_at_idx on public.wishes(expires_at);
create index if not exists wishes_photo_path_idx on public.wishes(photo_path);

-- No public client access. The Node server uses the Supabase service-role key.
alter table public.wishes enable row level security;

-- Optional cleanup helper. Run manually or schedule it later with Supabase Cron.
create or replace function public.delete_expired_wishes()
returns integer
language plpgsql
security definer
as $$
declare deleted_count integer;
begin
  -- The Node server removes photo objects from Storage first, then deletes rows.
  -- This SQL helper remains available for DB-only cleanup/admin use.
  delete from public.wishes where expires_at is not null and expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Additive admin control-plane storage. Core wishes schema/contracts remain unchanged.
create table if not exists public.admin_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.admin_settings enable row level security;

-- Runtime UI customization keys used by Telegram bot:
-- site_ui_overrides, experience_ui_overrides, qr_settings and template_overrides are stored in admin_settings.


-- V14.4 CONTROL-PLANE PERMISSIONS
-- Telegram/server use a privileged Supabase key. Public users must not read/write this table.
grant usage on schema public to service_role;
grant all privileges on table public.wishes to service_role;
grant all privileges on table public.admin_settings to service_role;
revoke all privileges on table public.admin_settings from anon, authenticated;

-- Keep the two runtime rows present so a fresh database is ready immediately.
insert into public.admin_settings(key,value)
values
  ('site_ui_overrides','{}'),
  ('experience_ui_overrides','{}'),
  ('qr_settings','{"defaultTemplate":"aurora","defaultColor":"#241d31","shareCardRatio":"1:1"}'),
  ('template_overrides','{}')
on conflict (key) do nothing;

-- V19 daily traffic/error aggregates used by the admin dashboard and Telegram report.
create table if not exists public.admin_daily_metrics (
  metric_date date primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.admin_daily_metrics enable row level security;
grant all privileges on table public.admin_daily_metrics to service_role;
revoke all privileges on table public.admin_daily_metrics from anon, authenticated;
