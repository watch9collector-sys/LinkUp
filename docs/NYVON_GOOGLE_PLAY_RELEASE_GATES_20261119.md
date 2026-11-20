# NYVON — Google Play release gates (2026-11-19)
**DRAFT / REVIEW ONLY — DO NOT MERGE, DEPLOY, CHANGE PRODUCTION OR PUBLISH**

## Owner's scope
Preserve Nyvon's established identity, branding, live MVP features, accounts,
data and `nyvon.app`. The owner has authorized **isolated staging testing and
draft code/documentation review**, not production changes or public publishing.
If a necessary safety fix changes backend behavior, show the user the exact
impact and obtain separate explicit approval before production migration/web
deployment. Never treat "full advancement" as final publishing authorization.

## Verified state

| Gate | Evidence | Status |
|---|---|---|
| Google Play production access | Google Play confirmation email dated Aug 17, 2026 for `com.jwashburn.linkup` | Approved historically |
| Live web MVP | Public `https://nyvon.app` loads | Live; preserve |
| Privacy URL | `https://nyvon.app/privacy` loads | Accessible; content review needed |
| Deletion URL | `https://nyvon.app/delete-account` loads | Accessible; **fulfillment not verified** |
| Android App Links | `/.well-known/assetlinks.json` publicly accessible; includes package `com.jwashburn.linkup` and one SHA-256 fingerprint | File exists; compare fingerprint against Play App Signing certificate |
| Public Play listing | `https://play.google.com/store/apps/details?id=com.jwashburn.linkup` returned 404 to public check | Not verified as public |
| Isolated staging | Supabase `nyvon-v1-5-staging` `ACTIVE_HEALTHY`; synthetic data only | Created |
| SQL privacy safeguards | Jaro 2 independent review + staging RLS/permissions regression checks | Passed SQL layer |
| HTTP anonymous | Five REAL staging REST calls over HTTPS: discovery 200, direct raw reads and privileged helper calls 401 | **Guest checks passed** |\n| HTTP/real-JWT | No real signed-in JWT tests completed | Pending |
| Realtime WebSocket | Tables in publication, no guest/nonmember subscriber traffic tests | Pending |
| Android bundle details | Android native source/AAB absent from connected GitHub repo | Need Console/AAB inspection |
| Release pipeline | PR #4 unmerged; no production migration or deployment | Held intentionally |

## Checklist before any launch approval

### A. Google Play Console (read-only first)
- Open Nyvon → Publishing overview and inspect each pending change:
  Production release versionName/versionCode, countries, release notes,
  rollout percentage, and status. **Do not click Publish.**
- Verify `com.jwashburn.linkup` is the existing package, not a new app.
- Verify the uploaded AAB targets Android API **36+** for new normal Android
  apps/updates, per current Google Play policy.
- Under App signing, compare the Play **app signing certificate** SHA-256
  against the live `assetlinks.json` fingerprint. Do not confuse upload
  certificate with the Play app signing certificate.
- Check actual upload-key availability and signing continuity before any new
  Android upload; reset a key ONLY if confirmed necessary. Never ask for a
  keystore password or signing private key in chat.
- Check current Android developer verification, trader status, app content,
  Data safety, target audience, account deletion, content rating, store
  graphics, and policy alerts. Developer email reminders are not proof
  account status is incomplete.

### B. Privacy and backend (isolated staging)
- Keep `fetch_safe_linkups` callable by anonymous guests; this is the
  intentionally public, redacted discovery RPC, subject to final owner
  acknowledgment and threat-model review.
- **Execute**, do not merely syntax-check,
  `scripts/qa/verify-staging-anon-http.mjs` with ephemeral
  staging-only environment variables and no production credentials.
- Test real Auth sessions for nonmember/member/host/founder on REST, including
  raw direct table reads, joins, blocks, reports, host history and error cases.
- Test actual Realtime websocket subscriptions as guest, nonmember and
  member, verifying no sensitive event or attendee payload leak.
- Run the complete website preview against staging-only configuration; no
  production Vercel environment edits. Verify sign-up/login, password reset,
  host/join/leave, safety tools, links, maps, mobile usability and history.
- Inspect exact old-Android-client calls. Main currently fetches raw
  `linkups` with attendee joins; the staged SQL blocks those reads
  for guests and nonparticipants. **Do not apply the staged database
  policy to production until compatible web/Android behavior is verified
  and coordinated**, or the live MVP may break.
- Review public event titles (which can themselves include an address),
  public avatar/banner storage, and Realtime exposure.

### C. Account deletion
- Existing app takes a manual deletion request; deletion itself is not
  demonstrably completed. The staging proof also confirmed a support
  request's email survives simply deleting its Auth user.
- Owner approved **staging-only testing** for deleting departing hosts'
  LinkUps and aiming to complete verified requests within **30 calendar days**.
  Retention is limited in principle to necessary moderation/fraud records,
  but **exact categories, time periods and lawful reasons remain unapproved**.
  These are NOT production or published policy approvals.
- Complete identity verification, secure admin procedure, all data/storage
  cleanup and user notification in the draft SOP; execute it with an
  independent disposable staging account (including photos, hosted events,
  attendance, reports and blocks). Audit all retained records.
- Reconcile Data safety and privacy wording to real, proven capabilities.
  Do not mark a declaration true based only on the presence of a request form.

### D. Device and release gate
- On an actual Android device, test install, launch, account sign-in/out,
  session persistence, password reset, profile photo, Create/Join/Leave,
  event map/location visibility, host history, report/block, and delete
  request. Test same package/signing path against existing installs.
- Check Android App Links fingerprint, target SDK, file-upload permissions,
  browser session behavior, deep links and back navigation.
- Obtain fresh independent review of **completed** HTTP, Realtime, web,
  Android and deletion evidence.
- Only with all checks passing: present precise production change plan
  (backup, migration, compatible web deployment, smoke tests, rollback
  preserving privacy), obtain separate explicit user approval.
- Publish the checked Play release only after separate final approval.

## What may be done without changing the existing app
- Review public pages, source, signing/documentation, Play screenshots and
  existing Console configuration, run isolated staging tests, revise
  **unmerged** review docs and test code.
- Do **not** update Play Console settings, production Supabase, active
  Vercel environments, production code or Google Play publication.
- Existing user-facing design can stay unchanged; completing privacy or
  deletion requirements may nevertheless require **minimal technical
  fixes** after staging proof and explicit owner authorization.

## Primary policy references (current 2026 guidance)
- Google Play target API: https://support.google.com/googleplay/android-developer/answer/11926878
- Account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- User data requirements: https://support.google.com/googleplay/android-developer/answer/10144311
- Play App Signing: https://support.google.com/googleplay/android-developer/answer/9842756
- Publishing overview: https://support.google.com/googleplay/android-developer/answer/9859348

## Subsequent Play Console screenshots supplied by owner

- **Publishing overview:** Managed publishing ON; four changes ready to
  publish, including `Nyvon V1.5 - Production`, US country availability,
  privacy policy and Data safety. **Do not click Publish.**
- **Production release page:** `Ready to publish`; version code **16**
  (versionName **1.5**), target SDK **36**, device minimum API **24+**.
  These values were read from the owner's Console screenshots; they do NOT
  prove device runtime correctness.
- **App signing:** Play App Signing shown as enabled; the owner identified
  the supplied SHA-256 as the **app signing certificate** rather than upload
  certificate. A fingerprint matching the live assetlinks entry was in
  previously supplied notes; retain certificate verification in the release
  checklist until independently copied directly from the Console.
- **Trader status:** A blue "Declare your trader status" banner remains
  visible; verify account status and business/region declaration before
  submission. Never assume that a banner establishes the final account status.
- **Next owner action:** Provide the Play Console current Data safety
  declaration details and App content status, without saving/publishing,
  and an actual Android install/smoke-test result.

## Newly completed staging API checks

Read `docs/NYVON_V1_5_STAGING_EVIDENCE_20261119.md` for HTTP status
and payload results. Five anonymous network API tests passed and the
temporary database HTTP extension was removed afterward. The existing
synthetic data is unchanged. The **real signed-in JWT, Realtime, website
preview, Android and account-deletion gates remain unverified**, therefore
the app is still NO-GO for publication.

No Play Console, production Supabase, production Vercel, or main-branch
changes were made by this audit.

## Staging-only deletion rehearsal follow-up

A rollback SQL test on the synthetic host account passed 8 cleanup and
non-target-isolation assertions: Auth user, hosted events, attendance, blocks,
reports and support requests removed, while the unrelated host and events
remained. No data changes were committed. This is not an end-to-end test of
real authentication, media bytes, verified identity, admin APIs or backups.
The deletion SOP remains non-executable pending the complete staging flow;
Google Play Data safety declarations have **not** been changed or verified.


## Latest staged physical-device/browser and deletion evidence (2026-11-19)

- Owner confirmed Google Play Internal Testing installation on an Android
  phone, with displayed navigation and successful deletion **request** flow.
  Internal versionCode itself was not independently checked on the device.
- Browser staging Vercel preview was configured with two encrypted
  branch-scoped Supabase variables and a separate Preview deployment.
  The owner signed in to a fresh staging test account on iPhone and
  created a test LinkUp. SQL independently verified that test LinkUp
  exists in **staging**, demonstrating actual preview writes went to
  isolated staging, not the production database.
- Owner submitted `delete_account` request through that preview,
  and staging SQL independently confirmed it was account-linked.
- **With separate explicit owner approval**, only that disposable
  account and its associated records were permanently deleted
  from staging. An independent post-commit SQL query verified
  zero target Auth, identities, sessions, LinkUps, attendance, and
  support requests, while four other staging users, three unrelated
  LinkUps and four attendee fixtures were preserved.
- No uploaded avatar/banner objects existed for the deleted account,
  so **actual media deletion remains untested**. Signed-in Realtime
  WebSocket privacy, a fresh sign-in rejection test, full admin deletion
  workflow, retry/notification/backup handling and detailed Data safety
  declaration alignment also remain open.

**Current decision: NO-GO for Google Play publication** until those
remaining gates pass. Do not merge the review PR or modify live
Supabase/Vercel and Play settings without separate owner authorization.


## Latest security hardening and Google Play Data safety audit (2026-11-19)

**Read-only PRODUCTION check:** `linkup-prod` still grants
`TRUNCATE` and `TRIGGER` on LinkUps, attendees and support
requests to both normal app roles. The `authenticated` role also
has these powers on blocks and reports. RLS does not restrict
`TRUNCATE`. These privileges do not establish an exploitable HTTP
route by themselves, but they are unnecessary. Six SECURITY DEFINER
RPCs also have direct anon EXECUTE grants according to Supabase's
security advisor. **No production permissions changed**.

**STAGING fixes implemented, data preserved:**
- `20261119130000_fix_linkups_updated_at_search_path.sql` fixes the
  timestamp trigger's mutable `search_path`; the advisor warning
  disappeared from staging.
- `20261119140000_strip_unsafe_client_table_privileges.sql`
  revokes TRUNCATE/TRIGGER/REFERENCES from anon and authenticated
  on five Nyvon app-data tables. PostgreSQL privilege queries confirm
  all three are now denied; rolled-back tests still successfully
  inserted guest contact requests and host-created LinkUps.
- Other staged privacy/RLS protections from the previous migration
  remain in place. The temporary test database has exactly four
  original synthetic users, three synthetic LinkUps, four attendee
  fixtures, zero profile-image files and zero support requests.

**Review-branch code/doc prep:**
- `src/lib/analytics.ts` no longer forwards entire URLs or
  `invite_code` to PostHog. Isolated staging analytics are disabled
  to avoid polluting live telemetry. Not deployed to production.
- The draft `app/privacy/page.tsx` discloses PostHog analytics;
  the currently live `nyvon.app/privacy` is an older, shorter document.
- New real-media and Realtime QA test scripts were created and
  syntax-checked by CI; **not yet run with signed-in staging users**.
- `docs/NYVON_PLAY_DATA_SAFETY_RECONCILIATION_20261119.md`
  maps code data flows against unverified Console answers.
- `docs/NYVON_PRODUCTION_SECURITY_HARDENING_ROLLOUT_20261119.md`
  identifies a minimal permissions-only first deployment and a later
  coordinated web/RLS cutover; both require explicit approval.

**Verified public URLs:** `https://nyvon.app/delete-account` and
`https://nyvon.app/privacy` load; `/.well-known/assetlinks.json`
associates `com.jwashburn.linkup` with the previously provided
certificate fingerprint. Google Play policy requires API 36 for
new normal apps/updates as of August 31, 2026; the owner's V1.5
Console screenshot showed target SDK 36 and versionCode 16.

**Still NO-GO:** no real uploaded media byte deletion test; no signed-in
WebSocket privacy trace; no production-capable deletion/retention
workflow or complete Play Console Data safety review. Production
security grants remain broader than intended.

No production Supabase, live web, Google Play Console, GitHub main
branch, or real user account changes were made by this review.
