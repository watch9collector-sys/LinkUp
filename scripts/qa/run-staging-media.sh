#!/usr/bin/env bash
# Nyvon V1.5 staging-only media deletion check.
# Uses the confirmed disposable QA Host account; never touches production.
set -euo pipefail
cd "$(dirname "$0")/../.."

if ! command -v node >/dev/null 2>&1; then
  printf 'Node.js is missing.\n' >&2
  exit 2
fi
if [[ ! -d node_modules/@supabase/supabase-js ]]; then
  printf 'Dependencies missing. Run npm ci first.\n' >&2
  exit 2
fi

export NYVON_STAGING_SUPABASE_URL="https://kxwechptoaituppkmcjr.supabase.co"
export NYVON_STAGING_TEST_EMAIL="watch9collector+nyvon-qa-host-20261119@gmail.com"
printf 'STAGING ONLY: media deletion and cache-invalidation test.\n'
printf 'HOST staging email: %s\n' "$NYVON_STAGING_TEST_EMAIL"
printf 'Paste STAGING publishable/anon key (hidden): '
IFS= read -r -s NYVON_STAGING_SUPABASE_KEY
printf '\n'
printf 'Enter RESET HOST staging password (hidden): '
IFS= read -r -s NYVON_STAGING_TEST_PASSWORD
printf '\n'
export NYVON_STAGING_SUPABASE_KEY NYVON_STAGING_TEST_PASSWORD

cleanup() {
  unset NYVON_STAGING_SUPABASE_KEY NYVON_STAGING_TEST_PASSWORD
  unset NYVON_STAGING_SUPABASE_URL NYVON_STAGING_TEST_EMAIL
}
trap cleanup EXIT

if [[ -z "$NYVON_STAGING_SUPABASE_KEY" || -z "$NYVON_STAGING_TEST_PASSWORD" ]]; then
  printf 'Both inputs are required.\n' >&2
  exit 2
fi

if NODE_OPTIONS=--experimental-websocket node scripts/qa/verify-staging-profile-image-lifecycle.mjs; then
  printf '\nPASS: staging avatar/banner removal and final readback denial.\n'
else
  printf '\nFAIL: staging media deletion is not yet verified. Production account-deletion gate remains NO-GO.\n' >&2
  exit 1
fi
