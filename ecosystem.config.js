/**
 * PM2 Ecosystem Configuration — SmartFinPro Live
 * ============================================================
 * Production deployment on Cloudways Node.js VPS (Iceland).
 *
 * Architecture:
 *   Next.js 16 (standalone) → PM2 cluster → Cloudways Nginx → Cloudflare CDN
 *
 * The standalone output produces a self-contained server at:
 *   .next/standalone/server.js
 * This bundles all required node_modules — no external deps needed at runtime.
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production   # first launch
 *   pm2 reload SmartFinPro-Live --update-env          # zero-downtime reload
 *   pm2 logs SmartFinPro-Live --lines 200             # tail logs
 *   pm2 monit                                         # real-time dashboard
 *
 * First-time setup on Cloudways:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save
 *   pm2 startup    # generates systemd boot script
 */

const path = require('path');

// ============================================================
// PATHS — Cloudways standard directory structure
// ============================================================
const APP_ROOT = '/home/master/applications/brvnvntpcj/public_html';
const LOG_DIR  = '/home/master/applications/brvnvntpcj/logs';

module.exports = {
  apps: [
    {
      // ============================================================
      // APPLICATION IDENTITY
      // ============================================================
      name: 'SmartFinPro-Live',
      script: path.join(APP_ROOT, '.next/standalone/server.js'),
      cwd: APP_ROOT,

      // ============================================================
      // CLUSTER MODE — Maximize VPS CPU utilization
      // ============================================================
      instances: 'max',             // 1 worker per CPU core
      exec_mode: 'cluster',         // PM2 cluster for zero-downtime reloads
      increment_var: 'INSTANCE_ID', // Unique ID per worker (for logs)

      // ============================================================
      // MEMORY & RESTART POLICY
      // ============================================================
      max_memory_restart: '1G',     // Hard restart at 1 GB RSS
      autorestart: true,            // Auto-recover from crashes
      watch: false,                 // Never watch in production
      max_restarts: 15,             // Max 15 restarts before giving up
      min_uptime: '10s',            // Process must survive 10s to count as started
      restart_delay: 4000,          // 4s delay between restart attempts
      kill_timeout: 8000,           // 8s graceful shutdown window
      listen_timeout: 12000,        // 12s to bind port or mark as errored
      shutdown_with_message: true,  // Send SIGINT before SIGKILL

      // ============================================================
      // ENVIRONMENT — Development (default, for local testing)
      // ============================================================
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      // ============================================================
      // ENVIRONMENT — Production
      // All secrets loaded from .env via dotenv at runtime.
      // PM2 env_production provides baseline config; .env overrides.
      // ============================================================
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',

        // ── Site Identity ──
        NEXT_PUBLIC_SITE_URL: 'https://smartfinpro.com',
        NEXT_PUBLIC_BASE_URL: 'https://smartfinpro.com',

        // ── Analytics ──
        PLAUSIBLE_DOMAIN: 'smartfinpro.com',

        // ── Cron Security ──
        // CRON_SECRET loaded from .env (never committed)

        // ── IP Guard (Affiliate redirect protection) ──
        // IP_GUARD_WHITELIST loaded from .env

        // ── Supabase ──
        // NEXT_PUBLIC_SUPABASE_URL loaded from .env
        // NEXT_PUBLIC_SUPABASE_ANON_KEY loaded from .env
        // SUPABASE_SERVICE_KEY loaded from .env

        // ── Email (Resend) ──
        // RESEND_API_KEY loaded from .env
        // RESEND_FROM_EMAIL loaded from .env

        // ── Affiliate Networks ──
        // FINANCEADS_API_KEY loaded from .env
        // AWIN_API_KEY loaded from .env
      },

      // ============================================================
      // LOGGING — Structured JSON for log aggregation
      // ============================================================
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
      error_file: path.join(LOG_DIR, 'error.log'),
      out_file: path.join(LOG_DIR, 'access.log'),
      pid_file: path.join(LOG_DIR, 'pm2-smartfinpro.pid'),
      merge_logs: true,             // Merge cluster worker logs
      log_type: 'json',             // Structured JSON output

      // ============================================================
      // NODE.JS FLAGS — Production tuning
      // ============================================================
      node_args: [
        '--max-old-space-size=1024',  // Match max_memory_restart
        '--dns-result-order=ipv4first', // Prefer IPv4 for Supabase/CDN
      ].join(' '),

      // ============================================================
      // SOURCE MAP SUPPORT (disabled in prod for speed)
      // ============================================================
      source_map_support: false,
    },
  ],
};
