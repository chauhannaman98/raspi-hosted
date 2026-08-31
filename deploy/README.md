# Deployment framework

This replaces the old single `deploy.sh` with a small set of focused scripts.

```
deploy/
├── deploy.sh        # Main orchestrator — this is what the webhook calls
├── common.sh        # Logging, colors, lock handling, git info, status.json writer
├── telegram.sh       # Telegram notification helper
├── healthcheck.sh    # Health verification with retries
├── rollback.sh       # Automatic rollback to the last-known-good commit
├── config.sh         # All configuration lives here
└── status.json       # Generated at runtime — last deployment result (gitignored)
```

## What it does

1. Acquires a lock (`flock`) so two webhook deliveries can never deploy at once.
2. Checks `origin/master` for a new commit; exits early if already up to date,
   or if this exact commit was already deployed (de-dupes duplicate webhook
   deliveries).
3. Sends a Telegram "Deployment started" message (if configured).
4. `git reset --hard`, `npm ci` (only if `package-lock.json` changed), clears
   `.next`, builds, restarts PM2.
5. Health-checks `http://localhost:3000` with retries.
6. On success: sends a Telegram success message and writes `deploy/status.json`.
7. On failure at any stage: sends a Telegram failure message, **automatically
   rolls back** to the commit that was running before the deploy started,
   re-runs the health check, and reports rollback success/failure.

## Setup

1. Edit `deploy/config.sh`:
   - `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` — leave blank to disable Telegram.
   - Double-check `REPO_DIR`, `DEPLOY_USER`, `LOGFILE`, `BRANCH` match your setup.
2. Make the scripts executable:
   ```bash
   chmod +x deploy/*.sh
   ```
3. Point your webhook at the new script path. In `/etc/webhook.conf`, update
   `execute-command` from the old `~/deploy.sh` to:
   ```
   /home/raspberry/webapp/raspi-hosted/deploy/deploy.sh
   ```
4. Test manually first:
   ```bash
   ./deploy/deploy.sh
   ```
   Colored output prints to your terminal; `deploy.log` stays plain text either way.

## Dashboard integration

Every successful (or failed/rolled-back) deployment writes `deploy/status.json`,
e.g.:

```json
{
  "status": "success",
  "time": "2026-07-22T11:35:44Z",
  "duration": 18,
  "commit": "97c66b2",
  "author": "Naman Chauhan",
  "message": "Improve deployment"
}
```

`app/api/deploy-status/route.js` reads this file, and the Services tab on
`/stats` shows it as a "Last Deployment" card.

## Notes

- `status.json` is gitignored — it's runtime-generated, not committed, and
  untracked files survive `git reset --hard`.
- `deploy.lock` and the "last deployed commit" marker live in `/tmp/`, not in
  the repo, so they don't need gitignoring here.
- Telegram, rollback, and the status file are all best-effort: a Telegram
  outage or a `status.json` write failure will never block or fail a
  deployment.
