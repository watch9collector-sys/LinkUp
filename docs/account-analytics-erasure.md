# Account-linked analytics erasure

Nyvon sends the Supabase Auth UUID to PostHog as its distinct ID. A hard
Auth deletion writes that UUID to the private erasure queue in the same
transaction. The user can sign out and see confirmation immediately while
the processor removes its copy asynchronously.

## Production setup

Assign the support operator who handles deletion requests to review the
queue each business day. Give that operator access to the correct Nyvon
PostHog project and a project-scoped API key with `person:read` and
`person:write`. Keep the key in an approved secret store and outside the
browser bundle. Test the procedure in a separate PostHog project using
only synthetic events before enabling instant deletion. Staging Nyvon
itself does not send product events to PostHog.

## Process a request

1. A database administrator selects the oldest pending row from
   `nyvon_private.account_analytics_erasure`. The operator works only with
   the UUID from that queue. Treat the queue as restricted personal data.
2. In the Nyvon PostHog project, find the person with
   `GET /api/projects/{project}/persons/?distinct_id={uuid}`. If there's no
   person profile, follow PostHog's documented process for events without
   a person profile. Send a server-side `$set` event using that exact
   distinct ID and no profile properties, then wait for the profile to
   appear. This includes events originally captured without a person profile.
3. Save the returned PostHog person UUID to the queue row before making the
   deletion call. Use that person UUID to check deletion status before
   retrying a request after a network failure. If a request is already
   pending or verified, use that result and avoid creating a new profile.
4. Call `POST /api/projects/{project}/persons/bulk_delete/` with
   `{"distinct_ids":["<account UUID>"],"delete_events":true,"delete_recordings":true}`.
   Verify that PostHog accepted the intended person and queued the events
   and recordings with no deletion errors. Set `submitted_at` after acceptance.
   Leave the row pending when any required deletion was rejected.
5. Poll `GET /api/projects/{project}/persons/deletion_status/?person_uuid={uuid}`
   using the **PostHog person UUID**. Once PostHog reports a populated
   `delete_verified_at` for the request and the person profile is gone, remove
   the queue row. Retain only aggregate completion counts for reporting.
   Escalate stalled requests to the privacy owner without removing the row.

Existing incomplete deletion requests need the same PostHog review when a
verified account UUID is available. Never reconstruct deleted user data
from a backup just to create a queue entry.

If instant deletion must be rolled back, disable the new entry point and
restore the previous frontend. Keep the erasure queue and trigger active
so accepted requests can be fulfilled and older deletion routes continue
to queue processor work.

References

- [PostHog data erasure and events without a person profile](https://posthog.com/docs/privacy/data-storage#data-deletion)
- [PostHog Persons API](https://posthog.com/docs/api/persons)
