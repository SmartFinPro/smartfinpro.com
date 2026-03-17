# 🚀 SmartFinPro Production Environment Checklist

> Complete checklist for Vercel deployment
> Last updated: February 2026

---

## ✅ Pre-Deployment Checklist

### 1. Vercel Project Setup
- [ ] Create new Vercel project linked to GitHub repo
- [ ] Set Framework Preset to "Next.js"
- [ ] Configure build settings (automatic detection should work)
- [ ] Connect custom domain: `smartfinpro.com`
- [ ] Enable Vercel Analytics (optional, free tier available)

---

## 🔐 Environment Variables (Vercel Dashboard)

### REQUIRED - Core Infrastructure

| Variable | Description | Where to Get | Example |
|----------|-------------|--------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | [Supabase Dashboard](https://app.supabase.com) → Project Settings → API | `https://abc123xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | Same location | `eyJhbGci...` (long JWT) |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (⚠️ SECRET) | Same location | `eyJhbGci...` (long JWT) |
| `NEXT_PUBLIC_SITE_URL` | Production URL | Your domain | `https://smartfinpro.com` |
| `NEXT_PUBLIC_BASE_URL` | Base URL (same as above) | Your domain | `https://smartfinpro.com` |

### REQUIRED - Email (Resend)

| Variable | Description | Where to Get | Example |
|----------|-------------|--------------|---------|
| `RESEND_API_KEY` | Resend API key | [Resend Dashboard](https://resend.com/api-keys) | `re_123abc...` |
| `RESEND_FROM_EMAIL` | Verified sender email | Resend → Domains → Add email | `hello@smartfinpro.com` |
| `RESEND_AUDIENCE_ID` | Audience ID for subscribers | Resend → Audiences | `aud_123...` |

### REQUIRED - Cron Jobs Security

| Variable | Description | Where to Get | Example |
|----------|-------------|--------------|---------|
| `CRON_SECRET` | Secret token for cron endpoints | Generate yourself | `sk_cron_a7b8c9d0e1f2...` |

---

### AFFILIATE NETWORKS - Revenue Tracking

#### PartnerStack (Jasper AI, SaaS Partners)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `PARTNERSTACK_API_KEY` | API Key | [PartnerStack](https://app.partnerstack.com) → Settings → API |
| `PARTNERSTACK_SECRET` | API Secret | Same location |
| `PARTNERSTACK_PROGRAM_ID` | Your program ID | Partner dashboard |

#### Awin (UK/EU Affiliate Network)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `AWIN_API_TOKEN` | OAuth API Token | [Awin Publisher](https://ui.awin.com) → Settings → API |
| `AWIN_PUBLISHER_ID` | Your publisher ID | Awin dashboard (top right) |

#### FinanceAds (Financial Products)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `FINANCEADS_API_KEY` | API Key | [FinanceAds](https://publisher.financeads.com) → API Settings |
| `FINANCEADS_PUBLISHER_ID` | Publisher ID | FinanceAds dashboard |

#### CJ Affiliate (Impact/Commission Junction)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `CJ_API_KEY` | API Developer Key | [CJ Affiliate](https://developers.cj.com) |
| `CJ_WEBSITE_ID` | Website/Property ID | CJ dashboard |

---

### OPTIONAL - Analytics & Monitoring

| Variable | Description | Where to Get | Default |
|----------|-------------|--------------|---------|
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible domain | [Plausible](https://plausible.io) | `smartfinpro.com` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID | [GA4](https://analytics.google.com) | - |
| `SENTRY_DSN` | Error tracking | [Sentry](https://sentry.io) | - |

### OPTIONAL - Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics tracking | `true` |
| `NEXT_PUBLIC_ENABLE_NEWSLETTER` | Enable newsletter signup | `true` |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | Enable maintenance page | `false` |

---

## 📋 Copy-Paste Template for Vercel

```env
# ============================================================
# CORE INFRASTRUCTURE (REQUIRED)
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
NEXT_PUBLIC_SITE_URL=https://smartfinpro.com
NEXT_PUBLIC_BASE_URL=https://smartfinpro.com

# ============================================================
# EMAIL - RESEND (REQUIRED)
# ============================================================
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@smartfinpro.com
RESEND_AUDIENCE_ID=

# ============================================================
# CRON SECURITY (REQUIRED)
# ============================================================
CRON_SECRET=

# ============================================================
# AFFILIATE NETWORKS
# ============================================================
# PartnerStack
PARTNERSTACK_API_KEY=
PARTNERSTACK_SECRET=
PARTNERSTACK_PROGRAM_ID=

# Awin
AWIN_API_TOKEN=
AWIN_PUBLISHER_ID=

# FinanceAds
FINANCEADS_API_KEY=
FINANCEADS_PUBLISHER_ID=

# CJ Affiliate
CJ_API_KEY=
CJ_WEBSITE_ID=

# ============================================================
# ANALYTICS (OPTIONAL)
# ============================================================
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=smartfinpro.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# ============================================================
# FEATURE FLAGS
# ============================================================
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NEWSLETTER=true
```

---

## 🔒 Supabase Setup Checklist

### Database
- [ ] Run all migrations from `/supabase/migrations/`
- [ ] Verify tables: `affiliate_links`, `link_clicks`, `conversions`, `subscribers`, `page_views`, `api_connectors`, `sync_logs`, `quiz_submissions`
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Create service role policies for server-side access

### Authentication (if needed later)
- [ ] Configure auth providers
- [ ] Set redirect URLs to production domain

### API Settings
- [ ] Copy project URL and keys to Vercel
- [ ] Enable database webhooks if using real-time features

---

## 📧 Resend Setup Checklist

### Domain Verification
- [ ] Add domain `smartfinpro.com` to Resend
- [ ] Add DNS records (SPF, DKIM, DMARC):

```dns
# SPF Record
TXT  @  v=spf1 include:_spf.resend.com ~all

# DKIM Record (Resend provides specific value)
TXT  resend._domainkey  [provided by Resend]

# DMARC Record
TXT  _dmarc  v=DMARC1; p=quarantine; rua=mailto:dmarc@smartfinpro.com
```

### Email Templates
- [ ] Verify sender email is working
- [ ] Test welcome sequence emails
- [ ] Test lead magnet delivery

---

## 🌐 Domain & DNS Setup

### Vercel Domain Configuration
- [ ] Add `smartfinpro.com` as production domain
- [ ] Add `www.smartfinpro.com` (redirect to apex)
- [ ] SSL certificate auto-provisioned by Vercel

### Cloudflare DNS (Recommended)
```dns
# Vercel DNS Records
A     @    76.76.21.21
AAAA  @    2606:4700:3034::ac43:b5a1
CNAME www  cname.vercel-dns.com.

# Email (if using custom email)
MX    @    [your email provider]
TXT   @    v=spf1 include:_spf.resend.com ~all
```

### Cloudflare Settings
- [ ] SSL/TLS: Full (strict)
- [ ] Always Use HTTPS: On
- [ ] Minimum TLS Version: 1.2
- [ ] Automatic HTTPS Rewrites: On

---

## ⏰ Cron Jobs Setup (Vercel)

Create `vercel.json` in project root (already exists, verify):

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-revenue?secret=${CRON_SECRET}",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/send-emails?secret=${CRON_SECRET}",
      "schedule": "0 9 * * *"
    }
  ]
}
```

- [ ] Verify `vercel.json` cron configuration
- [ ] Test cron endpoints manually after deployment
- [ ] Monitor cron execution in Vercel dashboard

---

## 🧪 Post-Deployment Testing

### Critical Paths
- [ ] Homepage loads correctly
- [ ] All market pages accessible (UK, CA, AU)
- [ ] Article pages render properly
- [ ] Affiliate redirect links work (`/go/[slug]`)
- [ ] Quiz submission works
- [ ] Newsletter signup works
- [ ] Dashboard accessible and shows data

### API Endpoints
- [ ] `/api/track` - Click tracking
- [ ] `/api/webhooks/conversions` - Webhook receiver
- [ ] `/api/cron/sync-revenue` - Manual test with secret
- [ ] `/api/cron/send-emails` - Manual test with secret

### SEO Verification
- [ ] `/sitemap.xml` accessible and complete
- [ ] `/robots.txt` correct
- [ ] Meta tags rendering properly
- [ ] Schema.org markup valid (test with Google Rich Results)

### Security Testing
- [ ] Run Lighthouse security audit
- [ ] Check security headers at [securityheaders.com](https://securityheaders.com)
- [ ] Verify HTTPS redirect works
- [ ] Test CSP doesn't block functionality

---

## 📊 Monitoring Setup

### Recommended Tools
- [ ] Vercel Analytics (built-in)
- [ ] Plausible for privacy-friendly analytics
- [ ] Sentry for error tracking (optional)
- [ ] UptimeRobot for uptime monitoring (free)

### Alerts to Configure
- [ ] Deployment failure notifications
- [ ] Error rate threshold alerts
- [ ] Uptime alerts

---

## 🚨 Emergency Contacts & Rollback

### Rollback Procedure
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Key Contacts
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Supabase Support: [supabase.com/support](https://supabase.com/support)
- Resend Support: [resend.com/support](https://resend.com/support)

---

## ✅ Final Launch Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase database ready with migrations
- [ ] Resend domain verified and working
- [ ] DNS configured correctly
- [ ] Test deployment successful
- [ ] All critical paths tested
- [ ] Security headers verified (A+ rating goal)
- [ ] Sitemap submitted to Google Search Console
- [ ] Analytics tracking confirmed
- [ ] Backup procedure documented

---

**Ready to launch!** 🚀

After deployment, submit sitemap to:
- Google Search Console: https://search.google.com/search-console
- Bing Webmaster Tools: https://www.bing.com/webmasters
