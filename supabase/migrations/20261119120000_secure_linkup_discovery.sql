-- REVIEW ONLY: Do not apply to production without Joshua's separate approval.
-- Nyvon public discovery: guests see upcoming events without precise addresses,
-- raw coordinates, host identities, attendee identities or descriptions.
-- PRECONDITION: Back up policies/data; inspect live grants/policies and test
-- all roles in an isolated Supabase staging project before application.
-- DO NOT rerun 20260212160000_linkups_schema.sql (it drops live tables).

BEGIN;

-- Stop if another SELECT/ALL policy exists that would silently bypass the
-- restrictions below. Review and explicitly incorporate those policies first.
DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('linkups', 'linkup_attendees')
      AND cmd IN ('SELECT', 'ALL')
      AND policyname NOT IN ('linkups_select_all', 'linkup_attendees_select_all')
  ) THEN
    RAISE EXCEPTION 'Unexpected LinkUp SELECT policy. Audit pg_policies before applying this migration.';
  END IF;
END;
$guard$;

-- Helper is SECURITY DEFINER to avoid circular RLS between linkups and
-- linkup_attendees. It returns only a boolean for the current user.
CREATE OR REPLACE FUNCTION public.current_user_hosts_linkup(p_linkup_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.linkups l
    WHERE l.id = p_linkup_id AND l.host_id = (SELECT auth.uid())
  );
$$;
REVOKE ALL ON FUNCTION public.current_user_hosts_linkup(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_hosts_linkup(uuid) TO authenticated;

-- Authorization at the database layer: direct reads are private; all guests
-- must access the redacted discovery RPC defined below.
DROP POLICY IF EXISTS linkups_select_all ON public.linkups;
DROP POLICY IF EXISTS linkups_select_participants ON public.linkups;
CREATE POLICY linkups_select_participants ON public.linkups
FOR SELECT TO authenticated
USING (
  host_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.linkup_attendees a
    WHERE a.linkup_id = linkups.id AND a.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS linkup_attendees_select_all ON public.linkup_attendees;
DROP POLICY IF EXISTS linkup_attendees_select_participants ON public.linkup_attendees;
CREATE POLICY linkup_attendees_select_participants ON public.linkup_attendees
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.current_user_hosts_linkup(linkup_id)
);

REVOKE SELECT ON public.linkups FROM anon;
REVOKE SELECT ON public.linkup_attendees FROM anon;

-- Prevent joins to already-past events even through direct database requests.
CREATE OR REPLACE FUNCTION public.linkup_is_upcoming(p_linkup_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.linkups l
    WHERE l.id = p_linkup_id AND l.starts_at > now()
  );
$$;
REVOKE ALL ON FUNCTION public.linkup_is_upcoming(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.linkup_is_upcoming(uuid) TO authenticated;

DROP POLICY IF EXISTS linkup_attendees_insert_self ON public.linkup_attendees;
CREATE POLICY linkup_attendees_insert_self ON public.linkup_attendees
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND public.linkup_is_upcoming(linkup_id)
);

-- Read-only discovery. Participant/host details are visible ONLY to the
-- host or a signed-in user who already joined the specific LinkUp.
-- Public/nonparticipant locations are approximate (rounded ~0.1 degree);
-- exact address and attendee identity are NEVER returned to those roles.
CREATE OR REPLACE FUNCTION public.fetch_safe_linkups(
  p_as_of timestamptz,
  p_limit integer DEFAULT 51,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid, title text, category text, location text,
  latitude double precision, longitude double precision,
  starts_at timestamptz, description text, host_id uuid,
  host_display_name text, created_at timestamptz, updated_at timestamptz,
  linkup_attendees jsonb, attendee_count bigint,
  you_joined boolean, you_host boolean, location_is_approximate boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  WITH upcoming AS (
    SELECT l.*,
      ((SELECT auth.uid()) IS NOT NULL AND l.host_id = (SELECT auth.uid())) AS is_host,
      ((SELECT auth.uid()) IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.linkup_attendees my
        WHERE my.linkup_id = l.id AND my.user_id = (SELECT auth.uid())
      )) AS is_joined
    FROM public.linkups l
    WHERE l.starts_at >= GREATEST(p_as_of, now())
    ORDER BY l.starts_at ASC, l.id ASC
    LIMIT LEAST(GREATEST(p_limit, 1), 101)
    OFFSET GREATEST(p_offset, 0)
  )
  SELECT
    l.id, l.title, l.category,
    CASE WHEN (l.is_host OR l.is_joined) THEN l.location
         ELSE 'Location shared with attendees' END AS location,
    CASE WHEN (l.is_host OR l.is_joined) THEN l.latitude
         ELSE round(l.latitude::numeric, 1)::double precision END AS latitude,
    CASE WHEN (l.is_host OR l.is_joined) THEN l.longitude
         ELSE round(l.longitude::numeric, 1)::double precision END AS longitude,
    l.starts_at,
    CASE WHEN (l.is_host OR l.is_joined) THEN l.description ELSE '' END AS description,
    CASE WHEN (SELECT auth.uid()) IS NOT NULL THEN l.host_id ELSE NULL END AS host_id,
    CASE WHEN (l.is_host OR l.is_joined) THEN l.host_display_name ELSE 'Host' END AS host_display_name,
    l.created_at, l.updated_at,
    CASE WHEN (l.is_host OR l.is_joined) THEN COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'user_id', a.user_id,
        'display_name', a.display_name, 'joined_at', a.joined_at
      ) ORDER BY a.joined_at)
      FROM public.linkup_attendees a WHERE a.linkup_id = l.id
    ), '[]'::jsonb)
    ELSE '[]'::jsonb END AS linkup_attendees,
    (SELECT count(*) FROM public.linkup_attendees a WHERE a.linkup_id = l.id) AS attendee_count,
    l.is_joined, l.is_host, NOT (l.is_host OR l.is_joined) AS location_is_approximate
  FROM upcoming l
  ORDER BY l.starts_at ASC, l.id ASC;
$$;
REVOKE ALL ON FUNCTION public.fetch_safe_linkups(timestamptz, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_safe_linkups(timestamptz, integer, integer) TO anon, authenticated;

COMMIT;

-- SECURITY TESTS REQUIRED BEFORE APPROVAL:
-- 1. anon SELECT from public.linkups and linkup_attendees denied/empty.
-- 2. anon RPC reveals no street addresses, attendee IDs/names or exact coords.
-- 3. signed-in nonparticipant gets public-only fields; host/member gets details.
-- 4. cross-user raw SELECT cannot read someone else's private LinkUp.
-- 5. host create/edit/delete works; new attendee can join upcoming, leave,
--    and cannot join expired; blocked-user rules verified independently.
-- 6. Check row count/status unchanged before/after; do not use old DROP script.
-- Rollback requires a new privacy-preserving policy, NEVER reinstating anon
-- SELECT ALL or restoring sensitive guest data.
