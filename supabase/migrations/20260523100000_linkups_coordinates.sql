-- LinkUp: store map coordinates on linkups (additive; safe on existing DBs)
-- Run in Supabase Dashboard → SQL → New query

alter table public.linkups
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.linkups
  drop constraint if exists linkups_latitude_range;

alter table public.linkups
  add constraint linkups_latitude_range
  check (latitude is null or (latitude >= -90 and latitude <= 90));

alter table public.linkups
  drop constraint if exists linkups_longitude_range;

alter table public.linkups
  add constraint linkups_longitude_range
  check (longitude is null or (longitude >= -180 and longitude <= 180));

create index if not exists linkups_coordinates_idx
  on public.linkups (latitude, longitude)
  where latitude is not null and longitude is not null;

select pg_notify('pgrst', 'reload schema');
