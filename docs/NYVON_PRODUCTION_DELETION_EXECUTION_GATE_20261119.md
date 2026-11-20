# Nyvon V1.5 — production account deletion execution gate
**Prepared 2026-11-19. Procedure REVIEW ONLY; no production deletion authorized or performed.**

## Current verified production inventory (read-only)
- `public.support_requests` contains **3** `request_type='delete_account'` records linked to **2 distinct existing Auth accounts**. Earliest request record: 2026-07-04 UTC; newest: 2026-11-20 UTC. They are not necessarily three separate unfulfilled requests. The table has **no status, reviewer, verification, fulfillment, or notification fields**. No assertion of fulfillment is possible from this table alone.
- `support_requests.user_id` is `ON DELETE SET NULL`, so support email/name/message survive Auth deletion unless explicitly handled.
- Auth user deletion cascades through hosted LinkUps, attendance, blocks and reporter-owned reports. `user_reports.reported_user_id` and `reviewed_by` are SET NULL, not necessarily erased. Verify any remaining records before claiming full deletion.
- Profile image and banner objects live under `profile-images/avatars/{user_id}/` and `profile-images/banners/{user_id}/`. The bucket is public; SQL database row deletion does not substitute for removing bytes via Storage API.
- One previously approved disposable **staging** user's Auth identity and linked database records were deleted and login rejection was checked. No complete production workflow or uploaded-media deletion has been proven.

## Mandatory operating procedure for an individually approved production deletion
1. **Intake:** Create a restricted operator case ID; record request ID(s), receipt date, account UUID, trusted contact route, duplicate requests, responsible operator, and status. No production request is automatically marked completed.
2. **Verify:** Require signed-in session ownership or a secure, single-use identity verification process. An unverified email alone cannot authorize account deletion; do not solicit passwords, OTPs or private keys.
3. **Review scope and retention:** Confirm whether hosted LinkUps will disappear for others; identify account-linked rows, public avatar/banner objects, external processors, audit records and any legally required holds. Obtain a documented, category-specific retention decision. The 30-calendar-day target in the earlier staging design is **not** a published guarantee.
4. **Snapshot minimum evidence:** Capture counts and opaque IDs for verification, not unnecessary user content. Record initial media object inventory and all expected downstream cascades. Confirm the exact account and no shared brand files.
5. **Remove media via Supabase Storage API:** Use a server-only privileged client, list/paginate all object keys scoped to the verified user's avatar/banner prefixes, remove them, re-list and attempt readbacks. Report failed removals; never delete a whole shared bucket.
6. **Clean personal records:** Remove or appropriately redact support requests (they otherwise persist), reporter-owned records and applicable other PII. Treat moderation/safety retention separately under approved limited rules. Avoid deleting unrelated users' data.
7. **Delete Auth user last through protected Admin API:** Require explicit single-account confirmation and record success/failure. Do not expose service_role/secret keys to the browser or use an unrestricted public endpoint.
8. **Verify independently:** Confirm Auth user and identities/sessions absent, hosted event and attendee cascades correct, support data/PII removed or lawfully documented, media bytes no longer retrievable, and unrelated accounts unaffected. Be mindful that previously issued access tokens can remain valid until expiry; test revoked sessions and sensitive operations.
9. **Confirm the result to requester:** Explain verified completion and any narrowly retained categories/periods. Do not say deletion is complete after only submitting a request.
10. **Failure/retry:** Keep a durable restricted status, stage and error category; re-run only idempotent steps after verifying account identity. Do not claim completion after a partial failure. Escalate unresolved storage, external processor, backup or moderation issues.

## Staging acceptance gates (still must run)
- Real disposable test users and signed-in sessions, including wrong-user deletion denial.
- Avatar **and banner** upload, download, delete and public-read denial after deletion.
- Hosted/attendee event cleanup while unrelated accounts remain intact.
- Real Admin API/Auth deletion, sign-in rejection and session/refresh token check.
- Retried partial failure and duplicate-request handling.
- User confirmation and an approved backup/processor retention policy.

## Security and release decision
- **NO GO** for production deletion automation or claim of fulfilled deletion support until the steps above have passed a full staging trial and the operator has approved narrow production actions.
- Do not process the 3 production request records automatically; first verify account identity, duplicate status, any prior manual handling and lawful retention.
- Google Play Data safety and the public policy must match an actual implemented deletion service, not merely a form.
