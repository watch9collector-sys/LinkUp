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
| HTTP/real-JWT | No actual staging client request has been run in provided evidence | Pending |
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
- Owner must decide: hosted LinkUps on deletion (delete or anonymize),
  an achievable request completion target (30 days was proposed, not
  approved), and narrowly defined moderation/fraud retention categories
  and periods. Legal review may be needed.
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

The first requested user artifact for Play-specific verification remains a
**Publishing overview screenshot** (with any account/personal identifiers
redacted by the owner if preferred). No action on that screen yet.
