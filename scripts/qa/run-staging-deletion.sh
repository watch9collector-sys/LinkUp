#!/usr/bin/env bash
# Staging ONLY. Deletes exactly one disposable NYVON QA account after full acceptance tests.
# Never use with a production account or production keys. Never paste credentials into chat.
set -euo pipefail
cd "$(dirname "$0")/../.."
if [[ ! -d node_modules/@supabase/supabase-js ]]; then
  echo 'Dependencies missing: run npm ci in this repository first.' >&2
  exit 2
fi
export NYVON_STAGING_SUPABASE_URL="https://kxwechptoaituppkmcjr.supabase.co"
cleanup() {
  unset NYVON_STAGING_SUPABASE_KEY NYVON_STAGING_ADMIN_KEY
  unset NYVON_QA_DELETE_EMAIL NYVON_QA_DELETE_PASSWORD NYVON_QA_DELETE_CONFIRM
  unset NYVON_STAGING_SUPABASE_URL
}
trap cleanup EXIT
printf '%s\n' "STAGING ACCOUNT DELETION TEST — one disposable account will be permanently deleted."
printf '%s\n' "Create a confirmed STAGING account named watch9collector+nyvon-qa-delete-<suffix>@gmail.com first."
printf 'Disposable staging account email: '
IFS= read -r NYVON_QA_DELETE_EMAIL
printf 'Disposable staging account password (hidden): '
IFS= read -r -s NYVON_QA_DELETE_PASSWORD; printf '\n'
printf 'Staging public/anon key (hidden): '
IFS= read -r -s NYVON_STAGING_SUPABASE_KEY; printf '\n'
printf 'STAGING SERVICE_ROLE key — never a production key (hidden): '
IFS= read -r -s NYVON_STAGING_ADMIN_KEY; printf '\n'
printf 'Type DELETE THIS DISPOSABLE STAGING ACCOUNT to authorize test: '
IFS= read -r NYVON_QA_DELETE_CONFIRM
export NYVON_STAGING_SUPABASE_KEY NYVON_STAGING_ADMIN_KEY
export NYVON_QA_DELETE_EMAIL NYVON_QA_DELETE_PASSWORD NYVON_QA_DELETE_CONFIRM
node scripts/qa/verify-staging-account-deletion.mjs
