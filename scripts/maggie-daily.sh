#!/bin/zsh
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
REPO="chensy618/lingo2"
REPO_DIR="${LINGO2_REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
KEY_FILE="$HOME/.config/lingo2/maggie.env"
LOG_PREFIX="[$(date '+%F %T')]"

log() { echo "$LOG_PREFIX $*"; }

if [ -z "${MAGGIE_API_KEY:-}" ] && [ -f "$KEY_FILE" ]; then
  set -a
  source "$KEY_FILE"
  set +a
fi
if [ -z "${MAGGIE_API_KEY:-}" ]; then
  log "MAGGIE_API_KEY is missing; expected it in $KEY_FILE or the environment."
  exit 1
fi
export MAGGIE_API_KEY

command -v node >/dev/null || { log "node not found"; exit 1; }
command -v gh >/dev/null || { log "gh not found"; exit 1; }
gh auth status >/dev/null 2>&1 || { log "gh is not authenticated"; exit 1; }
gh auth setup-git >/dev/null 2>&1 || true

DATE="$(date +%F)"
EXISTING_PR="$(gh pr list --repo "$REPO" --state all --search "Content review: $DATE" --json number,state --jq '.[0].number // empty')"
if [ -n "$EXISTING_PR" ] && [ "${FORCE:-0}" != "1" ]; then
  log "Review PR #$EXISTING_PR already exists for $DATE; skipping."
  exit 0
fi

WORK="$(mktemp -d "${TMPDIR:-/tmp}/lingo2-content.XXXXXX")"
cleanup() {
  cd "$REPO_DIR" 2>/dev/null || true
  git -C "$REPO_DIR" worktree remove --force "$WORK" >/dev/null 2>&1 || rm -rf "$WORK"
}
trap cleanup EXIT

log "Fetching origin/main"
git -C "$REPO_DIR" fetch origin main --quiet
git -C "$REPO_DIR" worktree add --detach "$WORK" origin/main --quiet
cd "$WORK"

log "Generating with Maggie"
node scripts/generate-content.mjs \
  --count="${CONTENT_COUNT:-3}" \
  --level="${CONTENT_LEVEL:-auto}" \
  --track="${CONTENT_TRACK:-mixed}"

if [ "${AUTO_REVIEW:-1}" != "0" ]; then
  log "Auto-reviewing with Maggie"
  node scripts/review-content.mjs --file=src/content/generated-exercises.json
fi

node scripts/validate-content.mjs

if git diff --quiet -- src/content/generated-exercises.json; then
  log "No new candidates were written."
  exit 0
fi

BRANCH="content/maggie-$DATE-$(date +%H%M%S)"
git checkout -b "$BRANCH" >/dev/null
git add src/content/generated-exercises.json
git commit -m "Add Maggie content candidates for $DATE" >/dev/null

PUSH_URL="https://github.com/${REPO}.git"
git push "$PUSH_URL" "$BRANCH" >/dev/null
log "Pushed branch $BRANCH"

PR_URL="$(gh pr create \
  --repo "$REPO" \
  --head "$BRANCH" \
  --base main \
  --title "Content review: $DATE (Maggie)" \
  --label content-review \
  --body "## Maggie 内容候选

生成日期：$DATE

本 PR 由本机任务自动生成并预审。评分 ≥14/16、八项 checklist 全通过且技术校验通过时自动合并；否则保留给人工审核。审核标准见 [docs/CONTENT_REVIEW.md](https://github.com/$REPO/blob/main/docs/CONTENT_REVIEW.md)。")"
log "Created review PR: $PR_URL"

TODAY_APPROVED="$(DATE="$DATE" node -e 'const fs=require("fs");const p=process.argv[1];const a=JSON.parse(fs.readFileSync(p,"utf8"));const t=a.filter((x)=>(x.generatedAt||"").slice(0,10)===process.env.DATE);console.log(t.length>0 && t.every((x)=>x.review?.status==="approved")?"1":"0")' "$PWD/src/content/generated-exercises.json")"

if [ "$TODAY_APPROVED" = "1" ] && [ "${AUTO_MERGE:-1}" != "0" ]; then
  if gh pr merge "$PR_URL" --squash --delete-branch >/dev/null 2>&1; then
    log "Auto-approved content merged and deployment triggered."
  else
    log "Content passed auto review but merge failed; PR left open for manual merge."
  fi
else
  log "Content left open for human review."
fi
