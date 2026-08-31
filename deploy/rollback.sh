#!/bin/bash
# ----------------------------
# Automatic rollback to the last commit that was running before this
# deployment attempt started.
# ----------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./config.sh
source "$SCRIPT_DIR/config.sh"
source "$SCRIPT_DIR/telegram.sh"
source "$SCRIPT_DIR/healthcheck.sh"

# rollback <target_commit>
# Resets the working tree back to $1, reinstalls/rebuilds, restarts PM2, and
# re-runs the health check to confirm the rollback actually fixed things.
rollback() {
    local target_commit="$1"

    log_warn "🔄 Rolling back to $target_commit..."
    notify_rollback_start

    if ! git reset --hard "$target_commit" >> "$LOGFILE" 2>&1; then
        log_error "❌ git reset during rollback failed"
        notify_rollback_failure
        return 1
    fi

    if ! npm ci >> "$LOGFILE" 2>&1; then
        log_error "❌ npm ci during rollback failed"
        notify_rollback_failure
        return 1
    fi

    if ! NODE_ENV=production npm run build >> "$LOGFILE" 2>&1; then
        log_error "❌ build during rollback failed"
        notify_rollback_failure
        return 1
    fi

    if ! pm2 restart "$APP_NAME" --update-env >> "$LOGFILE" 2>&1; then
        log_error "❌ pm2 restart during rollback failed"
        notify_rollback_failure
        return 1
    fi

    sleep 5

    if healthcheck; then
        log_info "✅ Rollback successful. Back on $target_commit."
        notify_rollback_success "$target_commit"
        return 0
    fi

    log_error "❌ Rollback completed but health check is still failing"
    notify_rollback_failure
    return 1
}
