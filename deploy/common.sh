#!/bin/bash
# ----------------------------
# Shared helpers: colored logging, lock handling, git info, timer,
# and the status.json writer used by the dashboard.
# ----------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./config.sh
source "$SCRIPT_DIR/config.sh"

# Colors are only used when attached to a real terminal (i.e. you ran
# ./deploy.sh by hand). The webhook service runs this with stdout redirected
# to a file, so colors are automatically skipped there and deploy.log stays
# plain text.
if [ -t 1 ]; then
    C_GREEN='\033[0;32m'
    C_RED='\033[0;31m'
    C_YELLOW='\033[1;33m'
    C_NC='\033[0m'
else
    C_GREEN=''; C_RED=''; C_YELLOW=''; C_NC=''
fi

touch "$LOGFILE"
chown "$DEPLOY_USER:$DEPLOY_USER" "$LOGFILE" 2>/dev/null || true
chmod 664 "$LOGFILE"

_log_raw() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOGFILE"
}

log_info()  { echo -e "${C_GREEN}$1${C_NC}";  _log_raw "$1"; }
log_warn()  { echo -e "${C_YELLOW}$1${C_NC}"; _log_raw "$1"; }
log_error() { echo -e "${C_RED}$1${C_NC}";    _log_raw "$1"; }

# ---------- Lock handling ----------
# Uses flock on a fixed fd (200) so two overlapping webhook deliveries can
# never run `git reset --hard` / `npm ci` / `pm2 restart` concurrently.
acquire_lock() {
    exec 200>"$LOCK_FILE"
    if ! flock -n 200; then
        log_warn "⚠️ Deployment already running (lock held on $LOCK_FILE). Exiting."
        exit 0
    fi
}

release_lock() {
    flock -u 200 2>/dev/null || true
}

# ---------- Timer ----------
start_timer() { DEPLOY_START=$(date +%s); }
elapsed_seconds() { echo $(( $(date +%s) - DEPLOY_START )); }

# ---------- Git info ----------
current_commit()  { git rev-parse --short HEAD 2>/dev/null || echo "unknown"; }
commit_author()   { git log -1 --pretty=format:'%an' 2>/dev/null || echo "unknown"; }
commit_message()  { git log -1 --pretty=format:'%s' 2>/dev/null || echo ""; }

# ---------- Status file for the /stats dashboard ----------
# Writes deploy/status.json so the Next.js dashboard can show "Last
# Deployment" without parsing deploy.log. Free-text fields are escaped so
# the output is always valid JSON even if a commit message contains quotes.
write_status() {
    local status="$1" duration="$2" commit="$3" author="$4" message="$5"
    author=$(printf '%s' "$author" | sed 's/\\/\\\\/g; s/"/\\"/g')
    message=$(printf '%s' "$message" | sed 's/\\/\\\\/g; s/"/\\"/g')

    cat > "$STATUS_FILE" <<EOF
{
  "status": "$status",
  "time": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "duration": $duration,
  "commit": "$commit",
  "author": "$author",
  "message": "$message"
}
EOF
    chown "$DEPLOY_USER:$DEPLOY_USER" "$STATUS_FILE" 2>/dev/null || true
}
