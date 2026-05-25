-- =============================================================================
-- LinkUp: linkups + linkup_attendees (full setup)
-- Supabase → SQL → New query → Run as one script
-- WARNING: drops existing linkup tables (dev reset).
-- =============================================================================

drop table if exists public.linkup_attendees cascade;
drop table if exists public.linkups cascade;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.linkups (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 160),
  category text not null check (char_length(category) <= 64),
  location text not null,
  latitude double precision,
  longitude double precision,
  description text not null default '' check (char_length(description) <= 2000),
  starts_at timestamptz not null,
  host_id uuid not null references auth.users (id) on delete cascade,
  host_display_name text not null default 'Host',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create index linkups_starts_at_idx on public.linkups (starts_at asc);
create index linkups_host_id_idx on public.linkups (host_id);

create index if not exists linkups_coordinates_idx
  on public.linkups (latitude, longitude)
  where latitude is not null and longitude is not null;

create or replace function public.set_linkups_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists linkups_set_updated_at on public.linkups;
create trigger linkups_set_updated_at
  before update on public.linkups
  for each row
  execute function public.set_linkups_updated_at();

create table public.linkup_attendees (
  id uuid primary key default gen_random_uuid(),
  linkup_id uuid not null references public.linkups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  display_name text not null default '',
  constraint linkup_attendees_unique_member unique (linkup_id, user_id)
);

create index linkup_attendees_linkup_idx on public.linkup_attendees (linkup_id);
create index linkup_attendees_user_idx on public.linkup_attendees (user_id);

-- -----------------------------------------------------------------------------
-- Grants (PostgREST + RLS)
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select on table public.linkups to anon, authenticated;
grant insert, update, delete on table public.linkups to authenticated;
grant all on table public.linkups to service_role;

grant select on table public.linkup_attendees to anon, authenticated;
grant insert, delete on table public.linkup_attendees to authenticated;
grant all on table public.linkup_attendees to service_role;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.linkups enable row level security;
alter table public.linkup_attendees enable row level security;

drop policy if exists "linkups_select_all" on public.linkups;
create policy "linkups_select_all"
  on public.linkups for select
  using (true);

drop policy if exists "linkups_insert_host" on public.linkups;
create policy "linkups_insert_host"
  on public.linkups for insert
  to authenticated
  with check (host_id = auth.uid());

drop policy if exists "linkups_update_host" on public.linkups;
create policy "linkups_update_host"
  on public.linkups for update
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists "linkups_delete_host" on public.linkups;
create policy "linkups_delete_host"
  on public.linkups for delete
  to authenticated
  using (host_id = auth.uid());

drop policy if exists "linkup_attendees_select_all" on public.linkup_attendees;
create policy "linkup_attendees_select_all"
  on public.linkup_attendees for select
  using (true);

drop policy if exists "linkup_attendees_insert_self" on public.linkup_attendees;
create policy "linkup_attendees_insert_self"
  on public.linkup_attendees for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "linkup_attendees_delete_self" on public.linkup_attendees;
create policy "linkup_attendees_delete_self"
  on public.linkup_attendees for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Realtime (ignore “already member of publication” if you re-run)
-- -----------------------------------------------------------------------------
do $realtime$
begin
  begin
    execute 'alter publication supabase_realtime add table public.linkups';
  exception
    when duplicate_object then null;
    when others then
      if sqlerrm ilike '%already%member%' or sqlerrm ilike '%already exists%' then
        null;
      else
        raise;
      end if;
  end;
  begin
    execute 'alter publication supabase_realtime add table public.linkup_attendees';
  exception
    when duplicate_object then null;
    when others then
      if sqlerrm ilike '%already%member%' or sqlerrm ilike '%already exists%' then
        null;
      else
        raise;
      end if;
  end;
end
$realtime$;

-- PostgREST: reload OpenAPI schema cache
select pg_notify('pgrst', 'reload schema');
