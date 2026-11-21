# Nyvon V1.5 — real staging QA runbook

**Staging only. No production database, real users, main-branch deployment or Google Play publication.** 
Project ref: `kxwechptoaituppkmcjr`. Preview environment variables for this review branch are Preview-only. 
Never use `nyvon.app` as a test target.

## Required preparation
1. Open the newest READY Vercel preview belonging to `review/nyvon-v1-5-launch-safeguards-20261119`. Sign into Vercel when the preview asks for access.
2. Through the Preview app's **Create account** tab, register three **distinct disposable accounts** with reachable inboxes/aliases: Host, Member, Outsider. Confirm their email links and sign in once each. Use only temporary test data, not company/client accounts. Confirm any email redirect stays on staging preview.
3. Under Supabase Dashboard select **nyvon-v1-5-staging** (ref above), then Project Settings → API Keys to obtain its **publishable** or **legacy anon** key. Never use service_role or any production key. Do not paste test passwords, recovery links, or keys into chat.
4. On a Mac with Node.js and Git installed, clone `watch9collector-sys/LinkUp`, check out `review/nyvon-v1-5-launch-safeguards-20261119`, run `npm ci`, then `bash scripts/qa/run-staging-e2e.sh`. The runner prompts for the staging public key and three disposable users' emails and hidden passwords locally. It hardcodes the isolated staging URL and calls **only staging-only** QA scripts.

## Photo and banner acceptance
- UI: As Host open Profile → Edit profile. Choose harmless test images for avatar and banner, Save, refresh and verify both display. Remove both, Save and refresh.
- Script: Uploads its own tiny synthetic PNG to both `avatars/{hostId}/qa-...` and `banners/{hostId}/qa-...`, downloads each, removes each, and checks subsequent downloads fail.
- Verify Storage `profile-images` has no leftover `qa-` objects in the user's prefixes. The runner prints a cleanup warning on any failed removal; this is a **FAIL**, not a pass. Public CDN caching is separately worth checking.

## Realtime and RLS acceptance
- The script creates one synthetic future LinkUp hosted by Host and joins Member.
- Signed-in Outsider and signed-out Guest cannot read raw event address, coordinates, description or host identity via REST; redacted discovery remains available.
- Host and Member receive a Realtime event UPDATE, Outsider and Guest receive **zero** event updates.
- Host sees Member's attendance INSERT; Guest and Outsider receive **zero** attendee identity events.
- Script removes the synthetic LinkUp and signs out all test sessions; ensure cleanup succeeded. Do not delete other staging fixture events.

## PASS/FAIL and release gating
The runner must print both storage and Realtime PASS lines and exit successfully. A failed assertion, timeout, leaked event, upload/download/remove failure, or leftover QA object is **NOT PASS**.
Capture only anonymized pass/fail logs: no tokens, credential values, personal identifiers or real account content.
These tests do not exercise account deletion and do not authorize a Google Play release. Retain real production data unchanged.

## Terminal commands
```bash
git clone https://github.com/watch9collector-sys/LinkUp.git
cd LinkUp
git checkout review/nyvon-v1-5-launch-safeguards-20261119
npm ci
bash scripts/qa/run-staging-e2e.sh
```
