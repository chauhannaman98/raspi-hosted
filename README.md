# 🚀 Raspberry Pi Continuous Deployment Setup (Next.js + Cloudflare Tunnel + GitHub Webhooks)

This guide walks you through setting up a Next.js app on a Raspberry Pi, exposed securely to the internet using Cloudflare Tunnel, and automated with GitHub Webhooks and PM2 for seamless CI/CD — all running under a non-root user (`admin`).

---
<<<<<<< HEAD

## 🧠 Overview

This guide covers:

- ✅ Forking your GitHub repo
- ✅ Setting up Cloudflare Tunnel for secure public access
- ✅ Configuring your domain/subdomain with Cloudflare
- ✅ Creating and managing a lightweight GitHub Webhook
- ✅ Setting up `pm2` for process management
- ✅ Automating deployments with a `deploy.sh` script
- ✅ Ensuring everything runs automatically after reboot

Perfect for self-hosted projects, dashboards, or personal apps on Raspberry Pi.

---

## ⚙️ Prerequisites

- Raspberry Pi (running Raspberry Pi OS / Debian)
- A registered domain (added in Cloudflare)
- Node.js & npm installed
- Git installed
- PM2 installed globally
=======
>>>>>>> staging

## 🧠 Overview

This guide covers:

- ✅ Forking your GitHub repo  
- ✅ Setting up Cloudflare Tunnel for secure public access  
- ✅ Configuring your domain/subdomain with Cloudflare  
- ✅ Creating and managing a lightweight GitHub Webhook  
- ✅ Setting up `pm2` for process management  
- ✅ Automating deployments with a `deploy.sh` script  
- ✅ Ensuring everything runs automatically after reboot  

Perfect for self-hosted projects, dashboards, or personal apps on Raspberry Pi.

---

## ⚙️ Prerequisites

- Raspberry Pi (running Raspberry Pi OS / Debian)
- A registered domain (added in Cloudflare)
- Node.js & npm installed
- Git installed
- PM2 installed globally
```bash
sudo npm install -g pm2
<<<<<<< HEAD
```

- A GitHub repository for your app
- Cloudflare account with an active tunnel

---

## ⚙️ PART 1 — Setup Your Raspberry Pi Environment

1. **Create a non-root user (if not already created):**

```bash
sudo adduser admin
sudo usermod -aG sudo admin
```

2. **Switch to the admin user:**

```bash
su - admin
```

3. **Setup SSH keys (for GitHub access):**

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
```

Add the key to GitHub → Settings → SSH and GPG Keys.

---

## 🪣 PART 2 — Clone Your GitHub Repository

```bash
cd ~
git clone git@github.com:yourusername/yourrepo.git raspi-hosted
cd raspi-hosted
```

Set ownership:

```bash
sudo chown -R admin:admin ~/raspi-hosted
```

---

## ☁️ PART 3 — Install and Configure Cloudflare Tunnel

1. **Install Cloudflared**

```bash
sudo apt update
sudo apt install cloudflared -y
```

2. **Authenticate Cloudflare**

```bash
cloudflared tunnel login
```

> This opens a browser; log in and select your domain.

3. **Create a new tunnel**

=======
```
- A GitHub repository for your app
- Cloudflare account with an active tunnel

---

## ⚙️ PART 1 — Setup Your Raspberry Pi Environment

1. **Create a non-root user (if not already created):**
```bash
sudo adduser admin
sudo usermod -aG sudo admin
```

2. **Switch to the admin user:**
```bash
su - admin
```

3. **Setup SSH keys (for GitHub access):**
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
```
Add the key to GitHub → Settings → SSH and GPG Keys.

------------

## 🪣 PART 2 — Clone Your GitHub Repository
```bash
cd ~
git clone git@github.com:yourusername/yourrepo.git raspi-hosted
cd raspi-hosted
```

Set ownership:
```bash
sudo chown -R admin:admin ~/raspi-hosted
```

------------

## ☁️ PART 3 — Install and Configure Cloudflare Tunnel

1. **Install Cloudflared**
```bash
sudo apt update
sudo apt install cloudflared -y
```

2. **Authenticate Cloudflare**
```bash
cloudflared tunnel login
```
> This opens a browser; log in and select your domain.

3. **Create a new tunnel**
>>>>>>> staging
```bash
cloudflared tunnel create raspi-tunnel
```

4. **Generate config file**
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

Example config.yml:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
tunnel: raspi-tunnel
credentials-file: /home/admin/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: <app.yourdomain.com>
    service: http://localhost:3000
  - hostname: <webhook.yourdomain.com>
    service: http://localhost:9000
  - service: http_status:404
```
<<<<<<< HEAD

> Replace `<tunnel-id>` with the tunnel's ID (found in .cloudflared/).

5. **Run the tunnel:**

=======
> Replace `<tunnel-id>` with the tunnel's ID (found in .cloudflared/).

5. **Run the tunnel:**
>>>>>>> staging
```bash
cloudflared tunnel run raspi-tunnel
```

<<<<<<< HEAD
---
=======
------------
>>>>>>> staging

## 🌐 PART 4 — Add Cloudflare DNS Records

Go to **Cloudflare Dashboard → DNS → Records** and **add**:

| Type  | Name    | Target                  | Proxy      |
<<<<<<< HEAD
| ----- | ------- | ----------------------- | ---------- |
| CNAME | @       | <UUID>.cfargotunnel.com | ✅ Proxied |
| CNAME | webhook | <UUID>.cfargotunnel.com | ✅ Proxied |

---
=======
| ---   | ---     | ---                     | ---         |
| CNAME | @       | <UUID>.cfargotunnel.com | ✅ Proxied |
| CNAME | webhook |	<UUID>.cfargotunnel.com | ✅ Proxied |

------------
>>>>>>> staging

## 🔁 PART 5 — Make Cloudflare Tunnel Persistent

Create a service file:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
sudo nano /etc/systemd/system/cloudflared.service
```

Paste this:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
User=admin
ExecStart=/usr/bin/cloudflared tunnel run raspi-tunnel
Restart=always
Environment=HOME=/home/admin
WorkingDirectory=/home/admin/.cloudflared

[Install]
WantedBy=multi-user.target
```

Enable it:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

Check:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
systemctl status cloudflared
```

<<<<<<< HEAD
---
=======
------------
>>>>>>> staging

## ⚡ PART 6 — PM2 Setup (Auto Restart on Reboot)

1. **Start your app manually first:**
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
cd ~/raspi-hosted
npm install
npm run build
pm2 start npm --name "raspi-hosted" -- start
```

2. **Save PM2 state:**
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
pm2 save
```

3. **Enable auto-start on boot:**
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
pm2 startup systemd
```

Follow the instruction shown (it will give you a command like `sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u admin --hp /home/admin`).

<<<<<<< HEAD
---

## 🧠 PART 7 — Create the deploy.sh Script

=======
------------

## 🧠 PART 7 — Create the deploy.sh Script
>>>>>>> staging
```bash
nano ~/deploy.sh
```

Paste this:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
#!/bin/bash

# ----------------------------
# Production-ready deploy script (fully robust)
# ----------------------------

LOGFILE="/home/admin/deploy.log"
REPO_DIR="/home/admin/raspi-hosted"
APP_NAME="raspi-hosted"
ENV_FILE="$REPO_DIR/.env"

set -e

export HOME=/home/admin
export PM2_HOME=/home/admin/.pm2
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE"; }

touch "$LOGFILE"
chown admin:admin "$LOGFILE"
chmod 664 "$LOGFILE"

cd "$REPO_DIR" || { log "❌ Failed to cd to $REPO_DIR"; exit 1; }

sudo chown -R admin:admin "$REPO_DIR"
git config --global --add safe.directory "$REPO_DIR"

if [ -f "$ENV_FILE" ]; then
    log "🔄 Loading environment variables from $ENV_FILE"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

log "🔄 Pulling latest code..."
git fetch origin master >> "$LOGFILE" 2>&1
git reset --hard origin/master >> "$LOGFILE" 2>&1

log "📦 Installing dependencies..."
npm install >> "$LOGFILE" 2>&1

log "🗑️ Clearing old build..."
rm -rf .next

log "🏗️ Building the app..."
NODE_ENV=production npm run build >> "$LOGFILE" 2>&1

log "🚀 Starting or restarting PM2..."
export HOME=/home/admin
export PM2_HOME=/home/admin/.pm2

if sudo -u admin pm2 list | grep -q "$APP_NAME"; then
    sudo -u admin pm2 restart "$APP_NAME" --update-env >> "$LOGFILE" 2>&1
else
    sudo -u admin pm2 start npm --name "$APP_NAME" -- start >> "$LOGFILE" 2>&1
fi

log "✅ Deployment complete!"
```

Make it executable:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
chmod +x ~/deploy.sh
```

<<<<<<< HEAD
---
=======
------------
>>>>>>> staging

## 🔄 PART 8 — Setup GitHub Webhook (Using webhook Package)

1. **Install webhook**
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
sudo apt install -y webhook
```

2. **Create Webhook Configuration**
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
sudo nano /etc/webhook.conf
```

Paste:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
[
  {
    "id": "github-deploy",
    "execute-command": "/home/admin/deploy.sh",
    "command-working-directory": "/home/admin/raspi-hosted",
    "response-message": "Deployment started",
    "trigger-rule": {
      "match": {
        "type": "payload-hash-sha1",
        "secret": "your_secret_here"
      }
    }
  }
]
```

3. **Create a systemd Service**
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
sudo nano /etc/systemd/system/webhook.service
```

Paste:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
[Unit]
Description=GitHub Webhook Listener
After=network.target

[Service]
User=admin
ExecStart=/usr/bin/webhook -hooks /etc/webhook.conf -verbose -port 9000
WorkingDirectory=/home/admin/raspi-hosted
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
sudo systemctl daemon-reload
sudo systemctl enable webhook
sudo systemctl start webhook
```

Test:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
curl -X POST http://localhost:9000/hooks/github-deploy
```

<<<<<<< HEAD
---
=======
------------
>>>>>>> staging

## 🔗 PART 9 — Connect GitHub to the Webhook

1. Go to GitHub → Repository → Settings → Webhooks → Add Webhook
2. Payload URL:
<<<<<<< HEAD

```bash
https://webhook.yourdomain.com/hooks/github-deploy
```

=======
```bash
https://webhook.yourdomain.com/hooks/github-deploy
```
>>>>>>> staging
3. Content type: application/json
4. Secret: The same as in /etc/webhook.conf
5. Select Just the push event
6. Save ✅

<<<<<<< HEAD
---
=======
------------
>>>>>>> staging

## 🧩 PART 10 — Verify Everything Works

Now push a new commit to your repo.
GitHub → Webhook triggers → hits your Cloudflare tunnel → Raspberry Pi’s `webhook` → runs `deploy.sh` → updates and restarts your app via PM2 🎯

Check logs:
<<<<<<< HEAD

=======
>>>>>>> staging
```bash
tail -f /home/admin/deploy.log
```

<<<<<<< HEAD
---
=======
------------
>>>>>>> staging

## 🔒 Ownership Safety Tips

- Always run processes under admin, never root.
- If any ownership errors appear:
<<<<<<< HEAD

```
sudo chown -R admin:admin /home/admin/raspi-hosted
```

- PM2 should show user as admin:
- pm2 list

---

## 🧭 Summary

| Component         | Purpose               | Port | User  |
| ----------------- | --------------------- | ---- | ----- |
=======
```
sudo chown -R admin:admin /home/admin/raspi-hosted
```
- PM2 should show user as admin:
- pm2 list

------------

## 🧭 Summary
| Component         | Purpose               | Port | User  |
| ---------         | -------               | ---- | ----  |
>>>>>>> staging
| Next.js App       | Main website          | 3000 | admin |
| Webhook Listener  | GitHub deploy trigger | 9000 | admin |
| Cloudflare Tunnel | Secure HTTPS exposure | —    | admin |
| PM2               | Process manager       | —    | admin |
