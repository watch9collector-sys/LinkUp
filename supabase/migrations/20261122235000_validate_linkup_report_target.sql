CREATE OR REPLACE FUNCTION public.submit_user_report(p_reason text, p_details text DEFAULT ''::text, p_reported_user_id uuid DEFAULT NULL::uuid, p_reported_linkup_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    if p_reported_user_id is not null and p_reported_user_id <> v_host then
      raise exception 'Reported user must be the LinkUp host';
    end if;
    if v_host = auth.uid() then
      raise exception 'Cannot report yourself';
    end if;
    p_reported_user_id := v_host;
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
$function$;
