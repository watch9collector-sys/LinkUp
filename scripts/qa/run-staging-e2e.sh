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

printf '\n[1/2] Checking disposable avatar/banner upload, download and deletion...\n'
node scripts/qa/verify-staging-profile-image-lifecycle.mjs
printf '\n[2/2] Checking real Auth/REST and Realtime host/member/outsider/guest privacy...\n'
node scripts/qa/verify-staging-realtime-privacy.mjs
printf '\nPASS: Both staging-only QA suites completed. This does not approve production release.\n'
