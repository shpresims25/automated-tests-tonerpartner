#!/usr/bin/env bash
# Uploads qa-report/summary.json (+ results.json) to Profihost via sftp -b.
# Env: PROJECT, ENVIRONMENT (destination slugs), PROFIHOST_HOST, PROFIHOST_USER, PROFIHOST_SSH_KEY,
#      PROFIHOST_KNOWN_HOSTS, optional PROFIHOST_PORT (default 22).
# No host configured -> notice + exit 0. Any other problem -> ::warning:: + exit 1 (step is continue-on-error).
set -u

SUMMARY_FILE="qa-report/summary.json"
RESULTS_FILE="qa-report/results.json"
TMPDIR_UP="$(mktemp -d)"
cleanup() { rm -rf "$TMPDIR_UP"; }
trap cleanup EXIT

step_summary() { [ -n "${GITHUB_STEP_SUMMARY:-}" ] && printf '%s\n' "$1" >> "$GITHUB_STEP_SUMMARY"; return 0; }
fail() {
  echo "::warning::Profihost upload failed: $1"
  step_summary "- **${PROJECT:-?}/${ENVIRONMENT:-?}**: FAILED, upload to Profihost failed: $1"
  exit 1
}

if [ -z "${PROFIHOST_HOST:-}" ]; then
  echo "::notice::PROFIHOST_HOST is not set, skipping the Profihost upload"
  step_summary "- **${PROJECT:-?}/${ENVIRONMENT:-?}**: upload skipped (PROFIHOST_HOST not set)"
  exit 0
fi

[ -n "${PROFIHOST_USER:-}" ] || fail "PROFIHOST_USER is missing"
[ -n "${PROFIHOST_SSH_KEY:-}" ] || fail "PROFIHOST_SSH_KEY is missing"
[ -n "${PROFIHOST_KNOWN_HOSTS:-}" ] || fail "PROFIHOST_KNOWN_HOSTS is missing"
[ -n "${PROJECT:-}" ] && [ -n "${ENVIRONMENT:-}" ] || fail "PROJECT / ENVIRONMENT missing"
[ -f "$SUMMARY_FILE" ] || fail "$SUMMARY_FILE not found"

# date and time come from summary.json's timestamp (UTC), so folder and JSON agree
TS="$(node -p "JSON.parse(require('fs').readFileSync('$SUMMARY_FILE','utf8')).timestamp" 2>/dev/null)" || fail "cannot read timestamp from $SUMMARY_FILE"
if ! [[ "$TS" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})\. ]]; then fail "invalid timestamp in $SUMMARY_FILE"; fi
DATE="${BASH_REMATCH[1]}"
TIME="${BASH_REMATCH[2]}${BASH_REMATCH[3]}${BASH_REMATCH[4]}"
DEST="qa-reports/${PROJECT}/${ENVIRONMENT}/${DATE}/${TIME}"

KEY="$TMPDIR_UP/key"; KNOWN="$TMPDIR_UP/known_hosts"; BATCH="$TMPDIR_UP/batch"
umask 077
printf '%s\n' "$PROFIHOST_SSH_KEY" > "$KEY"; chmod 600 "$KEY"
printf '%s\n' "$PROFIHOST_KNOWN_HOSTS" > "$KNOWN"

{
  p=""
  for part in qa-reports "$PROJECT" "$ENVIRONMENT" "$DATE" "$TIME"; do
    p="${p:+$p/}$part"
    echo "-mkdir $p"
  done
  echo "put $SUMMARY_FILE $DEST/summary.json"
  [ -f "$RESULTS_FILE" ] && echo "put $RESULTS_FILE $DEST/results.json"
} > "$BATCH"

if sftp -b "$BATCH" -i "$KEY" -P "${PROFIHOST_PORT:-22}" \
     -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes \
     -o UserKnownHostsFile="$KNOWN" "${PROFIHOST_USER}@${PROFIHOST_HOST}" >"$TMPDIR_UP/out" 2>&1; then
  INFO="$(node -p "const s=JSON.parse(require('fs').readFileSync('$SUMMARY_FILE','utf8'));s.status+': '+s.passed+' passed, '+s.failed+' failed, '+s.flaky+' flaky, '+s.skipped+' skipped'")"
  echo "Uploaded to $DEST"
  step_summary "- **${PROJECT}/${ENVIRONMENT}**: ${INFO} -> \`${DEST}\`"
else
  # sftp output can mention host/user but never the key; show only the last lines
  fail "sftp error ($(tail -n 2 "$TMPDIR_UP/out" | tr '\n' ' '))"
fi
