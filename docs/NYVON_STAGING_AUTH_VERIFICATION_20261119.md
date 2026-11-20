# Nyvon V1.5 — Staging browser authentication evidence, 2026-11-19 (America/Denver)

**Scope:** Isolated Supabase project `kxwechptoaituppkmcjr` and dedicated Vercel preview for review branch `review/nyvon-v1-5-launch-safeguards-20261119`. No production or Google Play changes.

## Confirmed
- Owner completed Vercel browser profile sign-in. Protected Vercel preview now loads Nyvon sign-in/Create account UI without Vercel login obstruction.
- Branch-scoped Vercel `NEXT_PUBLIC_SUPABASE_URL` independently read and compared equal to `https://kxwechptoaituppkmcjr.supabase.co`; no secret key was displayed.
- Browser saw staging's synthetic LinkUp card names; this is supplementary, not definitive proof of all runtime requests.
- **One** disposable HOST account was created via the staging preview, with password authentication present. Email was initially unconfirmed.
- Supabase Auth logs show **two** `mail.send` confirmation events for that disposable account from `noreply@mail.app.supabase.io`. Both corresponding actual confirmation emails were then located in the owner's connected Gmail via the Gmail connector. Verification tokens, full links and generated passwords were **never written into this document**.
- The browser QA agent had incorrectly searched Gmail with `from:supabase.com`, excluding the actual sender `noreply@mail.app.supabase.io`.
- After that discovery, the paid browser automation account reported insufficient balance; follow-up browser automation **did not start**. Do not claim the confirmation link was clicked.

## Pending / not passed
- User's click on the newest staging confirmation email, which must route through `kxwechptoaituppkmcjr.supabase.co/auth/v1/verify` and back to the preview. Do not use production links.
- First successful authenticated disposable Host sign-in, including setting/recovering a known test-only password if necessary.
- Real avatar and banner Storage API upload/download/remove tests.
- Separate Host/Member/Outsider authenticated and Guest unauthenticated Realtime WebSocket privacy test.

## Next safe action
Open Gmail's newest **Confirm your email address** message to the dedicated test alias, from `noreply@mail.app.supabase.io`, and use its confirmation link. Avoid opening the link more than once; it may be one-time. Then return to Vercel staging preview, use **Forgot password** to establish a known disposable password if needed, and complete sign-in. No real account deletion is authorized.

The checked-in staging-only runner `scripts/qa/run-staging-e2e.sh` is ready; only run it with confirmed disposable staging accounts and staging publishable key on a local machine. Run results were not faked or assumed. Release remains NO-GO.
