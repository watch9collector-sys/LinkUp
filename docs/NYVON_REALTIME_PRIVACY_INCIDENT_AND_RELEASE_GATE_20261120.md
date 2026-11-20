# NYVON V1.5 — Critical Realtime privacy finding and production cutover gate
**Date:** 2026-11-20, America/Denver | **Status:** STAGING MITIGATED / PRODUCTION NOT CHANGED / PUBLIC RELEASE NO-GO

## Evidence (do not confuse schema inspection with client tests)
1. A real unauthenticated Supabase JS client connected to the isolated staging project's Postgres Changes channel for `public.linkups` and `public.linkup_attendees`. Using only the **staging anonymous/public key** and no user password or JWT, it reached `SUBSCRIBED`.
2. While the guest listened, staging-only mutations generated one LinkUp UPDATE and one attendee INSERT event. The guest listener recorded `linkups.UPDATE=1` and `attendees.INSERT=1`. It deliberately logged only event types and counts, not private payloads. This is a demonstrated unexpected Realtime notification and potential disclosure; **the payload fields were not captured**, so don't claim they were read.
3. An independent staging PostgREST anonymous suite had already passed: direct raw table SELECT and privileged RPC access was denied and public discovery was redacted. Thus **HTTP RLS tests alone did not establish Realtime event privacy**.
4. Staging mitigation: `ALTER PUBLICATION supabase_realtime DROP TABLE public.linkups, public.linkup_attendees;` was executed only on staging project `kxwechptoaituppkmcjr`. Readback showed no tables in that publication. A fresh anonymous guest subscribed successfully, and during equivalent staging-only event UPDATE and attendee INSERT/DELETE probes saw `linkups=0`, `attendees=0`. All synthetic modifications were cleaned up and the original event description restored.
5. **Production read-only schema inspection only**, project `zijrcnzjdafndjdpltst`: `linkups`, `linkup_attendees`, and `support_requests` are present in `supabase_realtime`. Production policies `linkups_select_all` and `linkup_attendees_select_all` use `TO PUBLIC USING (true)`, and anon has SELECT grants for both. These conditions allow direct raw guest reads under current policy. Support requests has INSERT-only RLS policies, no SELECT policy, but is replicated; actual guest support-request payload exposure was **not** tested. Do not claim that customer support messages were observed.
6. No production SQL, Auth, Vercel, app stores or real customer rows were modified by this review.

## Changes in review branch
- `src/lib/userDisplay.ts` no longer infers a public name from the account email's local-part: unnamed users are called `Member`.
- Staging-only SQL normalized 5 synthetic LinkUp host labels and 5 synthetic attendee labels derived from email local-parts. Readback: zero remaining such matching labels, with all 5 LinkUps and 6 attendee records preserved.
- `src/hooks/useLinkUpsFeed.ts`: replaced raw `postgres_changes` table subscriptions with access-controlled `fetch_safe_linkups` refresh every 30 seconds while the page is visible, plus focus/visibility refresh. User-initiated join/leave/create/delete already refetch. Polling reduces immediate cross-user freshness and may add API traffic; monitor before rollout.
- `scripts/qa/verify-staging-realtime-privacy.mjs`: updated to fail if **any** raw private table events reach host/member/outsider/guest during deliberate changes; a broad unfiltered guest probe is included.
- Prior review draft PR #4 must remain unmerged until coordinated sign-off. Preview testing does not imply production compatibility.

## Safe coordinated PRODUCTION remediation — NOT AUTHORIZED OR EXECUTED
**1. Confirm compatibility.** Inventory all old Android/Web clients using direct `linkups` or `linkup_attendees` queries. Verify the staged web frontend using the `fetch_safe_linkups` redacted RPC, Host history, joining, leaving, blocking, reporting, precise location gating and app links on physical Android. Old clients may break if RLS policies are tightened.
**2. Prepare private database migration and change order.** Database changes must be deployed in lockstep with a frontend that can use safe discovery. Immediately before or during that controlled cutover, remove `linkups`, `linkup_attendees` and `support_requests` from the `supabase_realtime` publication, *conditionally when present*, and verify readback. Do not rely on UI-side filtering. The existing review-branch migrations have stronger authenticated/guest table privileges and RLS restrictions, but require coordinated old-client compatibility testing.
**3. Sanitize legacy snapshots with narrow predicates.** A backfill can update stored `host_display_name` / `display_name` to `Member` only where they exactly equal the corresponding user's email local-part and both full/display-name user metadata are blank; preserve intentional chosen usernames and unrelated records. Preview affected counts and keep a protected rollback snapshot before any production update.
**4. Verify after cutover.** Guest direct REST must be unable to read raw event coordinates, descriptions, attendee identity, host IDs or support PII; safe discovery must preserve redaction. Guest Realtime must receive zero raw events under UPDATE/INSERT/DELETE probes. Signed-in Host/Member/Outsider must have correct row authorization, and client events must still work via explicit refresh. Check stale sessions, blocks, moderation, hosted history, Android links and errors.
**5. Fail closed.** If the safe frontend fails, do not roll back database privacy restrictions to public-read policies. Keep the data closed, restore service with a compatible frontend, and notify affected users as needed. Monitor runtime errors and abnormal API load.
**6. Obtain final approval.** No live backend restriction, client deployment or Google Play publication until owner explicitly approves the exact production change plan and release checks pass.

## Additional separate release blockers
- Fully authenticated client JWT / Member / Host / Outsider REST tests and deletion-with-media/session/PII rehearsal remain unverified.
- Public privacy policy, PostHog analytics, Android permission/signing compatibility, Data safety and Play Console status remain unreconciled.
- Supabase staging security advisor flags nine signed-in-callable security-definer functions, one intentional public safe discovery function, and leaked-password protection disabled; review each intentionally and never turn off safeguards merely to silence a linter.
- A 30-second poll is a temporary alternative, not proven full-scale architecture. If real-time UX is required, implement authorized private Realtime Broadcast topics or another server-authorized delivery system and independently test it.
- Public launch remains **NO-GO**.

## Source references
- https://supabase.com/docs/guides/realtime/postgres-changes
- https://supabase.com/docs/guides/realtime/authorization
- https://github.com/watch9collector-sys/LinkUp/pull/4
- https://support.google.com/googleplay/android-developer/answer/10144311

**Data handling:** No real user content, personal event details, JWTs, passwords, keys, or confirmation tokens are logged or reproduced here.
