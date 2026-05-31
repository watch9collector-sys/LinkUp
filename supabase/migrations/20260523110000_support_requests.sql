-- LinkUp: contact + account deletion requests (stored in Supabase)
-- Run in Supabase Dashboard → SQL → New query (safe to re-run)

-- -----------------------------------------------------------------------------
-- Table
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
-- Grants (PostgREST requires SELECT for API schema visibility; RLS blocks reads)
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert on table public.support_requests to anon, authenticated;
grant all on table public.support_requests to service_role;

-- -----------------------------------------------------------------------------
-- Row Level Security (insert-only from client; no SELECT policies = zero rows)
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

-- PostgREST: reload OpenAPI schema cache
select pg_notify('pgrst', 'reload schema');
