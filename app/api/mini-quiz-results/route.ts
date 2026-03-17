import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { getLinksForMarketCategory, loadRegistry, getComplianceLabel } from '@/lib/affiliate/link-registry';
import type { Market, Category } from '@/types';

// ── Partner Profiles ─────────────────────────────────────────
// Tags, features, and honesty lines for scoring + display

// ── Partner → Category Mapping (for hardcoded fallback when DB has no links)
const PARTNER_CATEGORY: Record<string, string> = {
  // Trading
  'eToro': 'trading',
  'Interactive Brokers': 'trading',
  'Plus500': 'trading',
  'CMC Markets': 'trading',
  'Hargreaves Lansdown': 'trading',
  'Trading 212': 'trading',
  'IG Markets': 'trading',
  'Questrade': 'trading',
  // Forex
  'Pepperstone': 'forex',
  'IC Markets': 'forex',
  'OANDA': 'forex',
  // Personal Finance
  'Wealthsimple': 'personal-finance',
  'Wealthfront': 'personal-finance',
  'SoFi': 'personal-finance',
  'Nutmeg': 'personal-finance',
  'Vanguard': 'personal-finance',
  // Business Banking
  'Wise Business': 'business-banking',
  'Revolut Business': 'business-banking',
  'Mercury': 'business-banking',
  // AI Tools
  'Jasper AI': 'ai-tools',
  'Copy.ai': 'ai-tools',
  // Banking / Savings
  'Marcus': 'savings',
  'Monzo': 'savings',
  'Starling Bank': 'savings',
  'Chase UK': 'savings',
};

/** Convert partner name to URL-safe slug */
function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const PARTNER_PROFILES: Record<string, {
  tags: string[];
  features: string[];
  bestFor: string;
  notIdealFor: string;
}> = {
  // Trading
  'eToro': {
    tags: ['beginner', 'social', 'simple', 'robo', 'passive'],
    features: ['Social & copy trading with 30M+ users', 'Commission-free stock trading', 'User-friendly mobile app'],
    bestFor: 'Beginners who want to learn from other traders.',
    notIdealFor: 'Advanced traders needing professional-grade tools.',
  },
  'Interactive Brokers': {
    tags: ['advanced', 'pro', 'low-cost', 'research', 'self-directed', 'active', 'global'],
    features: ['Industry-lowest margin rates', 'Access to 150+ global markets', 'Professional-grade trading tools'],
    bestFor: 'Experienced traders who want the broadest market access.',
    notIdealFor: 'Beginners who prefer a simpler interface.',
  },
  'Plus500': {
    tags: ['intermediate', 'simple', 'beginner'],
    features: ['Intuitive CFD trading platform', 'Competitive spreads', 'Risk management tools built-in'],
    bestFor: 'CFD traders who value simplicity.',
    notIdealFor: 'Traders looking for real stock ownership.',
  },
  'CMC Markets': {
    tags: ['intermediate', 'advanced', 'research', 'metatrader'],
    features: ['Award-winning Next Generation platform', '12,000+ instruments available', 'Advanced charting & analysis tools'],
    bestFor: 'Traders who rely on technical analysis.',
    notIdealFor: 'Casual investors wanting a simple app experience.',
  },

  // Forex
  'Pepperstone': {
    tags: ['advanced', 'pro', 'low-cost', 'metatrader', 'regulated'],
    features: ['Raw spreads from 0.0 pips', 'MT4, MT5 & cTrader supported', 'Lightning-fast execution'],
    bestFor: 'Active forex traders who need tight spreads.',
    notIdealFor: 'Those looking for stock or ETF investing.',
  },
  'IC Markets': {
    tags: ['advanced', 'pro', 'low-cost', 'metatrader'],
    features: ['True ECN pricing', 'Average spread 0.1 pips on EUR/USD', 'Scalping-friendly execution'],
    bestFor: 'High-volume and algorithmic traders.',
    notIdealFor: 'Beginners who need educational resources.',
  },
  'OANDA': {
    tags: ['intermediate', 'regulated', 'safe', 'global'],
    features: ['Trusted by traders since 1996', 'Transparent pricing, no hidden fees', 'Powerful TradingView integration'],
    bestFor: 'Traders who prioritize regulatory trust.',
    notIdealFor: 'Those seeking the absolute lowest spreads.',
  },

  // Personal Finance
  'Wealthsimple': {
    tags: ['beginner', 'simple', 'investing', 'robo', 'low-cost', 'safe'],
    features: ['No-commission stock & ETF trading', 'Automated robo-advisor portfolios', 'Free tax-loss harvesting'],
    bestFor: 'Canadian investors who want a simple all-in-one platform.',
    notIdealFor: 'Active day traders needing advanced tools.',
  },
  'Wealthfront': {
    tags: ['investing', 'robo', 'planning', 'low-cost', 'safe'],
    features: ['Automated tax-loss harvesting', 'Financial planning tools', 'Low 0.25% advisory fee'],
    bestFor: 'Hands-off investors who want automated portfolio management.',
    notIdealFor: 'Those who want to pick individual stocks.',
  },
  'SoFi': {
    tags: ['beginner', 'simple', 'credit', 'investing', 'savings'],
    features: ['All-in-one: invest, bank, borrow', 'No-fee stock trading', 'Competitive loan rates'],
    bestFor: 'People who want banking + investing in one app.',
    notIdealFor: 'Those needing specialized trading features.',
  },

  // Business Banking
  'Wise Business': {
    tags: ['global', 'fx', 'low-cost', 'solo', 'small'],
    features: ['Multi-currency accounts in 40+ currencies', 'Real mid-market exchange rates', 'Batch payment tools'],
    bestFor: 'Businesses sending or receiving international payments.',
    notIdealFor: 'Those needing lending or credit facilities.',
  },
  'Revolut Business': {
    tags: ['global', 'fx', 'integrations', 'small', 'growing'],
    features: ['Expense management + corporate cards', 'Built-in invoicing & analytics', 'API access for automation'],
    bestFor: 'Growing teams that need modern financial tools.',
    notIdealFor: 'Large enterprises with complex compliance needs.',
  },
  'Mercury': {
    tags: ['small', 'growing', 'integrations', 'api', 'simple'],
    features: ['Built for startups & tech companies', 'Powerful API & Zapier integrations', 'FDIC-insured up to $5M'],
    bestFor: 'US startups that want a developer-friendly bank.',
    notIdealFor: 'Businesses needing international multi-currency.',
  },

  // AI Tools
  'Jasper AI': {
    tags: ['writing', 'content', 'speed', 'fast', 'features'],
    features: ['50+ AI content templates', 'Brand voice consistency', 'Team collaboration workflows'],
    bestFor: 'Marketing teams creating content at scale.',
    notIdealFor: 'Individuals on a tight budget.',
  },
  'Copy.ai': {
    tags: ['writing', 'content', 'low-cost', 'value', 'speed'],
    features: ['Generous free tier available', 'Sales & marketing copy focus', 'Workflow automation tools'],
    bestFor: 'Small businesses and solopreneurs.',
    notIdealFor: 'Enterprise teams needing advanced brand controls.',
  },

  // UK-specific
  'Hargreaves Lansdown': {
    tags: ['investing', 'safe', 'insured', 'beginner', 'performance', 'self-directed', 'regulated'],
    features: ['UK\'s #1 investment platform', 'ISA, SIPP & general investing', 'Award-winning research & tools'],
    bestFor: 'UK investors who value trust and comprehensive research.',
    notIdealFor: 'Cost-conscious investors (higher platform fees).',
  },
  'Trading 212': {
    tags: ['beginner', 'simple', 'low-cost', 'investing', 'self-directed'],
    features: ['Commission-free stocks & ETFs', 'Fractional shares from £1', 'AutoInvest pie feature'],
    bestFor: 'UK beginners who want to invest with small amounts.',
    notIdealFor: 'Advanced traders needing professional tools.',
  },
  'IG Markets': {
    tags: ['intermediate', 'advanced', 'research', 'metatrader', 'regulated'],
    features: ['17,000+ markets available', 'Spread betting & CFDs', 'ProRealTime & MT4 platforms'],
    bestFor: 'Experienced UK traders wanting market breadth.',
    notIdealFor: 'Beginners overwhelmed by too many options.',
  },

  // AU-specific
  'Questrade': {
    tags: ['low-cost', 'intermediate', 'investing', 'simple', 'self-directed'],
    features: ['Low commissions from $4.95/trade', 'Free ETF purchases', 'Self-directed & managed portfolios'],
    bestFor: 'Canadian investors who want low-cost self-directed investing.',
    notIdealFor: 'Those wanting a fully automated robo-advisor.',
  },

  // Banking / Savings
  'Marcus': {
    tags: ['savings', 'high-yield', 'safe', 'insured', 'simple'],
    features: ['Competitive high-yield savings rate', 'No fees, no minimum deposit', 'Backed by Goldman Sachs'],
    bestFor: 'Savers who want a top rate with zero hassle.',
    notIdealFor: 'Those looking for a full current account.',
  },
  'Monzo': {
    tags: ['digital', 'app', 'modern', 'everyday', 'checking', 'simple'],
    features: ['Instant spending notifications', 'Fee-free spending abroad', 'Smart budgeting & savings pots'],
    bestFor: 'People who want a modern, app-first bank experience.',
    notIdealFor: 'Those who prefer in-branch banking.',
  },
  'Starling Bank': {
    tags: ['digital', 'app', 'modern', 'everyday', 'checking', 'safe'],
    features: ['Award-winning mobile banking app', 'Fee-free overseas card payments', 'Savings spaces & round-ups'],
    bestFor: 'UK customers wanting a feature-rich digital bank.',
    notIdealFor: 'Those needing specialist savings products.',
  },
  'Chase UK': {
    tags: ['digital', 'app', 'modern', 'everyday', 'high-yield', 'safe', 'insured'],
    features: ['Easy-access saver with competitive rate', '1% cashback on debit card spending', 'Backed by JPMorgan Chase'],
    bestFor: 'UK customers who want savings + cashback in one app.',
    notIdealFor: 'Those needing ISA or investment options.',
  },
  'Nutmeg': {
    tags: ['investing', 'isa', 'tax-free', 'robo', 'passive', 'performance'],
    features: ['Stocks & shares ISA with auto-rebalancing', 'Socially responsible portfolio options', 'Fully managed by investment experts'],
    bestFor: 'Hands-off investors who want ISA tax benefits.',
    notIdealFor: 'Active traders who pick individual stocks.',
  },
  'Vanguard': {
    tags: ['investing', 'isa', 'tax-free', 'low-cost', 'safe', 'performance'],
    features: ['Ultra-low platform fee (0.15%)', 'World-class index fund range', 'ISA, SIPP & general account'],
    bestFor: 'Long-term investors who want lowest-cost index investing.',
    notIdealFor: 'Those who want individual stock trading.',
  },
};

// ── Route Handler ────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { market, category, tags } = body as {
      market: Market;
      category: Category;
      tags: string[];
    };

    if (!market || !category || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch active affiliate links — cascade: market+category → cross-market category → all active
    let links = await getLinksForMarketCategory(market, category);
    if (links.length === 0) {
      const allLinks = await loadRegistry();
      links = allLinks.filter((l) => l.category === category && l.active);
    }
    // Score each partner
    const COST_TAGS = ['low-cost', 'value', 'free-tier'];
    type Scored = { slug: string; partnerName: string; score: number; priceScore: number; profile: (typeof PARTNER_PROFILES)[string] };
    const scored: Scored[] = [];

    if (links.length > 0) {
      // ── DB-backed scoring (production path) ────────────────
      for (const link of links) {
        const profile = PARTNER_PROFILES[link.partner_name];
        if (!profile) continue;
        // Enforce category match via hardcoded map (DB may have stale categories)
        if (PARTNER_CATEGORY[link.partner_name] && PARTNER_CATEGORY[link.partner_name] !== category) continue;

        let score = 0;
        for (const tag of tags) {
          if (profile.tags.includes(tag)) score++;
        }
        const cpaBonus = Math.min(link.commission_value / 50, 2);
        score += cpaBonus;

        let priceScore = 0;
        for (const ct of COST_TAGS) {
          if (profile.tags.includes(ct)) priceScore += 3;
        }
        for (const tag of tags) {
          if (profile.tags.includes(tag)) priceScore += 0.5;
        }

        scored.push({ slug: link.slug, partnerName: link.partner_name, score, priceScore, profile });
      }
    } else {
      // ── Hardcoded fallback (no DB / dev environment) ───────
      // Score partners from PARTNER_PROFILES that match the requested category
      for (const [partnerName, profile] of Object.entries(PARTNER_PROFILES)) {
        if (PARTNER_CATEGORY[partnerName] !== category) continue;

        let score = 0;
        for (const tag of tags) {
          if (profile.tags.includes(tag)) score++;
        }

        let priceScore = 0;
        for (const ct of COST_TAGS) {
          if (profile.tags.includes(ct)) priceScore += 3;
        }
        for (const tag of tags) {
          if (profile.tags.includes(tag)) priceScore += 0.5;
        }

        scored.push({ slug: toSlug(partnerName), partnerName, score, priceScore, profile });
      }
    }

    if (scored.length === 0) {
      const complianceLabel = getComplianceLabel(market, category);
      if (links.length > 0) {
        const fallback = links[0];
        const generic = {
          slug: fallback.slug,
          partnerName: fallback.partner_name,
          score: 1,
          maxScore: tags.length + 2,
          features: ['Trusted and regulated platform', 'Competitive pricing'],
          bestFor: 'General users looking for a reliable option.',
          notIdealFor: 'Users with very specific advanced requirements.',
          complianceLabel,
        };
        return NextResponse.json({ bestMatch: generic, bestPrice: generic });
      }
      // No partners at all for this category
      return NextResponse.json({ error: 'No partners found for this category' }, { status: 404 });
    }

    const maxScore = tags.length + 2;
    const complianceLabel = getComplianceLabel(market, category);

    // Best Match = highest overall score
    scored.sort((a, b) => b.score - a.score);
    const topMatch = scored[0];

    // Best Price = highest price score, but NOT the same partner as bestMatch
    const priceRanked = [...scored].sort((a, b) => b.priceScore - a.priceScore);
    const topPrice = priceRanked.find((p) => p.partnerName !== topMatch.partnerName) ?? priceRanked[0];

    const fmt = (s: Scored) => ({
      slug: s.slug,
      partnerName: s.partnerName,
      score: Math.round(s.score),
      maxScore,
      features: s.profile.features.slice(0, 2),
      bestFor: s.profile.bestFor,
      notIdealFor: s.profile.notIdealFor,
      complianceLabel,
    });

    return NextResponse.json({ bestMatch: fmt(topMatch), bestPrice: fmt(topPrice) });
  } catch (error) {
    logger.error('[mini-quiz-results] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
