# SmartFinPro — Fortress Admin Handbook

> Self-hosted deployment on Cloudways Node.js VPS with Cloudflare Enterprise.
> Last updated: February 11, 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Server Setup (Cloudways)](#2-server-setup-cloudways)
3. [First Deployment](#3-first-deployment)
4. [PM2 Process Management](#4-pm2-process-management)
5. [Cron Jobs (Linux Crontab)](#5-cron-jobs-linux-crontab)
6. [Cloudflare Enterprise Configuration](#6-cloudflare-enterprise-configuration)
7. [Cloudflare Zero Trust (Access)](#7-cloudflare-zero-trust-access)
8. [Security Headers](#8-security-headers)
9. [Maintenance & Backups](#9-maintenance--backups)
10. [Logging](#10-logging)
11. [Environment Variables](#11-environment-variables)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Architecture Overview

```
                ┌─────────────────────────────────────┐
                │         Cloudflare Enterprise        │
                │  (DNS, CDN, WAF, DDoS, Zero Trust)   │
                │  ┌─────────┐  ┌──────────┐          │
                │  │  Cache   │  │   WAF    │          │
                │  │  (HTML,  │  │  Rules   │          │
                │  │  assets) │  │          │          │
                │  └────┬────┘  └────┬─────┘          │
                └───────┼────────────┼────────────────┘
                        │            │
                        ▼            ▼
              ┌──────────────────────────────┐
              │    Cloudways Node.js VPS     │
              │  ┌────────────────────────┐  │
              │  │   PM2 (Cluster Mode)   │  │
              │  │  ┌──────────────────┐  │  │
              │  │  │  Next.js 16.1.6  │  │  │
              │  │  │  (Port 3000)     │  │  │
              │  │  └──────────────────┘  │  │
              │  └────────────────────────┘  │
              │  ┌────────────────────────┐  │
              │  │  Linux Crontab         │  │
              │  │  (curl → /api/cron/*)  │  │
              │  └────────────────────────┘  │
              └──────────────────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │   Supabase (Cloud)   │
              │   PostgreSQL + Auth  │
              └──────────────────────┘
```

**Stack:**
- **Runtime:** Node.js 20 LTS on Cloudways VPS
- **Framework:** Next.js 16.1.6 (App Router, Turbopack)
- **Process Manager:** PM2 (cluster mode, auto-restart)
- **CDN/Security:** Cloudflare Enterprise ($4.99 add-on)
- **Database:** Supabase (hosted PostgreSQL)
- **Email:** Resend API
- **Cron:** Linux crontab + CRON_SECRET auth

---

## 2. Server Setup (Cloudways)

### 2.1 Create Application

1. Log into Cloudways Dashboard
2. **Add Application** → Select **Node.js**
3. Choose server size: **2 GB RAM / 1 vCPU** minimum (recommended: 4 GB)
4. Select datacenter closest to primary audience (US East or EU West)

### 2.2 SSH Access

```bash
# SSH into Cloudways
ssh master@YOUR_SERVER_IP -p 22

# Navigate to app directory
cd /home/master/applications/smartfinpro/public_html
```

### 2.3 Install Prerequisites

```bash
# Install PM2 globally
npm install -g pm2

# Install Node.js 20 LTS (if not default)
nvm install 20
nvm use 20
nvm alias default 20

# Create log directory
mkdir -p /home/master/applications/smartfinpro/logs
mkdir -p /home/master/backups/smartfinpro
```

---

## 3. First Deployment

```bash
cd /home/master/applications/smartfinpro/public_html

# 1. Clone repository
git clone https://github.com/YOUR_ORG/smartfinpro.git .

# 2. Install dependencies
npm ci

# 3. Create .env.local (see Section 11)
nano .env.local

# 4. Build production bundle
NODE_ENV=production npm run build

# 5. Start with PM2
pm2 start ecosystem.config.js --env production

# 6. Save PM2 config for auto-restart on reboot
pm2 save
pm2 startup
# → Follow the printed command (copy/paste with sudo)

# 7. Verify
curl -sf http://localhost:3000/ && echo "OK" || echo "FAIL"
pm2 status
```

---

## 4. PM2 Process Management

### Common Commands

```bash
# Status overview
pm2 status

# Detailed info
pm2 show smartfinpro

# Real-time monitoring
pm2 monit

# Restart (hard)
pm2 restart smartfinpro

# Reload (zero-downtime, graceful)
pm2 reload smartfinpro

# Stop
pm2 stop smartfinpro

# View logs
pm2 logs smartfinpro --lines 100

# Flush logs
pm2 flush smartfinpro
```

### Zero-Downtime Deployment

```bash
cd /home/master/applications/smartfinpro/public_html
git pull --ff-only origin main
npm ci
NODE_ENV=production npm run build
pm2 reload smartfinpro --update-env
```

Or use the maintenance script:

```bash
./scripts/maintenance.sh deploy
```

---

## 5. Cron Jobs (Linux Crontab)

### 5.1 Setup

All cron jobs call internal API endpoints with Bearer token authentication.

```bash
# Open crontab editor
crontab -e
```

### 5.2 Crontab Entries

Add these lines (replace `YOUR_CRON_SECRET` with the actual secret):

```crontab
# ============================================================
# SmartFinPro — Scheduled Jobs
# ============================================================

# Revenue sync — Daily at 2:00 AM UTC
0 2 * * * curl -sf -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/sync-revenue >> /home/master/applications/smartfinpro/logs/cron.log 2>&1

# Conversion sync — Daily at 6:00 AM UTC
0 6 * * * curl -sf -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/sync-conversions >> /home/master/applications/smartfinpro/logs/cron.log 2>&1

# Email nurture sequence — Daily at 10:00 AM UTC
0 10 * * * curl -sf -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/send-emails >> /home/master/applications/smartfinpro/logs/cron.log 2>&1

# Log rotation — Weekly on Sunday at midnight
0 0 * * 0 /home/master/applications/smartfinpro/public_html/scripts/maintenance.sh rotate >> /home/master/applications/smartfinpro/logs/cron.log 2>&1

# Health check — Every 5 minutes (optional)
*/5 * * * * curl -sf http://localhost:3000/ > /dev/null || pm2 reload smartfinpro 2>&1
```

### 5.3 Security

- All cron endpoints require `Authorization: Bearer CRON_SECRET`
- Endpoints reject requests if `CRON_SECRET` is not set or uses default value
- Failed auth attempts are logged with IP and User-Agent
- Cron calls use `localhost:3000` — never exposed to the internet directly

---

## 6. Cloudflare Enterprise Configuration

### 6.1 DNS Setup

1. Add domain `smartfinpro.com` to Cloudflare
2. Set DNS records:
   - `A` → `smartfinpro.com` → `YOUR_SERVER_IP` (proxied, orange cloud)
   - `A` → `www.smartfinpro.com` → `YOUR_SERVER_IP` (proxied)
3. Set SSL mode: **Full (Strict)**

### 6.2 Caching Rules

Create the following **Cache Rules** in Cloudflare dashboard:

#### Rule 1: Static Assets — Cache Everything (1 year)

```
URI Path matches: /static/* OR /_next/static/* OR *.woff2
→ Cache Level: Cache Everything
→ Edge TTL: 1 year (31536000s)
→ Browser TTL: 1 year
```

#### Rule 2: HTML Pages — Moderate Cache (1 hour + stale)

```
URI Path matches: NOT /api/* AND NOT /dashboard/*
Content-Type: text/html
→ Cache Level: Cache Everything
→ Edge TTL: 1 hour
→ Browser TTL: 1 hour
→ Stale-While-Revalidate: 1 day
```

#### Rule 3: API & Dashboard — Bypass Cache

```
URI Path matches: /api/* OR /dashboard/*
→ Cache Level: Bypass
→ Disable Performance (minify, etc.)
```

#### Rule 4: Sitemap & Robots — Daily Cache

```
URI Path matches: /sitemap.xml OR /robots.txt
→ Cache Level: Cache Everything
→ Edge TTL: 1 day
→ Browser TTL: 1 day
```

### 6.3 Page Rules (Legacy Fallback)

```
smartfinpro.com/_next/static/*   → Cache Level: Cache Everything, Edge TTL: 1 month
smartfinpro.com/api/*            → Cache Level: Bypass
```

### 6.4 Speed Optimizations

In Cloudflare Dashboard → Speed:

- **Auto Minify:** CSS ✅, JavaScript ✅, HTML ✅
- **Brotli:** ✅ Enabled
- **Early Hints:** ✅ Enabled
- **HTTP/2 & HTTP/3:** ✅ Enabled
- **0-RTT Connection Resumption:** ✅ Enabled
- **Rocket Loader:** ❌ Disabled (conflicts with Next.js hydration)
- **Mirage:** ❌ Disabled (Next.js handles image optimization)

---

## 7. Cloudflare Zero Trust (Access)

Protect the `/dashboard` route and deployment interfaces using Cloudflare Access with WebAuthn (YubiKey).

### 7.1 Setup Access Application

1. Go to **Cloudflare Zero Trust** → **Access** → **Applications**
2. **Add Application** → **Self-hosted**
3. Configure:

```
Application name: SmartFinPro Dashboard
Session Duration: 24 hours
Application domain: smartfinpro.com
Path: /dashboard
```

### 7.2 Access Policy (WebAuthn/YubiKey)

Create a policy:

```
Policy name: Admin Only — WebAuthn
Action: Allow
Include:
  - Emails: your-email@example.com
Require:
  - Authentication Method: WebAuthn (hardware key)
```

### 7.3 Additional Protected Paths

Create separate applications for:

| Path | Policy | Notes |
|---|---|---|
| `/dashboard/*` | Admin — WebAuthn | Main admin area |
| `/api/cron/*` | Service Token | Cron jobs (use Cloudflare Service Tokens) |

### 7.4 Service Tokens for Cron

If cron jobs go through Cloudflare (not localhost):

1. **Zero Trust** → **Access** → **Service Tokens**
2. Create token: `smartfinpro-cron`
3. Add to crontab:

```bash
curl -sf \
  -H "CF-Access-Client-Id: YOUR_CLIENT_ID" \
  -H "CF-Access-Client-Secret: YOUR_CLIENT_SECRET" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://smartfinpro.com/api/cron/sync-revenue
```

> **Note:** Since cron runs on localhost, Cloudflare Access is typically bypassed. Only needed if you want external triggering.

---

## 8. Security Headers

Security headers are configured in `next.config.ts` and also enforced via Cloudflare.

### 8.1 Headers Set by Next.js (origin server)

| Header | Value |
|---|---|
| `Content-Security-Policy` | Strict CSP with self, inline, specific domains |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Camera, mic, geo, payment disabled |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` |
| `Cross-Origin-Resource-Policy` | `same-site` |

### 8.2 Cloudflare Transform Rules (additional)

Add in Cloudflare Dashboard → **Rules** → **Transform Rules** → **Modify Response Headers**:

```
Set: X-Robots-Tag → noindex, nofollow   (for /dashboard/* paths only)
Set: Cache-Control → no-store            (for /api/* paths only)
Remove: Server                            (all paths)
Remove: X-Powered-By                      (all paths)
```

### 8.3 Cloudflare WAF Rules

Enable in **Security** → **WAF**:

- **Managed Rules:** ✅ Cloudflare Managed Ruleset
- **OWASP Core Ruleset:** ✅ Enabled (Medium sensitivity)
- **Rate Limiting:** Create rule for `/api/*` — 60 requests/minute per IP
- **Bot Fight Mode:** ✅ Enabled
- **Challenge Passage:** 30 minutes

---

## 9. Maintenance & Backups

### 9.1 Maintenance Script

```bash
# Full backup (app + .env + build artifacts)
./scripts/maintenance.sh backup

# Zero-downtime deployment (pull → build → reload)
./scripts/maintenance.sh deploy

# Health check
./scripts/maintenance.sh status

# Log rotation
./scripts/maintenance.sh rotate

# Clean caches
./scripts/maintenance.sh cleanup

# Tail live logs
./scripts/maintenance.sh logs
```

### 9.2 Backup Retention

- **Automatic:** 7 most recent backups kept
- **Location:** `/home/master/backups/smartfinpro/`
- **Contents:** Source code, .env, .next build, PM2 config
- **Excludes:** `node_modules`, `.next/cache`

### 9.3 Recommended Backup Schedule

Add to crontab:

```crontab
# Daily backup at 1 AM UTC
0 1 * * * /home/master/applications/smartfinpro/public_html/scripts/maintenance.sh backup >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
```

---

## 10. Logging

### 10.1 Log Locations

| Log | Path | Content |
|---|---|---|
| PM2 Access | `/home/master/applications/smartfinpro/logs/access.log` | stdout, request logs |
| PM2 Error | `/home/master/applications/smartfinpro/logs/error.log` | stderr, exceptions |
| Cron | `/home/master/applications/smartfinpro/logs/cron.log` | Cron job output |
| Archive | `/home/master/applications/smartfinpro/logs/archive/` | Rotated, compressed logs |

### 10.2 Log Format

PM2 logs are in JSON format (configured in `ecosystem.config.js`):

```json
{
  "timestamp": "2026-02-11 14:30:00 +0000",
  "type": "out",
  "process_id": 0,
  "message": "[sync-revenue] Starting revenue sync..."
}
```

### 10.3 Log Commands

```bash
# Real-time logs
pm2 logs smartfinpro

# Last 200 lines, errors only
pm2 logs smartfinpro --err --lines 200

# Flush (clear) all logs
pm2 flush smartfinpro

# Rotate manually
./scripts/maintenance.sh rotate
```

---

## 11. Environment Variables

Create `.env.local` on the production server:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Site URL (PRODUCTION)
NEXT_PUBLIC_SITE_URL=https://smartfinpro.com
NEXT_PUBLIC_BASE_URL=https://smartfinpro.com

# Cron Job Secret (generate: openssl rand -hex 32)
CRON_SECRET=YOUR_SECURE_64_CHAR_HEX_SECRET

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=SmartFinPro <hello@smartfinpro.com>

# Analytics
PLAUSIBLE_DOMAIN=smartfinpro.com

# Affiliate Network API Keys
FINANCEADS_API_KEY=xxx
AWIN_API_KEY=xxx
```

**Generate a secure CRON_SECRET:**

```bash
openssl rand -hex 32
```

---

## 12. Troubleshooting

### App won't start

```bash
pm2 logs smartfinpro --err --lines 50
# Check for missing env vars or build errors
npm run build  # Rebuild
pm2 restart smartfinpro
```

### Port 3000 already in use

```bash
lsof -i :3000
kill -9 <PID>
pm2 restart smartfinpro
```

### Cron jobs not running

```bash
# Test manually
curl -v -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/cron/sync-revenue

# Check crontab
crontab -l

# Check cron log
tail -50 /home/master/applications/smartfinpro/logs/cron.log
```

### High memory usage

```bash
pm2 monit
# PM2 auto-restarts at 512MB (configured in ecosystem.config.js)
# Reduce instances if needed:
pm2 scale smartfinpro 2
```

### Cloudflare cache issues

```bash
# Purge everything
# Cloudflare Dashboard → Caching → Purge Everything

# Or via API:
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### SSL certificate issues

- Ensure Cloudflare SSL mode is **Full (Strict)**
- Cloudways provides Origin Certificate — install it on the server
- Or use Cloudflare Origin CA certificate

---

## Quick Reference Card

| Action | Command |
|---|---|
| Deploy | `./scripts/maintenance.sh deploy` |
| Status | `./scripts/maintenance.sh status` |
| Backup | `./scripts/maintenance.sh backup` |
| Logs | `pm2 logs smartfinpro` |
| Restart | `pm2 reload smartfinpro` |
| Build | `npm run build` |
| Health | `npm run health` |
| Cron test | `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-revenue` |

---

*Generated for SmartFinPro — Fortress-Grade Self-Hosted Infrastructure*
