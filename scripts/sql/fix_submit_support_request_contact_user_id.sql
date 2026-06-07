-- LinkUp: contact requests derive user_id from auth.uid() inside RPC (not client)
-- Run in Supabase Dashboard → SQL Editor → project zijrcnzjdafndjdpltst
-- Does NOT change RLS, table, or delete_account behavior.
-- NOTE: Prefer fix_submit_support_request_no_returning.sql (includes this + no RETURNING fix).

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

select pg_notify('pgrst', 'reload schema');
