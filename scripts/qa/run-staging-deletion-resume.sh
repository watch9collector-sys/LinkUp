#!/usr/bin/env bash
# Exact NYVON staging fixture recovery. Never run against production.
set -euo pipefail
cd "$(dirname "$0")/../.."
if [[ ! -d node_modules/@supabase/supabase-js ]]; then
  echo "Missing dependencies: run npm ci first." >&2
  exit 2
fi
export NYVON_STAGING_SUPABASE_URL="https://kxwechptoaituppkmcjr.supabase.co"
export NYVON_QA_DELETE_EMAIL="watch9collector+nyvon-qa-delete-20261120@gmail.com"
clear_qa_env(){
  unset NYVON_STAGING_SUPABASE_URL NYVON_QA_DELETE_EMAIL
  unset NYVON_QA_DELETE_PASSWORD NYVON_STAGING_SUPABASE_KEY
  unset NYVON_STAGING_ADMIN_KEY NYVON_QA_DELETE_CONFIRM
}
trap clear_qa_env EXIT
printf 'STAGING ONLY: resume deletion of exact disposable account %s\n' "$NYVON_QA_DELETE_EMAIL"
printf 'Preflight rejects any unexpected event, attendee, support or media records.\n'
printf 'Disposable account password (hidden): '
IFS= read -r -s NYVON_QA_DELETE_PASSWORD; printf '\n'
printf 'STAGING public/anon key (hidden): '
IFS= read -r -s NYVON_STAGING_SUPABASE_KEY; printf '\n'
printf 'STAGING LEGACY service_role key (hidden; NEVER production): '
IFS= read -r -s NYVON_STAGING_ADMIN_KEY; printf '\n'
printf 'Type DELETE THIS DISPOSABLE STAGING ACCOUNT to authorize exact test cleanup: '
IFS= read -r NYVON_QA_DELETE_CONFIRM
export NYVON_QA_DELETE_PASSWORD NYVON_STAGING_SUPABASE_KEY
export NYVON_STAGING_ADMIN_KEY NYVON_QA_DELETE_CONFIRM
NODE_OPTIONS=--experimental-websocket node scripts/qa/resume-staging-deletion-20261120.mjs
