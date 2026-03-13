'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Info,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  XCircle,
  ArrowRight,
  Beaker,
  Clock,
  Users,
  BarChart3,
  TrendingUp,
  Shield,
  Zap,
  Building,
  Building2,
  DollarSign,
  Globe,
  Award,
  Target,
  Sparkles,
  FileText,
  CreditCard,
  PiggyBank,
  Lock,
  RefreshCw,
  ArrowRightLeft,
  MessageSquare,
  Briefcase,
  Calculator,
  Percent,
  Wallet,
  Landmark,
  Star,
  Plane,
  ChevronDown,
  Layers,
  // AP-11 + GEO-Snippet new imports
  PlayCircle,
  BookOpen,
  ChevronRight,
  Quote,
  // Tag 4 Quick-Win components
  Newspaper,
  BadgeCheck,
  Hash,
} from 'lucide-react';

// Marketing Components
import { AffiliateLink } from '@/components/marketing/affiliate-link';
import { RegulatorBadge } from '@/components/marketing/regulator-badge';
import { PreQualQuiz } from '@/components/marketing/pre-qual-quiz';
import { RegionalHeroImage } from '@/components/marketing/regional-hero-image';
import { CTABox } from '@/components/marketing/cta-box';
import { FAQSection } from '@/components/marketing/faq-section';
import { ComparisonTable, SimpleComparison } from '@/components/marketing/comparison-table';
import { StarRating, TrustBadges } from '@/components/marketing/trust-badges';
import {
  ExpertBox,
  ExpertEndorsement,
  TrustAuthority,
  MethodologyBox,
} from '@/components/marketing/expert-box';
import {
  TrackedCTA,
  HighlightCTA,
  InlineCTA,
  DecisionCTA,
} from '@/components/marketing/tracked-cta';
import { QuickPicks, CompactPicks } from '@/components/marketing/quick-picks';
// Dynamic imports — these components import Server Actions (newsletter.ts)
// which use Node.js `crypto` + `next/headers`. Static imports crash Turbopack
// HMR because it can't create the Server Reference proxy in the client bundle.
const NewsletterOptin = dynamic(
  () =>
    import('@/components/marketing/newsletter-optin').then((m) => ({
      default: m.NewsletterOptin,
    })),
  { ssr: false, loading: () => null },
);
const StickyNewsletterBar = dynamic(
  () =>
    import('@/components/marketing/newsletter-optin').then((m) => ({
      default: m.StickyNewsletterBar,
    })),
  { ssr: false, loading: () => null },
);
const ExitIntentPopup = dynamic(
  () =>
    import('@/components/marketing/newsletter-optin').then((m) => ({
      default: m.ExitIntentPopup,
    })),
  { ssr: false, loading: () => null },
);
const NewsletterBox = dynamic(
  () =>
    import('@/components/marketing/newsletter-box').then((m) => ({
      default: m.NewsletterBox,
    })),
  { ssr: false, loading: () => null },
);
const NewsletterInline = dynamic(
  () =>
    import('@/components/marketing/newsletter-box').then((m) => ({
      default: m.NewsletterInline,
    })),
  { ssr: false, loading: () => null },
);
import { SmartFinderQuiz, SmartFinderInline } from '@/components/marketing/smart-finder-quiz';
import { BrokerComparisonTablePremium } from '@/components/marketing/broker-comparison-premium';
import { ComparisonTablePremium } from '@/components/marketing/comparison-table-premium';
import { RiskWarningBox } from '@/components/marketing/risk-warning';
import { QuickVerdictCard } from '@/components/marketing/quick-verdict-card';
import { SmartFinCard } from '@/components/marketing/smartfin-card';
import { ProviderCard } from '@/components/marketing/provider-card';
import { ExpertVerdictBox } from '@/components/marketing/expert-verdict-box';
import { QuickSummary } from '@/components/marketing/quick-summary';
import {
  SpreadComparison,
  CostBreakdownGrid,
  ScoringCriteria,
  RegulationTiers,
  PositionSizeGuide,
  SectionHeader,
} from '@/components/marketing/trading-visuals';
import { ComparisonMatrix, CompactMatrix } from '@/components/marketing/comparison-matrix';
import NetworkAnimation from '@/components/marketing/network-animation';
import { NetworkAnimationMini } from '@/components/marketing/network-animation';
import { AISavingsCalculator, AISavingsCalculatorCompact } from '@/components/marketing/ai-savings-calculator';
import { NeuralFinanceSVG } from '@/components/marketing/neural-finance-svg';
import { CreditCardRewardsCalc } from '@/components/marketing/credit-card-rewards-calc';
import { ComparisonHub } from '@/components/marketing/comparison-hub';
// import { ReportHighlight, DataSummary } from '@/components/marketing/report-highlights';
import { AnalysisTable, ScopeTable, RankingTable } from '@/components/marketing/enterprise-table';
import { FrictionlessCTA } from '@/components/marketing/frictionless-cta';
import { EvidenceCarousel } from '@/components/marketing/evidence-carousel';
import { StickyComparisonBar } from '@/components/marketing/sticky-comparison-bar';
import { ExpertVerifier } from '@/components/marketing/expert-verifier';
import { WinnerAtGlance } from '@/components/marketing/winner-at-glance';
import { StickyTableOfContents } from '@/components/marketing/sticky-toc';
import { StickyFooterCTA } from '@/components/marketing/sticky-footer-cta';
import { AnswerBlock } from '@/components/ui/answer-block';
import { TrustBar } from '@/components/marketing/trust-bar';
// MiniQuiz uses Dialog which causes Turbopack bundling issues in mdxComponents.
// Render MiniQuiz via ReportLayout instead (outside MDX pipeline).
function MiniQuiz() { return null; }

// Tip Component — Sky background + Navy left border (per Konzept 7.3 Info-Box)
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border-l-4 p-4" style={{ borderColor: 'var(--sfp-navy)', background: 'var(--sfp-sky)' }}>
      <div className="flex gap-3">
        <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-navy)' }} />
        <div className="text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Info Component — Sky background + Navy left border (per Konzept 7.3 Info-Box)
function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border-l-4 p-4" style={{ borderColor: 'var(--sfp-navy)', background: 'var(--sfp-sky)' }}>
      <div className="flex gap-3">
        <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-navy)' }} />
        <div className="text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Warning Component — Gelb-Tint + Gold left border (per Konzept 7.3 Warning-Box)
function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border-l-4 p-4" style={{ borderColor: 'var(--sfp-gold)', background: 'var(--sfp-warning-bg)' }}>
      <div className="flex gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
        <div className="text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Pros/Cons Component
function ProsCons({
  pros,
  cons,
}: {
  pros: string[];
  cons: string[];
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4 my-6">
      <Card className="border-green-200 bg-white">
        <CardContent className="p-4">
          <h4 className="font-bold text-green-600 mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Pros
          </h4>
          <ul className="space-y-2">
            {pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--sfp-ink)' }}>
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="border-red-200 bg-white">
        <CardContent className="p-4">
          <h4 className="font-bold text-red-600 mb-3 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Cons
          </h4>
          <ul className="space-y-2">
            {cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--sfp-ink)' }}>
                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Rating Component — Split-Panel Proof Design (matches TrustAuthority)
function Rating({ value }: { value: number }) {
  return (
    <div className="my-10 not-prose">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

        <div className="flex flex-col lg:flex-row">
          {/* Left panel: Label */}
          <div
            className="shrink-0 px-6 py-5 lg:px-8 lg:py-0 flex flex-col justify-center lg:w-[260px] border-b lg:border-b-0 lg:border-r border-gray-100"
            style={{ background: 'var(--sfp-sky)' }}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,166,35,0.12)' }}
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              </div>
              <span
                className="text-sm font-bold uppercase tracking-wider leading-tight"
                style={{ color: 'var(--sfp-navy)' }}
              >
                Our Rating
              </span>
            </div>
            <p style={{ color: 'var(--sfp-slate)', fontSize: '11px' }} className="lg:pl-[38px]">
              Expert Score
            </p>
          </div>

          {/* Right panel: Stars + Value */}
          <div className="flex-1 flex items-center gap-3 px-6 py-4 lg:px-8">
            <StarRating value={value} size="lg" />
            <span className="font-bold" style={{ color: 'var(--sfp-navy)', fontSize: '18px' }}>{value}/5</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Affiliate Button Component — Split-Panel Design with CTA click tracking
function AffiliateButton({
  href,
  productName,
  provider,
  market,
  variant = 'emerald-shimmer',
  enablePreQual = false,
  children,
}: {
  href: string;
  productName?: string;
  /** Provider name for analytics (falls back to productName) */
  provider?: string;
  /** Market code for analytics (auto-detected from URL path) */
  market?: 'us' | 'uk' | 'ca' | 'au';
  /** CTA variant: 'primary' (gold action) or 'secondary' (navy learn more) */
  variant?: 'emerald-shimmer' | 'violet-pill' | 'primary' | 'secondary';
  /** P3: Pre-Qual Quiz — opens qualification modal before outbound click */
  enablePreQual?: boolean;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showQuiz, setShowQuiz] = useState(false);
  const resolvedMarket = market || detectMarketFromPath(pathname);

  // Detect category from URL path: /[market]/[category]/[slug] or /[category]/[slug]
  const segments = (pathname || '').split('/').filter(Boolean);
  const firstSeg = segments[0];
  const resolvedCategory =
    firstSeg === 'uk' || firstSeg === 'ca' || firstSeg === 'au'
      ? segments[1] || ''
      : firstSeg || '';

  // Extract slug from href for pre-qual
  const affiliateSlug = href.startsWith('/go/')
    ? href.replace('/go/', '').replace(/\/$/, '')
    : href;

  const handleClick = (e?: React.MouseEvent) => {
    // If pre-qual enabled, intercept click and show quiz
    if (enablePreQual) {
      e?.preventDefault();
      setShowQuiz(true);
      return;
    }

    const slug = pathname || '/';
    const resolvedProvider = provider || productName || 'unknown';

    fetch('/api/track-cta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        provider: resolvedProvider,
        variant,
        market: resolvedMarket,
      }),
    }).catch(() => {});
  };

  return (
    <div className="my-10 not-prose">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

        <div className="flex flex-col lg:flex-row">
          {/* Left panel: Label */}
          <div
            className="shrink-0 px-6 py-5 lg:px-8 lg:py-0 flex flex-col justify-center lg:w-[260px] border-b lg:border-b-0 lg:border-r border-gray-100"
            style={{ background: 'var(--sfp-sky)' }}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(26,107,58,0.1)' }}
              >
                <ArrowRight className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} />
              </div>
              <span
                className="text-sm font-bold uppercase tracking-wider leading-tight"
                style={{ color: 'var(--sfp-navy)' }}
              >
                Get Started
              </span>
            </div>
            <p style={{ color: 'var(--sfp-slate)', fontSize: '11px' }} className="lg:pl-[38px]">
              Official Partner Link
            </p>
          </div>

          {/* Right panel: CTA + Regulator Badge */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-4 lg:px-8">
            <Link
              href={enablePreQual ? '#' : href}
              target={enablePreQual ? undefined : '_blank'}
              rel="nofollow noopener sponsored"
              onClick={handleClick}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-white transition-all px-5 py-2.5 shadow-sm hover:shadow-md whitespace-nowrap"
              style={{ background: 'var(--sfp-gold)', color: '#ffffff', fontSize: '13px' }}
            >
              {children || `Try ${productName || 'Now'} Free`}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <RegulatorBadge market={resolvedMarket} category={resolvedCategory} size="md" />
          </div>
        </div>
      </div>

      {/* P3: Pre-Qual Quiz Modal */}
      {showQuiz && (
        <PreQualQuiz
          slug={affiliateSlug}
          market={resolvedMarket}
          category={resolvedCategory}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </div>
  );
}

// Collapsible Section — Split-Panel Proof Design Accordion
// Uses native <details>/<summary> for zero-JS open/close
function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="my-8 not-prose">
      <details
        className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden group"
        open={defaultOpen || undefined}
      >
        {/* Gradient accent bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex flex-col lg:flex-row">
          {/* Left panel: Label */}
          <div
            className="shrink-0 px-6 py-5 lg:px-8 lg:py-0 flex flex-col justify-center lg:w-[260px] border-b lg:border-b-0 lg:border-r border-gray-100"
            style={{ background: 'var(--sfp-sky)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(27,79,140,0.08)' }}
              >
                <Layers className="h-3.5 w-3.5" style={{ color: 'var(--sfp-navy)' }} />
              </div>
              <span
                className="text-sm font-bold uppercase tracking-wider leading-tight"
                style={{ color: 'var(--sfp-navy)' }}
              >
                {title}
              </span>
              {count != null && (
                <span
                  className="text-[10px] font-bold rounded-full px-2 py-0.5"
                  style={{ background: 'var(--sfp-navy)', color: '#fff' }}
                >
                  {count}
                </span>
              )}
            </div>
          </div>

          {/* Right panel: Chevron toggle hint */}
          <div className="flex-1 flex items-center justify-between px-6 py-4 lg:px-8">
            <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
              <span className="group-open:hidden">Show details</span>
              <span className="hidden group-open:inline">Hide details</span>
            </span>
            <ChevronDown
              className="h-4 w-4 transition-transform duration-200 group-open:rotate-180"
              style={{ color: 'var(--sfp-slate)' }}
            />
          </div>
        </summary>

        {/* Collapsible content */}
        <div className="border-t border-gray-100 px-6 py-5 lg:px-8">
          {children}
        </div>
      </details>
    </div>
  );
}

/** Detect market code from URL path (e.g. /uk/personal-finance/... → 'uk') */
function detectMarketFromPath(pathname: string | null): 'us' | 'uk' | 'ca' | 'au' {
  if (!pathname) return 'us';
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first === 'uk' || first === 'ca' || first === 'au') return first;
  return 'us'; // US uses clean URLs (no /us prefix)
}

// Executive Summary Component — Split-Panel Design (matches TrustAuthority proof design)
function ExecutiveSummary({
  children,
  title = 'Key Findings',
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="relative my-10 not-prose">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

        <div className="flex flex-col lg:flex-row">
          {/* Left panel: Title */}
          <div
            className="shrink-0 px-6 py-5 lg:px-8 lg:py-6 flex flex-col justify-center lg:w-[260px] border-b lg:border-b-0 lg:border-r border-gray-100"
            style={{ background: 'var(--sfp-sky)' }}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(26,107,58,0.1)' }}
              >
                <FileText className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
              </div>
              <span
                className="text-sm font-bold uppercase tracking-wider leading-tight"
                style={{ color: 'var(--sfp-navy)' }}
              >
                {title}
              </span>
            </div>
            <p style={{ color: 'var(--sfp-slate)', fontSize: '11px' }} className="lg:pl-[38px]">
              Key Findings &amp; Analysis
            </p>
          </div>

          {/* Right panel: Content */}
          <div className="flex-1 px-6 py-5 lg:px-8 lg:py-6 text-[14px] leading-relaxed space-y-3 [&>p]:mb-3 [&>p:last-child]:mb-0 [&_strong]:font-semibold" style={{ color: 'var(--sfp-ink)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// CallToAction — generated by content-generator for mid-article CTAs
function CallToAction({
  title,
  description,
  href,
  buttonText = 'Learn More →',
  variant = 'primary',
}: {
  title: string;
  description?: string;
  href: string;
  buttonText?: string;
  variant?: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';
  return (
    <div className="my-8 not-prose">
      <div
        className="rounded-2xl p-6 border border-gray-200 bg-white"
        style={{ boxShadow: '0 2px 12px rgba(27, 79, 140, 0.06)' }}
      >
        <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--sfp-ink)' }}>{title}</h4>
        {description && (
          <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>{description}</p>
        )}
        <Link
          href={href}
          target="_blank"
          rel="nofollow noopener sponsored"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
          style={{
            background: isPrimary ? 'var(--sfp-gold)' : 'var(--sfp-navy)',
          }}
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}

// ComplianceNotice — regulatory notices generated by content-generator
function ComplianceNotice({ market, category }: { market?: string; category?: string }) {
  return <AutoDisclaimer category={category || 'ai-tools'} market={market} />;
}

// AffiliateDisclosure — auto-detects category from URL path
function AffiliateDisclosure({ market }: { market?: string }) {
  const pathname = usePathname();
  // Extract category from path: /[market]/[category]/[slug] or /[category]/[slug]
  const segments = (pathname || '').split('/').filter(Boolean);
  const firstSeg = segments[0];
  const category =
    firstSeg === 'uk' || firstSeg === 'ca' || firstSeg === 'au'
      ? segments[1] || 'ai-tools'
      : firstSeg || 'ai-tools';

  return <AutoDisclaimer category={category} market={market} />;
}

// Auto Disclaimer Component — covers all 16 categories × 4 markets
function AutoDisclaimer({ category, market }: { category: string; market?: string }) {
  const AFFILIATE_BASE = 'Affiliate Disclosure: SmartFinPro may earn a commission when you click links and make a purchase.';

  const tradingDisclaimers: Record<string, string[]> = {
    us: [
      AFFILIATE_BASE,
      'Risk Warning: Forex trading involves significant risk of loss and is not suitable for all investors. Past performance is not indicative of future results. All brokers listed are regulated by the NFA and CFTC.',
    ],
    uk: [
      AFFILIATE_BASE,
      'Risk Warning: CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. Between 74-89% of retail investor accounts lose money when trading CFDs. All platforms mentioned are authorised and regulated by the Financial Conduct Authority (FCA).',
    ],
    ca: [
      AFFILIATE_BASE,
      'Risk Warning: Forex and CFD trading involves significant risk of loss. Leveraged products can result in losses exceeding your initial deposit. All brokers listed are regulated by CIRO (Canadian Investment Regulatory Organization).',
    ],
    au: [
      AFFILIATE_BASE,
      'Risk Warning: CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money. Consider the Product Disclosure Statement (PDS) and Target Market Determination (TMD) before making a decision. All brokers listed hold an Australian Financial Services Licence (AFSL) regulated by ASIC.',
    ],
  };

  const disclaimers: Record<string, string[]> = {
    // ── Original 6 categories ──
    'ai-tools': [
      AFFILIATE_BASE + ' This does not affect our editorial independence.',
    ],
    trading: market ? (tradingDisclaimers[market] || tradingDisclaimers.us) : tradingDisclaimers.us,
    forex: market ? (tradingDisclaimers[market] || tradingDisclaimers.us) : tradingDisclaimers.us,
    'personal-finance': [
      AFFILIATE_BASE,
      'Credit Card Disclaimer: SmartFinPro is not a lender or card issuer. Credit card approval is not guaranteed and depends on your creditworthiness. APR, fees, rewards, and terms are set by the card issuer and may change. Please review the Schumer Box and full terms on the issuer\'s website before applying. Applying may result in a hard inquiry on your credit report.',
    ],
    'business-banking': [
      AFFILIATE_BASE,
      'Important: Business account eligibility and features may vary based on your business type and location.',
    ],
    cybersecurity: [
      AFFILIATE_BASE + ' This does not affect our editorial independence.',
      'Feature availability may vary by plan. Always verify current pricing and features on the provider\'s website.',
    ],
    // ── US Silo categories ──
    'credit-repair': [
      AFFILIATE_BASE,
      'Important: Credit repair companies cannot guarantee specific outcomes. Results vary. This is not legal or financial advice. Credit repair is regulated under the Credit Repair Organizations Act (CROA).',
    ],
    'debt-relief': [
      AFFILIATE_BASE,
      'Risk Warning: Debt relief programs may negatively impact your credit score and have tax consequences on forgiven debt. Fees apply. Results vary based on individual circumstances. This is not financial advice.',
    ],
    'credit-score': [
      AFFILIATE_BASE,
      'Important: Credit scores shown are for educational purposes only. Actual scores may vary by bureau and scoring model. Checking your own score does not affect your credit.',
    ],
    // ── UK Silo categories ──
    remortgaging: [
      AFFILIATE_BASE,
      'Your home may be repossessed if you do not keep up repayments on your mortgage. All mortgage advice must come from an FCA-authorised advisor.',
    ],
    'cost-of-living': [
      AFFILIATE_BASE,
      'Information provided for guidance only. Eligibility for government schemes varies by household circumstances.',
    ],
    savings: [
      AFFILIATE_BASE,
      'Interest rates may vary and are subject to change. FSCS protection applies up to £85,000 per eligible institution.',
    ],
    // ── AU Silo categories ──
    superannuation: [
      AFFILIATE_BASE,
      'General advice warning: This information is general in nature and does not take into account your personal financial situation, objectives, or needs. Consider the Product Disclosure Statement (PDS) and Target Market Determination (TMD) before making a decision. Past performance is not a reliable indicator of future results. All super funds referenced are regulated by APRA or hold appropriate ASIC licences.',
    ],
    'gold-investing': [
      AFFILIATE_BASE,
      'Risk Warning: Investing in gold and precious metals carries risk. Past performance is not indicative of future returns. Consider the PDS before deciding. AFSL regulated where applicable.',
    ],
    // ── CA Silo categories ──
    'tax-efficient-investing': [
      AFFILIATE_BASE,
      'Important: Contribution limits and tax rules for TFSA, RRSP, and FHSA may change. This is general information, not tax advice. Consult a qualified tax professional. All platforms referenced are CIRO-regulated where applicable.',
    ],
    housing: [
      AFFILIATE_BASE,
      'Important: Mortgage rates and eligibility vary by lender and province. CMHC insurance requirements apply to high-ratio mortgages. This is not financial advice.',
    ],
  };

  // Market-specific regulatory notices (for non-trading categories)
  const isTradingOrForex = category === 'trading' || category === 'forex';
  let marketNotice = '';
  if (!isTradingOrForex) {
    if (market === 'uk') {
      marketNotice = 'All platforms mentioned are authorised and regulated by the Financial Conduct Authority (FCA). Your capital is at risk.';
    } else if (market === 'au') {
      marketNotice = 'General advice warning: Consider whether this information is appropriate for your circumstances. All providers referenced hold an Australian Financial Services Licence (AFSL) or are regulated by ASIC where applicable.';
    } else if (market === 'ca') {
      marketNotice = 'All platforms referenced are regulated by CIRO (Canadian Investment Regulatory Organization) or provincially regulated where applicable.';
    }
  }

  const relevant = disclaimers[category] || disclaimers['ai-tools'];

  return (
    <aside className="my-8 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground border">
      {relevant.map((text, i) => (
        <p key={i} className="mb-2 last:mb-0">
          {text}
        </p>
      ))}
      {marketNotice && (
        <p className="mb-2">
          {marketNotice}
        </p>
      )}
      <p className="mt-2">
        <Link href="/affiliate-disclosure" className="underline hover:text-primary">
          Learn more about our review process
        </Link>
      </p>
    </aside>
  );
}

// ── Styled Base Elements ──────────────────────────────────────────────

function StyledH1({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight mt-10 mb-8 leading-[1.1]" style={{ color: 'var(--sfp-navy)' }} {...props}>
      {children}
    </h1>
  );
}

function StyledH2({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <div className="relative mt-7 mb-6 not-prose">
      <div className="flex items-center gap-4">
        <div
          className="w-1 h-8 rounded-full shrink-0"
          style={{ background: 'linear-gradient(180deg, var(--sfp-navy), var(--sfp-gold))' }}
        />
        <h2 className="text-[32px] md:text-[36px] font-semibold tracking-tight" style={{ color: 'var(--sfp-navy)' }} {...props}>
          {children}
        </h2>
      </div>
      <div
        className="mt-3 ml-5 h-px w-32"
        style={{ background: 'linear-gradient(90deg, var(--sfp-gold), transparent)' }}
      />
    </div>
  );
}

function StyledH3({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <div className="relative mb-5 not-prose" style={{ marginTop: '45px' }}>
      <h3 className="text-[24px] md:text-[28px] font-semibold" style={{ color: 'var(--sfp-green)' }} {...props}>
        {children}
      </h3>
      <div
        className="mt-2 h-px w-20"
        style={{ background: 'linear-gradient(90deg, var(--sfp-green), transparent)' }}
      />
    </div>
  );
}

function StyledH4({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4 className="text-[20px] md:text-[22px] font-medium mt-8 mb-4" style={{ color: 'var(--sfp-ink)' }} {...props}>
      {children}
    </h4>
  );
}

function StyledUl({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative my-6 not-prose">
      <div className="rounded-xl px-6 py-5 border border-gray-200 bg-white shadow-sm">
        <ul className="space-y-2.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {children}
        </ul>
      </div>
    </div>
  );
}

function StyledOl({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative my-6 not-prose">
      <div className="rounded-xl px-6 py-5 border border-gray-200 bg-white shadow-sm">
        <ol className="space-y-2.5 list-none counter-reset-[item]" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {children}
        </ol>
      </div>
    </div>
  );
}

function StyledLi({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '16px', color: 'var(--sfp-ink)', lineHeight: '1.7', paddingTop: '2px', paddingBottom: '2px', listStyle: 'none' }}>
      <span style={{ position: 'relative', marginTop: '7px', width: '10px', height: '10px', minWidth: '10px', flexShrink: 0 }}>
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--sfp-navy), var(--sfp-gold))',
          }}
        />
      </span>
      <span className="[&>strong]:font-semibold" style={{ color: 'var(--sfp-ink)' }}>{children}</span>
    </li>
  );
}

function StyledHr() {
  return (
    <div className="my-6 not-prose">
      <div
        className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent, var(--sfp-navy), var(--sfp-gold), var(--sfp-navy), transparent)', opacity: 0.3 }}
      />
    </div>
  );
}

function StyledTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 not-prose overflow-x-auto enterprise-table">
      <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}

function StyledThead({ children, style, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  // Keep backwards compatibility for non-color layout styles,
  // but enforce current design tokens for header background/text.
  const mergedStyle: React.CSSProperties = {
    ...(style || {}),
    background: 'var(--sfp-sky)',
    backgroundColor: 'var(--sfp-sky)',
    color: 'var(--sfp-navy)',
  };
  return (
    <thead style={mergedStyle} {...props}>
      {children}
    </thead>
  );
}

function StyledTh({ children, className, style, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  const mergedStyle: React.CSSProperties = {
    ...(style || {}),
    color: 'var(--sfp-navy)',
  };
  return (
    <th
      className={className || "px-5 py-4 text-left text-xs font-bold uppercase tracking-wider"}
      style={mergedStyle}
      {...props}
    >
      {children}
    </th>
  );
}

function StyledTd({ children, className, style, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={className || "px-5 py-4 border-b border-gray-100 [&>strong]:font-semibold text-sm"}
      style={style || { color: 'var(--sfp-ink)' }}
      {...props}
    >
      {children}
    </td>
  );
}

function StyledTr({ children, className, style, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={className} style={style} {...props}>
      {children}
    </tr>
  );
}

// === Winner Column Components (Enterprise "Top Pick" Highlighting) ===
// Used in comparison tables to visually highlight the recommended provider column.
// These bypass the MDX props limitation by being dedicated custom components.

function WinnerTh({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <th
      className="px-5 py-5 text-center font-bold uppercase tracking-wider"
      style={{
        background: 'var(--sfp-sky)',
        color: 'var(--sfp-navy)',
        borderLeft: '3px solid rgba(245,166,35,0.5)',
        borderRight: '3px solid rgba(245,166,35,0.5)',
      }}
    >
      <div
        className="inline-block mb-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
        style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.4)', color: 'var(--sfp-gold-dark)' }}
      >
        ★ Top Pick
      </div>
      <div className="text-sm font-bold" style={{ color: 'var(--sfp-navy)' }}>{children}</div>
      {label && <div className="text-[10px] font-normal mt-0.5" style={{ color: 'var(--sfp-gold-dark)' }}>★ {label}</div>}
    </th>
  );
}

function WinnerTd({ children, alt }: { children: React.ReactNode; alt?: boolean }) {
  return (
    <td
      className="px-5 py-4 text-center"
      style={{
        background: alt ? 'rgba(245,166,35,0.09)' : 'rgba(245,166,35,0.07)',
        borderLeft: '3px solid rgba(245,166,35,0.35)',
        borderRight: '3px solid rgba(245,166,35,0.35)',
      }}
    >
      {children}
    </td>
  );
}

function WinnerCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <td
      className="px-5 py-4 text-center"
      style={{
        background: 'rgba(245,166,35,0.09)',
        borderLeft: '3px solid rgba(245,166,35,0.35)',
        borderRight: '3px solid rgba(245,166,35,0.35)',
      }}
    >
      <a
        href={href}
        target="_blank"
        rel="nofollow noopener sponsored"
        className="btn-shimmer inline-flex items-center justify-center h-10 px-6 rounded-lg text-xs font-bold whitespace-nowrap no-underline transition-all duration-200"
        style={{
          background: 'var(--sfp-gold)',
          color: 'white',
          boxShadow: '0 4px 15px rgba(245,166,35,0.4)',
          border: 'none',
          textDecoration: 'none',
        }}
      >
        {children}
      </a>
    </td>
  );
}

function StyledBlockquote({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 not-prose">
      <div
        className="relative rounded-xl p-5 border border-gray-200"
        style={{ background: 'var(--sfp-sky)' }}
      >
        <div
          className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
          style={{ background: 'linear-gradient(180deg, var(--sfp-navy), var(--sfp-gold))' }}
        />
        <div className="pl-4 italic font-serif [&>p]:mb-2 [&>p:last-child]:mb-0 [&_strong]:font-semibold" style={{ color: 'var(--sfp-slate)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function StyledP({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className="text-base leading-[1.7] mb-5 [&>strong]:font-semibold [&>a]:underline [&>a]:underline-offset-2" style={{ color: 'var(--sfp-ink)' }} {...props}>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────
// AP-11: Missing Content Templates
// ─────────────────────────────────────────────────────────────

// ── 1. StepByStepGuide ───────────────────────────────────────
// Tutorial component for how-to / problem-solution pages (SEO impact)
// Usage in MDX:
//   <StepByStepGuide title="How to Open a Trading Account">
//     <Step n={1} title="Choose a regulated broker">...content...</Step>
//     <Step n={2} title="Verify your identity">...content...</Step>
//   </StepByStepGuide>

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 group">
      {/* Step number circle */}
      <div className="shrink-0 flex flex-col items-center">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
          style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, #2563EB 100%)' }}
        >
          {n}
        </div>
        {/* Connector line */}
        <div className="w-px flex-1 mt-2 mb-0" style={{ background: 'linear-gradient(180deg, var(--sfp-navy) 0%, transparent 100%)', minHeight: '20px', opacity: 0.2 }} />
      </div>
      {/* Content */}
      <div className="flex-1 pb-6">
        <h4 className="font-semibold mb-2 text-[15px]" style={{ color: 'var(--sfp-navy)' }}>
          {title}
        </h4>
        <div className="text-[14px] leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 [&_strong]:font-semibold [&_a]:underline" style={{ color: 'var(--sfp-ink)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function StepByStepGuide({
  title,
  subtitle,
  children,
  timeEstimate,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  timeEstimate?: string;
}) {
  return (
    <div className="relative my-10 not-prose">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

        {/* Header — split-panel */}
        <div className="flex flex-col lg:flex-row border-b border-gray-100">
          {/* Left panel */}
          <div
            className="shrink-0 px-6 py-5 lg:px-8 lg:py-6 flex flex-col justify-center lg:w-[260px] border-b lg:border-b-0 lg:border-r border-gray-100"
            style={{ background: 'var(--sfp-sky)' }}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(27,79,140,0.1)' }}>
                <ChevronRight className="h-3.5 w-3.5" style={{ color: 'var(--sfp-navy)' }} />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--sfp-navy)' }}>
                Step-by-Step
              </span>
            </div>
            {timeEstimate && (
              <div className="flex items-center gap-1.5 mt-1 lg:pl-[38px]">
                <Clock className="h-3 w-3" style={{ color: 'var(--sfp-slate)' }} />
                <span style={{ color: 'var(--sfp-slate)', fontSize: '11px' }}>{timeEstimate}</span>
              </div>
            )}
          </div>
          {/* Right panel: Title */}
          <div className="flex-1 px-6 py-5 lg:px-8 lg:py-6">
            <h3 className="font-bold text-[17px] leading-tight mb-1" style={{ color: 'var(--sfp-ink)' }}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-[13px]" style={{ color: 'var(--sfp-slate)' }}>{subtitle}</p>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="px-6 py-6 lg:px-10 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── 2. VideoContainer ─────────────────────────────────────────
// Responsive video embed + VideoObject JSON-LD for SEO
// Usage in MDX:
//   <VideoContainer
//     src="https://www.youtube.com/embed/xyz"
//     title="Best Brokers 2026 Comparison"
//     description="We compare the top 5 regulated brokers..."
//     uploadDate="2026-03-06"
//     thumbnail="https://img.youtube.com/vi/xyz/maxresdefault.jpg"
//   />

function VideoContainer({
  src,
  title,
  description,
  uploadDate,
  thumbnail,
  label,
}: {
  src: string;
  title: string;
  description?: string;
  uploadDate?: string;
  thumbnail?: string;
  label?: string;
}) {
  // Build VideoObject JSON-LD for Google/AI Overviews
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description: description || title,
    uploadDate: uploadDate || '2026-01-01', // safe — static fallback avoids SSR/client mismatch
    ...(thumbnail ? { thumbnailUrl: thumbnail } : {}),
    embedUrl: src,
  };

  return (
    <div className="relative my-10 not-prose">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

        {/* Header label */}
        {(label || title) && (
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5" style={{ background: 'var(--sfp-sky)' }}>
            <PlayCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--sfp-navy)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--sfp-navy)' }}>
              {label || title}
            </span>
          </div>
        )}

        {/* 16:9 responsive iframe */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={src}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
          />
        </div>

        {/* Caption */}
        {description && (
          <div className="px-5 py-3 border-t border-gray-100">
            <p className="text-[12px]" style={{ color: 'var(--sfp-slate)' }}>{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 3. CaseStudyCard ─────────────────────────────────────────
// Social proof / case study block — deep trust signal
// Usage in MDX:
//   <CaseStudyCard
//     company="FinanceFirm Ltd."
//     industry="Wealth Management"
//     challenge="Spending 15h/week on manual research"
//     solution="Deployed AI tools from our top picks list"
//     result="+62% efficiency, €18,400 saved per year"
//     quote="Game-changer for our advisory team."
//     author="CFO, FinanceFirm Ltd."
//   />

function CaseStudyCard({
  company,
  industry,
  challenge,
  solution,
  result,
  quote,
  author,
  logo,
}: {
  company: string;
  industry?: string;
  challenge: string;
  solution: string;
  result: string;
  quote?: string;
  author?: string;
  logo?: string;
}) {
  return (
    <div className="relative my-10 not-prose">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

        <div className="flex flex-col lg:flex-row">
          {/* Left panel: Company + Result */}
          <div
            className="shrink-0 px-6 py-6 lg:px-8 lg:py-8 flex flex-col justify-between lg:w-[260px] border-b lg:border-b-0 lg:border-r border-gray-100"
            style={{ background: 'var(--sfp-sky)' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(26,107,58,0.1)' }}>
                  <Award className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--sfp-green)' }}>
                  Case Study
                </span>
              </div>
              <p className="font-bold text-[15px] leading-tight mb-0.5" style={{ color: 'var(--sfp-ink)' }}>{company}</p>
              {industry && <p className="text-[11px]" style={{ color: 'var(--sfp-slate)' }}>{industry}</p>}
            </div>

            {/* Result highlight */}
            <div className="mt-5 rounded-xl p-4" style={{ background: 'rgba(26,107,58,0.08)', border: '1px solid rgba(26,107,58,0.2)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--sfp-green)' }}>Result</span>
              </div>
              <p className="font-bold text-[14px] leading-snug" style={{ color: 'var(--sfp-green)' }}>{result}</p>
            </div>
          </div>

          {/* Right panel: Challenge + Solution + Quote */}
          <div className="flex-1 px-6 py-6 lg:px-8 lg:py-8 space-y-5">
            {/* Challenge */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(214,64,69,0.1)' }}>
                  <XCircle className="h-3 w-3" style={{ color: 'var(--sfp-red)' }} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--sfp-red)' }}>Challenge</span>
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{challenge}</p>
            </div>

            {/* Solution */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(26,107,58,0.1)' }}>
                  <CheckCircle className="h-3 w-3" style={{ color: 'var(--sfp-green)' }} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--sfp-green)' }}>Solution</span>
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{solution}</p>
            </div>

            {/* Quote */}
            {quote && (
              <div className="rounded-xl p-4 mt-2" style={{ background: 'var(--sfp-gray)', borderLeft: '3px solid var(--sfp-gold)' }}>
                <div className="flex gap-2.5">
                  <Quote className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
                  <div>
                    <p className="text-[14px] italic leading-relaxed mb-1" style={{ color: 'var(--sfp-ink)' }}>&ldquo;{quote}&rdquo;</p>
                    {author && <p className="text-[11px] font-medium" style={{ color: 'var(--sfp-slate)' }}>— {author}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GEO-Snippet Optimierung (AI Overviews / Featured Snippets)
// ─────────────────────────────────────────────────────────────

// ── 4. QuickAnswer ───────────────────────────────────────────
// Direct answer box — targets AI Overviews + featured snippets
// Wrap the single most important answer sentence in this component.
// Usage in MDX:
//   <QuickAnswer question="What is the best broker for beginners?">
//     eToro is the best broker for beginners in 2026 due to its
//     regulated copy-trading, zero-commission stocks, and $50 minimum deposit.
//   </QuickAnswer>

function QuickAnswer({
  question,
  children,
}: {
  question?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative my-8 not-prose">
      <div
        className="rounded-xl p-5 border-l-4"
        style={{
          background: 'var(--sfp-sky)',
          borderLeftColor: 'var(--sfp-navy)',
          borderTop: '1px solid rgba(27,79,140,0.15)',
          borderRight: '1px solid rgba(27,79,140,0.15)',
          borderBottom: '1px solid rgba(27,79,140,0.15)',
        }}
      >
        {/* Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--sfp-navy)' }}>
            Quick Answer
          </span>
        </div>

        {/* Question (optional, for SEO context) */}
        {question && (
          <p className="font-semibold text-[13px] mb-2" style={{ color: 'var(--sfp-navy)' }}>
            {question}
          </p>
        )}

        {/* Answer — the key sentence for AI Overview extraction */}
        <div
          className="text-[15px] leading-relaxed font-medium [&>p]:mb-0 [&_strong]:font-bold"
          style={{ color: 'var(--sfp-ink)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ── 5. DefinitionBox ─────────────────────────────────────────
// Term definition — structured for rich results + AI Overviews
// Usage in MDX:
//   <DefinitionBox term="Spread" category="Forex">
//     The spread is the difference between the bid and ask price of a currency
//     pair. It is measured in pips and represents the broker's fee for the trade.
//   </DefinitionBox>

function DefinitionBox({
  term,
  category,
  children,
}: {
  term: string;
  category?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative my-8 not-prose">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Top accent */}
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-sky) 100%)' }} />

        <div className="flex items-start gap-4 px-5 py-4">
          {/* Icon */}
          <div
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
            style={{ background: 'rgba(27,79,140,0.08)' }}
          >
            <BookOpen className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Term header */}
            <div className="flex flex-wrap items-baseline gap-2 mb-2">
              <span className="font-bold text-[16px]" style={{ color: 'var(--sfp-ink)' }}>
                {term}
              </span>
              {category && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {category}
                </span>
              )}
            </div>

            {/* Definition */}
            <div className="text-[14px] leading-relaxed [&>p]:mb-0 [&_strong]:font-semibold" style={{ color: 'var(--sfp-slate)' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 6. StatBox ────────────────────────────────────────────────
// Single prominent stat — for EEAT trust-building and data pull-outs
// Usage:
//   <StatBox value="£2.3B" label="Assets Under Management" source="FCA 2025" accent="navy" />
//   <StatBox value="4.9/5" label="Trustpilot Rating" accent="gold" />

function StatBox({
  value,
  label,
  description,
  source,
  accent = 'navy',
}: {
  value: string;
  label: string;
  description?: string;
  source?: string;
  accent?: 'navy' | 'gold' | 'green';
}) {
  const accentMap: Record<string, { border: string; bg: string; text: string }> = {
    navy:  { border: 'var(--sfp-navy)',     bg: 'rgba(27,79,140,0.05)',  text: 'var(--sfp-navy)'     },
    gold:  { border: 'var(--sfp-gold)',     bg: 'rgba(245,166,35,0.07)', text: 'var(--sfp-gold-dark)' },
    green: { border: 'var(--sfp-green)',    bg: 'rgba(26,107,58,0.05)',  text: 'var(--sfp-green)'    },
  };
  const c = accentMap[accent] ?? accentMap.navy;
  return (
    <div className="relative my-4 not-prose inline-block min-w-[180px]">
      <div
        className="rounded-xl border-l-4 border border-gray-100 px-5 py-4"
        style={{ borderLeftColor: c.border, background: c.bg }}
      >
        <div className="flex items-start gap-2.5">
          <Hash className="h-4 w-4 mt-1 shrink-0" style={{ color: c.border, opacity: 0.6 }} />
          <div>
            <p className="text-[36px] font-extrabold tabular-nums leading-none mb-1" style={{ color: c.text }}>
              {value}
            </p>
            <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--sfp-ink)' }}>
              {label}
            </p>
            {description && (
              <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--sfp-slate)' }}>
                {description}
              </p>
            )}
            {source && (
              <p className="text-[10px] mt-1.5 uppercase tracking-wider" style={{ color: 'var(--sfp-slate)', opacity: 0.7 }}>
                Source: {source}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 7. RegulatorAlert ─────────────────────────────────────────
// Regulatory badge + risk warning — FCA/ASIC/CIRO/SEC compliance
// Required on UK (FCA), AU (ASIC), CA (CIRO) pages per CLAUDE.md rules
// Usage:
//   <RegulatorAlert regulator="FCA" number="195355" name="IG Markets Ltd" type="CFD">
//     Capital at risk. 70% of retail accounts lose money trading CFDs.
//   </RegulatorAlert>

function RegulatorAlert({
  regulator,
  number,
  name,
  type,
  children,
}: {
  regulator: 'FCA' | 'ASIC' | 'CIRO' | 'SEC' | 'FINRA' | 'BaFin';
  number?: string;
  name?: string;
  type?: string;
  children?: React.ReactNode;
}) {
  const regulatorMap: Record<string, { bg: string; border: string; badge: string }> = {
    FCA:   { bg: 'rgba(27,79,140,0.05)',  border: 'rgba(27,79,140,0.25)',  badge: 'var(--sfp-navy)'  },
    ASIC:  { bg: 'rgba(26,107,58,0.05)',  border: 'rgba(26,107,58,0.25)',  badge: 'var(--sfp-green)' },
    CIRO:  { bg: 'rgba(245,166,35,0.06)', border: 'rgba(245,166,35,0.35)', badge: '#8B6914'          },
    SEC:   { bg: 'rgba(27,79,140,0.05)',  border: 'rgba(27,79,140,0.25)',  badge: 'var(--sfp-navy)'  },
    FINRA: { bg: 'rgba(27,79,140,0.05)',  border: 'rgba(27,79,140,0.25)',  badge: 'var(--sfp-navy)'  },
    BaFin: { bg: 'rgba(27,79,140,0.05)',  border: 'rgba(27,79,140,0.25)',  badge: 'var(--sfp-navy)'  },
  };
  const c = regulatorMap[regulator] ?? regulatorMap.FCA;
  return (
    <div className="relative my-6 not-prose">
      <div className="rounded-xl border overflow-hidden" style={{ background: c.bg, borderColor: c.border }}>
        {/* Header row */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: c.border }}>
          <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: c.badge }} />
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white shrink-0"
              style={{ background: c.badge }}
            >
              {regulator} Regulated
            </span>
            {name && (
              <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--sfp-ink)' }}>
                {name}
              </span>
            )}
            {number && (
              <span className="text-[11px] tabular-nums" style={{ color: 'var(--sfp-slate)' }}>
                #{number}
              </span>
            )}
            {type && (
              <span
                className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm"
                style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--sfp-slate)' }}
              >
                {type}
              </span>
            )}
          </div>
        </div>
        {/* Risk warning */}
        {children && (
          <div className="px-4 py-3 text-[12px] leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 8. NewsAlert ──────────────────────────────────────────────
// Breaking news / update alert — highlights time-sensitive information
// Useful for review pages needing freshness signals for EEAT
// Usage:
//   <NewsAlert date="2026-03-06" title="New FCA Leverage Rules (Q2 2026)" type="update">
//     The FCA has announced new limits for retail CFD traders...
//   </NewsAlert>

function NewsAlert({
  date,
  title,
  children,
  type = 'update',
}: {
  date?: string;
  title: string;
  children?: React.ReactNode;
  type?: 'update' | 'breaking' | 'warning';
}) {
  const typeMap: Record<string, { bg: string; accent: string; label: string }> = {
    update:   { bg: 'rgba(27,79,140,0.04)',  accent: 'var(--sfp-navy)', label: 'Update'   },
    breaking: { bg: 'rgba(214,64,69,0.05)',  accent: 'var(--sfp-red)',  label: 'Breaking' },
    warning:  { bg: 'rgba(245,166,35,0.07)', accent: 'var(--sfp-gold)', label: 'Warning'  },
  };
  const c = typeMap[type] ?? typeMap.update;
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  return (
    <div className="relative my-6 not-prose">
      <div
        className="rounded-xl border-l-4 border border-gray-100 p-4"
        style={{ borderLeftColor: c.accent, background: c.bg }}
      >
        <div className="flex items-start gap-3">
          <Newspaper className="h-4 w-4 shrink-0 mt-0.5" style={{ color: c.accent }} />
          <div className="flex-1 min-w-0">
            {/* Badge + date */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                style={{ background: c.accent }}
              >
                {c.label}
              </span>
              {formattedDate && (
                <span className="text-[11px]" style={{ color: 'var(--sfp-slate)' }}>
                  {formattedDate}
                </span>
              )}
            </div>
            {/* Title */}
            <p className="font-semibold text-[14px] mb-1.5 leading-snug" style={{ color: 'var(--sfp-ink)' }}>
              {title}
            </p>
            {/* Body */}
            {children && (
              <div
                className="text-[13px] leading-relaxed [&>p]:mb-0 [&_strong]:font-semibold"
                style={{ color: 'var(--sfp-slate)' }}
              >
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export all MDX components
export const mdxComponents = {
  // Base elements
  h1: StyledH1,
  h2: StyledH2,
  h3: StyledH3,
  h4: StyledH4,
  ul: StyledUl,
  ol: StyledOl,
  li: StyledLi,
  hr: StyledHr,
  table: StyledTable,
  thead: StyledThead,
  th: StyledTh,
  td: StyledTd,
  tr: StyledTr,
  blockquote: StyledBlockquote,
  p: StyledP,
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href?.startsWith('/go/')) {
      return (
        <Link
          href={href}
          target="_blank"
          rel="nofollow noopener sponsored"
          className="text-primary hover:underline"
          {...props}
        >
          {children}
        </Link>
      );
    }
    if (href?.startsWith('/')) {
      return (
        <Link href={href} className="text-primary hover:underline" {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
        {...props}
      >
        {children}
      </a>
    );
  },
  img: ({ src, alt, width, height }: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const imgSrc = typeof src === 'string' ? src : '';
    // Parse width/height, defaulting to sensible values for MDX content
    const imgWidth = typeof width === 'number' ? width : 800;
    const imgHeight = typeof height === 'number' ? height : 450;
    return (
      <Image
        src={imgSrc}
        alt={alt || ''}
        width={imgWidth}
        height={imgHeight}
        className="rounded-lg my-4"
      />
    );
  },

  // Custom components
  Tip,
  Info: InfoBox,
  Warning,
  ProsCons,
  Rating,
  AffiliateButton,
  AutoDisclaimer,
  AffiliateDisclosure,
  CallToAction,
  ComplianceNotice,
  CTABox,
  FAQSection,
  ComparisonTable,
  SimpleComparison,
  StarRating,
  TrustBadges,
  ExpertBox,
  ExpertEndorsement,
  TrustAuthority,
  MethodologyBox,
  TrackedCTA,
  HighlightCTA,
  InlineCTA,
  DecisionCTA,
  QuickPicks,
  CompactPicks,
  NewsletterOptin,
  StickyNewsletterBar,
  ExitIntentPopup,
  NewsletterBox,
  NewsletterInline,
  SmartFinderQuiz,
  SmartFinderInline,
  BrokerComparisonTablePremium,
  ComparisonTablePremium,
  RiskWarningBox,
  QuickVerdictCard,
  SmartFinCard,
  ProviderCard,
  ExpertVerdictBox,
  QuickSummary,
  SpreadComparison,
  CostBreakdownGrid,
  ScoringCriteria,
  RegulationTiers,
  PositionSizeGuide,
  SectionHeader,
  ComparisonMatrix,
  CompactMatrix,
  NetworkAnimation,
  NetworkAnimationMini,
  AISavingsCalculator,
  AISavingsCalculatorCompact,
  NeuralFinanceSVG,
  ExecutiveSummary,
  CollapsibleSection,
  CreditCardRewardsCalc,
  RegionalHeroImage,
  AffiliateLink,
  ComparisonHub,
  FrictionlessCTA,
  StickyComparisonBar,
  ExpertVerifier,
  WinnerAtGlance,
  StickyTableOfContents,
  StickyFooterCTA,
  AnswerBlock,
  TrustBar,
  MiniQuiz,
  // ReportHighlight,
  // DataSummary,
  EvidenceCarousel,
  AnalysisTable,
  ScopeTable,
  RankingTable,

  // Pass through Lucide icons for MDX
  Beaker,
  Clock,
  Users,
  BarChart3,
  TrendingUp,
  Shield,
  Zap,
  Building,
  Building2,
  DollarSign,
  Globe,
  Award,
  Target,
  Sparkles,
  FileText,
  CreditCard,
  PiggyBank,
  Lock,
  RefreshCw,
  ArrowRight,
  ArrowRightLeft,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  MessageSquare,
  Briefcase,
  Calculator,
  Percent,
  Wallet,
  Landmark,
  XCircle,
  Star,
  Plane,

  // Winner column components (Enterprise Top Pick highlighting)
  WinnerTh,
  WinnerTd,
  WinnerCta,

  // AP-11: New Content Templates
  StepByStepGuide,
  Step,
  VideoContainer,
  CaseStudyCard,

  // GEO-Snippet Optimierung (AI Overviews / Featured Snippets)
  QuickAnswer,
  DefinitionBox,

  // Tag 4 Quick-Win Components
  StatBox,
  RegulatorAlert,
  NewsAlert,
};
