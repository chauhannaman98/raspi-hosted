#!/bin/bash
# ----------------------------
# Application health verification
# ----------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./config.sh
source "$SCRIPT_DIR/config.sh"

# Polls HEALTH_URL up to HEALTH_RETRIES times, waiting HEALTH_RETRY_DELAY
# seconds between attempts. This avoids failing a deploy just because PM2 /
# Next.js hasn't finished booting yet on a slower Pi.
healthcheck() {
    local attempt=1
    local status="000"

    while [ "$attempt" -le "$HEALTH_RETRIES" ]; do
        status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" || echo "000")

        if [ "$status" = "200" ]; then
            log_info "✅ Health check passed (attempt $attempt/$HEALTH_RETRIES, HTTP $status)"
            return 0
        fi

        log_warn "⏳ Health check attempt $attempt/$HEALTH_RETRIES failed (HTTP $status). Retrying in ${HEALTH_RETRY_DELAY}s..."
        sleep "$HEALTH_RETRY_DELAY"
        attempt=$((attempt + 1))
    done

    log_error "❌ Health check failed after $HEALTH_RETRIES attempts (last HTTP $status)"
    return 1
}
