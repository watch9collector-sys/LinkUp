-- NYVON V1.5 REVIEW ONLY — DO NOT APPLY TO PRODUCTION WITHOUT APPROVAL.
-- Least privilege, non-destructive. RLS does NOT restrict TRUNCATE.
-- These ordinary browser roles must never be able to TRUNCATE, alter triggers,
-- or declare foreign keys against user-data tables.
-- Retain existing SELECT/INSERT/UPDATE/DELETE grants and RLS policies so
-- normal app behavior stays unchanged during isolated staged testing.
BEGIN;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE
  public.linkups,
  public.linkup_attendees,
  public.support_requests,
  public.user_blocks,
  public.user_reports
FROM anon, authenticated;
COMMIT;
