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


## Live staging HTTPS REST verification — new evidence (2026-11-19)

These requests traversed the actual Supabase API gateway and PostgREST over
HTTPS, using **only the staging project's anonymous publishable access
credential**. Requests were initiated from a temporary, permission-isolated
staging PostgreSQL `http` extension. This is an actual network API test, not
`SET ROLE` SQL simulation. No credentials were committed to GitHub.

| Anonymous HTTPS request | Observed response | Gate |
|---|---|---|
| `GET /rest/v1/rpc/fetch_safe_linkups` | HTTP **200**, two synthetic upcoming events; sensitive fields redacted | PASS |
| `GET /rest/v1/linkups?select=id&limit=1` | HTTP **401**, SQLSTATE `42501` permission denied | PASS |
| `GET /rest/v1/linkup_attendees?select=id&limit=1` | HTTP **401**, SQLSTATE `42501` permission denied | PASS |
| `GET /rest/v1/rpc/is_platform_founder` | HTTP **401**, SQLSTATE `42501` permission denied | PASS |
| `GET /rest/v1/rpc/my_interaction_block_ids` | HTTP **401**, SQLSTATE `42501` permission denied | PASS |

The discovery response revealed **no host UUID, raw latitude/longitude,
private location, description or attendee identity** for the synthetic
events; the historical fixture did not appear. The location was replaced
with "Location shared with attendees" and attendee identities were `[]`.

Cleanup verified: the temporary `http` extension and its
`staging_http_qa` schema were both **removed**. Final counts remain:
four .invalid test users, three LinkUps, four attendee records, zero reports,
zero support requests. Production was not touched.

**NOT TESTED / NOT PASSED:** real authenticated signup/JWT REST behavior
(nonparticipant, member, host and founder); all write RPCs over HTTP;
Realtime WebSockets; staging browser preview; Android app/device test;
end-to-end permanent account deletion. Do not overstate coverage.

The source-only `scripts/qa/verify-staging-anon-http.mjs` test harness
passed a CI syntax check, but the harness itself has not been executed.
The five HTTPS checks above were performed directly by the connector,
not by the test harness.


## Approved staging deletion-rules rehearsal (2026-11-19)

Owner authorization **for staging only**: delete hosted LinkUps with the
account, aim for verified request completion within 30 calendar days, and
retain only essential safety/fraud records under a separately defined
retention policy. No final retention period has been approved.

A rolled-back SQL transaction on an existing `.invalid` synthetic host
verified the proposed explicit cleanup path:

| Scoped database assertion | Result |
|---|---|
| Target `auth.users` row absent after cleanup | PASS |
| Target host's upcoming and past LinkUps absent | PASS |
| Target attendee memberships absent | PASS |
| Account-linked support request (including email) absent | PASS |
| Synthetic reports removed in no-retention-hold test | PASS |
| Synthetic bilateral block records absent | PASS |
| Other synthetic host's LinkUps unchanged | PASS |
| Other synthetic host's Auth account intact | PASS |

**No test records were permanently changed:** `ROLLBACK` restored
four synthetic users, three LinkUps and four attendee records. The test
proves SQL order/cascade effects only. Unverified: real Auth Admin API,
storage object bytes, user authentication/verification, retries, session
revocation, deletion confirmation, external processors/backups and a
complete moderation-retention policy. It is not lawful evidence that a
real account has been permanently deleted.

The public Play Data safety account-deletion declaration must not be
treated as verified by this SQL rehearsal alone.


## Staging Realtime publication and storage policy inspection (2026-11-19)

Read-only inspection of `pg_publication_tables` showed that staging
`supabase_realtime` publishes **only** `public.linkups` and
`public.linkup_attendees`. Both publications include raw columns
(`linkups.host_id`, exact `location`, `latitude`, `longitude`,
`description`, and `linkup_attendees.user_id`). Therefore, maintaining
per-record access rules is mandatory. The existence of these fields in the
publication **does not by itself prove a privacy leak**: Realtime Postgres
Changes must be tested under real subscriber JWTs to confirm RLS
enforcement and client behavior.

`public.support_requests` is **not** in `supabase_realtime`, which
reduces one broadcast exposure surface. `pg_policies` inspection also
showed no client SELECT policy for support requests; authenticated
participants/hosts have row-scoped SELECT policies for LinkUps and
attendee rows. This is a **static configuration check only**. Do not claim
a WebSocket stream passed until a real anonymous/nonparticipant/member/
host test has shown the correct subscription event visibility.

The `profile-images` storage object policy permits public reads and
user-scoped writes under `avatars/<user_id>/` and
`banners/<user_id>/`. No real storage-object deletion was executed
or confirmed; the required staging Auth + Storage API end-to-end deletion
test remains pending.


## Vercel team access and branch-scoped isolated preview (2026-11-19)

The owner granted Vercel team access and the project `nyvon`
(`prj_uzHZuRbK74gaq340dkPgkiDIqt10`) was confirmed connected to
`watch9collector-sys/LinkUp`, with `nyvon.app` and
`www.nyvon.app` attached as live custom domains.

**Important discovery:** the original two
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
Vercel variables targeted **both production and preview**. Those
existing variables were NOT changed or deleted; their protected values
were unavailable to inspection. Do not use any older preview for
staging account or deletion tests.

**Staging isolation prepared:** two distinct encrypted variable
overrides of those exact names were added, restricted to
`target=preview` and Git branch
`review/nyvon-v1-5-launch-safeguards-20261119` only. The new values
are the isolated Supabase project URL `kxwechptoaituppkmcjr` and its
public anonymous client key; secrets/keys were not committed to GitHub.
Production variable definitions and `main` remain untouched.

A separate **preview** deployment was deliberately created from commit
`eac12eee4aeafc4fce6e19d080fd3dc6d85d7b3f`:
- Deployment id: `dpl_DqqBJHaCmw5pGCaND1dvWkN7UNWF`.
- Hostname: `nyvon-ecikon8dh-watch9collector-5462s-projects.vercel.app`.
- Vercel state: **READY**; target is Preview, not Production.
- Vercel access protection is on; an unauthenticated request to the
  preview returned `login_required`. This is not a frontend
  functionality check.
- **Outstanding validation:** the actual client bundle has NOT yet
  been independently inspected to prove the staging Supabase ref was
  embedded; the signed-in website and Auth/Realtime/Storage browser
  testing have NOT run. Never claim the preview is confirmed
  production-safe for write tests until runtime config and client access
  are confirmed.

No production Vercel deployment, custom domains, production env
variables, production database, or Google Play releases were changed.


## Real staging account deletion execution — PASS, with defined remaining gaps

The owner gave **explicit approval** to permanently delete the particular
disposable staging account after successfully submitting its request from
the authenticated staging Vercel preview. The submitted deletion request was
independently verified in staging as account-linked and email-verified.

**Preflight scope:** exactly one disposable Auth user, one hosted LinkUp,
one self-attendance record (the only attendance on the hosted LinkUp), one
support request, and **zero** profile-image objects, user reports, blocks,
moderation-audit records, or founder assignments. Staging held five Auth
accounts and four LinkUps total.

A single transactional **staging-only** SQL cleanup checked exact test
account ID, email, deletion request, media absence, affected-row counts and
total-fixture counts before making changes. It explicitly removed the
account-linked support request (to prevent email PII surviving `SET NULL`)
then deleted the verified Auth user, allowing the existing foreign-key
cascades to remove their hosted LinkUp, attendee record, identity and
sessions. Assertions ran before `COMMIT`; any exception would have
rolled back the full transaction.

**Independent post-commit database query confirmed:**

| Item | Remaining records |
|---|---:|
| Target Auth user | 0 |
| Target Auth identities | 0 |
| Target Auth sessions | 0 |
| Target hosted LinkUps | 0 |
| Target attendee rows | 0 |
| Target support requests (including matching email) | 0 |
| Target profile image objects | 0 (none existed before cleanup) |
| Other staging synthetic users | 4, unchanged |
| Other LinkUps | 3, unchanged |
| Remaining attendance fixtures | 4, unchanged |

No live production operations, Play publication, merges, or live-domain
changes occurred. This **proves persistent removal of this one human-created
staging account and relational data**. It does **not** prove uploaded
Storage object byte removal (no uploaded objects existed), Auth Admin
API behavior (SQL deletion was used), old JWT expiration/revocation in
the browser, emailed requester confirmation, external processor/backups
cleanup, or complete moderation-retention policy. The owner should still
attempt password sign-in from a **fresh session** and confirm failure.

This is a staging-only accomplishment, **not** authorization to deploy a
production deletion flow or declare full Google Play account-deletion
compliance. Retest the production-capable deletion workflow with a
synthetic uploaded avatar, a partially failing cleanup, and complete
operator audit before launch.
