-- REVIEW ONLY. Apply to production only after separate owner approval.
-- On isolated staging, the trigger body was confirmed to use only NEW and
-- pg_catalog.now(). Lock down function name resolution against search_path
-- changes, addressing Supabase security advisor lint 0011.
BEGIN;
DO $guard$
BEGIN
  IF to_regprocedure('public.set_linkups_updated_at()') IS NULL THEN
    RAISE EXCEPTION 'Missing updated_at trigger: stop rather than silently creating a replacement';
  END IF;
END;
$guard$;
ALTER FUNCTION public.set_linkups_updated_at() SET search_path = '';
COMMIT;
