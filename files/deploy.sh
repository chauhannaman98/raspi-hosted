#!/bin/bash 

# ---------------------------- 
# Production-ready deploy script (fully robust) 
# ---------------------------- 

LOGFILE="/home/raspberry/deploy.log" 
REPO_DIR="/home/raspberry/webapp/raspi-hosted" 
APP_NAME="raspi-hosted" 
ENV_FILE="$REPO_DIR/.env" 

set -e 
exec >>"$LOGFILE" 2>&1 
set -x 

export HOME=/home/raspberry 
export PM2_HOME=/home/raspberry/.pm2 
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin 

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE"; } 

touch "$LOGFILE" 
chown raspberry:raspberry "$LOGFILE" 
chmod 664 "$LOGFILE" 

cd "$REPO_DIR" || { log "❌ Failed to cd to $REPO_DIR"; exit 1; } 

chown -R raspberry:raspberry "$REPO_DIR" 
git config --global --add safe.directory "$REPO_DIR" 

if [ -f "$ENV_FILE" ]; then 
    log "🔄 Loading environment variables from $ENV_FILE" 
    export $(grep -v '^#' "$ENV_FILE" | xargs) 
fi 

log "🔄 Checking for updates..." 

git fetch origin master >> "$LOGFILE" 2>&1 

LOCAL=$(git rev-parse HEAD) 
REMOTE=$(git rev-parse origin/master) 

if [ "$LOCAL" = "$REMOTE" ]; then 
    log "✅ Already up to date. Nothing to deploy." 
    exit 0 
fi 

log "⬇️ New commit detected."
git reset --hard origin/master >> "$LOGFILE" 2>&1 

OLD_LOCK=$(git rev-parse HEAD:package-lock.json 2>/dev/null || echo "") 
NEW_LOCK=$(git rev-parse origin/master:package-lock.json 2>/dev/null || echo "") 

if [ "$OLD_LOCK" != "$NEW_LOCK" ]; then 
    log "📦 package-lock.json changed. Installing dependencies..." 
    npm ci >> "$LOGFILE" 2>&1 
else 
    log "📦 Dependencies unchanged. Skipping npm ci." 
fi 

log "🗑️ Clearing old build..." 
rm -rf .next 

log "🏗️ Building the app..." 
NODE_ENV=production npm run build >> "$LOGFILE" 2>&1 

log "🚀 Starting or restarting PM2..." 
export HOME=/home/raspberry 
export PM2_HOME=/home/raspberry/.pm2 

if pm2 list | grep -q "$APP_NAME"; then 
    pm2 restart "$APP_NAME" --update-env >> "$LOGFILE" 2>&1 
else 
    pm2 start npm --name "$APP_NAME" -- start >> "$LOGFILE" 2>&1 
fi 

sleep 5 

STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000) 

if [ "$STATUS" != "200" ]; then 
    log "❌ Health check failed. HTTP $STATUS" 
    exit 1 
fi 

log "✅ Health check passed." 

log "✅ Deployment complete!"
