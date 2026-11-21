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
1. **Guest privacy — SQL staging tests passed; HTTP/Realtime security tests still pending.**
   - `supabase/migrations/20261119120000_secure_linkup_discovery.sql` is a
     draft production migration, applied and tested ONLY in isolated staging.
   - `src/lib/linkupsApi.ts`, `src/lib/linkupsTypes.ts`,
     `src/lib/linkupLocations.ts`, `app/explore/ExploreClient.tsx`,
     `app/components/linkups/LinkUpCard.tsx`, and
     `app/components/linkups/LinkUpDetailsModal.tsx` use redacted data.
   - Verify direct anonymous requests to linkups and linkup_attendees cannot
     retrieve data; anon and signed-in NONPARTICIPANTS cannot retrieve exact
     street address, exact coordinates, description, attendee names/IDs or
     host full name through any API or realtime channel. Participant and host
     have permitted details. Nonparticipants receive NULL latitude and
     longitude; no public map pins appear until a user joins the LinkUp.
     Test that behavior for guests and signed-in nonparticipants.
   - Important residual risk: event TITLES are free-text and can themselves
     contain exact addresses. Add host safety guidance/moderation if needed.
   - RLS helpers must be audited for escalation, recursion and performance.
     Review ALL live policies/grants before applying. The migration fails
     intentionally if unexpected policies of ANY command are present.
2. **Expired LinkUps — database tests passed in staging.**
   - Shared discovery now queries upcoming events only, including pagination.
   - Verify cards, details, and map do not show past events. Verify 62 historical
     events remain unchanged in DB; 65/3 counts are audit snapshots, not a
     permanent assertion. Use current timestamps and exact time zones.
   - Database insert policy rejects expired joins (verified by SQL-level staging test).
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
- PR #4 is DRAFT and unmerged; `main` remains unchanged.
- Code/design and SQL layer: independent Jaro 2 review PASSED at head e1fe1ed;
  newer documentation/security commits should be re-reviewed independently.
- Migration: applied and tested only in `nyvon-v1-5-staging`, NOT production.
- SQL/RLS checks: passed using synthetic users and transaction-local role
  simulation; real PostgREST login/JWT and WebSocket tests remain open.
- CI: lint and build passed; not equivalent to app/Android functional tests.
- Realtime, Android and staging-connected browser tests: PENDING.
- Account deletion: draft SOP only; permanent completion NOT verified.
- Play V1.5: owner holds publishing and Data safety decisions.
- Launch: NO GO until all staging/API/Realtime/Android, deletion and review
  gates pass, followed by separately authorized production change window.
- See `docs/NYVON_V1_5_STAGING_EVIDENCE_20261119.md`.


## Jaro 2 independent-review findings — response on 2026-11-19
Review result before these revisions: CONDITIONAL PASS / DO NOT MERGE.
- **All RLS policies:** Migration now rejects unexpected SELECT, INSERT,
  UPDATE, DELETE or ALL policies on LinkUp tables. This is a conservative
  allowlist, NOT proof of deployed SQL safety. Inventory current
  pg_policies, grantees, roles, security-definer ownership, and behavior in
  an isolated staging project. The older moderation migration contains a
  blocked-user join safeguard; the new `linkup_join_allowed` SECURITY DEFINER
  must preserve both blocked-user denial and event-time checks under private RLS.
- **History:** `fetchHostedLinkUpHistory` and `HostedLinkUpHistory` provide a
  private, read-only list of 50 most recent past events for signed-in hosts.
  Verify RLS and no access to other hosts' history in staging. Pagination
  beyond 50 remains future work.
- **Host identifiers:** Discovery RPC now returns a host UUID ONLY to the
  host or an already-joined participant. Report submission can resolve host
  from LinkUp ID; block-host uses proposed `block_linkup_host` RPC.
  Review how user_blocks and the existing `my_interaction_block_ids` API
  handle identity disclosure, and test both actions end-to-end.
- **CI:** Repaired PR workflow (no production secrets; synthetic build env).
  CI lint and build need to pass on final branch commit. Vercel's Ready status
  alone does NOT constitute functional or security test evidence.
- **Map privacy:** To avoid a home-address disclosure even at ~11 km granularity,
  nonparticipants receive NULL latitude/longitude. Guests see discovery
  cards without precise pins until a separately approved city-level discovery
  location exists. This is a deliberate visibility trade-off.
- **Additional scope:** profiles, public avatar/photo storage, realtime
  payloads and existing guest titles/descriptions must be audited separately.
- **Release sequencing:** migrate staging → test frontend against staging →
  verify guest and authenticated read/write and realtime behavior → production
  backup → explicit new approval for matching server/client release window.

### Important data-safety clarifications
- Even with a zero-row-update migration, RLS policy and RPC changes are
  production-affecting DDL; never characterize applying them as zero-risk.
- The SQL draft is not a complete security assessment; inspect function owners,
  execution grants, role-specific RLS behavior and all dependent features.
- Do not merge before verifying cross-platform Android app compatibility with
  the new permission model. The public 1.5 Android app may call existing APIs.
- Do not publish Privacy Policy drafts until facts are confirmed; the draft
  is not legal advice and does not establish a deletion process.


## Read-only Supabase connection verification — November 19, 2026
- Connected project: `linkup-prod` ACTIVE_HEALTHY; older `linkup`
  project INACTIVE. Neither was modified or restored.
- Active LinkUp tables report **65 LinkUps** and **142 attendee records**.
  These are a snapshot, not an authorization to export or edit records.
- No existing Supabase development branches were listed for either project.
- Organization plan is **free**; staging cost/availability must be checked
  with Joshua before any project or branch creation. The inactive older
  project is NOT assumed safe to reuse as staging.
- Production metadata inspection confirmed the expected existing policies:
  linkups host-scoped INSERT, UPDATE and DELETE; attendee self-scoped INSERT
  (including blocked-user check) and DELETE; both SELECT-all policies are
  permissive for PUBLIC. It also confirmed the dependency functions
  `users_blocked_either_way(uuid,uuid)` and `my_interaction_block_ids()`,
  plus unique `user_blocks_unique`.
- Important additional finding: anon and authenticated roles currently
  have broader table grants than necessary, including TRUNCATE, REFERENCES,
  and TRIGGER. A new review commit revokes all table privileges from PUBLIC,
  anon and authenticated on the two LinkUp tables, then grants only the
  expected authenticated SELECT/INSERT/UPDATE/DELETE scopes. **This change
  is in proposed SQL on the GitHub draft branch only. No grants were changed
  in production.**
- Staging test matrix MUST verify anon cannot TRUNCATE, REFERENCES,
  TRIGGER or otherwise directly read or mutate either table, and that
  authenticated CRUD still passes host/self RLS and the new RPCs.
- This new security change requires another independent Jaro 2 review.
