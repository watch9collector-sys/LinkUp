# Nyvon — production security hardening rollout (REVIEW ONLY)
**Update 2026-11-19: narrow anonymous RPC revoke applied to production; broader changes remain review-only**

## Observed live risks (read-only audit)
Supabase `linkup-prod` currently grants BOTH `anon` and `authenticated`
SQL-level **TRUNCATE** and **TRIGGER** powers on:
- `public.linkups`
- `public.linkup_attendees`
- `public.support_requests`

Additionally, `authenticated` has these powers on `user_blocks` and
`user_reports`; the anon role does not on those two tables.

**Important:** PostgreSQL row-level security does NOT restrict `TRUNCATE`.
That is a dangerous *database privilege* even when PostgREST does not
expose a direct TRUNCATE HTTP method. Do not mistake this audit for proof
of an external exploit; the grants are still unnecessary and should be
removed.

At initial audit, production's Supabase Security Advisor showed six
`SECURITY DEFINER` RPC functions directly callable by `anon`:
`founder_remove_linkup`, `founder_set_report_status`,
`is_platform_founder`, `my_interaction_block_ids`,
`submit_user_report`, `users_blocked_either_way`.
These may contain their own login/founder checks; the advisor's warning
alone does not establish unauthorized outcomes, but their direct anon
EXECUTE privileges expand the attack surface.

Both staging and live previously warned that
`set_linkups_updated_at()` had a mutable `search_path`. Production
also has leaked password protection disabled.

## Staging-only fixes completed

1. `supabase/migrations/20261119120000_secure_linkup_discovery.sql`
   hardened anon raw table permissions, visibility and privileged
   RPC execution; the intentionally public, redacted
   `fetch_safe_linkups` is left callable by guests. Earlier SQL and
   five actual anonymous HTTPS checks passed; real authenticated
   WebSocket tests are still not complete.
2. `supabase/migrations/20261119130000_fix_linkups_updated_at_search_path.sql`
   fixes the timestamp trigger `search_path`. Staging Supabase
   Security Advisor no longer emits the mutable path warning.
3. `supabase/migrations/20261119140000_strip_unsafe_client_table_privileges.sql`
   revoked `TRUNCATE`, `TRIGGER`, and `REFERENCES` for browser
   roles on all five public tables named above.
   Verification proved all five tables deny these three
   capabilities to both ordinary app roles. Transactionally rolled-back RLS inserts still
   succeeded for anonymous support contact and an authenticated hosted
   LinkUp, including the updated timestamp trigger. Original staging
   accounts and LinkUps preserved.

## Safe production proposal — ONLY with separate owner approval

**A. Immediate narrow permissions fix (first):**
Backup/inventory live table grants, verify current app health, then
apply only `20261119140000_strip_unsafe_client_table_privileges.sql`
on `linkup-prod`. This preserves existing SELECT/INSERT/UPDATE/DELETE
grants and RLS. Recheck ordinary sign-in, guest contact, event creation,
join/leave, reporting and all user-data table privileges. Monitor errors.
Avoid changing any other live schema in this step.

**B. Coordinated privacy rollout (separate approval and testing):**
Do NOT blindly apply the single full staging privacy migration to
production with old client code. The current `nyvon.app` version
still uses direct guest data access; revoking it without deploying the
compatible `fetch_safe_linkups` frontend simultaneously could break
Home/Explore. Prepare a backward-compatible RPC first, confirm old
clients remain functional, deploy the reviewed website and verify it,
then cut over raw access and privileged RPC permissions in a later
controlled step. Preview branch changes must be tested with real
signed-in JWTs and Realtime subscriptions before this cutover.

**C. Following checks:** Enable leaked-password checks after checking
plan and current Auth configuration; apply the staging-tested
`search_path` fix; reconcile the public privacy policy and Play Data
safety; implement the durable deletion procedure with media cleanup,
verification and retries.

## Release decision
**NO-GO for public Google Play publication at present.**
No production database, live website, real user accounts, or Play
Console settings were changed by this audit. Merging PR #4 into main
would affect production deployments; leave it a draft until final
explicit owner approval.

Reference:
- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Production RPC hardening completed (2026-11-19)

With the owner's request to resolve the six privileged functions, a separate
production Supabase migration named
`nyvon_restrict_anon_privileged_rpc_20261119` was applied to `linkup-prod`.
It removed **only anonymous EXECUTE grants** for the six audited functions,
without altering their definitions, `authenticated` grants, `service_role`
grants, table DML, RLS, records, the website, or Play Console.

Independent post-migration `has_function_privilege` checks confirmed anon=false,
authenticated=true and service_role=true on all six functions. Supabase Security
Advisor no longer reports anonymous SECURITY DEFINER functions. The six signed-in
SECURITY DEFINER notices remain because some are intentionally used by the app;
keep them for per-function authorization review rather than blindly revoking
signed-in permissions and breaking reporting, blocking or moderation.

**Still not performed:** the table-level TRUNCATE/TRIGGER/REFERENCES cleanup,
the larger privacy RLS/RPC migration, the search-path trigger fix, production
deletion automation, production website deployment, or Google Play publication.
Old and new Android/client compatibility and real end-to-end tests remain pending.

See `supabase/migrations/20261120050000_restrict_anon_privileged_rpc.sql`
for the exact idempotent SQL represented by this operation.
