// lib/claude/opportunity-analyzer.ts
// Smart-Scan 2026 — Claude-powered affiliate opportunity analysis
// Uses Haiku for fast, cheap batch processing

import { createClaudeMessage } from './client';
import { getCompliancePrompt } from './market-compliance-prompts';

export interface OpportunityInput {
  programName: string;
  providerUrl?: string;
  market: 'us' | 'uk' | 'ca' | 'au';
  category: string;
  sourceCompetitor?: string;
  /** Monthly sessions estimate from analytics table */
  trafficEstimate?: number;
  /** Existing CPA values for this category for revenue benchmarking */
  existingCpaValues?: number[];
}

export interface OpportunityAnalysis {
  trustScore: number;
  complianceStatus: 'pass' | 'review' | 'fail';
  complianceFlags: string[];
  revenueForecastMonthly: number;
  revenueConfidence: 'low' | 'medium' | 'high';
  draftSlug: string;
  draftTitle: string;
  analysisNotes: string;
}

// Typical CPA ranges per category (USD) for revenue estimation fallback
const CATEGORY_CPA_RANGES: Record<string, [number, number]> = {
  'trading':          [100, 500],
  'forex':            [150, 600],
  'ai-tools':         [ 30, 150],
  'cybersecurity':    [ 20, 100],
  'personal-finance': [ 50, 300],
  'business-banking': [ 75, 400],
};

export async function analyzeOpportunity(
  input: OpportunityInput,
): Promise<OpportunityAnalysis> {
  const complianceRules = getCompliancePrompt(input.market);
  const [cpaMin, cpaMax] = CATEGORY_CPA_RANGES[input.category] ?? [50, 200];

  const prompt = `You are a senior financial affiliate marketing analyst. Evaluate this affiliate program opportunity and respond with ONLY a valid JSON object — no markdown, no preamble.

PROGRAM: "${input.programName}"
URL: ${input.providerUrl ?? 'unknown'}
MARKET: ${input.market.toUpperCase()}
CATEGORY: ${input.category}
DISCOVERED ON: ${input.sourceCompetitor ?? 'competitor analysis'}
MONTHLY TRAFFIC ESTIMATE: ${input.trafficEstimate?.toLocaleString() ?? 'unknown'} sessions
COMPARABLE CPA VALUES: ${input.existingCpaValues?.length ? `$${input.existingCpaValues.join(', $')}` : `$${cpaMin}–$${cpaMax} (category average)`}

COMPLIANCE RULES FOR ${input.market.toUpperCase()}:
${complianceRules}

Respond ONLY with this JSON (no other text):
{
  "trustScore": <integer 1-10>,
  "complianceStatus": "<pass|review|fail>",
  "complianceFlags": ["<flag1>", "<flag2>"],
  "revenueForecastMonthly": <number in USD, no currency symbol>,
  "revenueConfidence": "<low|medium|high>",
  "draftSlug": "<kebab-case-url-slug>",
  "draftTitle": "<SEO title under 65 chars>",
  "analysisNotes": "<2–3 sentences: opportunity quality, key risks, recommendation>"
}

TRUST SCORE GUIDE:
10 = Tier-1 regulated (Fidelity, Interactive Brokers, major high-street bank)
7–9 = Well-known brand, regulated, proven affiliate program
4–6 = Unknown/new brand, limited regulation info, moderate risk
1–3 = Unregulated, red flags, potential fraud indicators

REVENUE FORMULA: (traffic × 0.01) × (CPA estimate) × (category conversion rate 0.5–2%)
Round to nearest $50.`;

  const response = await createClaudeMessage(
    {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    },
    { operation: 'opportunity_analysis', timeoutMs: 20_000 },
  );

  const raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';

  try {
    // Strip possible markdown code fences
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    return {
      trustScore: clamp(Number(parsed.trustScore) || 5, 1, 10),
      complianceStatus: (['pass', 'review', 'fail'] as const).includes(
        parsed.complianceStatus as never,
      )
        ? (parsed.complianceStatus as 'pass' | 'review' | 'fail')
        : 'review',
      complianceFlags: Array.isArray(parsed.complianceFlags)
        ? (parsed.complianceFlags as string[]).slice(0, 10)
        : [],
      revenueForecastMonthly: Math.max(0, Number(parsed.revenueForecastMonthly) || 0),
      revenueConfidence: (['low', 'medium', 'high'] as const).includes(
        parsed.revenueConfidence as never,
      )
        ? (parsed.revenueConfidence as 'low' | 'medium' | 'high')
        : 'low',
      draftSlug: slugify(String(parsed.draftSlug || input.programName)),
      draftTitle: String(parsed.draftTitle || `Best ${input.programName} ${new Date().getFullYear()}`).slice(0, 70),
      analysisNotes: String(parsed.analysisNotes || 'Manual review required.').slice(0, 500),
    };
  } catch {
    console.error('[opportunity-analyzer] JSON parse failed, raw:', raw.slice(0, 200));
    return fallbackAnalysis(input);
  }
}

function fallbackAnalysis(input: OpportunityInput): OpportunityAnalysis {
  return {
    trustScore: 5,
    complianceStatus: 'review',
    complianceFlags: ['analysis_error'],
    revenueForecastMonthly: 0,
    revenueConfidence: 'low',
    draftSlug: slugify(input.programName),
    draftTitle: `${input.programName} Review ${new Date().getFullYear()}`,
    analysisNotes: 'Automated analysis failed. Manual review required before approval.',
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
