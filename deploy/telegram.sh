#!/bin/bash
# ----------------------------
# Telegram notifications
# All deployment messages funnel through the single telegram() function so
# formatting stays consistent. No-ops silently if BOT_TOKEN/CHAT_ID are
# unset, so Telegram remains fully optional.
# ----------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./config.sh
source "$SCRIPT_DIR/config.sh"

telegram() {
    local message="$1"

    if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
        return 0
    fi

    curl -s -m 10 \
        -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="$TELEGRAM_CHAT_ID" \
        -d parse_mode="Markdown" \
        --data-urlencode "text=$message" \
        > /dev/null 2>&1 || log_warn "⚠️ Telegram notification failed to send"
}

notify_start() {
    telegram "🚀 *Deployment Started*
*Repository:* ${APP_NAME}
*Commit:* \`$(current_commit)\`
*Time:* $(date '+%H:%M:%S')"
}

notify_success() {
    local duration="$1"
    telegram "✅ *Deployment Successful*
*Commit:* \`$(current_commit)\`
*Author:* $(commit_author)
*Message:* $(commit_message)
*Duration:* ${duration} sec
*Health Check:* Passed"
}

notify_failure() {
    local stage="$1"
    telegram "❌ *Deployment Failed*
*Stage:* ${stage}
*Commit:* \`$(current_commit)\`
See deploy.log for details."
}

notify_rollback_start() {
    telegram "⚠️ *Deployment Failed*
Rolling back..."
}

notify_rollback_success() {
    telegram "✅ *Rollback Successful*
Restored to \`$1\` and app is healthy again."
}

notify_rollback_failure() {
    telegram "❌ *Rollback Failed*
Manual intervention required on ${APP_NAME}. Check deploy.log immediately."
}
