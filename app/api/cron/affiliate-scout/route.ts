// app/api/cron/affiliate-scout/route.ts
// Smart-Scan 2026 — Daily Affiliate Opportunity Discovery
//
// Schedule: Daily at 02:00 UTC
// Crontab: 0 2 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" \
//   http://localhost:3000/api/cron/affiliate-scout >> /home/master/applications/smartfinpro/logs/cron.log 2>&1

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { analyzeOpportunity } from '@/lib/claude/opportunity-analyzer';

// ── Types ────────────────────────────────────────────────────────────────────

interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

interface SerperResponse {
  organic?: SerperOrganicResult[];
}

interface Competitor {
  domain: string;
  market: string;
  category?: string;
}

interface ProgramCandidate {
  programName: string;
  providerUrl: string;
  market: string;
  category: string;
  sourceCompetitor: string;
  sourceQuery: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const MARKETS = ['us', 'uk', 'ca', 'au'] as const;

// Category keywords for targeted affiliate searches
const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  'trading':          ['online broker affiliate', 'stock trading affiliate program', 'CFD broker commission'],
  'forex':            ['forex broker affiliate', 'FX trading partner program', 'currency broker commission'],
  'ai-tools':         ['AI trading tool affiliate', 'fintech AI affiliate program', 'robo advisor partner'],
  'cybersecurity':    ['VPN affiliate program', 'identity protection partner', 'password manager affiliate'],
  'personal-finance': ['credit repair affiliate', 'debt consolidation partner', 'personal loan affiliate'],
  'business-banking': ['business bank affiliate', 'SME banking partner', 'business credit card commission'],
};

// Patterns that indicate affiliate links in SERP results
const AFFILIATE_SIGNALS = [
  /\baffiliate\b/i,
  /\bpartner program\b/i,
  /\bcommission\b/i,
  /\brefer.*earn\b/i,
  /\bearn.*refer\b/i,
  /impact\.com/i,
  /shareasale\.com/i,
  /cj\.com/i,
  /awin\.com/i,
  /partnerize\.com/i,
  /rakutenadvertising\.com/i,
];

// ── Serper.dev helper ────────────────────────────────────────────────────────

async function serperSearch(query: string, gl = 'us'): Promise<SerperOrganicResult[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) {
    console.warn('[affiliate-scout] SERPER_API_KEY not set, skipping search');
    return [];
  }

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 10, gl }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data: SerperResponse = await res.json();
    return data.organic ?? [];
  } catch (err) {
    console.warn('[affiliate-scout] serperSearch error:', (err as Error).message);
    return [];
  }
}

// ── Candidate extraction ─────────────────────────────────────────────────────

function extractCandidates(
  results: SerperOrganicResult[],
  market: string,
  category: string,
  competitor: string,
  query: string,
): ProgramCandidate[] {
  const candidates: ProgramCandidate[] = [];

  for (const r of results) {
    const text = `${r.title} ${r.snippet} ${r.link}`;
    const isAffiliate = AFFILIATE_SIGNALS.some((p) => p.test(text));
    if (!isAffiliate) continue;

    // Extract the brand/program name from the page title
    const rawName = r.title
      .split(/\s*[-|:–]\s*/)[0]
      .replace(/\s+(Review|Affiliate|Program|Partner|2024|2025|2026|Best|Top|#\d+)\s*/gi, ' ')
      .trim();

    if (rawName.length >= 3 && rawName.length <= 80) {
      candidates.push({
        programName: rawName,
        providerUrl: r.link,
        market,
        category,
        sourceCompetitor: competitor,
        sourceQuery: query,
      });
    }
  }

  return candidates;
}

// ── Telegram notification ────────────────────────────────────────────────────

async function sendTelegramAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    // Non-critical — don't fail the cron
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.startsWith('your-') || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = createServiceClient();
  let discovered = 0;
  let saved = 0;
  let skipped = 0;

  try {
    // ── 1. Load competitors from DB ──────────────────────────────────────────
    const { data: competitors } = await supabase
      .from('competitors')
      .select('domain, market, keywords')
      .order('cps_score', { ascending: false })
      .limit(20); // top 20 competitors across all markets

    // ── 2. Load existing program names for dedup ─────────────────────────────
    const { data: existingOpps } = await supabase
      .from('affiliate_opportunities')
      .select('program_name, market');

    const existingSet = new Set(
      (existingOpps ?? []).map((o) => `${o.program_name.toLowerCase()}::${o.market}`),
    );

    // ── 3. Load analytics for traffic estimates ──────────────────────────────
    const { data: trafficData } = await supabase
      .from('analytics')
      .select('market, sessions')
      .gte('date', new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0]);

    const trafficByMarket: Record<string, number> = {};
    for (const row of trafficData ?? []) {
      trafficByMarket[row.market] = (trafficByMarket[row.market] ?? 0) + (row.sessions ?? 0);
    }

    // ── 4. Load existing CPA values per category ─────────────────────────────
    const { data: cpaData } = await supabase
      .from('affiliate_links')
      .select('category, cpa_value')
      .gt('cpa_value', 0);

    const cpaByCategory: Record<string, number[]> = {};
    for (const row of cpaData ?? []) {
      if (!cpaByCategory[row.category]) cpaByCategory[row.category] = [];
      cpaByCategory[row.category].push(row.cpa_value);
    }

    // ── 5. Build search queries ───────────────────────────────────────────────
    const searchTasks: Array<{
      query: string;
      market: string;
      category: string;
      competitor: string;
      gl: string;
    }> = [];

    const glMap: Record<string, string> = { us: 'us', uk: 'gb', ca: 'ca', au: 'au' };

    // A) Competitor-based: find what affiliate programs our competitors promote
    for (const comp of (competitors ?? []) as Competitor[]) {
      const market = comp.market as typeof MARKETS[number];
      if (!MARKETS.includes(market)) continue;
      const category = Array.isArray(comp.keywords) && comp.keywords[0]
        ? inferCategory(comp.keywords[0] as string)
        : 'personal-finance';

      searchTasks.push({
        query: `site:${comp.domain} affiliate OR partner program`,
        market,
        category,
        competitor: comp.domain,
        gl: glMap[market] ?? 'us',
      });
    }

    // B) Category-based: find new programs per market
    for (const market of MARKETS) {
      const gl = glMap[market];
      for (const [category, terms] of Object.entries(CATEGORY_SEARCH_TERMS)) {
        const term = terms[Math.floor(Math.random() * terms.length)];
        searchTasks.push({
          query: `${term} ${market === 'us' ? '' : market.toUpperCase()} 2026 site:impact.com OR site:partnerize.com OR site:awin.com`,
          market,
          category,
          competitor: 'affiliate_network_scan',
          gl,
        });
      }
    }

    // ── 6. Execute searches (max 30 to protect Serper quota) ─────────────────
    const batchSize = Math.min(searchTasks.length, 30);
    const allCandidates: ProgramCandidate[] = [];

    for (let i = 0; i < batchSize; i++) {
      const task = searchTasks[i];
      const results = await serperSearch(task.query, task.gl);
      const candidates = extractCandidates(
        results,
        task.market,
        task.category,
        task.competitor,
        task.query,
      );
      allCandidates.push(...candidates);
      discovered += candidates.length;

      // Small delay to avoid rate-limiting
      if (i < batchSize - 1) await sleep(300);
    }

    // ── 7. Dedup + analyze + save ─────────────────────────────────────────────
    const seen = new Set<string>();

    for (const candidate of allCandidates) {
      const key = `${candidate.programName.toLowerCase()}::${candidate.market}`;
      if (seen.has(key) || existingSet.has(key)) {
        skipped++;
        continue;
      }
      seen.add(key);

      try {
        const analysis = await analyzeOpportunity({
          programName: candidate.programName,
          providerUrl: candidate.providerUrl,
          market: candidate.market as 'us' | 'uk' | 'ca' | 'au',
          category: candidate.category,
          sourceCompetitor: candidate.sourceCompetitor,
          trafficEstimate: trafficByMarket[candidate.market],
          existingCpaValues: cpaByCategory[candidate.category],
        });

        const { error } = await supabase.from('affiliate_opportunities').insert({
          market:                   candidate.market,
          category:                 candidate.category,
          source:                   'serper_competitor_scan',
          source_competitor:        candidate.sourceCompetitor,
          source_query:             candidate.sourceQuery,
          program_name:             candidate.programName,
          provider_url:             candidate.providerUrl,
          trust_score:              analysis.trustScore,
          compliance_status:        analysis.complianceStatus,
          compliance_flags:         analysis.complianceFlags,
          revenue_forecast_monthly: analysis.revenueForecastMonthly,
          revenue_confidence:       analysis.revenueConfidence,
          draft_slug:               analysis.draftSlug,
          draft_title:              analysis.draftTitle,
          analysis_notes:           analysis.analysisNotes,
          status:                   'new',
        });

        if (!error) {
          saved++;
          existingSet.add(key); // prevent re-insert in this run
        }

        // Small delay between Claude calls
        await sleep(200);
      } catch (err) {
        console.warn(
          '[affiliate-scout] Analysis failed for:',
          candidate.programName,
          (err as Error).message,
        );
      }
    }

    // ── 8. Log to cron_logs ──────────────────────────────────────────────────
    const duration = Date.now() - startTime;
    await supabase.from('cron_logs').insert({
      job_name:     'affiliate-scout',
      status:       'success',
      duration_ms:  duration,
      executed_at:  new Date().toISOString(),
    });

    // ── 9. Telegram notification (only if new opportunities found) ────────────
    if (saved > 0) {
      await sendTelegramAlert(
        `🔍 <b>Smart-Scan 2026</b>\n` +
        `${saved} new affiliate opportunit${saved === 1 ? 'y' : 'ies'} discovered!\n` +
        `Discovered: ${discovered} | Saved: ${saved} | Skipped: ${skipped}\n` +
        `Duration: ${(duration / 1000).toFixed(1)}s\n` +
        `👉 <a href="https://smartfinpro.com/dashboard/opportunities">Review in Dashboard</a>`,
      );
    }

    return NextResponse.json({
      success:    true,
      discovered,
      saved,
      skipped,
      duration:   `${(duration / 1000).toFixed(1)}s`,
      timestamp:  new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const duration = Date.now() - startTime;

    console.error('[affiliate-scout] Cron failed:', msg);

    await supabase.from('cron_logs').insert({
      job_name:    'affiliate-scout',
      status:      'error',
      duration_ms: duration,
      error:       msg,
      executed_at: new Date().toISOString(),
    }).catch(() => null);

    await sendTelegramAlert(`❌ <b>Smart-Scan 2026 FEHLER</b>\n${msg}`);

    return NextResponse.json(
      { error: msg, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function inferCategory(keyword: string): string {
  const k = keyword.toLowerCase();
  if (k.includes('forex') || k.includes('fx') || k.includes('currency')) return 'forex';
  if (k.includes('trading') || k.includes('broker') || k.includes('stock')) return 'trading';
  if (k.includes('ai') || k.includes('robot') || k.includes('automated')) return 'ai-tools';
  if (k.includes('vpn') || k.includes('security') || k.includes('cyber')) return 'cybersecurity';
  if (k.includes('business') || k.includes('bank') || k.includes('account')) return 'business-banking';
  return 'personal-finance';
}
