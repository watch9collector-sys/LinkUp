-- LinkUp: fix support_requests contact INSERT RLS (production-safe, idempotent)
-- Run in Supabase Dashboard → SQL Editor → project zijrcnzjdafndjdpltst
-- Does NOT recreate table/RPC. Does NOT change delete_account policy or SELECT/UPDATE/DELETE.

-- 1) Inspect existing policies
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'support_requests';

-- 2) Replace contact INSERT policy only (anon + authenticated)
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

-- 3) Reload PostgREST schema cache
select pg_notify('pgrst', 'reload schema');

-- 4) Verify policy is present
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'support_requests'
order by policyname;
