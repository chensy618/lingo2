#!/bin/zsh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEY_DIR="$HOME/.config/lingo2"
KEY_FILE="$KEY_DIR/maggie.env"
PLIST="$HOME/Library/LaunchAgents/com.uit.lingo2.content.plist"
LOG_DIR="$HOME/Library/Logs"
LABEL="com.uit.lingo2.content"
HOUR="${HOUR:-15}"

mkdir -p "$KEY_DIR" "$HOME/Library/LaunchAgents" "$LOG_DIR"
chmod 700 "$KEY_DIR"

if [ -n "${MAGGIE_API_KEY:-}" ]; then
  printf 'MAGGIE_API_KEY=%q\n' "$MAGGIE_API_KEY" > "$KEY_FILE"
  chmod 600 "$KEY_FILE"
  echo "Stored Maggie key in $KEY_FILE"
elif [ ! -f "$KEY_FILE" ]; then
  echo "MAGGIE_API_KEY is not set and $KEY_FILE does not exist." >&2
  echo "Run: MAGGIE_API_KEY='...' ./scripts/install-maggie-schedule.sh" >&2
  exit 1
fi

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>$REPO_DIR/scripts/maggie-daily.sh</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$REPO_DIR</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>LINGO2_REPO_DIR</key>
    <string>$REPO_DIR</string>
  </dict>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>$HOUR</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/lingo2-content.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/lingo2-content.log</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
PLIST

launchctl bootout "gui/$(id -u)" "$PLIST" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl enable "gui/$(id -u)/$LABEL"
echo "Installed $LABEL: daily at $HOUR:00"
echo "Log: $LOG_DIR/lingo2-content.log"
echo "Test now: launchctl kickstart -k gui/$(id -u)/$LABEL"
