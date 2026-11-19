# Nyvon V1.5 — Isolated Supabase staging evidence (2026-11-19)

> **STAGING ONLY · DRAFT · DO NOT MERGE OR DEPLOY**
>
> This document reports SQL-level test evidence only. It does **not** establish
> web/Android compatibility or public-launch approval. All live production,
> Google Play, and main-branch settings were left unchanged.

## Environment and isolation

- Staging project: `nyvon-v1-5-staging` (separate Supabase project, US East).
- Active production project: `linkup-prod`, **read-only catalog inspected**.
- The staging schema was created from non-destructive definitions of the LinkUp
  tables and moderation schema. **The legacy DROP TABLE schema reset script was
  not executed**; real users, emails, locations, and production records were
  not copied into staging.
- Disposable fixtures: four fake Auth users with .invalid email domains,
  three fabricated LinkUps (two upcoming; one historical), four synthetic
  attendees. No login passwords, real emails, personal addresses, or media.
- Runtime test SQL used transaction-local `SET ROLE` and simulated JWT subject
  claims, then `ROLLBACK`. These verify database permission behavior but are
  **not equivalent to HTTP/WebSocket or frontend end-to-end testing**.
- The test database also contains an empty `support_requests` table, an empty
  public `profile-images` bucket matching existing public-avatar behavior,
  and both LinkUp tables included in its `supabase_realtime` publication.
  No existing objects were copied.
- Final fixture counts: **4 test users, 3 LinkUps, 4 attendees, 0 user blocks,
  0 reports, 0 support requests, 0 storage objects**. The counts were unchanged
  by the reviewed privacy migrations and tests.

## Security fixes discovered during staging

1. **SQL parsing:** The draft `block_linkup_host` body contained incorrect
   `AS $` / `$;` delimiters. The pre-apply static check stopped it.
   The review-only migration was corrected to named dollar-quoting, then
   applied successfully on staging.
2. **Legacy table privileges:** Production read-only metadata showed broad
   direct table grants to `anon`, including `TRUNCATE`. The review migration
   now revokes all direct LinkUp table privileges from `PUBLIC`, `anon`,
   and `authenticated`, and regrants only the necessary authenticated CRUD
   permissions under RLS.
3. **Explicit function EXECUTE grants:** Supabase default privileges granted
   `anon` direct EXECUTE on SECURITY DEFINER functions even where
   `REVOKE FROM PUBLIC` existed. This was confirmed with
   `has_function_privilege` and function ACLs, including in production metadata.
   Review migration now explicitly revokes `anon` access to all helper and
   moderation RPCs, leaving only redacted discovery executable by `anon`.
   `users_blocked_either_way(uuid, uuid)` is no longer directly callable by
   anonymous or signed-in users, preventing arbitrary block-pair lookups.
   Its internal use by the privileged discovery RPC was regression-tested.
4. The latest hardening version of the discovery migration was applied a
   second time to **staging only** to confirm the final draft remains
   parseable and idempotent with the allowed policy inventory.

## SQL-level test outcomes

| Test | Result | Evidence/behavior |
|---|---|---|
| Anonymous direct raw LinkUp/attendee SELECT | PASS | No table SELECT privilege |
| Anonymous direct TRUNCATE | PASS | No table TRUNCATE privilege |
| Guest upcoming discovery | PASS | Two synthetic upcoming, no past |
| Guest redaction | PASS | NULL host UUID/coordinates, generic location, blank description, no attendee identities |
| Authenticated nonparticipant redaction | PASS | Same sensitive fields redacted |
| Host access to own private events | PASS | Own upcoming + past visible under RLS |
| Joined participant access | PASS | Own LinkUp details available |
| Cross-user reads | PASS | Nonparticipant cannot read another host's raw events |
| Join upcoming + leave | PASS | Temporary join succeeds; leave clears membership |
| Join past event | PASS | Actual INSERT denied, SQLSTATE 42501 |
| Block host via LinkUp ID | PASS | RPC succeeds; host disappears from discovery |
| Reverse block (host blocks member) | PASS | Actual join INSERT denied, SQLSTATE 42501 |
| Host create, auto-join, edit, delete | PASS | All worked in rollback transaction |
| Unauthorized edit/delete | PASS | Both affected zero rows |
| Report from redacted event | PASS | Host resolved internally, report attributed to member |
| Preservation of fixture data | PASS | Three events and four attendees unchanged |
| Function grants after hardening | PASS | Only `fetch_safe_linkups` callable by `anon` from tested privileged functions |

Supabase Security Advisor after privilege hardening flags only the intentionally
anonymous redacted discovery function; authenticated SECURITY DEFINER functions
need independent threat-model review. It also flags legacy trigger search-path
configuration and staging's leaked-password-protection setting. See
https://supabase.com/docs/guides/database/database-linter for context.

## Adjacent read-only production catalog observations

- `profiles` is not a public table; there is a public `profile-images`
  bucket for avatars/banners. This may be intended, but storage object paths
  and public-media privacy require a dedicated review.
- `supabase_realtime` publishes `linkups`, `linkup_attendees`, and
  `support_requests` in production. RLS should be tested with real
  anonymous and authenticated WebSocket clients; no runtime test has happened.
- Existing `support_requests` policies are insert-only for clients; a
  staged request was recorded successfully.
- **Deletion gap verified:** Deleting a synthetic Auth user in a rolled-back
  staging transaction set `support_requests.user_id` to NULL but left the
  support request row and its email address intact. Permanent deletion is not
  fulfilled by Auth deletion alone; a separate deletion SOP and end-to-end
  workflow remain REQUIRED.
- Do not interpret the production metadata read as authorization to change
  live RLS, grants, functions, Auth users, data or media.

## Hard gates still open

1. Jaro 2 independent re-review **of the latest SQL**, including explicit
   role-level function grants and existing helper-function dependencies.
2. Real staging HTTP API tests with actual disposable Auth sessions, in
   addition to simulated SQL/JWT role testing.
3. Actual anonymous and signed-in Realtime WebSocket subscriber tests.
4. Fully separate Vercel preview using **staging-only** settings; web
   guest/member/host tests and all legal/footer links. Do not modify
   production Vercel environment variables.
5. Profile/storage object privacy audit and test of uploading/deleting
   synthetic public avatars/banners.
6. Android/TWA/Capacitor compatibility against staging if a test build can
   be configured without changing the production app.
7. Permanent account deletion SOP, retention decision, secure server-side
   execution, confirmation, and end-to-end test.
8. Google Play Data safety reconciliation and remaining Play Console
   publication decisions remain user-approved, separate steps.
9. Explicit owner approval for a production backup/migration/web deployment
   window after all preceding applicable tests pass.

**No production changes, no merging and no publishing were done.**


## Independent-review follow-up (same staging project; 2026-11-19)

A separate SQL-level check explicitly verified host-history row isolation:
`host-a` can read the synthetic `Staging A past` event; `host-b`
receives zero rows for that host's past event. These are **SQL-role** tests,
not the still-required actual PostgREST host-history requests.

**Correction to reviewer interpretation:** The deployed staging
`submit_user_report` implementation has NO check that prevents reporting
a host after that host is blocked. The actual transaction tested:
1. Synthetic member B blocked synthetic host A using `block_linkup_host`;
2. The host's event disappeared from member B's discovery results;
3. `submit_user_report('safety_concern', ..., NULL, linkup_id)` nevertheless
   succeeded, storing a report linked to the correct host.
All changes were rolled back. Thus **block-then-report is allowed**, not
denied; do not claim a blocked-user report rejection passed without a
separate explicit requirement and approved test. Allowing reports after
blocking may be desirable for safety/escalation. Do not change this
behavior or the live MVP solely based on a mistaken test expectation.

Jaro 2's note about the SQL function dollar quotes was checked against the
actual evidence: this document already says **named dollar-quoting**, and the
committed SQL uses `$block_linkup_host$`. No wording change was needed.

Remaining evidence gap: API/HTTP with real JWTs, Realtime WebSocket with
real subscribers, staging-specific frontend deployment, Android smoke tests,
and the full deletion process are still **NOT tested**. Schema/RLS simulation
cannot substitute for these checks.
