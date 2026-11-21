> **CURRENT VERIFIED PRODUCTION UPDATE — NOVEMBER 20, 2026 (SUPERSEDES OLDER “PRODUCTION NOT CHANGED” STATUS)**
> The owner requested completion of Nyvon's five launch priorities. LIVE project `zijrcnzjdafndjdpltst`: (1) anon/authenticated TRUNCATE, REFERENCES and TRIGGER privileges were revoked on linkups, linkup_attendees, support_requests, user_blocks and user_reports; independently verified FALSE on all five; (2) linkups, linkup_attendees and support_requests were removed from `supabase_realtime` publication; independently verified zero published tables; (3) privacy-redacted public `fetch_safe_linkups` RPC was created as a non-breaking additive production migration. **Real anonymous HTTP:** RPC 200, 3 upcoming rows with all private identifiers, coordinates, descriptions, locations and attendee identities redacted. Existing old raw `linkups` and `linkup_attendees` endpoints still returned HTTP 206/HEAD with counts 65 and 143, proving that legacy anonymous raw-SELECT permissions remain open. No data deleted: 53 accounts / 65 LinkUps / 143 attendees / 14 support requests.
> **Critical remaining risk:** DO NOT claim production privacy fixed while raw public SELECT policies remain. Restrict them only in a tested coordinated cutover with the safe-discovery frontend and old Android compatibility checks. Do not restore them on rollback.
> **Account deletion:** 3 existing delete-account requests concern 2 accounts; none automatically fulfilled. New guarded staging-only local acceptance scripts `scripts/qa/verify-staging-account-deletion.mjs` and `scripts/qa/run-staging-deletion.sh` pass Node/Bash syntax checks but have NOT run end to end with disposable credentials. No live account deleted.
> **Android/Play:** Live privacy, deletion and assetlinks URLs return HTTP 200. Published privacy copy still lacks PostHog analytics disclosure. Play queued V1.5/API36/status, signing certificate, current Data safety answers, trader declaration and physical Android flow still require fresh owner Console/device verification. Play release remains UNPUBLISHED; draft PRs #4/#5 remain unmerged.
> **Canonical evidence:** [updated Nyvon Executive QA and Launch Handoff](https://docs.google.com/document/d/1Hag21wDVXkxNZQeg2a5-qoVpdXtflrfGWtgqX3_aUtY/edit). No further live app deployment, customer-data edits or Play publication were made.

> **CURRENT VERIFIED ADDENDUM — NOVEMBER 20, 2026**
> **NO-GO FOR PUBLIC LAUNCH.** This historical November 19 report has now been superseded for specific QA results by [the critical Realtime security incident and release gate](./NYVON_REALTIME_PRIVACY_INCIDENT_AND_RELEASE_GATE_20261120.md).
> Since this report was originally written, all three staging test accounts were confirmed and signed in, actual avatar/banner upload and deletion were verified, an Outsider joined and left a test LinkUp, and a new-name privacy fallback was committed.
> A REAL unauthenticated staging WebSocket listener subsequently received one private LinkUp UPDATE and one attendee INSERT event despite the HTTP privacy checks passing. Staging removed both private tables from `supabase_realtime`, then an independent guest retest saw **zero** raw events. The staging frontend now refreshes through safe RPC polling every 30 seconds while visible. Staging build/lint and guest HTTP tests passed.
> A read-only production inspection separately found `linkups`, `linkup_attendees` and `support_requests` in raw Realtime publication, and public SELECT policies and grants for the first two tables. NO live records, permissions or Play Console settings were modified. Do not apply staging RLS to old clients blindly; coordinate an approved production privacy cutover. Realtime, deletion-with-media, Android and Play gates remain blocking.

# Nyvon V1.5 — Public launch readiness decision
**Review-only assessment · November 19, 2026 America/Denver / November 20 UTC**
**Current verdict: NO-GO. Do not publish queued Play changes.**

## Verified progress
- Google Play `com.jwashburn.linkup` versionName 1.5, versionCode 16 and target SDK 36 are queued for production, subject to Google Play policy checks. Managed publishing is ON. **None published through this workflow.**
- Isolated Supabase staging project `kxwechptoaituppkmcjr` is healthy and preview-scoped Vercel environment `NEXT_PUBLIC_SUPABASE_URL` independently confirms staging ref. Vercel signed-in browser loads the preview.
- Staging SQL role simulations for host/member/nonmember/anon passed; anonymous `fetch_safe_linkups` safe-discovery redaction independently passed, including no private coordinate, description, host ID or attendee identity in public results. These are SQL checks, **not real WebSocket tests**.
- Review branch `review/nyvon-v1-5-launch-safeguards-20261119` contains QA scripts and a fix recognizing guest raw-table `42501` permission denial as an intended outcome, plus explicit unauthenticated redacted RPC checks. **Script not yet executed with real accounts.**
- Earlier isolated Vercel sandbox source lint and Next.js build passed with a deliberately unusable synthetic build key; no runtime authentication conclusion was drawn.
- Exactly one new disposable staging email/password account was created; Supabase confirms email remains **unverified** and no sign-in occurred.

## Blocking Auth redirect problem — confirmed from actual Gmail
Actual staging signup confirmation emails from `noreply@mail.app.supabase.io` arrive in the owner's connected Gmail inbox. Their `/auth/v1/verify` URLs are on the correct staging project but contain `redirect_to=http://localhost:3000`.
This indicates fallback to the staging project's default Site URL / redirect allowlist configuration. Fix in **STAGING Supabase**, not in production:
1. Open **https://supabase.com/dashboard/project/kxwechptoaituppkmcjr/auth/url-configuration**
2. Set the staging **Site URL** to the Vercel **stable branch preview alias** (independently verified through Vercel deployment aliases and HTTP 200):
   `https://nyvon-git-review-nyvon-v1-8d04de-watch9collector-5462s-projects.vercel.app`
3. Under **Redirect URLs**, add the exact branch alias with path wildcard:
   `https://nyvon-git-review-nyvon-v1-8d04de-watch9collector-5462s-projects.vercel.app/**`
   Open the **branch alias**, not a build-specific deployment URL, for signup and password recovery. This avoids granting wildcard trust to all team previews. Do not allow the production domain to point at the staging project.
4. Save, return to that **protected staging preview**, request a fresh confirmation (or new staging signup) and inspect that the newest email's redirect points back to the current preview, **not localhost**. Confirmation links are one-use.
5. Create or reset a known disposable password without sharing any credentials in chat, sign in from a new session, and verify Supabase `email_confirmed_at` and `last_sign_in_at`.
Important: clicking an older link may complete verification but still redirect to localhost. Do not count this as an end-to-end successful flow. Don't disable email confirmation.

## Required real staging execution
- Three separate confirmed disposable accounts (Host, Member, Outsider), plus unauthenticated Guest.
- Run `bash scripts/qa/run-staging-e2e.sh` locally with staging-only credentials and publishable/anon key.
- Pass actual Storage API avatar/banner upload, download, remove and readback denial.
- Pass actual signed-in REST RLS and realtime WebSocket update/attendee privacy checks, verify the synthetic event/media cleanup.
- Test app user flows on an Android device. Check build/signing/app links against Play App Signing certificate.
- Test a separate disposable staging user deletion with actual uploaded media and secure admin process; confirm sessions, Auth, media and support PII removed.

## Production and Google Play compliance gates
- Manual account-deletion request intake exists, but no fully verified production fulfillment pipeline. Three production request rows are linked to two Auth users; these records must be verified/triaged individually, no automatic deletions.
- Public live privacy policy has not been updated to match precise coordinates/analytics/retention; narrow, draft `review/privacy-analytics-hotfix-20261119` PR #5 is ready for review and includes analytics minimization. Do not merge until disclosures are approved and compatibility checks pass.
- Preserve existing live app and Android compatibility. Staging's stricter RLS would block old anonymous/raw client requests; don't blindly apply to production.
- Reconcile actual Google Play Data safety answers, verify Play signing certificate fingerprint vs assetlinks, correct outdated listing contact/site, resolve visible target API warning and trader status.
- Google's November 2026 regular app update policy expects API 36+, which the queued V1.5 appears to target; the existing console policy warning is not independently cleared.
- Obtain **separate final owner publishing approval** once every gate passes, with rollout/rollback checklist. Until then keep managed publishing ON and all changes unpublished.

## What cannot be claimed yet
- No verified three-user live JWT WebSocket tests, no photo Storage API lifecycle, no complete account-deletion-with-media pass, no final production legal/policy review, no all-green Play policy status, no confirmed V1.5 production public availability.
- Browser automation currently unavailable due provider usage limit. Secure verification-link transfer into a remote runner was blocked by tool safety checks and **not circumvented**. Staging account remains unconfirmed; no production changes caused.

## Public guidance
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Google Play target API: https://support.google.com/googleplay/android-developer/answer/11926878
- Google Play account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- Google Play user data: https://support.google.com/googleplay/android-developer/answer/10144311
