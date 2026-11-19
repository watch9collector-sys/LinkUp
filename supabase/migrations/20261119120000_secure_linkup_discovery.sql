-- REVIEW ONLY: Do not apply to production without Joshua's separate approval.
-- Nyvon public discovery: guests see upcoming events without precise addresses,
-- raw coordinates, host identities, attendee identities or descriptions.
-- PRECONDITION: Back up policies/data; inspect live grants/policies and test
-- all roles in an isolated Supabase staging project before application.
-- DO NOT rerun 20260212160000_linkups_schema.sql (it drops live tables).

BEGIN;

-- Strict inventory of EVERY policy, not just SELECT. Unexpected policies
-- (including a broad ALL/INSERT/UPDATE/DELETE policy) stop the transaction.
-- Inspect pg_policies and all grants in staging before attempting migration.
DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename IN ('linkups', 'linkup_attendees')
      AND NOT EXISTS (
        SELECT 1 FROM (VALUES
          ('linkups', 'linkups_select_all', 'SELECT'),
          ('linkups', 'linkups_select_participants', 'SELECT'),
          ('linkups', 'linkups_insert_host', 'INSERT'),
          ('linkups', 'linkups_update_host', 'UPDATE'),
          ('linkups', 'linkups_delete_host', 'DELETE'),
          ('linkup_attendees', 'linkup_attendees_select_all', 'SELECT'),
          ('linkup_attendees', 'linkup_attendees_select_participants', 'SELECT'),
          ('linkup_attendees', 'linkup_attendees_insert_self', 'INSERT'),
          ('linkup_attendees', 'linkup_attendees_delete_self', 'DELETE')
        ) AS allowed(table_name, policy_name, command)
        WHERE allowed.table_name = p.tablename
          AND allowed.policy_name = p.policyname
          AND allowed.command = p.cmd
      )
  ) THEN
    RAISE EXCEPTION 'Unexpected LinkUp policy (any command). Inventory pg_policies before proceeding.';
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

-- Production preflight found legacy grants of ALL table privileges to anon
-- (including TRUNCATE, REFERENCES and TRIGGER), despite RLS. RLS does not
-- protect TRUNCATE. Harden table grants rather than revoking SELECT alone.
-- SECURITY DEFINER discovery RPC remains available to anon independently.
REVOKE ALL PRIVILEGES ON TABLE public.linkups, public.linkup_attendees
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.linkups
  TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.linkup_attendees
  TO authenticated;

-- Enforce BOTH future date and blocked-host rule using privileged reads.
-- Nonparticipants cannot SELECT the raw LinkUp table under participant-only
-- RLS, so a plain NOT EXISTS subquery in an INSERT policy would be bypassable.
CREATE OR REPLACE FUNCTION public.linkup_join_allowed(p_linkup_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.linkups l
    WHERE l.id = p_linkup_id
      AND l.starts_at > now()
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks b
        WHERE
          (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = l.host_id)
          OR
          (b.blocker_id = l.host_id AND b.blocked_id = (SELECT auth.uid()))
      )
  );
$$;
REVOKE ALL ON FUNCTION public.linkup_join_allowed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.linkup_join_allowed(uuid) TO authenticated;

DROP POLICY IF EXISTS linkup_attendees_insert_self ON public.linkup_attendees;
CREATE POLICY linkup_attendees_insert_self ON public.linkup_attendees
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND public.linkup_join_allowed(linkup_id)
);

-- Read-only discovery. Participant/host details are visible ONLY to the
-- host or a signed-in user who already joined the specific LinkUp.
-- Guest/nonparticipant locations and precise coordinates are fully redacted;
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
      AND (
        (SELECT auth.uid()) IS NULL
        OR NOT public.users_blocked_either_way((SELECT auth.uid()), l.host_id)
      )
    ORDER BY l.starts_at ASC, l.id ASC
    LIMIT LEAST(GREATEST(p_limit, 1), 101)
    OFFSET GREATEST(p_offset, 0)
  )
  SELECT
    l.id, l.title, l.category,
    CASE WHEN (l.is_host OR l.is_joined) THEN l.location
         ELSE 'Location shared with attendees' END AS location,
    CASE WHEN (l.is_host OR l.is_joined) THEN l.latitude
         ELSE NULL END AS latitude,
    CASE WHEN (l.is_host OR l.is_joined) THEN l.longitude
         ELSE NULL END AS longitude,
    l.starts_at,
    CASE WHEN (l.is_host OR l.is_joined) THEN l.description ELSE '' END AS description,
    CASE WHEN (l.is_host OR l.is_joined) THEN l.host_id ELSE NULL END AS host_id,
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

-- Signed-in nonparticipants can block the host without receiving the host's
-- internal UUID. This uses the LinkUp id as the target and is idempotent.
CREATE OR REPLACE FUNCTION public.block_linkup_host(p_linkup_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $block_linkup_host$
DECLARE
  v_blocker uuid := (SELECT auth.uid());
  v_host uuid;
BEGIN
  IF v_blocker IS NULL THEN
    RAISE EXCEPTION 'Sign in to block a host';
  END IF;
  SELECT l.host_id INTO v_host
  FROM public.linkups l WHERE l.id = p_linkup_id;
  IF v_host IS NULL THEN
    RAISE EXCEPTION 'LinkUp not found';
  END IF;
  IF v_blocker = v_host THEN
    RAISE EXCEPTION 'You cannot block yourself';
  END IF;
  INSERT INTO public.user_blocks(blocker_id, blocked_id)
  VALUES (v_blocker, v_host)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
END;
$block_linkup_host$;
REVOKE ALL ON FUNCTION public.block_linkup_host(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.block_linkup_host(uuid) TO authenticated;

-- Supabase may grant EXECUTE directly to anon/authenticated on new functions
-- through default privileges. REVOKE FROM PUBLIC alone is NOT sufficient.
-- Explicitly remove role-level anon grants on every privileged helper/RPC.
REVOKE ALL ON FUNCTION public.current_user_hosts_linkup(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_hosts_linkup(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.linkup_join_allowed(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.linkup_join_allowed(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.block_linkup_host(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.block_linkup_host(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.fetch_safe_linkups(timestamptz, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_safe_linkups(timestamptz, integer, integer)
  TO anon, authenticated;

-- Legacy moderation SECURITY DEFINER RPCs existed before this migration.
-- Keep their intended signed-in callers working, but deny anonymous calls.
REVOKE ALL ON FUNCTION public.is_platform_founder() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_founder() TO authenticated;

REVOKE ALL ON FUNCTION public.founder_remove_linkup(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.founder_remove_linkup(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.founder_set_report_status(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.founder_set_report_status(uuid, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.submit_user_report(text, text, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_user_report(text, text, uuid, uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.my_interaction_block_ids()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_interaction_block_ids() TO authenticated;

-- No direct client needs this legacy arbitrary-pair lookup. The new
-- SECURITY DEFINER discovery RPC can call it internally as its owner;
-- direct anonymous or authenticated EXECUTE would reveal block relationships.
REVOKE ALL ON FUNCTION public.users_blocked_either_way(uuid, uuid)
  FROM PUBLIC, anon, authenticated;

COMMIT;

-- SECURITY TESTS REQUIRED BEFORE APPROVAL:
-- 1. anon has NO direct table privileges including TRUNCATE, INSERT,
--    UPDATE, DELETE, SELECT, REFERENCES or TRIGGER. Authenticated roles have
--    only required privileges and host/self RLS applies.
-- 2. anon RPC reveals NO street addresses, attendee IDs/names, host ID,
--    or coordinates (even approximately); public map pins remain hidden.
-- 3. signed-in nonparticipant gets public-only fields; host/member gets details.
-- 4. cross-user raw SELECT cannot read another private LinkUp; no host_id
--    exposed to any nonparticipant; reporting and blocking still operate.
-- 5. host create/edit/delete works; new attendee can join upcoming, leave,
--    and cannot join expired or blocked hosts via linkup_join_allowed;
--    block_linkup_host succeeds
--    for nonparticipants but never returns a host UUID.
-- 6. Check row count/status unchanged before/after; do not use old DROP script.
-- Rollback requires a new privacy-preserving policy, NEVER reinstating anon
-- SELECT ALL or restoring sensitive guest data.
