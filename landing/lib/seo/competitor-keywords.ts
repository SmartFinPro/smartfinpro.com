/**
 * Competitor Keywords — Pure Module
 * ──────────────────────────────────
 * Seed keywords, authority domains, and CPS algorithm.
 * No 'use server' — can be imported by both server actions and client code.
 */

import type { Market, Category } from '@/lib/i18n/config';

// ── Authority Domains ────────────────────────────────────────

/**
 * Known high-authority finance/fintech domains.
 * Used to calculate the "Authority Saturation" CPS factor.
 */
export const AUTHORITY_DOMAINS = [
  'nerdwallet.com',
  'investopedia.com',
  'bankrate.com',
  'forbes.com',
  'cnbc.com',
  'bloomberg.com',
  'fool.com',
  'wsj.com',
  'money.com',
  'kiplinger.com',
  'finder.com',
  'thebalancemoney.com',
  'moneysavingexpert.com',
  'which.co.uk',
  'canstar.com.au',
  'ratehub.ca',
] as const;

// ── CPS Weights ──────────────────────────────────────────────

export const CPS_WEIGHTS = {
  ads: 35,           // Ad density → commercial intent
  engagement: 20,    // PAA count → search engagement
  knowledgeGraph: 15, // KG presence → Google deems important
  authority: 20,     // Authority saturation (inverted → fewer = easier)
  opportunity: 10,   // Position opportunity
} as const;

// ── CPS Algorithm ────────────────────────────────────────────

export interface SerperSignals {
  adCount: number;
  hasShopping: boolean;
  paaCount: number;
  hasKnowledgeGraph: boolean;
  authorityCount: number;
  ownPosition: number | null; // null = not in top 10
}

/**
 * Calculate Conversion Potential Score (0–100) from SERP signals.
 *
 * Factors:
 *   1. Ad Density (35): More ads = higher commercial intent
 *   2. Engagement (20): More PAA = higher search engagement
 *   3. Knowledge Graph (15): KG presence = Google deems keyword important
 *   4. Authority Saturation (20, inverted): Fewer authorities = easier to rank
 *   5. Position Opportunity (10): Not ranking yet = untapped potential
 */
export function calculateCPS(signals: SerperSignals): number {
  // Factor 1: Ad Density (0-35)
  let adScore = signals.adCount === 0 ? 0 : signals.adCount <= 2 ? 0.6 : 1.0;
  if (signals.hasShopping) adScore = Math.min(adScore + 0.2, 1.0);
  const adFactor = adScore * CPS_WEIGHTS.ads;

  // Factor 2: Search Engagement via PAA (0-20)
  const paaScore = signals.paaCount === 0
    ? 0
    : signals.paaCount <= 2
      ? 0.4
      : signals.paaCount <= 4
        ? 0.7
        : 1.0;
  const engagementFactor = paaScore * CPS_WEIGHTS.engagement;

  // Factor 3: Knowledge Graph (0-15)
  const kgFactor = signals.hasKnowledgeGraph ? CPS_WEIGHTS.knowledgeGraph : 0;

  // Factor 4: Authority Saturation (0-20, inverted — fewer = higher score)
  const authScore = signals.authorityCount <= 1
    ? 1.0
    : signals.authorityCount <= 3
      ? 0.7
      : signals.authorityCount <= 5
        ? 0.4
        : 0.1;
  const authFactor = authScore * CPS_WEIGHTS.authority;

  // Factor 5: Position Opportunity (0-10)
  let posScore: number;
  if (signals.ownPosition === null || signals.ownPosition > 10) {
    posScore = 1.0; // Not ranking → full opportunity
  } else if (signals.ownPosition >= 4) {
    posScore = 0.7; // Can push higher
  } else {
    posScore = 0.2; // Already winning
  }
  const opportunityFactor = posScore * CPS_WEIGHTS.opportunity;

  const total = adFactor + engagementFactor + kgFactor + authFactor + opportunityFactor;
  return Math.round(total * 10) / 10;
}

// ── Seed Keywords ────────────────────────────────────────────

export interface CompetitorKeyword {
  keyword: string;
  market: Market;
  category: Category;
}

/**
 * 300+ Money Keywords across all markets and categories.
 * Covers trading, forex, personal finance, business banking, AI tools, and new silos.
 */
export const COMPETITOR_KEYWORDS: CompetitorKeyword[] = [
  // ── US TRADING (40+ keywords) ──
  { keyword: 'best trading platform', market: 'us', category: 'trading' },
  { keyword: 'best stock broker', market: 'us', category: 'trading' },
  { keyword: 'best day trading platform', market: 'us', category: 'trading' },
  { keyword: 'best options trading platform', market: 'us', category: 'trading' },
  { keyword: 'best stock trading app', market: 'us', category: 'trading' },
  { keyword: 'best investment app', market: 'us', category: 'trading' },
  { keyword: 'best commission free broker', market: 'us', category: 'trading' },
  { keyword: 'best crypto trading platform', market: 'us', category: 'trading' },
  { keyword: 'best swing trading platform', market: 'us', category: 'trading' },
  { keyword: 'best penny stock broker', market: 'us', category: 'trading' },
  { keyword: 'best fractional share trading', market: 'us', category: 'trading' },
  { keyword: 'best algo trading platform', market: 'us', category: 'trading' },
  { keyword: 'etoro vs other brokers', market: 'us', category: 'trading' },
  { keyword: 'interactive brokers review', market: 'us', category: 'trading' },
  { keyword: 'webull vs interactive brokers', market: 'us', category: 'trading' },
  { keyword: 'td ameritrade alternative', market: 'us', category: 'trading' },
  { keyword: 'fidelity vs charles schwab', market: 'us', category: 'trading' },
  { keyword: 'best mobile trading app', market: 'us', category: 'trading' },
  { keyword: 'best trading platform for beginners', market: 'us', category: 'trading' },
  { keyword: 'zero commission trading', market: 'us', category: 'trading' },
  { keyword: 'best broker for options trading', market: 'us', category: 'trading' },
  { keyword: 'best broker for day traders', market: 'us', category: 'trading' },
  { keyword: 'best real time data broker', market: 'us', category: 'trading' },
  { keyword: 'best micro trading platform', market: 'us', category: 'trading' },
  { keyword: 'cheapest online broker', market: 'us', category: 'trading' },
  { keyword: 'best low fee broker', market: 'us', category: 'trading' },
  { keyword: 'best broker for stock baskets', market: 'us', category: 'trading' },
  { keyword: 'webull review', market: 'us', category: 'trading' },
  { keyword: 'robinhood vs fidelity', market: 'us', category: 'trading' },
  { keyword: 'best broker for spread betting', market: 'us', category: 'trading' },
  { keyword: 'best otc stock broker', market: 'us', category: 'trading' },
  { keyword: 'best broker for margin trading', market: 'us', category: 'trading' },
  { keyword: 'etoro review', market: 'us', category: 'trading' },
  { keyword: 'best trading platform reddit', market: 'us', category: 'trading' },
  { keyword: 'best technical analysis platform', market: 'us', category: 'trading' },
  { keyword: 'best platform for active traders', market: 'us', category: 'trading' },
  { keyword: 'best direct access broker', market: 'us', category: 'trading' },
  { keyword: 'best futures trading platform', market: 'us', category: 'trading' },
  { keyword: 'best broker for dividend investors', market: 'us', category: 'trading' },
  { keyword: 'best forex-crypto combo platform', market: 'us', category: 'trading' },

  // ── US FOREX (35+ keywords) ──
  { keyword: 'best forex broker', market: 'us', category: 'forex' },
  { keyword: 'best forex trading platform', market: 'us', category: 'forex' },
  { keyword: 'forex broker for beginners', market: 'us', category: 'forex' },
  { keyword: 'best regulated forex broker usa', market: 'us', category: 'forex' },
  { keyword: 'best low spread forex broker', market: 'us', category: 'forex' },
  { keyword: 'best cfd trading platform usa', market: 'us', category: 'forex' },
  { keyword: 'best leveraged forex broker', market: 'us', category: 'forex' },
  { keyword: 'best forex broker with crypto', market: 'us', category: 'forex' },
  { keyword: 'best micro forex account', market: 'us', category: 'forex' },
  { keyword: 'best forex broker no deposit bonus', market: 'us', category: 'forex' },
  { keyword: 'best metatrader 4 broker usa', market: 'us', category: 'forex' },
  { keyword: 'best metatrader 5 broker', market: 'us', category: 'forex' },
  { keyword: 'best forex broker reddit', market: 'us', category: 'forex' },
  { keyword: 'best forex signals service', market: 'us', category: 'forex' },
  { keyword: 'forex trading app usa', market: 'us', category: 'forex' },
  { keyword: 'best forex broker for scalping', market: 'us', category: 'forex' },
  { keyword: 'best forex broker for news trading', market: 'us', category: 'forex' },
  { keyword: 'oanda vs ic markets', market: 'us', category: 'forex' },
  { keyword: 'forex.com vs other brokers', market: 'us', category: 'forex' },
  { keyword: 'best ecn forex broker', market: 'us', category: 'forex' },
  { keyword: 'best stp forex broker', market: 'us', category: 'forex' },
  { keyword: 'best forex broker for day traders', market: 'us', category: 'forex' },
  { keyword: 'best forex broker for swingtraders', market: 'us', category: 'forex' },
  { keyword: 'best forex broker bonus 2026', market: 'us', category: 'forex' },
  { keyword: 'best fca regulated broker', market: 'us', category: 'forex' },
  { keyword: 'best broker with vps included', market: 'us', category: 'forex' },
  { keyword: 'best mobile forex app', market: 'us', category: 'forex' },
  { keyword: 'forex broker no 1099', market: 'us', category: 'forex' },
  { keyword: 'best crypto forex combo', market: 'us', category: 'forex' },
  { keyword: 'best forex broker for algorithmic trading', market: 'us', category: 'forex' },
  { keyword: 'best variable spread broker', market: 'us', category: 'forex' },
  { keyword: 'best copy trading platform forex', market: 'us', category: 'forex' },
  { keyword: 'best social trading platform', market: 'us', category: 'forex' },
  { keyword: 'best managed forex accounts', market: 'us', category: 'forex' },
  { keyword: 'trading 212 vs other brokers', market: 'us', category: 'forex' },

  // ── US PERSONAL FINANCE (40+ keywords) ──
  { keyword: 'best personal finance app', market: 'us', category: 'personal-finance' },
  { keyword: 'best budgeting app', market: 'us', category: 'personal-finance' },
  { keyword: 'best money management app', market: 'us', category: 'personal-finance' },
  { keyword: 'best investment tracking app', market: 'us', category: 'personal-finance' },
  { keyword: 'best credit score app', market: 'us', category: 'personal-finance' },
  { keyword: 'best savings app with high yield', market: 'us', category: 'personal-finance' },
  { keyword: 'best robo advisor', market: 'us', category: 'personal-finance' },
  { keyword: 'best wealth management app', market: 'us', category: 'personal-finance' },
  { keyword: 'best financial planning software', market: 'us', category: 'personal-finance' },
  { keyword: 'best tax preparation software', market: 'us', category: 'personal-finance' },
  { keyword: 'best credit card rewards app', market: 'us', category: 'personal-finance' },
  { keyword: 'best expense tracking app', market: 'us', category: 'personal-finance' },
  { keyword: 'best loan management app', market: 'us', category: 'personal-finance' },
  { keyword: 'best refinance app', market: 'us', category: 'personal-finance' },
  { keyword: 'best mortgage calculator app', market: 'us', category: 'personal-finance' },
  { keyword: 'best net worth tracking', market: 'us', category: 'personal-finance' },
  { keyword: 'best ira comparison tool', market: 'us', category: 'personal-finance' },
  { keyword: 'best 401k rollover app', market: 'us', category: 'personal-finance' },
  { keyword: 'best debt payoff calculator', market: 'us', category: 'personal-finance' },
  { keyword: 'best retirement planner app', market: 'us', category: 'personal-finance' },
  { keyword: 'betterment vs other robo advisors', market: 'us', category: 'personal-finance' },
  { keyword: 'sofi vs ally savings', market: 'us', category: 'personal-finance' },
  { keyword: 'best high yield savings account', market: 'us', category: 'personal-finance' },
  { keyword: 'best cd rates comparison', market: 'us', category: 'personal-finance' },
  { keyword: 'best money market account', market: 'us', category: 'personal-finance' },
  { keyword: 'best online bank', market: 'us', category: 'personal-finance' },
  { keyword: 'best credit union', market: 'us', category: 'personal-finance' },
  { keyword: 'best dividend tracking app', market: 'us', category: 'personal-finance' },
  { keyword: 'best portfolio tracker', market: 'us', category: 'personal-finance' },
  { keyword: 'best crypto portfolio tracker', market: 'us', category: 'personal-finance' },
  { keyword: 'best personal investment advisor', market: 'us', category: 'personal-finance' },
  { keyword: 'best passive income app', market: 'us', category: 'personal-finance' },
  { keyword: 'best side hustle tracking app', market: 'us', category: 'personal-finance' },
  { keyword: 'best financial independence calculator', market: 'us', category: 'personal-finance' },
  { keyword: 'best 529 plan comparison', market: 'us', category: 'personal-finance' },
  { keyword: 'best hsa comparison', market: 'us', category: 'personal-finance' },
  { keyword: 'best insurance comparison', market: 'us', category: 'personal-finance' },
  { keyword: 'best mortgage lender', market: 'us', category: 'personal-finance' },
  { keyword: 'best personal loan lender', market: 'us', category: 'personal-finance' },
  { keyword: 'best student loan refinancer', market: 'us', category: 'personal-finance' },

  // ── US BUSINESS BANKING (30+ keywords) ──
  { keyword: 'best business bank account', market: 'us', category: 'business-banking' },
  { keyword: 'best business checking account', market: 'us', category: 'business-banking' },
  { keyword: 'best business savings account', market: 'us', category: 'business-banking' },
  { keyword: 'best small business banking', market: 'us', category: 'business-banking' },
  { keyword: 'best business credit card', market: 'us', category: 'business-banking' },
  { keyword: 'best merchant services provider', market: 'us', category: 'business-banking' },
  { keyword: 'best payment processor', market: 'us', category: 'business-banking' },
  { keyword: 'best accounting software', market: 'us', category: 'business-banking' },
  { keyword: 'best payroll software', market: 'us', category: 'business-banking' },
  { keyword: 'best invoicing software', market: 'us', category: 'business-banking' },
  { keyword: 'best expense management app', market: 'us', category: 'business-banking' },
  { keyword: 'best cash flow forecasting tool', market: 'us', category: 'business-banking' },
  { keyword: 'best business loan provider', market: 'us', category: 'business-banking' },
  { keyword: 'best sba loan lender', market: 'us', category: 'business-banking' },
  { keyword: 'best invoice financing', market: 'us', category: 'business-banking' },
  { keyword: 'best equipment financing', market: 'us', category: 'business-banking' },
  { keyword: 'best line of credit for business', market: 'us', category: 'business-banking' },
  { keyword: 'best business insurance', market: 'us', category: 'business-banking' },
  { keyword: 'best expense tracking for business', market: 'us', category: 'business-banking' },
  { keyword: 'wise business transfer', market: 'us', category: 'business-banking' },
  { keyword: 'best international wire transfer', market: 'us', category: 'business-banking' },
  { keyword: 'best crypto business account', market: 'us', category: 'business-banking' },
  { keyword: 'best hr software', market: 'us', category: 'business-banking' },
  { keyword: 'quickbooks vs freshbooks', market: 'us', category: 'business-banking' },
  { keyword: 'square vs stripe', market: 'us', category: 'business-banking' },
  { keyword: 'best business bank for freelancers', market: 'us', category: 'business-banking' },
  { keyword: 'best online bank for business', market: 'us', category: 'business-banking' },
  { keyword: 'revolut business review', market: 'us', category: 'business-banking' },
  { keyword: 'best business checking no fee', market: 'us', category: 'business-banking' },
  { keyword: 'best virtual business address', market: 'us', category: 'business-banking' },

  // ── US AI TOOLS (35+ keywords) ──
  { keyword: 'best ai tools for finance', market: 'us', category: 'ai-tools' },
  { keyword: 'ai trading software', market: 'us', category: 'ai-tools' },
  { keyword: 'ai financial planning tools', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai investing assistant', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai wealth advisor', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai portfolio manager', market: 'us', category: 'ai-tools' },
  { keyword: 'best chatgpt finance plugin', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai stock picker', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai crypto prediction', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai budget app', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai invoice generator', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai expense categorizer', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai tax assistant', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai financial advisor chatbot', market: 'us', category: 'ai-tools' },
  { keyword: 'best ml trading strategy', market: 'us', category: 'ai-tools' },
  { keyword: 'best automated trading bot', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai powered credit repair', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai fraud detection', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai loan calculator', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai mortgage calculator', market: 'us', category: 'ai-tools' },
  { keyword: 'jasper ai for finance', market: 'us', category: 'ai-tools' },
  { keyword: 'copy ai business generator', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai financial content generator', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai trader analysis', market: 'us', category: 'ai-tools' },
  { keyword: 'best openai powered finance app', market: 'us', category: 'ai-tools' },
  { keyword: 'best anthropic claude finance', market: 'us', category: 'ai-tools' },
  { keyword: 'best neural network investing', market: 'us', category: 'ai-tools' },
  { keyword: 'best deep learning trading', market: 'us', category: 'ai-tools' },
  { keyword: 'best reinforcement learning trader', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai robo advisor 2026', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai personal finance assistant', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai credit score optimizer', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai investment recommender', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai portfolio rebalancer', market: 'us', category: 'ai-tools' },
  { keyword: 'best ai tax optimization', market: 'us', category: 'ai-tools' },

  // ── US CYBERSECURITY (30+ keywords) ──
  { keyword: 'best cybersecurity software', market: 'us', category: 'cybersecurity' },
  { keyword: 'cybersecurity tools for business', market: 'us', category: 'cybersecurity' },
  { keyword: 'best password manager', market: 'us', category: 'cybersecurity' },
  { keyword: 'best vpn service', market: 'us', category: 'cybersecurity' },
  { keyword: 'best antivirus software', market: 'us', category: 'cybersecurity' },
  { keyword: 'best malware protection', market: 'us', category: 'cybersecurity' },
  { keyword: 'best firewall software', market: 'us', category: 'cybersecurity' },
  { keyword: 'best two factor authentication', market: 'us', category: 'cybersecurity' },
  { keyword: 'best secure email service', market: 'us', category: 'cybersecurity' },
  { keyword: 'best encrypted messaging app', market: 'us', category: 'cybersecurity' },
  { keyword: 'best identity theft protection', market: 'us', category: 'cybersecurity' },
  { keyword: 'best credit monitoring service', market: 'us', category: 'cybersecurity' },
  { keyword: 'best dark web monitoring', market: 'us', category: 'cybersecurity' },
  { keyword: 'best breach notification service', market: 'us', category: 'cybersecurity' },
  { keyword: 'best sso solution', market: 'us', category: 'cybersecurity' },
  { keyword: 'best mfa solution', market: 'us', category: 'cybersecurity' },
  { keyword: 'best siem platform', market: 'us', category: 'cybersecurity' },
  { keyword: 'best endpoint detection', market: 'us', category: 'cybersecurity' },
  { keyword: 'best insider threat solution', market: 'us', category: 'cybersecurity' },
  { keyword: 'best iam platform', market: 'us', category: 'cybersecurity' },
  { keyword: '1password vs lastpass', market: 'us', category: 'cybersecurity' },
  { keyword: 'protonvpn review', market: 'us', category: 'cybersecurity' },
  { keyword: 'nordvpn vs expressvpn', market: 'us', category: 'cybersecurity' },
  { keyword: 'best business vpn', market: 'us', category: 'cybersecurity' },
  { keyword: 'best zero trust security', market: 'us', category: 'cybersecurity' },
  { keyword: 'best cloud security', market: 'us', category: 'cybersecurity' },
  { keyword: 'best ransomware protection', market: 'us', category: 'cybersecurity' },
  { keyword: 'best incident response', market: 'us', category: 'cybersecurity' },
  { keyword: 'best penetration testing', market: 'us', category: 'cybersecurity' },
  { keyword: 'best vulnerability scanning', market: 'us', category: 'cybersecurity' },

  // ── US CREDIT REPAIR (45+ keywords) ──
  { keyword: 'credit repair companies', market: 'us', category: 'credit-repair' },
  { keyword: 'best credit repair service', market: 'us', category: 'credit-repair' },
  { keyword: 'how to fix credit score', market: 'us', category: 'credit-repair' },
  { keyword: 'fix credit score fast', market: 'us', category: 'credit-repair' },
  { keyword: 'best credit repair letter templates', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair organizations act', market: 'us', category: 'credit-repair' },
  { keyword: 'professional credit repair', market: 'us', category: 'credit-repair' },
  { keyword: 'credit counseling vs credit repair', market: 'us', category: 'credit-repair' },
  { keyword: 'lexington law review', market: 'us', category: 'credit-repair' },
  { keyword: 'the credit people review', market: 'us', category: 'credit-repair' },
  { keyword: 'credit saint review', market: 'us', category: 'credit-repair' },
  { keyword: 'pyramid credit repair', market: 'us', category: 'credit-repair' },
  { keyword: 'best credit repair 2026', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair reddit', market: 'us', category: 'credit-repair' },
  { keyword: 'diy credit repair', market: 'us', category: 'credit-repair' },
  { keyword: 'credit dispute letter templates', market: 'us', category: 'credit-repair' },
  { keyword: 'how long does credit repair take', market: 'us', category: 'credit-repair' },
  { keyword: 'is credit repair legitimate', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair vs debt settlement', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair cost', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair monthly fee', market: 'us', category: 'credit-repair' },
  { keyword: 'free credit repair', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair guarantee', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair scam', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair lawsuit', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair complaints', market: 'us', category: 'credit-repair' },
  { keyword: 'credit report errors', market: 'us', category: 'credit-repair' },
  { keyword: 'dispute credit report', market: 'us', category: 'credit-repair' },
  { keyword: 'remove negative items credit report', market: 'us', category: 'credit-repair' },
  { keyword: 'charge offs credit repair', market: 'us', category: 'credit-repair' },
  { keyword: 'collections repair credit', market: 'us', category: 'credit-repair' },
  { keyword: 'foreclosure credit repair', market: 'us', category: 'credit-repair' },
  { keyword: 'bankruptcy credit repair', market: 'us', category: 'credit-repair' },
  { keyword: 'late payments repair credit', market: 'us', category: 'credit-repair' },
  { keyword: 'hard inquiries remove credit', market: 'us', category: 'credit-repair' },
  { keyword: 'authorized user credit repair', market: 'us', category: 'credit-repair' },
  { keyword: 'credit limits increase repair', market: 'us', category: 'credit-repair' },
  { keyword: 'credit utilization ratio', market: 'us', category: 'credit-repair' },
  { keyword: 'building credit from scratch', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair success rate', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair attorney', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair certification', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair business', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair affiliate', market: 'us', category: 'credit-repair' },
  { keyword: 'credit repair leads', market: 'us', category: 'credit-repair' },

  // ── US DEBT RELIEF (40+ keywords) ──
  { keyword: 'debt relief programs', market: 'us', category: 'debt-relief' },
  { keyword: 'best debt relief company', market: 'us', category: 'debt-relief' },
  { keyword: 'debt consolidation loans', market: 'us', category: 'debt-relief' },
  { keyword: 'debt settlement negotiation', market: 'us', category: 'debt-relief' },
  { keyword: 'national debt relief review', market: 'us', category: 'debt-relief' },
  { keyword: 'freedom debt relief review', market: 'us', category: 'debt-relief' },
  { keyword: 'debt negotiation companies', market: 'us', category: 'debt-relief' },
  { keyword: 'debt relief vs bankruptcy', market: 'us', category: 'debt-relief' },
  { keyword: 'credit card debt relief', market: 'us', category: 'debt-relief' },
  { keyword: 'personal loan debt relief', market: 'us', category: 'debt-relief' },
  { keyword: 'medical debt relief', market: 'us', category: 'debt-relief' },
  { keyword: 'student loan debt relief', market: 'us', category: 'debt-relief' },
  { keyword: 'tax debt relief', market: 'us', category: 'debt-relief' },
  { keyword: 'payday loan debt relief', market: 'us', category: 'debt-relief' },
  { keyword: 'mortgage debt relief', market: 'us', category: 'debt-relief' },
  { keyword: 'irs debt relief programs', market: 'us', category: 'debt-relief' },
  { keyword: 'dmp debt management plan', market: 'us', category: 'debt-relief' },
  { keyword: 'dro debt relief order', market: 'us', category: 'debt-relief' },
  { keyword: 'debt relief scam', market: 'us', category: 'debt-relief' },
  { keyword: 'is debt relief legitimate', market: 'us', category: 'debt-relief' },
  { keyword: 'debt settlement cost', market: 'us', category: 'debt-relief' },
  { keyword: 'debt relief fee', market: 'us', category: 'debt-relief' },
  { keyword: 'best debt relief reddit', market: 'us', category: 'debt-relief' },
  { keyword: 'debt relief 2026', market: 'us', category: 'debt-relief' },
  { keyword: 'debt relief complaints', market: 'us', category: 'debt-relief' },
  { keyword: 'debt relief testimonials', market: 'us', category: 'debt-relief' },
  { keyword: 'how does debt relief work', market: 'us', category: 'debt-relief' },
  { keyword: 'debt relief credit score impact', market: 'us', category: 'debt-relief' },
  { keyword: 'debt relief tax implications', market: 'us', category: 'debt-relief' },
  { keyword: 'negotiate debt settlement', market: 'us', category: 'debt-relief' },
  { keyword: 'diy debt settlement', market: 'us', category: 'debt-relief' },
  { keyword: 'debt settlement template', market: 'us', category: 'debt-relief' },
  { keyword: 'debt relief lawyer', market: 'us', category: 'debt-relief' },
  { keyword: 'debt relief attorney', market: 'us', category: 'debt-relief' },
  { keyword: 'nonprofit debt relief', market: 'us', category: 'debt-relief' },
  { keyword: 'government debt relief programs', market: 'us', category: 'debt-relief' },
  { keyword: 'debt consolidation vs settlement', market: 'us', category: 'debt-relief' },
  { keyword: 'best debt consolidation lender', market: 'us', category: 'debt-relief' },
  { keyword: 'best debt settlement company 2026', market: 'us', category: 'debt-relief' },
  { keyword: 'lendingtree debt relief', market: 'us', category: 'debt-relief' },

  // ── UK TRADING (30+ keywords) ──
  { keyword: 'best trading app uk', market: 'uk', category: 'trading' },
  { keyword: 'best stock trading platform uk', market: 'uk', category: 'trading' },
  { keyword: 'best investment platform uk', market: 'uk', category: 'trading' },
  { keyword: 'best trading platform uk beginners', market: 'uk', category: 'trading' },
  { keyword: 'best cfd broker uk', market: 'uk', category: 'trading' },
  { keyword: 'fca regulated brokers uk', market: 'uk', category: 'trading' },
  { keyword: 'best spread betting uk', market: 'uk', category: 'trading' },
  { keyword: 'best day trading platform uk', market: 'uk', category: 'trading' },
  { keyword: 'best options trading uk', market: 'uk', category: 'trading' },
  { keyword: 'interactive brokers uk', market: 'uk', category: 'trading' },
  { keyword: 'trading 212 review uk', market: 'uk', category: 'trading' },
  { keyword: 'degiro uk review', market: 'uk', category: 'trading' },
  { keyword: 'hargreaves lansdown review', market: 'uk', category: 'trading' },
  { keyword: 'etoro uk review', market: 'uk', category: 'trading' },
  { keyword: 'zero commission trading uk', market: 'uk', category: 'trading' },
  { keyword: 'best broker for penny stocks uk', market: 'uk', category: 'trading' },
  { keyword: 'best crypto trading uk', market: 'uk', category: 'trading' },
  { keyword: 'best leverage trading uk', market: 'uk', category: 'trading' },
  { keyword: 'best metatrader 4 broker uk', market: 'uk', category: 'trading' },
  { keyword: 'best active trader platform uk', market: 'uk', category: 'trading' },
  { keyword: 'best beginner broker uk', market: 'uk', category: 'trading' },
  { keyword: 'best mobile trading app uk', market: 'uk', category: 'trading' },
  { keyword: 'best technical analysis platform uk', market: 'uk', category: 'trading' },
  { keyword: 'best chart analysis uk', market: 'uk', category: 'trading' },
  { keyword: 'best algo trading uk', market: 'uk', category: 'trading' },
  { keyword: 'best fractional shares uk', market: 'uk', category: 'trading' },
  { keyword: 'best dividend investing uk', market: 'uk', category: 'trading' },
  { keyword: 'best etf broker uk', market: 'uk', category: 'trading' },
  { keyword: 'best bond broker uk', market: 'uk', category: 'trading' },
  { keyword: 'best forex trader uk', market: 'uk', category: 'trading' },

  // ── UK PERSONAL FINANCE (30+ keywords) ──
  { keyword: 'best isa platform uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best savings account uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best cash isa', market: 'uk', category: 'personal-finance' },
  { keyword: 'best stocks shares isa', market: 'uk', category: 'personal-finance' },
  { keyword: 'best lifetime isa', market: 'uk', category: 'personal-finance' },
  { keyword: 'best innovative finance isa', market: 'uk', category: 'personal-finance' },
  { keyword: 'best personal finance app uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best budgeting app uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best money saving app uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best investment app uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best robo advisor uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best pension provider uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best online bank uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best high interest savings', market: 'uk', category: 'personal-finance' },
  { keyword: 'best premium bonds', market: 'uk', category: 'personal-finance' },
  { keyword: 'best buy to let mortgage', market: 'uk', category: 'personal-finance' },
  { keyword: 'best first time buyer mortgage', market: 'uk', category: 'personal-finance' },
  { keyword: 'best mortgage broker uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best mortgage protection insurance', market: 'uk', category: 'personal-finance' },
  { keyword: 'best credit card uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best 0% balance transfer card', market: 'uk', category: 'personal-finance' },
  { keyword: 'best rewards credit card uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best personal loan uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best log book loan', market: 'uk', category: 'personal-finance' },
  { keyword: 'best guarantor loan', market: 'uk', category: 'personal-finance' },
  { keyword: 'best peer to peer lending uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best expense tracker uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best net worth tracker uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best pension calculator uk', market: 'uk', category: 'personal-finance' },
  { keyword: 'best retirement planner uk', market: 'uk', category: 'personal-finance' },

  // ── UK REMORTGAGING (35+ keywords) ──
  { keyword: 'remortgage rates 2026', market: 'uk', category: 'remortgaging' },
  { keyword: 'best remortgage deals', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage calculator', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage process timeline', market: 'uk', category: 'remortgaging' },
  { keyword: 'fixed rate mortgage ending', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage early redemption penalty', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage broker vs direct', market: 'uk', category: 'remortgaging' },
  { keyword: 'best remortgage lender uk', market: 'uk', category: 'remortgaging' },
  { keyword: 'habito review', market: 'uk', category: 'remortgaging' },
  { keyword: 'trussle review', market: 'uk', category: 'remortgaging' },
  { keyword: 'mortgage broker review uk', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage with cashback', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage fee comparison', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage stamp duty', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage conveyancer cost', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage valuation fee', market: 'uk', category: 'remortgaging' },
  { keyword: 'can i remortgage with bad credit', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage while on maternity leave', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage self employed', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage buy to let', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage with equity release', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage increase amount borrowed', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage joint mortgage', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage after divorce', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage with guarantor', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage interest only', market: 'uk', category: 'remortgaging' },
  { keyword: 'best fixed rate mortgage', market: 'uk', category: 'remortgaging' },
  { keyword: 'best tracker mortgage', market: 'uk', category: 'remortgaging' },
  { keyword: 'best discount mortgage', market: 'uk', category: 'remortgaging' },
  { keyword: 'best offset mortgage', market: 'uk', category: 'remortgaging' },
  { keyword: 'best variable rate mortgage', market: 'uk', category: 'remortgaging' },
  { keyword: 'mortgage rate forecast 2026', market: 'uk', category: 'remortgaging' },
  { keyword: 'should i remortgage now', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage moving lender', market: 'uk', category: 'remortgaging' },
  { keyword: 'remortgage vs staying put', market: 'uk', category: 'remortgaging' },

  // ── AU TRADING (25+ keywords) ──
  { keyword: 'best trading platform australia', market: 'au', category: 'trading' },
  { keyword: 'best share trading platform australia', market: 'au', category: 'trading' },
  { keyword: 'best asx broker', market: 'au', category: 'trading' },
  { keyword: 'best cfd broker australia', market: 'au', category: 'trading' },
  { keyword: 'asic regulated brokers', market: 'au', category: 'trading' },
  { keyword: 'best trading app australia', market: 'au', category: 'trading' },
  { keyword: 'best day trading platform australia', market: 'au', category: 'trading' },
  { keyword: 'best options trading australia', market: 'au', category: 'trading' },
  { keyword: 'best crypto exchange australia', market: 'au', category: 'trading' },
  { keyword: 'best leverage trading australia', market: 'au', category: 'trading' },
  { keyword: 'commsec vs selfwealth', market: 'au', category: 'trading' },
  { keyword: 'interactive brokers australia', market: 'au', category: 'trading' },
  { keyword: 'best zero commission broker australia', market: 'au', category: 'trading' },
  { keyword: 'best beginner broker australia', market: 'au', category: 'trading' },
  { keyword: 'best mobile trading australia', market: 'au', category: 'trading' },
  { keyword: 'best technical analysis australia', market: 'au', category: 'trading' },
  { keyword: 'best algo trading platform australia', market: 'au', category: 'trading' },
  { keyword: 'best fractional shares australia', market: 'au', category: 'trading' },
  { keyword: 'best dividend broker australia', market: 'au', category: 'trading' },
  { keyword: 'best etf broker australia', market: 'au', category: 'trading' },
  { keyword: 'best us shares trading australia', market: 'au', category: 'trading' },
  { keyword: 'best forex broker australia', market: 'au', category: 'trading' },
  { keyword: 'best managed funds australia', market: 'au', category: 'trading' },
  { keyword: 'best investment platform australia', market: 'au', category: 'trading' },
  { keyword: 'best robo advisor australia', market: 'au', category: 'trading' },

  // ── AU PERSONAL FINANCE (25+ keywords) ──
  { keyword: 'best investment app australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best savings account australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best high interest savings australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best online bank australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best mortgage broker australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best home loan australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best personal loan australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best car loan australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best credit card australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best rewards credit card australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best budgeting app australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best money management app australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best expense tracker australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best net worth tracker australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best superannuation calculator', market: 'au', category: 'personal-finance' },
  { keyword: 'best super fund', market: 'au', category: 'personal-finance' },
  { keyword: 'best self managed super fund', market: 'au', category: 'personal-finance' },
  { keyword: 'best insurance australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best life insurance australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best income protection insurance', market: 'au', category: 'personal-finance' },
  { keyword: 'best tax return software australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best financial advisor australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best wealth management australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best investment advice australia', market: 'au', category: 'personal-finance' },
  { keyword: 'best retirement planning australia', market: 'au', category: 'personal-finance' },

  // ── AU SUPERANNUATION (30+ keywords) ──
  { keyword: 'australian super review', market: 'au', category: 'superannuation' },
  { keyword: 'best super fund australia', market: 'au', category: 'superannuation' },
  { keyword: 'superannuation contribution limits', market: 'au', category: 'superannuation' },
  { keyword: 'salary sacrifice super', market: 'au', category: 'superannuation' },
  { keyword: 'concessional contributions super', market: 'au', category: 'superannuation' },
  { keyword: 'non concessional contributions', market: 'au', category: 'superannuation' },
  { keyword: 'super co contributions', market: 'au', category: 'superannuation' },
  { keyword: 'super splitting between spouses', market: 'au', category: 'superannuation' },
  { keyword: 'super early access covid', market: 'au', category: 'superannuation' },
  { keyword: 'super early access hardship', market: 'au', category: 'superannuation' },
  { keyword: 'super early access downsizer', market: 'au', category: 'superannuation' },
  { keyword: 'super preservation age', market: 'au', category: 'superannuation' },
  { keyword: 'super transition to retirement', market: 'au', category: 'superannuation' },
  { keyword: 'super income stream', market: 'au', category: 'superannuation' },
  { keyword: 'self managed super fund smsf', market: 'au', category: 'superannuation' },
  { keyword: 'smsf setup costs', market: 'au', category: 'superannuation' },
  { keyword: 'smsf property investment', market: 'au', category: 'superannuation' },
  { keyword: 'smsf audit requirements', market: 'au', category: 'superannuation' },
  { keyword: 'super tax deductions', market: 'au', category: 'superannuation' },
  { keyword: 'super division 293 tax', market: 'au', category: 'superannuation' },
  { keyword: 'super retirement income', market: 'au', category: 'superannuation' },
  { keyword: 'super death benefits', market: 'au', category: 'superannuation' },
  { keyword: 'super lost account recovery', market: 'au', category: 'superannuation' },
  { keyword: 'super fund performance comparison', market: 'au', category: 'superannuation' },
  { keyword: 'super fees comparison', market: 'au', category: 'superannuation' },
  { keyword: 'industry super fund', market: 'au', category: 'superannuation' },
  { keyword: 'retail super fund', market: 'au', category: 'superannuation' },
  { keyword: 'not for profit super fund', market: 'au', category: 'superannuation' },
  { keyword: 'super consolidation', market: 'au', category: 'superannuation' },
  { keyword: 'super fund merger', market: 'au', category: 'superannuation' },

  // ── AU GOLD INVESTING (30+ keywords) ──
  { keyword: 'best gold investment australia', market: 'au', category: 'gold-investing' },
  { keyword: 'perth mint gold', market: 'au', category: 'gold-investing' },
  { keyword: 'gold bullion australia', market: 'au', category: 'gold-investing' },
  { keyword: 'gold coins australia', market: 'au', category: 'gold-investing' },
  { keyword: 'gold bars australia', market: 'au', category: 'gold-investing' },
  { keyword: 'allocated gold storage', market: 'au', category: 'gold-investing' },
  { keyword: 'gold etf australia', market: 'au', category: 'gold-investing' },
  { keyword: 'gold futures australia', market: 'au', category: 'gold-investing' },
  { keyword: 'gold mining stocks australia', market: 'au', category: 'gold-investing' },
  { keyword: 'gold price australia today', market: 'au', category: 'gold-investing' },
  { keyword: 'gold price forecast 2026', market: 'au', category: 'gold-investing' },
  { keyword: 'should i invest in gold', market: 'au', category: 'gold-investing' },
  { keyword: 'gold investment returns', market: 'au', category: 'gold-investing' },
  { keyword: 'gold investment vs stocks', market: 'au', category: 'gold-investing' },
  { keyword: 'physical gold vs gold etf', market: 'au', category: 'gold-investing' },
  { keyword: 'gold investment tax australia', market: 'au', category: 'gold-investing' },
  { keyword: 'capital gains tax gold', market: 'au', category: 'gold-investing' },
  { keyword: 'gst on gold investment', market: 'au', category: 'gold-investing' },
  { keyword: 'gold investment portfolio allocation', market: 'au', category: 'gold-investing' },
  { keyword: 'gold investment insurance', market: 'au', category: 'gold-investing' },
  { keyword: 'gold investment storage cost', market: 'au', category: 'gold-investing' },
  { keyword: 'gold investment dealer australia', market: 'au', category: 'gold-investing' },
  { keyword: 'gold investment scam', market: 'au', category: 'gold-investing' },
  { keyword: 'best gold dealer australia', market: 'au', category: 'gold-investing' },
  { keyword: 'gold coin premiums', market: 'au', category: 'gold-investing' },
  { keyword: 'australian gold sovereign', market: 'au', category: 'gold-investing' },
  { keyword: 'gold wedding investment', market: 'au', category: 'gold-investing' },
  { keyword: 'gold ira equivalent australia', market: 'au', category: 'gold-investing' },
  { keyword: 'gold super fund investment', market: 'au', category: 'gold-investing' },
  { keyword: 'gold shortage 2026', market: 'au', category: 'gold-investing' },

  // ── CA TAX-EFFICIENT INVESTING (35+ keywords) ──
  { keyword: 'tax efficient investing canada', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'best tfsa account', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'best rrsp account', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'tfsa vs rrsp', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'best resp provider', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'cesg matching grants', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'best registered education savings', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'tax deductible investment', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'investment income tax canada', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'capital gains tax rate canada', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'dividend tax credit canada', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'tax loss harvesting canada', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'corporate class funds vs etf', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'best tax efficient etf canada', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'canadian dividend stocks tax', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'us dividend withholding tax canada', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'foreign tax credit canada investment', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'canadian mutual fund tax', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'best index funds canada', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'vanguard canada tax efficient', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'ishares canada etf tax', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'wealthsimple tax efficient', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'questrade tax efficient', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'best tax software canada', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'tax planning investment strategy', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'investment withdrawal strategy tax', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'retirement income tax planning canada', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'rrif vs lif tax', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'oac tax efficient investing', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'canadian investment tax brackets', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'spousal rrsp tax planning', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'prescribed rate loan strategy', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'small business investment tax', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'real estate investment tax canada', market: 'ca', category: 'tax-efficient-investing' },
  { keyword: 'principal residence exemption', market: 'ca', category: 'tax-efficient-investing' },

  // ── CA HOUSING (30+ keywords) ──
  { keyword: 'best mortgage broker canada', market: 'ca', category: 'housing' },
  { keyword: 'best home loan canada', market: 'ca', category: 'housing' },
  { keyword: 'mortgage rates canada 2026', market: 'ca', category: 'housing' },
  { keyword: 'fixed vs variable mortgage canada', market: 'ca', category: 'housing' },
  { keyword: 'best first time home buyer', market: 'ca', category: 'housing' },
  { keyword: 'rrsp home buyers plan', market: 'ca', category: 'housing' },
  { keyword: 'first time home buyer rebate', market: 'ca', category: 'housing' },
  { keyword: 'best mortgage lender canada', market: 'ca', category: 'housing' },
  { keyword: 'best mortgage calculator canada', market: 'ca', category: 'housing' },
  { keyword: 'best real estate agent canada', market: 'ca', category: 'housing' },
  { keyword: 'best property management canada', market: 'ca', category: 'housing' },
  { keyword: 'best home insurance canada', market: 'ca', category: 'housing' },
  { keyword: 'mortgage pre approval process', market: 'ca', category: 'housing' },
  { keyword: 'mortgage stress test canada', market: 'ca', category: 'housing' },
  { keyword: 'amortization period canada', market: 'ca', category: 'housing' },
  { keyword: 'mortgage default insurance cost', market: 'ca', category: 'housing' },
  { keyword: 'mortgage portability rules canada', market: 'ca', category: 'housing' },
  { keyword: 'mortgage refinancing options', market: 'ca', category: 'housing' },
  { keyword: 'mortgage prepayment penalties', market: 'ca', category: 'housing' },
  { keyword: 'second mortgage canada', market: 'ca', category: 'housing' },
  { keyword: 'heloc vs second mortgage', market: 'ca', category: 'housing' },
  { keyword: 'best heloc canada', market: 'ca', category: 'housing' },
  { keyword: 'rent vs buy calculator canada', market: 'ca', category: 'housing' },
  { keyword: 'property investment canada', market: 'ca', category: 'housing' },
  { keyword: 'real estate crowdfunding canada', market: 'ca', category: 'housing' },
  { keyword: 'co buying property canada', market: 'ca', category: 'housing' },
  { keyword: 'mortgage after divorce canada', market: 'ca', category: 'housing' },
  { keyword: 'bad credit mortgage canada', market: 'ca', category: 'housing' },
  { keyword: 'mortgage for self employed canada', market: 'ca', category: 'housing' },
  { keyword: 'home buying tips canada', market: 'ca', category: 'housing' },
];

// ── Helpers ──────────────────────────────────────────────────

export function getKeywordsForMarket(market: Market): CompetitorKeyword[] {
  return COMPETITOR_KEYWORDS.filter((k) => k.market === market);
}

export function getKeywordsForCategory(category: Category): CompetitorKeyword[] {
  return COMPETITOR_KEYWORDS.filter((k) => k.category === category);
}

/**
 * Extract domain from a URL string.
 * Returns empty string on malformed URLs.
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/**
 * Check if a domain is in the authority list.
 */
export function isAuthorityDomain(domain: string): boolean {
  const clean = domain.replace('www.', '').toLowerCase();
  return AUTHORITY_DOMAINS.some((auth) => clean.includes(auth));
}
