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
OPEN_PR="$(gh pr list --repo "$REPO" --state open --search "Content review: $DATE" --json number --jq '.[0].number // empty')"
if [ -n "$OPEN_PR" ] && [ "${FORCE:-0}" != "1" ]; then
  log "Open review PR #$OPEN_PR already exists for $DATE; skipping."
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

gh pr create \
  --repo "$REPO" \
  --head "$BRANCH" \
  --base main \
  --title "Content review: $DATE (Maggie)" \
  --label content-review \
  --body "## Maggie 内容候选

生成日期：$DATE

本 PR 只包含 \`pending\` 候选，未审核内容不会出现在网站上。请按 [内容审核标准](https://github.com/$REPO/blob/main/docs/CONTENT_REVIEW.md) 逐条审核，并直接修改 \`src/content/generated-exercises.json\`：

- [ ] 检查三语言语义、自然度与等级
- [ ] 检查语域、语法、解析与原创性
- [ ] 为 \`approved\` 条目填写 reviewer、reviewedAt、score、checklist
- [ ] 校验通过后合并发布" >/dev/null

log "Created review PR for $BRANCH"
