-- LinkUp: support_requests API fix (run on Production branch for your active project)
-- Dashboard → confirm Project URL ref matches .env.local NEXT_PUBLIC_SUPABASE_URL
-- Safe to re-run. Does not drop existing rows.

-- -----------------------------------------------------------------------------
-- 1) Table (skip if already created)
-- -----------------------------------------------------------------------------
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('contact', 'delete_account')),
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(trim(name)) >= 1),
  email text not null check (char_length(trim(email)) >= 3),
  subject text,
  message text not null check (char_length(trim(message)) >= 10),
  created_at timestamptz not null default now()
);

create index if not exists support_requests_created_at_idx
  on public.support_requests (created_at desc);

create index if not exists support_requests_type_idx
  on public.support_requests (request_type);

create index if not exists support_requests_user_id_idx
  on public.support_requests (user_id)
  where user_id is not null;

-- -----------------------------------------------------------------------------
-- 2) Grants (PostgREST + Supabase API roles)
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert on table public.support_requests to anon, authenticated;
grant all on table public.support_requests to service_role;

do $grant_authenticator$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticator') then
    execute 'grant usage on schema public to authenticator';
    execute 'grant select, insert on table public.support_requests to authenticator';
  end if;
end
$grant_authenticator$;

-- -----------------------------------------------------------------------------
-- 3) RLS (insert-only from client)
-- -----------------------------------------------------------------------------
alter table public.support_requests enable row level security;

drop policy if exists "support_requests_insert_contact" on public.support_requests;
create policy "support_requests_insert_contact"
  on public.support_requests
  for insert
  to anon, authenticated
  with check (
    request_type = 'contact'
    and (user_id is null or user_id = auth.uid())
    and char_length(trim(message)) >= 10
  );

drop policy if exists "support_requests_insert_delete_account" on public.support_requests;
create policy "support_requests_insert_delete_account"
  on public.support_requests
  for insert
  to authenticated
  with check (
    request_type = 'delete_account'
    and user_id = auth.uid()
    and char_length(trim(message)) >= 10
  );

-- -----------------------------------------------------------------------------
-- 4) RPC insert (PostgREST /rest/v1/rpc/submit_support_request)
--    SECURITY INVOKER → RLS policies above still apply.
-- -----------------------------------------------------------------------------
create or replace function public.submit_support_request(
  request_type text,
  name text,
  email text,
  message text,
  subject text default null,
  user_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_id uuid;
  resolved_user_id uuid;
begin
  if request_type not in ('contact', 'delete_account') then
    raise exception 'invalid request_type';
  end if;

  resolved_user_id := case
    when request_type = 'contact' then auth.uid()
    else user_id
  end;

  -- Avoid INSERT ... RETURNING: with RLS and no SELECT policy, RETURNING needs read access.
  new_id := gen_random_uuid();

  insert into public.support_requests (
    id,
    request_type,
    user_id,
    name,
    email,
    subject,
    message
  )
  values (
    new_id,
    request_type,
    resolved_user_id,
    trim(name),
    trim(email),
    nullif(trim(subject), ''),
    trim(message)
  );

  return new_id;
end;
$$;

revoke all on function public.submit_support_request(text, text, text, text, text, uuid)
  from public;

grant execute on function public.submit_support_request(text, text, text, text, text, uuid)
  to anon, authenticated, service_role;

-- One cache refresh after DDL (not a loop — run this script once per project/branch).
select pg_notify('pgrst', 'reload schema');
