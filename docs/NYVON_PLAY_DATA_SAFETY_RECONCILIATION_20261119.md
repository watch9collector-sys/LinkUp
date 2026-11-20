# Nyvon V1.5 — Google Play Data safety & privacy reconciliation
**Review branch only · 2026-11-19 · NOT a completed Console declaration**

## Checked sources
- Current live https://nyvon.app/privacy and https://nyvon.app/delete-account (read-only fetch)
- Current live https://nyvon.app/.well-known/assetlinks.json
- Review branch app/privacy/page.tsx and app/delete-account/page.tsx
- Code: src/lib/analytics.ts, src/lib/geocode.ts, src/lib/storage.ts,
  src/lib/supportApi.ts, src/lib/linkupsApi.ts, app/profile/edit/EditProfileForm.tsx
- Staging DB policies, sample records and verified disposable-account deletion
- Google Play policies: https://support.google.com/googleplay/android-developer/answer/10144311
  https://support.google.com/googleplay/android-developer/answer/10787469
  https://support.google.com/googleplay/android-developer/answer/13327111

## Confirmed app data flows and policy questions

| Data/practice | Code evidence | Console Data safety reconciliation |
|---|---|---|
| Account email/authentication | Supabase Auth and password-based sessions | Review personal info and account identifiers. Never claim app stores raw passwords. |
| Profile name, display name, bio | Auth user metadata / EditProfileForm | Review personal info, public profile and optionality. |
| Avatar/banner | Public `profile-images` Supabase bucket | Review photos/files. Public URL and deletion need disclosure; physical deletion remains untested. |
| Event titles, descriptions, categories and time | `linkups` | Review user-generated content / app activity disclosure. Titles remain public and can accidentally include addresses. |
| Event location and coordinates | `linkups.latitude`, `longitude`, `location`; Nominatim geocode | Review location collection and precise vs approximate classification with actual app behavior. Staging privacy RPC redacts details for nonparticipants. |
| Hosting, joining, attendance | `linkup_attendees` and event activity | Review app interactions and social connections/participation. |
| Support and deletion requests | `support_requests`, includes name/email/message | Review personal info and message data, and deletion handling. |
| Blocks, safety reports, moderation | `user_blocks`, `user_reports`, `moderation_audit_log` | Review safety/content categories and disclosed retention exceptions. |
| Product-usage analytics | `src/lib/analytics.ts` transmits `distinct_id`, event name, page path, parameters, timestamp and properties to **PostHog** | Review analytics, app interactions and identifiers, whether classified collected/shared. Test client runtime for actual events. |
| Maps, location search | OpenStreetMap Nominatim and OpenStreetMap tile requests from clients | Review external processors and what search/location/network metadata leaves device. |
| Technical service logs | Supabase/Vercel | Confirm what is retained and for how long with current provider configurations. |

**Do not guess the exact Play Console selections** without reviewing the
live AAB, current Data safety questionnaire, third-party SDK declarations,
actual data transport and provider retention. This is an evidence
inventory, NOT a submitted Data safety form.

## Important live policy mismatch

The **current public** `/privacy` page describes location features as
approximate/demo, and gives a brief list of collected data and deletion
contact. Review-branch `app/privacy/page.tsx` has a more detailed draft
covering exact event coordinates, participant visibility, account deletion
and PostHog analytics. These are **not the same published document**.

The code review found `src/lib/analytics.ts` included the full
`window.location.href` and `invite_code` in telemetry. The review
branch now drops both to avoid accidentally sending password-recovery
codes, invite tokens or personal URL parameters to a third party.
**No live deployment has been made**; until separately authorized, the
production website continues running the old behavior.

The live account-deletion page is reachable and provides an external
email-request route. The owner created and removed one real disposable
account in staging and verified password sign-in was rejected afterward.
There is **no independently verified production deletion fulfillment
workflow, uploaded-media byte deletion, retry procedure, notification
workflow, or provider/backups policy**.

## Play Console owner-required read-only checks

1. Under **App content → Data safety**, open the actual latest
   questionnaire and compare all collection, sharing, purpose,
   encryption, deletion and processing assertions to the matrix above.
2. Under **App content**, review public privacy and deletion URLs,
   target audience and content rating, and account-deletion declarations.
3. Confirm **Trader status** and developer verification from current
   Console account state; prior blue banners do not establish completion.
4. Confirm internal-tested package and version code actually match the
   queued production AAB `com.jwashburn.linkup` / **versionCode 16**.
5. Do **not** press Publish or save contradictory Data safety assertions.

## Remaining GO / NO-GO
**NO-GO** until:
- one real staging photo is uploaded, deleted and confirmed inaccessible;
- guest / nonmember / member / host Realtime WebSocket observations are recorded;
- production-capable deletion SOP is implemented/tested incl. failure,
  retention exception policy and requester confirmation;
- public policy and actual Console Data safety answers agree with app;
- final Android/Play Console checks and owner approval are recorded.

Completed development artifacts in this review branch:
- `scripts/qa/verify-staging-profile-image-lifecycle.mjs`
- `scripts/qa/verify-staging-realtime-privacy.mjs`
Neither has run against live signed-in credentials. CI syntax checks are
**not** functional test results.

No updates to production Supabase, production Vercel, main branch,
Google Play Console or real user accounts were made in this audit.
