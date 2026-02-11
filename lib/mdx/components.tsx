import Link from 'next/link';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

// Marketing Components
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
import {
  NewsletterOptin,
  StickyNewsletterBar,
  ExitIntentPopup,
} from '@/components/marketing/newsletter-optin';
import { NewsletterBox, NewsletterInline } from '@/components/marketing/newsletter-box';
import { SmartFinderQuiz, SmartFinderInline } from '@/components/marketing/smart-finder-quiz';
import { BrokerComparisonTablePremium } from '@/components/marketing/broker-comparison-premium';
import { RiskWarningBox } from '@/components/marketing/risk-warning';
import { QuickVerdictCard } from '@/components/marketing/quick-verdict-card';
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
import { NetworkAnimation, NetworkAnimationMini } from '@/components/marketing/network-animation';
import { AISavingsCalculator, AISavingsCalculatorCompact } from '@/components/marketing/ai-savings-calculator';
import { NeuralFinanceSVG } from '@/components/marketing/neural-finance-svg';
import { CreditCardRewardsCalc } from '@/components/marketing/credit-card-rewards-calc';

// Tip Component
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="my-4 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
      <Lightbulb className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800 dark:text-green-200">
        {children}
      </AlertDescription>
    </Alert>
  );
}

// Info Component
function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="my-4 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        {children}
      </AlertDescription>
    </Alert>
  );
}

// Warning Component
function Warning({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="my-4 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        {children}
      </AlertDescription>
    </Alert>
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
      <Card className="border-green-200 dark:border-green-900">
        <CardContent className="p-4">
          <h4 className="font-bold text-green-600 mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Pros
          </h4>
          <ul className="space-y-2">
            {pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="border-red-200 dark:border-red-900">
        <CardContent className="p-4">
          <h4 className="font-bold text-red-600 mb-3 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Cons
          </h4>
          <ul className="space-y-2">
            {cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
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

// Rating Component
function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 my-4">
      <StarRating value={value} size="lg" />
      <span className="text-2xl font-bold">{value}/5</span>
    </div>
  );
}

// Affiliate Button Component
function AffiliateButton({
  href,
  productName,
  children,
}: {
  href: string;
  productName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="my-6 not-prose">
      <Link
        href={href}
        target="_blank"
        rel="noopener sponsored"
        className="inline-flex items-end justify-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-all px-6"
        style={{ height: '44px', paddingBottom: '10px' }}
      >
        {children || `Try ${productName || 'Now'} Free`}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// Executive Summary Component - Premium Glass Design
function ExecutiveSummary({
  children,
  title = 'Executive Summary',
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="relative my-12 not-prose">
      {/* Background glow */}
      <div className="absolute -inset-4 rounded-3xl opacity-50 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.08), transparent 70%)' }} />

      <div
        className="relative rounded-2xl overflow-hidden border border-violet-500/20"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 10, 26, 0.9), rgba(26, 15, 46, 0.6), rgba(15, 10, 26, 0.9))',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.3), 0 0 60px rgba(139, 92, 246, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Top accent line */}
        <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, #8b5cf6, transparent)' }} />

        {/* Header */}
        <div className="flex items-center gap-3 px-8 pt-7 pb-4">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.15))' }}
          >
            <FileText className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Key Findings & Analysis</div>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs text-violet-300 font-medium">Research-backed</span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2), transparent)' }} />

        {/* Content */}
        <div className="px-8 py-6 text-[15px] leading-relaxed text-slate-300 space-y-4 [&>p]:mb-4 [&>p:last-child]:mb-0 [&_strong]:text-white [&_strong]:font-semibold">
          {children}
        </div>

        {/* Bottom accent */}
        <div className="h-[1px] w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.15), transparent)' }} />
      </div>
    </div>
  );
}

// Auto Disclaimer Component
function AutoDisclaimer({ category, market }: { category: string; market?: string }) {
  const tradingDisclaimers: Record<string, string[]> = {
    us: [
      'Affiliate Disclosure: SmartFinPro may earn a commission when you click links and make a purchase.',
      'Risk Warning: Forex trading involves significant risk of loss and is not suitable for all investors. Past performance is not indicative of future results. All brokers listed are regulated by the NFA and CFTC.',
    ],
    uk: [
      'Affiliate Disclosure: SmartFinPro may earn a commission when you click links and make a purchase.',
      'Risk Warning: CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. Between 74-89% of retail investor accounts lose money when trading CFDs. All platforms mentioned are authorised and regulated by the Financial Conduct Authority (FCA).',
    ],
    ca: [
      'Affiliate Disclosure: SmartFinPro may earn a commission when you click links and make a purchase.',
      'Risk Warning: Forex and CFD trading involves significant risk of loss. Leveraged products can result in losses exceeding your initial deposit. All brokers listed are regulated by CIRO (Canadian Investment Regulatory Organization).',
    ],
    au: [
      'Affiliate Disclosure: SmartFinPro may earn a commission when you click links and make a purchase.',
      'Risk Warning: CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. You should consider whether you understand how CFDs work. All brokers listed hold an Australian Financial Services Licence (AFSL) regulated by ASIC.',
    ],
  };

  const disclaimers: Record<string, string[]> = {
    'ai-tools': [
      'Affiliate Disclosure: SmartFinPro may earn a commission when you click links and make a purchase. This does not affect our editorial independence.',
    ],
    trading: tradingDisclaimers[market || 'uk'] || tradingDisclaimers.uk,
    forex: tradingDisclaimers[market || 'uk'] || tradingDisclaimers.uk,
    'personal-finance': [
      'Affiliate Disclosure: SmartFinPro may earn a commission when you click links and make a purchase.',
      'Loan Disclaimer: SmartFinPro is not a lender. We connect users with third-party lenders. Loan approval and terms depend on the lender and your creditworthiness.',
    ],
    'business-banking': [
      'Affiliate Disclosure: SmartFinPro may earn a commission when you click links and make a purchase.',
      'Important: Business account eligibility and features may vary based on your business type and location.',
    ],
  };

  // Add market-specific regulatory notices
  const marketNotice = market === 'uk' && category !== 'trading' && category !== 'forex'
    ? 'All platforms mentioned are authorised and regulated by the Financial Conduct Authority (FCA). Your capital is at risk.'
    : '';

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

function StyledH2({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <div className="relative mt-16 mb-8 not-prose">
      <div className="flex items-center gap-4">
        <div
          className="w-1 h-8 rounded-full shrink-0"
          style={{ background: 'linear-gradient(180deg, #8b5cf6, #06b6d4)' }}
        />
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" {...props}>
          {children}
        </h2>
      </div>
      <div
        className="mt-3 ml-5 h-px w-32"
        style={{ background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.5), transparent)' }}
      />
    </div>
  );
}

function StyledH3({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <div className="relative mb-5 not-prose" style={{ marginTop: '45px' }}>
      <h3 className="text-lg md:text-xl font-semibold text-slate-100" {...props}>
        {children}
      </h3>
      <div
        className="mt-2 h-px w-20"
        style={{ background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.4), transparent)' }}
      />
    </div>
  );
}

function StyledUl({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative my-6 not-prose">
      <div
        className="rounded-xl px-6 py-5 border border-slate-700/50"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 10, 26, 0.6), rgba(30, 20, 50, 0.4))',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <ul className="space-y-2.5">
          {children}
        </ul>
      </div>
    </div>
  );
}

function StyledOl({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative my-6 not-prose">
      <div
        className="rounded-xl px-6 py-5 border border-slate-700/50"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 10, 26, 0.6), rgba(30, 20, 50, 0.4))',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <ol className="space-y-2.5 list-none counter-reset-[item]">
          {children}
        </ol>
      </div>
    </div>
  );
}

function StyledLi({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '15px', color: '#cbd5e1', lineHeight: '1.65', paddingTop: '2px', paddingBottom: '2px' }}>
      <span style={{ position: 'relative', marginTop: '7px', width: '10px', height: '10px', minWidth: '10px', flexShrink: 0 }}>
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #a78bfa, #818cf8, #60a5fa)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            right: '-4px',
            bottom: '-4px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #a78bfa, #818cf8, #60a5fa)',
            filter: 'blur(6px)',
            opacity: 0.7,
          }}
        />
      </span>
      <span className="[&>strong]:text-white [&>strong]:font-semibold [&>a]:text-cyan-400 [&>a]:underline [&>a]:underline-offset-2 [&>a]:decoration-cyan-400/30 [&>a:hover]:decoration-cyan-400">{children}</span>
    </li>
  );
}

function StyledHr() {
  return (
    <div className="my-12 not-prose">
      <div
        className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.3), transparent)' }}
      />
    </div>
  );
}

function StyledTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 not-prose overflow-x-auto">
      <div
        className="rounded-xl overflow-hidden border border-slate-700/50"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 10, 26, 0.8), rgba(26, 15, 46, 0.5))',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <table className="w-full text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}

function StyledThead({ children }: { children: React.ReactNode }) {
  return (
    <thead
      style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))' }}
    >
      {children}
    </thead>
  );
}

function StyledTh({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-violet-300 uppercase tracking-wider border-b border-slate-700/50">
      {children}
    </th>
  );
}

function StyledTd({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 text-slate-300 border-b border-slate-800/50 [&>strong]:text-white [&>strong]:font-semibold [&>a]:text-cyan-400 [&>a]:hover:text-cyan-300">
      {children}
    </td>
  );
}

function StyledTr({ children }: { children: React.ReactNode }) {
  return (
    <tr className="transition-colors hover:bg-violet-500/5">
      {children}
    </tr>
  );
}

function StyledBlockquote({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 not-prose">
      <div
        className="relative rounded-xl p-5 border border-violet-500/20"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(15, 10, 26, 0.6))',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <div
          className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
          style={{ background: 'linear-gradient(180deg, #8b5cf6, #06b6d4)' }}
        />
        <div className="pl-4 text-slate-300 italic [&>p]:mb-2 [&>p:last-child]:mb-0 [&_strong]:text-white [&_strong]:font-semibold">
          {children}
        </div>
      </div>
    </div>
  );
}

function StyledP({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className="text-[15px] leading-relaxed text-slate-300 mb-5 [&>strong]:text-white [&>strong]:font-semibold [&>a]:text-cyan-400 [&>a]:underline [&>a]:underline-offset-2 [&>a]:decoration-cyan-400/30 [&>a:hover]:decoration-cyan-400" {...props}>
      {children}
    </p>
  );
}

// Export all MDX components
export const mdxComponents = {
  // Base elements
  h2: StyledH2,
  h3: StyledH3,
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
          rel="noopener sponsored"
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
  RiskWarningBox,
  QuickVerdictCard,
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
  CreditCardRewardsCalc,

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
};
