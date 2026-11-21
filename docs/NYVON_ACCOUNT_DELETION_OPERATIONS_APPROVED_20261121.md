# Nyvon LLC™ — Account deletion operational SOP (owner-approved handling decisions)
**Operational decision date:** 2026-11-20 (America/Denver)  
**Status:** Identity confirmation initiated; NO REAL ACCOUNT DELETION AUTHORISED.  
**Scope:** Verified production requests handled one account at a time with case-specific final approval.  
**Security:** This is an operations runbook, not a publicly callable account-deletion API.

## Approved handling rules
1. **Hosted LinkUps:** Remove LinkUps hosted by the departing account when a verified deletion is approved. Existing database foreign-key cascades also remove participation rows associated with those hosted LinkUps, including other members' participation in them. Tell requesters this before deletion. Do not transfer or anonymize events as a substitute for their deletion.
2. **Service target:** Aim to complete a verified, authorized account deletion within **30 calendar days**, while applying applicable law and reasonable identity verification. Measure receipt, verification, each cleanup step, completion and final notice. This is an internal processing target, not a promise that every request will be fulfilled regardless of verification or legal restrictions; escalate older cases immediately.
3. **Retention:** Default to deleting associated personal data. Retain only specifically documented records genuinely required for legal obligations, active safety investigations or fraud prevention, in minimized form with a restricted operator, purpose, lawful basis, review/end date and access controls. No indefinite blanket moderation retention. Notify the requester of exceptions and relevant timeframes. Confirm vendor and backup retention policies independently; do not claim instantaneous erasure from all backups.
4. **Authorization:** The person requesting deletion must be verified, and the owner must separately approve the exact production account before any destructive operation. The approval to execute the coordinated RLS security cutover is NOT permission to delete these accounts. Never ask for passwords, OTPs, recovery tokens or admin credentials by email or chat.

## Current production intake (without exposing customer details)
- On Nov 20–21, 2026, **3 signed-in deletion-request records** were linked to **2 existing confirmed-email accounts**; all request emails exactly matched confirmed Auth emails.
- Restricted operations schema: `nyvon_deletion_ops.cases`. It holds one row per account with the original request UUIDs, initial/latest timestamps, status and confirmation timestamps. It is NOT in Supabase's exposed API schemas and has no anon/authenticated grants.
- Both accounts were emailed individually from `nyvonsupport@gmail.com` to their registered/confirmed account email and asked to reconfirm deletion or contest the request. The case status is `awaiting_requester_confirmation`; no account has been removed.
- Do not put account emails, UUIDs, private event titles, messages or storage paths in the GitHub repository, tickets, public dashboard, or ordinary logs.

## Manual case procedure (case-specific; destructive operations separately gated)
1. **Review restricted case:** Identify one account by exact internal UUID and its set of signed-in request IDs. Compare authenticated request, verified Auth email, any later request withdrawal and case state; check for duplicate entries and pending responses. Contact the registered email only. Do not act on a forwarded or spoofed message alone.
2. **Confirm ownership and intent:** Prefer the original signed-in request plus confirmed-account email reply, and if inconsistent or stale, require a fresh authenticated confirmation or secure identity flow. A reply alone does not establish identity. Record evidence category, date, operator, not passwords/secret tokens.
3. **Review user impact and retention:** Count hosted events, memberships, avatar/banner objects, support requests, reports, blocks, logs and third-party processors without copying content. Explain that hosted LinkUps and their attendee participation will disappear. Flag any narrowly defined legal/safety holds and review period for owner approval.
4. **Get explicit individual owner approval:** Present one case summary (opaque account reference, verified intent, planned deletion scope and retained exceptions). Record the owner's decision. Unverified, withdrawn, disputed and legally held cases remain PAUSED, not auto-deleted.
5. **Perform protected server-side cleanup:** Remove only that account's profile image/avatar/banner objects from Supabase Storage using a privileged server-only Admin client with non-public credentials. Paginate exact owner-prefixed paths and verify no unrelated objects are touched. Confirm metadata disappears and cache-busted image download eventually denies access (short CDN caching of ~60 sec was observed in staging).
6. **Remove or lawfully minimize personal operational data:** Clear account-linked support request PII explicitly (support_requests.user_id otherwise ON DELETE SET NULL), moderation information, user-owned report data and other account content after reviewing approved holds; preserve unrelated users' data. Do not treat SQL auth deletion alone as complete cleanup.
7. **Delete Supabase Auth identity LAST:** Via protected Admin API, only after media/support cleanup is verified and account UUID reconfirmed. Hosted LinkUps and attendee FK cascades must be independently checked. If an error interrupts cleanup, record partial completion and inspect state before retry; never blindly repeat.
8. **Independently verify:** Check Auth identities/sessions, hosted events, attendance, media objects and cache-busted public URLs, support PII, processor actions, and unaffected unrelated records. Existing access tokens may remain valid until expiry; validate access-control protections beyond client-side sign-out.
9. **Notify requester:** Only report deletion **completed** after verification. Explain any limited remaining records and timeframes. Record completion and notification date in restricted case registry.
10. **Escalation and maintenance:** Review pending cases regularly against 30-day target, handle undeliverable messages and identity disputes, minimize internal case notes. No routine deletion if verification or retention criteria are unresolved.

## Staging acceptance evidence and limits
- Staging signed-in Host/Member/Outsider/Guest privacy and Realtime test passed 7/7; anonymous HTTP privacy passed 13/13.
- A dedicated disposable staging account deletion-with-media PASS was verified on Nov 20. Known CDN delay approximately 60 seconds. This does not by itself validate production case fulfillment, all external providers, backups or previously-issued JWT revocation.
- The existing production deletion page collects requests, not automatic deletion. Maintain accurate Google Play Data safety copy.

## Separate Nyvon V1.5 release gates
- Live anonymous direct SELECT on linkups and linkup_attendees must be removed after compatible frontend soak/Android checks, and pass repeatable production privacy gate.
- Android versionCode 16 post-cutover device test, Google Play app signing and Data safety checks must pass.
- Public release requires a SEPARATE explicit owner approval. Do not publish because this SOP exists.

**Canonical launch handoff:** https://docs.google.com/document/d/1Hag21wDVXkxNZQeg2a5-qoVpdXtflrfGWtgqX3_aUtY/edit
