-- An Auth deletion and its analytics erasure request must commit together.
-- The UUID is the PostHog distinct ID. It survives Auth deletion only until
-- staff verify processor erasure, so this table intentionally has no Auth FK.
create table nyvon_private.account_analytics_erasure (
  distinct_id uuid primary key,
  requested_at timestamptz not null default now(),
  posthog_person_id uuid,
  submitted_at timestamptz
);

alter table nyvon_private.account_analytics_erasure enable row level security;
revoke all on nyvon_private.account_analytics_erasure from public, anon, authenticated;

create function nyvon_private.queue_account_analytics_erasure()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into nyvon_private.account_analytics_erasure (distinct_id)
  values (old.id)
  on conflict (distinct_id) do nothing;
  return old;
end;
$function$;

revoke all on function nyvon_private.queue_account_analytics_erasure() from public, anon, authenticated;

create trigger nyvon_queue_account_analytics_erasure
after delete on auth.users
for each row execute function nyvon_private.queue_account_analytics_erasure();
