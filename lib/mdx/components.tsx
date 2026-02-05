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
    <Button asChild size="lg" className="gap-2 my-4">
      <Link href={href} target="_blank" rel="noopener sponsored">
        {children || `Try ${productName || 'Now'} Free`}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
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

// Export all MDX components
export const mdxComponents = {
  // Base elements
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
};
