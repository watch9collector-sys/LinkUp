#!/usr/bin/env bash
# Nyvon V1.5 real end-to-end staging verification runner.
# Only isolated staging project kxwechptoaituppkmcjr is permitted.
# Reads disposable account credentials locally, without writing them to disk.
# Does not touch production, Google Play, or Auth account deletion.
set -euo pipefail

cd "$(dirname "$0")/../.."

if ! command -v node >/dev/null 2>&1; then
  printf 'Node.js is missing. Install Node.js first.\n' >&2
  exit 2
fi
if [[ ! -d node_modules/@supabase/supabase-js ]]; then
  printf 'Dependencies are missing. Run npm ci from repository root first.\n' >&2
  exit 2
fi

export NYVON_STAGING_SUPABASE_URL="https://kxwechptoaituppkmcjr.supabase.co"
printf 'STAGING ONLY: %s\n' "$NYVON_STAGING_SUPABASE_URL"
printf 'Use only three disposable, confirmed STAGING accounts. Never use production credentials.\n'
printf 'Paste the STAGING publishable/anon key (input hidden): '
IFS= read -r -s NYVON_STAGING_SUPABASE_KEY; printf '\n'
export NYVON_STAGING_SUPABASE_KEY
if [[ -z "$NYVON_STAGING_SUPABASE_KEY" ]]; then printf 'Missing staging key.\n' >&2; exit 2; fi

for role in HOST MEMBER OUTSIDER; do
  printf '%s staging account email: ' "$role"
  IFS= read -r addr
  printf '%s staging account password (input hidden): ' "$role"
  IFS= read -r -s secret; printf '\n'
  if [[ -z "$addr" || -z "$secret" ]]; then printf 'Missing account credentials for %s.\n' "$role" >&2; exit 2; fi
  export "NYVON_QA_${role}_EMAIL=$addr"
  export "NYVON_QA_${role}_PASSWORD=$secret"
  if [[ "$role" == "HOST" ]]; then
    export NYVON_STAGING_TEST_EMAIL="$addr"
    export NYVON_STAGING_TEST_PASSWORD="$secret"
  fi
  unset addr secret
done

cleanup_environment() {
  unset NYVON_STAGING_SUPABASE_URL NYVON_STAGING_SUPABASE_KEY
  unset NYVON_STAGING_TEST_EMAIL NYVON_STAGING_TEST_PASSWORD
  unset NYVON_QA_HOST_EMAIL NYVON_QA_HOST_PASSWORD
  unset NYVON_QA_MEMBER_EMAIL NYVON_QA_MEMBER_PASSWORD
  unset NYVON_QA_OUTSIDER_EMAIL NYVON_QA_OUTSIDER_PASSWORD
}
trap cleanup_environment EXIT

# Run both independent suites, even if one fails, so a storage-cache
# issue cannot prevent the separate authenticated access-control evidence.
# Report each result separately, and NEVER return success if either fails.
printf '\n[1/2] Checking disposable avatar/banner upload, download and deletion...\n'
storage_status=0
node scripts/qa/verify-staging-profile-image-lifecycle.mjs || storage_status=$?

printf '\n[2/2] Checking real Auth/REST and Realtime host/member/outsider/guest privacy...\n'
privacy_status=0
node scripts/qa/verify-staging-realtime-privacy.mjs || privacy_status=$?

printf '\nFINAL STAGING QA RESULTS:\n'
if [[ "$storage_status" -eq 0 ]]; then
  printf 'PASS: Avatar/banner media lifecycle and removal verification.\n'
else
  printf 'FAIL: Avatar/banner media lifecycle (exit %s); deletion remains unverified.\n' "$storage_status"
fi
if [[ "$privacy_status" -eq 0 ]]; then
  printf 'PASS: Authenticated host/member/outsider/guest security checks.\n'
else
  printf 'FAIL: Authenticated host/member/outsider/guest security checks (exit %s).\n' "$privacy_status"
fi

if [[ "$storage_status" -ne 0 || "$privacy_status" -ne 0 ]]; then
  printf 'NO-GO: One or more staging tests failed. Do not proceed with the production privacy cutover.\n' >&2
  exit 1
fi
printf 'PASS: Both staging-only QA suites completed. This does not approve production release.\n'
