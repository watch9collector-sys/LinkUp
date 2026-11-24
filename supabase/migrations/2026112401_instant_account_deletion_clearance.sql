-- Applied in isolation to nyvon-v1-5-staging first.
-- Run in production only after authenticated end-to-end staging QA passes.
create table if not exists nyvon_private.account_deletion_holds (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);
revoke all on nyvon_private.account_deletion_holds from public, anon, authenticated;

create or replace function public.nyvon_account_deletion_clearance(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    return 'invalid_account';
  end if;
  -- Unknown user-owned objects require manual review, not a partial automatic deletion.
  if exists (
    select 1 from storage.objects s
    where (s.owner = p_user_id or s.owner_id = p_user_id::text)
      and not (
        s.bucket_id = 'profile-images'
        and (s.name like ('avatars/' || p_user_id::text || '/%')
          or s.name like ('banners/' || p_user_id::text || '/%'))
      )
  ) then return 'unrecognized_storage_review'; end if;
  if exists (select 1 from public.platform_founders where user_id = p_user_id) then
    return 'founder_account_review';
  end if;
  if exists (select 1 from nyvon_private.account_deletion_holds where user_id = p_user_id) then
    return 'legal_hold_review';
  end if;
  if exists (
    select 1 from public.user_reports r
    left join public.linkups l on l.id = r.reported_linkup_id
    where r.status = 'open'
      and (r.reporter_id = p_user_id or r.reported_user_id = p_user_id or l.host_id = p_user_id)
  ) then return 'open_safety_case_review'; end if;
  return 'allowed';
end;
$function$;
revoke all on function public.nyvon_account_deletion_clearance(uuid) from public, anon, authenticated;
grant execute on function public.nyvon_account_deletion_clearance(uuid) to service_role;
