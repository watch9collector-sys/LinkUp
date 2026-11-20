# Nyvon — Account deletion operating procedure (DRAFT, not active)

> **REVIEW ONLY. No production deletions, Auth changes, storage cleanup,
> new UI or live backend functionality were executed.**
> This is an operational design, not proof of implementation or legal advice.

## Owner decisions — approved for isolated staging testing only (2026-11-19)

- **Hosted LinkUps:** Delete LinkUps hosted by the departing account rather
  than transferring ownership or anonymizing their host. The deletion
  cascades to attendance on those LinkUps, including other attendees'
  memberships. In the user-facing flow, clearly disclose that hosted LinkUps
  and associated participation records will disappear.
- **Processing target:** Work toward completing a **verified** deletion
  request within **30 calendar days** in staging test design. This is a
  proposed operating target, not a published/legal guarantee until final
  owner/legal review and proven implementation. Track request received,
  identity verified, cleanup started, cleanup completed, confirmation sent.
- **Safety/fraud records:** Retain **only genuinely necessary, documented**
  records for legal/safety/fraud purposes; do not silently retain unrelated
  identifying information. **Exact retention categories, periods, access
  controls and lawful bases are still undecided** and must be approved
  before production implementation. Do not interpret the broad approval
  as permission to retain all moderation reports indefinitely.
- **Scope:** Staging-only test authorization. No live user deletion,
  Play Console updates, customer messages, production migrations or
  public privacy/legal promises are authorized.

## Verified existing flow

- Signed-in user opens Profile → Support & Legal → Delete account → confirms
  and submits a form. `app/delete/page.tsx` calls `submitSupportRequest`
  with `request_type='delete_account'`; the UI confirms only that a
  **request was recorded**, not that data was deleted.
- Without the app, the public `/delete-account` page provides a support-email
  route. It asks users to supply their account email and never their password.
- The `support_requests` table persists name, email, message and optional
  account UUID. Its `user_id` foreign key is **ON DELETE SET NULL**.
  A rolled-back deletion simulation on isolated staging confirmed the
  request row and email survive deletion of the Auth user.
- No verified server-side completion workflow or fixed retention timeline
  appears in the reviewed code. Do NOT claim account deletion is automatic.

## Proposed manual process — staging testing approved; production/legal approvals outstanding

1. **Intake and track:** Record timestamp, request ID, account identity,
   contact route, operator, verification status and next action. Never request
   a password, OTP, session token or API key.
2. **Verify ownership:** Prefer a session-bound request; for email-only
   requests use an identity-verification workflow before accessing or deleting
   private data. Prevent arbitrary users from deleting another person's
   account. Require explicit owner approval for any admin deletion.
3. **Identify all account-linked data:** Supabase Auth user and metadata,
   hosted LinkUps, attendance rows, blocks, reports/moderation audit records,
   support requests, public avatar/banner media, any other uploaded files,
   logs, backups and external processors. Confirm each table's current foreign
   keys and any unexpected references with an inventory query.
4. **Determine retention and holds:** Decide the exact deletion/retention
   schedule and document the legal/security exceptions and how the user is
   informed. Do not invent a blanket number of days; review applicable law,
   Google Play requirements and actual operational capacity.
5. **Remove uploaded account media:** Under a privileged **server-side**
   process, identify and delete the requester's objects in the
   `profile-images` bucket at `avatars/{user_id}/` and
   `banners/{user_id}/`. Check other buckets only if they contain
   that person's own content. Do not delete shared brand assets.
6. **Clean linked data:** Deleting Auth users may cascade through hosted
   LinkUps, attendee rows, user blocks and reporter-owned reports. Verify
   each relationship and product impact (a hosted event may disappear for
   everyone); redact or delete personal data in support requests,
   moderation records and any other records according to approved retention
   exceptions.
7. **Delete Auth identity last:** Use protected administrative APIs with
   credentials stored server-side only. Never place a Supabase service-role
   or secret key in `NEXT_PUBLIC_*`, a browser bundle or a public endpoint.
8. **Verify completion:** Recheck Auth record absence, linked records,
   uploaded URLs, storage objects and accessible private data. Record a
   minimal audit result without retaining unnecessary PII.
9. **Confirm to requester:** Provide a clear status and any retained categories
   and schedule. Do not claim successful permanent deletion until verified.
10. **Handle failure/retries:** Make the process idempotent, log partial
    completion, handle media/storage errors, and provide a secure escalation
    route. Backups and processor logs require separate policy treatment.

## Mandatory staging end-to-end test — still pending (SQL cleanup rehearsal passed)

- Create a disposable test account via normal staging Auth sign-up,
  upload an avatar/banner, host and join synthetic LinkUps, submit a deletion
  request, and verify intake.
- Execute the approved secure deletion workflow in staging. Assert Auth,
  relevant rows, media and URLs are removed/anonymized as intended while
  unrelated accounts and media are unaffected.
- Test an unverified request (must NOT delete anyone) and a partially failed
  deletion/retry. Confirm any lawful retained records are minimized and
  reflected in the response to the requester.
- Test that guest access to Realtime `support_requests` events reveals no
  private support data.
- Record timestamps, operator, status, data counts and evidence. Only then
  update final policy text and reconcile Google Play Data safety statements.

## Independent public-launch blockers

- The deletion SOP has **not** been operationally implemented or approved.
- No end-to-end automated or manual deletion completion has been verified.
- Retention period and exceptions need a concrete owner/legal decision.
- Google Play Data safety's deletion statements must match real capability.
- Do not publish or change production code, Console data safety, or live
  account records without the owner's separate explicit approval.

References: `app/delete/page.tsx`, `app/delete-account/page.tsx`,
`supabase/migrations/20260523110000_support_requests.sql`,
`supabase/migrations/20260523120000_support_requests_rpc.sql`,
`supabase/migrations/20260610120000_profile_images_storage_paths.sql`.


## SQL cleanup rehearsal — PASS (not a completed end-to-end deletion)

On the isolated staging database, a single transaction used only the
existing `host-a@nyvon-staging.invalid` synthetic account. It temporarily
created a synthetic deletion support request, report and block, then tested
the following cleanup order: support request → reports (no approved
retention hold in the synthetic scenario) → blocks → attendance → hosted
LinkUps → Auth identity last. All statements were followed by `ROLLBACK`.

**Eight assertions passed:** target Auth account, hosted LinkUps, target
attendance, support request, reports and blocks were absent after the
cleanup sequence; another host's LinkUps and Auth account remained
unchanged. This proves FK cascade behavior and that an explicit cleanup
procedure can protect unrelated test users. It does **NOT** verify storage
byte deletion, real Auth Admin API authentication, genuine user identity
verification, account sessions, notification, or provider/backups removal.
It does not establish a lawfully approved moderation retention policy.

Complete the mandatory end-to-end tests above in a staging-only service
session, including real photo upload/removal, unverified request denial,
partial-failure retry, actual Auth Admin API deletion and proof of
client/session revocation before changing a public/legal declaration.
