# Nyvon V1.5 — Staging QA execution report
**Execution: 2026-11-19 America/Denver (2026-11-20 UTC).**

## Safety boundary
- Isolated Supabase project: `nyvon-v1-5-staging` (`kxwechptoaituppkmcjr`).
- Vercel preview branch: `review/nyvon-v1-5-launch-safeguards-20261119`.
- No production database, `nyvon.app`, Play Console, or live customer data was modified.
- Temporary test environment had outbound network access restricted to staging Supabase, source/package services and Google Fonts. No production Supabase host allowed.

## Checks with verified PASS
1. **Staging database RLS, read-only preflight:** Both `linkups` and `linkup_attendees` have RLS enabled; public `support_requests` RLS enabled. Only the two LinkUp tables are in `supabase_realtime`; `support_requests` is not.
2. **Role privilege check:** `anon` has no direct SELECT privilege on raw LinkUps or attendee tables; `authenticated` retains needed SELECT/INSERT privileges.
3. **Four database-role simulations:** Scoped to an explicit transaction and ROLLBACK (no data changes):
   - Host A reads own upcoming LinkUp, cannot read Host B's.
   - Member A reads joined LinkUp and own attendee record, not Host B's.
   - Unrelated Member B cannot read either host's private LinkUps or attendees.
   - Guest lacks raw SELECT privileges.
   These tests verify RLS SQL behavior only; they are **NOT** real JWT or WebSocket tests.
4. **Staging Storage policy inspection:** `profile-images` restricts INSERT/UPDATE/DELETE to the current user's avatar/banner prefixes. Public read is intentional; physical media lifecycle still untested.
5. **Vercel authorized preview fetch:** HTTP 200 and Next.js HTML successfully returned using the Vercel connector. Regular browser without Vercel sign-in gets authentication wall; access protection remains ON.
6. **Isolated source tests:** `npm ci` passed; `node --check` passed for anon HTTP, photo lifecycle and Realtime scripts; `npm run lint` passed.
7. **Isolated Next.js build:** `npm run build` completed successfully using a deliberately synthetic UNUSABLE JWT whose `ref` matches staging solely for the build-time project-ref check; 21/21 static pages generated. This is not evidence of actual API authentication.

## Real end-to-end tests STILL PENDING — NOT PASSED
- Creating three real disposable Auth signups and confirming email/session flow.
- Authenticated staging REST access under real client JWTs.
- Avatar/banner upload, download, delete and post-delete readback through Storage API.
- Simultaneous Realtime WebSocket tests for host, member, outsider and guest, including attendee identity leaks.
- Guest HTTP REST calls from the new runner, and full Android smoke test.

**Blockers encountered:** Browser-driven preview is protected by Vercel sign-in; the attempted method for securely injecting staging credentials into a remote test runner was blocked by environment safety checks. Do not bypass protection or put keys/passwords into GitHub or a public endpoint. The existing QA scripts remain ready for local execution with credentials entered by the owner directly in a secure terminal.

## Post-run unchanged inventory
- Auth users: **4**
- LinkUps: **3**
- Attendee records: **4**
- Stored objects: **0**
- New QA sign-up accounts: **0**

## Next safe execution
Owner signs into protected Vercel preview, creates three disposable staging accounts with reachable inboxes, then on their local computer runs `bash scripts/qa/run-staging-e2e.sh` and enters staging publishable key and disposable user credentials directly into that local terminal. Tests have staging-only project-ref guards. Review sanitized PASS/FAIL output and object cleanup before any production release decision.

**Release gate:** NO GO. No Play publication authorized or performed.
