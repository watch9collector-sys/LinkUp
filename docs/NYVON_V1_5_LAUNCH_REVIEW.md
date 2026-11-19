# Nyvon V1.5 — Jaro 1 review-branch implementation package
Date: 2026-11-19. Owner approval scope: prepare proposed code and SQL on a separate branch only.
**NOT approved:** production merge/deploy, database migration, live-data edits, test accounts,
Play Console changes, Play publishing, legal publication, or automated deletion.

## Branch and staging dependency
Branch: `review/nyvon-v1-5-launch-safeguards-20261119`
Base commit: `8bcfb8d23fb788f30ea31a9dd19b18f302deda7f`.
The new feed calls the `fetch_safe_linkups` database RPC. It will NOT work on a
Supabase instance without the matching reviewed migration. Do not merge or ship
the web changes before applying and validating the migration in an isolated
staging project, then obtaining separate owner approval for any production
database changes and deploy. Never silently fall back to unsafe public table
SELECTs.

## Fixes and acceptance checks
1. **Guest privacy — needs staging security audit.**
   - `supabase/migrations/20261119120000_secure_linkup_discovery.sql` is a
     proposed migration, not applied anywhere by this branch.
   - `src/lib/linkupsApi.ts`, `src/lib/linkupsTypes.ts`,
     `src/lib/linkupLocations.ts`, `app/explore/ExploreClient.tsx`,
     `app/components/linkups/LinkUpCard.tsx`, and
     `app/components/linkups/LinkUpDetailsModal.tsx` use redacted data.
   - Verify direct anonymous requests to linkups and linkup_attendees cannot
     retrieve data; anon and signed-in NONPARTICIPANTS cannot retrieve exact
     street address, exact coordinates, description, attendee names/IDs or
     host full name through any API or realtime channel. Participant and host
     have permitted details. Approximate map pins use 0.1-degree rounding;
     assess whether this is appropriately private in small communities.
   - Important residual risk: event TITLES are free-text and can themselves
     contain exact addresses. Add host safety guidance/moderation if needed.
   - RLS helpers must be audited for escalation, recursion and performance.
     Review ALL live policies/grants before applying. The migration fails
     intentionally if unexpected SELECT policies are present.
2. **Expired LinkUps — staged.**
   - Shared discovery now queries upcoming events only, including pagination.
   - Verify cards, details, and map do not show past events. Verify 62 historical
     events remain unchanged in DB; 65/3 counts are audit snapshots, not a
     permanent assertion. Use current timestamps and exact time zones.
   - Database policy proposes rejection of new joins for expired events.
   - Confirm hosts can still access their prior events via a separate history
     mechanism before claiming full history behavior is preserved.
3. **Account deletion — copy clarified; workflow NOT complete.**
   - Public path now reads Profile → Support & Legal → Delete account.
   - The form records a request to `support_requests`; it does NOT erase
     auth.users, profiles, photos, LinkUps, attendee records or moderation data.
   - Before approving a real deletion, inventory FK cascade constraints, Auth
     admin privileges, storage paths, support tickets, diagnostics/analytics,
     identity verification, lawful retention exceptions and confirmation email.
   - Define a truthful service-level processing deadline (not invented here),
     a deletion/retention schedule, and a documented manual owner SOP.
   - Test only with an explicitly approved disposable account, and document
     every deleted/retained data category. No automatic deletion tool in branch.
4. **Legal and guest navigation — staged drafts; review before publication.**
   - `app/privacy/page.tsx`, `app/terms/page.tsx`,
     `app/delete-account/page.tsx`, `app/components/SiteFooter.tsx`,
     `app/layout.tsx`.
   - Verify disclosures against actual services, age verification, cookies/
     local storage, legal retention, third-party disclosures and Play Data safety.
   - Counsel/owner must approve wording; do not promise fixed retention or SLA
     until verified. Review the 18+ policy's practical signup enforcement.
5. **Google Play Website — NOT CHANGED.**
   - Current old value (from Jaro 2): https://link-up-394f01b7.base44.app/home
   - Proposed new value: https://nyvon.app
   - Google Play Store settings uses 'Save and publish' that may go live
     immediately. Only the owner should approve this Console action.
   - Managed publishing remains ON; do not click Publish 4 changes.
6. **Additional checks before GO:**
   - Brother's Android tests: install, sign-up (email verification), login/out,
     password reset, profile edit/photo, Create/Join/Leave/Edit/Delete LinkUp,
     report/block, session persistence, Android WebView permissions, deletion.
   - Reconcile Data safety deletion support / partial deletion wording using
     current Play Console preview, not assumptions.
   - Validate wrong-city geocoding, profile image replacement behavior, and
     map initial loading as separate follow-ups.

## Deployment safety sequence (NOT authorization)
1. Obtain staging Supabase/project with masked/disposable data, no real users.
2. Preflight: export schema/policies/grants; snapshot counts and row hashes;
   review other migrations. NEVER run the destructive 20260212160000 setup file.
3. Apply only the proposed secure migration to staging; test roles and RPC.
4. Connect a preview build to STAGING Supabase, not production; run TS lint,
   build, end-to-end and abuse/privacy tests with disposable accounts.
5. Jaro 2 independently re-audits both guest and authenticated API payloads.
6. Obtain Joshua's separate explicit approval before production SQL/merge,
   Console updates or release. Back up production before any approved changes.
7. On approved rollout, verify counters, RLS, links, app behavior and crash logs.

## Rollback and risk controls
- Git commits are independently reviewable. Client release can be reverted to a
  prior commit only while preserving server-side privacy restrictions.
- NEVER roll back to unauthenticated SELECT ALL or expose raw private data as
  a quick fix. If RPC fails, fail closed with an error instead.
- SQL security rollback requires a newly audited privacy-preserving migration
  and explicit owner approval; prior RLS policy is unsafe.
- Changes to existing data are NOT part of this review package. Any schema or
  RLS change is a production policy change, not a harmless UI tweak.
- If a preview deploy runs automatically, its existence is not proof that the
  feature works or permission to publish.

## Status
- GitHub branch: prepared for code review.
- Static code review: ongoing.
- Migration: proposed, not applied/tested.
- Staging/Android E2E: outstanding.
- Jaro 2 independent review: outstanding.
- Google Play V1.5: previously approved, owner holds publication.
- Launch: NO GO until security and deletion workflows are demonstrated.
