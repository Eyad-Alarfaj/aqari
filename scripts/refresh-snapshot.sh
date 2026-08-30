#!/usr/bin/env bash
# Refreshes public/snapshot.json from an allowed network and pushes it.
#
# The scheduled GitHub workflow that used to do this fails on every run:
# SREM blocks GitHub Actions egress just as it blocks Vercel's. Running the
# fetch here — from a Saudi residential IP — is the only path that reaches
# the upstream, so this script is driven by a Windows scheduled task instead.
# See scripts/build-snapshot.mjs and .github/workflows/snapshot.yml.
set -euo pipefail

cd "$(dirname "$0")/.."
exec >>"snapshot-refresh.log" 2>&1
echo "=== $(date -Is)"

git pull --quiet --rebase origin master

if ! node scripts/build-snapshot.mjs; then
  echo "fetch failed; keeping the previous snapshot"
  exit 1
fi

if git diff --quiet public/snapshot.json; then
  echo "snapshot unchanged"
  exit 0
fi

git add public/snapshot.json
git commit --quiet -m "chore: refresh SREM snapshot [skip ci]"
git push --quiet origin master
echo "pushed"
