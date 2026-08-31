#!/bin/bash
# ----------------------------
# Configuration for the raspi-hosted deployment framework
# Edit this file to change paths, tokens, or behavior. Nothing else in
# deploy/ should need editing for normal use.
# ----------------------------

APP_NAME="raspi-hosted"
DEPLOY_USER="raspberry"
REPO_DIR="/home/raspberry/webapp/raspi-hosted"
LOGFILE="/home/raspberry/deploy.log"
ENV_FILE="$REPO_DIR/.env"
BRANCH="master"

export HOME=/home/raspberry
export PM2_HOME=/home/raspberry/.pm2
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

# ---------- Telegram notifications ----------
# Leave BOT_TOKEN/CHAT_ID empty to disable Telegram entirely — every call to
# telegram() becomes a silent no-op, so deployments work fine without it.
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""

# ---------- Health check ----------
HEALTH_URL="http://localhost:3000"
HEALTH_RETRIES=10
HEALTH_RETRY_DELAY=3

# ---------- Deployment lock ----------
# Prevents two overlapping webhook deliveries from running git/npm/pm2 at
# the same time.
LOCK_FILE="/tmp/${APP_NAME}-deploy.lock"

# ---------- Webhook de-dup ----------
# If GitHub fires the same commit twice, the second delivery is skipped.
LAST_COMMIT_FILE="/tmp/${APP_NAME}-last-deployed-commit"

# ---------- Dashboard status file ----------
# Read by app/api/deploy-status/route.js and shown on the /stats dashboard.
STATUS_FILE="$REPO_DIR/deploy/status.json"
