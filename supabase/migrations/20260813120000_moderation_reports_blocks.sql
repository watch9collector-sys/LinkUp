-- NYVON: Founder moderation, user reports, and user blocks
-- Run in Supabase Dashboard → SQL Editor (safe to re-run)
-- Founder authorization is server-side via platform_founders (auth.users UUID).
-- Clients cannot insert/update/delete founder rows.

-- ---------------------------------------------------------------------------
-- Platform founders (least privilege; no client writes)
-- ---------------------------------------------------------------------------
create table if not exists public.platform_founders (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.platform_founders enable row level security;

revoke all on table public.platform_founders from anon, authenticated;
grant select on table public.platform_founders to authenticated;
grant all on table public.platform_founders to service_role;

drop policy if exists "platform_founders_select_own" on public.platform_founders;
create policy "platform_founders_select_own"
  on public.platform_founders
  for select
  to authenticated
  using (user_id = auth.uid());

-- Seed founder account if present (email lookup in auth.users — not client metadata)
insert into public.platform_founders (user_id, note)
select id, 'NYVON Founder/Owner'
from auth.users
where lower(email) = lower('watch9collector@gmail.com')
on conflict (user_id) do nothing;

create or replace function public.is_platform_founder()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_founders
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_platform_founder() from public;
grant execute on function public.is_platform_founder() to authenticated;

-- ---------------------------------------------------------------------------
-- Moderation audit log (founder-readable; insert via security definer only)
-- ---------------------------------------------------------------------------
create table if not exists public.moderation_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid not null references auth.users (id) on delete cascade,
  target_linkup_id uuid,
  target_user_id uuid,
  linkup_title text,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists moderation_audit_log_created_idx
  on public.moderation_audit_log (created_at desc);

alter table public.moderation_audit_log enable row level security;

revoke all on table public.moderation_audit_log from anon, authenticated;
grant select on table public.moderation_audit_log to authenticated;
grant all on table public.moderation_audit_log to service_role;

drop policy if exists "moderation_audit_select_founder" on public.moderation_audit_log;
create policy "moderation_audit_select_founder"
  on public.moderation_audit_log
  for select
  to authenticated
  using (public.is_platform_founder());

-- ---------------------------------------------------------------------------
-- User reports
-- ---------------------------------------------------------------------------
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_user_id uuid references auth.users (id) on delete set null,
  reported_linkup_id uuid references public.linkups (id) on delete set null,
  reason text not null check (
    reason in (
      'spam',
      'harassment',
      'inappropriate_content',
      'safety_concern',
      'impersonation',
      'scam_fraud',
      'other'
    )
  ),
  details text not null default '' check (char_length(details) <= 2000),
  status text not null default 'open' check (
    status in ('open', 'reviewed', 'dismissed', 'actioned')
  ),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  constraint user_reports_target_required check (
    reported_user_id is not null or reported_linkup_id is not null
  ),
  constraint user_reports_not_self check (
    reported_user_id is null or reported_user_id <> reporter_id
  )
);

create index if not exists user_reports_created_idx
  on public.user_reports (created_at desc);
create index if not exists user_reports_status_idx
  on public.user_reports (status);
create index if not exists user_reports_reporter_idx
  on public.user_reports (reporter_id);

alter table public.user_reports enable row level security;

revoke all on table public.user_reports from anon;
grant select, insert on table public.user_reports to authenticated;
grant all on table public.user_reports to service_role;

drop policy if exists "user_reports_insert_own" on public.user_reports;
create policy "user_reports_insert_own"
  on public.user_reports
  for insert
  to authenticated
  with check (
    reporter_id = auth.uid()
    and (reported_user_id is null or reported_user_id <> auth.uid())
  );

drop policy if exists "user_reports_select_own_or_founder" on public.user_reports;
create policy "user_reports_select_own_or_founder"
  on public.user_reports
  for select
  to authenticated
  using (
    reporter_id = auth.uid()
    or public.is_platform_founder()
  );

-- No update/delete for normal users. Founders update status via RPC only.

create or replace function public.submit_user_report(
  p_reason text,
  p_details text default '',
  p_reported_user_id uuid default null,
  p_reported_linkup_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_host uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_reported_user_id is null and p_reported_linkup_id is null then
    raise exception 'Report target required';
  end if;

  if p_reported_user_id is not null and p_reported_user_id = auth.uid() then
    raise exception 'Cannot report yourself';
  end if;

  if p_reported_linkup_id is not null then
    select host_id into v_host from public.linkups where id = p_reported_linkup_id;
    if v_host is null then
      raise exception 'LinkUp not found';
    end if;
    if p_reported_user_id is null then
      p_reported_user_id := v_host;
    end if;
  end if;

  insert into public.user_reports (
    reporter_id,
    reported_user_id,
    reported_linkup_id,
    reason,
    details
  )
  values (
    auth.uid(),
    p_reported_user_id,
    p_reported_linkup_id,
    p_reason,
    coalesce(trim(p_details), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_user_report(text, text, uuid, uuid) from public;
grant execute on function public.submit_user_report(text, text, uuid, uuid) to authenticated;

create or replace function public.founder_set_report_status(
  p_report_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_platform_founder() then
    raise exception 'Not authorized';
  end if;

  if p_status not in ('open', 'reviewed', 'dismissed', 'actioned') then
    raise exception 'Invalid status';
  end if;

  update public.user_reports
  set
    status = p_status,
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where id = p_report_id;

  if not found then
    raise exception 'Report not found';
  end if;
end;
$$;

revoke all on function public.founder_set_report_status(uuid, text) from public;
grant execute on function public.founder_set_report_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- User blocks (private; blocker manages own rows only)
-- ---------------------------------------------------------------------------
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_blocks_unique unique (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocker_idx on public.user_blocks (blocker_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

revoke all on table public.user_blocks from anon;
grant select, insert, delete on table public.user_blocks to authenticated;
grant all on table public.user_blocks to service_role;

drop policy if exists "user_blocks_select_own" on public.user_blocks;
create policy "user_blocks_select_own"
  on public.user_blocks
  for select
  to authenticated
  using (blocker_id = auth.uid());

drop policy if exists "user_blocks_insert_own" on public.user_blocks;
create policy "user_blocks_insert_own"
  on public.user_blocks
  for insert
  to authenticated
  with check (
    blocker_id = auth.uid()
    and blocked_id <> auth.uid()
  );

drop policy if exists "user_blocks_delete_own" on public.user_blocks;
create policy "user_blocks_delete_own"
  on public.user_blocks
  for delete
  to authenticated
  using (blocker_id = auth.uid());

create or replace function public.users_blocked_either_way(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

revoke all on function public.users_blocked_either_way(uuid, uuid) from public;
grant execute on function public.users_blocked_either_way(uuid, uuid) to authenticated;

-- Opaque list of user ids the current user should not interact with (either direction).
-- Does not reveal who initiated a block.
create or replace function public.my_interaction_block_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select blocked_id
  from public.user_blocks
  where blocker_id = auth.uid()
  union
  select blocker_id
  from public.user_blocks
  where blocked_id = auth.uid();
$$;

revoke all on function public.my_interaction_block_ids() from public;
grant execute on function public.my_interaction_block_ids() to authenticated;

-- Prevent new joins across a block (does not mutate existing attendee rows)
drop policy if exists "linkup_attendees_insert_self" on public.linkup_attendees;
create policy "linkup_attendees_insert_self"
  on public.linkup_attendees
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and not exists (
      select 1
      from public.linkups l
      where l.id = linkup_id
        and public.users_blocked_either_way(auth.uid(), l.host_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Founder platform-level LinkUp removal (audited; no content edit)
-- ---------------------------------------------------------------------------
create or replace function public.founder_remove_linkup(
  p_linkup_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host uuid;
  v_title text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_platform_founder() then
    raise exception 'Not authorized';
  end if;

  select host_id, title
  into v_host, v_title
  from public.linkups
  where id = p_linkup_id;

  if v_host is null then
    raise exception 'LinkUp not found';
  end if;

  insert into public.moderation_audit_log (
    action,
    actor_id,
    target_linkup_id,
    target_user_id,
    linkup_title,
    reason
  )
  values (
    'founder_remove_linkup',
    auth.uid(),
    p_linkup_id,
    v_host,
    v_title,
    coalesce(nullif(trim(p_reason), ''), 'Platform moderation removal')
  );

  delete from public.linkups where id = p_linkup_id;

  return jsonb_build_object(
    'ok', true,
    'linkup_id', p_linkup_id,
    'host_id', v_host
  );
end;
$$;

revoke all on function public.founder_remove_linkup(uuid, text) from public;
grant execute on function public.founder_remove_linkup(uuid, text) to authenticated;

select pg_notify('pgrst', 'reload schema');
