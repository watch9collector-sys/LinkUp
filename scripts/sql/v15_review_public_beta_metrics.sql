-- NYVON V1.5: Safe, non-PII all-time public beta metrics.
-- Apply to staging and test before a coordinated production privacy cutover.
-- This SECURITY DEFINER function deliberately returns ONLY two aggregate counts,
-- not rows, IDs, email addresses, locations, attendee identity or event details.
BEGIN;
DO $guard$
BEGIN
  IF to_regprocedure('public.fetch_public_beta_metrics()') IS NOT NULL THEN
    RAISE EXCEPTION 'fetch_public_beta_metrics exists; review before modifying';
  END IF;
END;
$guard$;

CREATE FUNCTION public.fetch_public_beta_metrics()
RETURNS TABLE (linkups_created bigint, connections_made bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    (SELECT count(*) FROM public.linkups) AS linkups_created,
    (SELECT count(*) FROM public.linkup_attendees) AS connections_made;
$$;

REVOKE ALL ON FUNCTION public.fetch_public_beta_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_public_beta_metrics() TO anon, authenticated;
COMMIT;
