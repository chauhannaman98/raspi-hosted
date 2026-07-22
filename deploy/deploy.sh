#!/bin/bash
# ----------------------------
# Production deployment orchestrator for raspi-hosted
#
# Run manually:  ./deploy/deploy.sh
# Run via webhook: point /etc/webhook.conf's execute-command at this file's
# absolute path (see deploy/README.md).
# ----------------------------

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"
source "$SCRIPT_DIR/common.sh"
source "$SCRIPT_DIR/telegram.sh"
source "$SCRIPT_DIR/healthcheck.sh"
source "$SCRIPT_DIR/rollback.sh"

# From here on everything is appended to the logfile, and `set -x` gives a
# full command trace — matching the visibility the original single-file
# script had, just split across modules now.
exec >>"$LOGFILE" 2>&1
set -x

STAGE="init"
LAST_COMMIT=""

# Central failure handler. Called either by the ERR trap (for any command
# that fails under `set -e`) or explicitly (for checks like healthcheck that
# use `||` and so don't trip the trap on their own). Attempts a rollback if
# we have a known-good commit to roll back to, notifies Telegram, writes
# status.json, releases the lock, and exits non-zero.
handle_failure() {
    local stage="$1"
    set +e +x
    log_error "❌ Deployment failed at stage: $stage"
    notify_failure "$stage"

    if [ -n "$LAST_COMMIT" ]; then
        if rollback "$LAST_COMMIT"; then
            write_status "rolled_back" "$(elapsed_seconds)" "$LAST_COMMIT" "$(commit_author)" "$(commit_message)"
        else
            write_status "rollback_failed" "$(elapsed_seconds)" "$LAST_COMMIT" "$(commit_author)" "$(commit_message)"
        fi
    else
        write_status "failed" "$(elapsed_seconds)" "$(current_commit)" "$(commit_author)" "$(commit_message)"
    fi

    release_lock
    exit 1
}

trap 'handle_failure "$STAGE"' ERR

main() {
    start_timer
    acquire_lock

    STAGE="cd repo"
    cd "$REPO_DIR"

    STAGE="permissions"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$REPO_DIR"
    git config --global --add safe.directory "$REPO_DIR"

    STAGE="load env"
    if [ -f "$ENV_FILE" ]; then
        log_info "🔄 Loading environment variables from $ENV_FILE"
        set -a
        # shellcheck source=/dev/null
        source "$ENV_FILE"
        set +a
    fi

    STAGE="check updates"
    log_info "🔄 Checking for updates..."
    git fetch origin "$BRANCH"

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse "origin/$BRANCH")

    if [ "$LOCAL" = "$REMOTE" ]; then
        log_info "✅ Already up to date. Nothing to deploy."
        release_lock
        exit 0
    fi

    # Webhook de-dup: skip if this exact remote commit was already the last
    # one we successfully deployed (protects against GitHub firing the same
    # delivery twice in quick succession).
    if [ -f "$LAST_COMMIT_FILE" ] && [ "$(cat "$LAST_COMMIT_FILE")" = "$REMOTE" ]; then
        log_info "↩️ Commit $REMOTE already deployed. Skipping duplicate webhook."
        release_lock
        exit 0
    fi

    LAST_COMMIT="$LOCAL"
    log_info "⬇️ New commit detected: $REMOTE"
    notify_start

    STAGE="git reset"
    git reset --hard "origin/$BRANCH"

    STAGE="dependencies"
    OLD_LOCK=$(git rev-parse HEAD:package-lock.json 2>/dev/null || echo "")
    NEW_LOCK=$(git rev-parse "origin/$BRANCH:package-lock.json" 2>/dev/null || echo "")
    if [ "$OLD_LOCK" != "$NEW_LOCK" ]; then
        log_info "📦 package-lock.json changed. Installing dependencies..."
        npm ci
    else
        log_info "📦 Dependencies unchanged. Skipping npm ci."
    fi

    STAGE="clean build"
    log_info "🗑️ Clearing old build..."
    rm -rf .next

    STAGE="build"
    log_info "🏗️ Building the app..."
    NODE_ENV=production npm run build

    STAGE="pm2 restart"
    log_info "🚀 Starting or restarting PM2..."
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 restart "$APP_NAME" --update-env
    else
        pm2 start npm --name "$APP_NAME" -- start
    fi

    sleep 5

    STAGE="health check"
    healthcheck || handle_failure "health check"

    DURATION=$(elapsed_seconds)
    echo "$REMOTE" > "$LAST_COMMIT_FILE"

    log_info "✅ Deployment complete in ${DURATION}s!"
    notify_success "$DURATION"
    write_status "success" "$DURATION" "$(current_commit)" "$(commit_author)" "$(commit_message)"

    release_lock
}

main "$@"
