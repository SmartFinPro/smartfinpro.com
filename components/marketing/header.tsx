'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  MenuIcon as Menu,
  XIcon as X,
  ChevronDownIcon as ChevronDown,
  ArrowRightIcon as ArrowRight,
  StarIcon as Star,
} from '@/components/icons/header-icons';
import {
  Sparkles,
  Shield,
  TrendingUp,
  DollarSign,
  Wallet,
  Building,
  Target,
  BarChart3,
  Calculator,
  Scale,
  CreditCard,
  Home,
  PiggyBank,
  Landmark,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Market,
  marketConfig,
  markets,
  marketCategories,
  categoryConfig,
  Category,
  getNavGroupsForMarket,
} from '@/lib/i18n/config';

interface TrendingPartner {
  providerName: string;
  cpaValue: number;
  currency: string;
}

interface HeaderProps {
  market?: Market;
  trendingPartners?: TrendingPartner[];
}

// Lucide icon mapping from categoryConfig.icon strings
const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  Shield,
  TrendingUp,
  DollarSign,
  Wallet,
  Building,
  BarChart3,
  Calculator,
};

// Broker review cards
const brokerCards = [
  { name: 'IG Group', slug: 'ig', rating: 4.8 },
  { name: 'eToro', slug: 'etoro', rating: 4.8 },
  { name: 'Plus500', slug: 'plus500', rating: 4.5 },
  { name: 'Capital.com', slug: 'capital-com', rating: 4.7 },
  { name: 'IBKR', slug: 'ibkr', rating: 4.9 },
  { name: 'Investing.com', slug: 'investing', rating: 4.6 },
  { name: 'Revolut', slug: 'revolut', rating: 4.5 },
];

// Tool cards for mega-menu — each card declares which markets it belongs to.
// Global tools (no market prefix) use `markets: 'all'`.
// Market-specific tools list their target market(s).
interface ToolCard {
  name: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge: string | null;
  markets: 'all' | Market[];
}

const allToolCards: ToolCard[] = [
  { name: 'Broker Finder Quiz', description: 'Personalized broker match in 60 seconds', href: '/tools/broker-finder', icon: Target, badge: 'New', markets: 'all' },
  { name: 'Trading Cost Calculator', description: 'Compare fees across top brokers', href: '/tools/trading-cost-calculator', icon: BarChart3, badge: 'New', markets: 'all' },
  { name: 'Fee Savings Calculator', description: 'See how much you save vs bank funds', href: '/ca/tools/wealthsimple-calculator', icon: DollarSign, badge: 'New', markets: ['ca'] },
  { name: 'AI ROI Calculator', description: 'Calculate AI tool investment returns', href: '/tools/ai-roi-calculator', icon: TrendingUp, badge: null, markets: 'all' },
  { name: 'Loan Calculator', description: 'Monthly payments & amortization', href: '/tools/loan-calculator', icon: Calculator, badge: null, markets: 'all' },
  { name: 'AU Mortgage Calculator', description: 'Home loan repayments, LVR & offset', href: '/au/tools/au-mortgage-calculator', icon: Home, badge: 'New', markets: ['au'] },
  { name: 'ISA Tax Savings Calculator', description: 'See your ISA tax shield over time', href: '/uk/tools/isa-tax-savings-calculator', icon: PiggyBank, badge: 'New', markets: ['uk'] },
  { name: 'Rewards Calculator', description: 'Find your best credit card by spend', href: '/tools/credit-card-rewards-calculator', icon: CreditCard, badge: 'New', markets: 'all' },
  { name: 'Broker Comparison', description: 'Side-by-side broker comparison', href: '/tools/broker-comparison', icon: Scale, badge: null, markets: 'all' },
];

/** Return only the tool cards relevant to the given market silo. */
function getToolCardsForMarket(m: Market): ToolCard[] {
  return allToolCards.filter((t) => t.markets === 'all' || t.markets.includes(m));
}

// Detect market from pathname — delegated to central config
import { detectMarketFromPath } from '@/config/navigation';
function detectMarket(pathname: string): Market {
  return detectMarketFromPath(pathname);
}

// ── Market-Specific Sidebar (Desktop Mega-Menu) ─────────────────

function MarketSidebar({ market, prefix, onClose }: { market: Market; prefix: string; onClose: () => void }) {
  return (
    <>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Market Overviews</p>
      <div className="space-y-2.5 mb-6">
        {(marketCategories[market] || []).map((cat) => (
          <Link key={`ov-${cat}`} href={`${prefix}/${cat}/overview`} className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
            <span>{categoryConfig[cat].name}</span>
            <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Link>
        ))}
      </div>

      {market === 'us' && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Credit Cards</p>
          <div className="space-y-2.5 mb-6">
            <Link href="/personal-finance/credit-cards-comparison" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <CreditCard className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} /><span>Card Comparison</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--sfp-gold-dark)' }}>New</span>
            </Link>
            <Link href="/personal-finance/amex-gold-card-review" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <span>Amex Gold Review</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href="/personal-finance/chase-sapphire-preferred-review" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <span>Chase Sapphire Preferred</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href="/personal-finance/chase-sapphire-reserve-review" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <span>Chase Sapphire Reserve</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
          </div>
        </>
      )}

      {market === 'ca' && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Wealthsimple</p>
          <div className="space-y-2.5 mb-6">
            <Link href="/ca/personal-finance/wealthsimple-review" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <Landmark className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} /><span>Wealthsimple Review</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(26,107,58,0.12)', color: 'var(--sfp-green)' }}>Top Rated</span>
            </Link>
            <Link href="/ca/personal-finance/wealthsimple-tax" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <span>Wealthsimple Tax</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href="/ca/personal-finance/wealthsimple-vs-questrade" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <span>Wealthsimple vs Questrade</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
          </div>
        </>
      )}

      {market === 'au' && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Home Loans</p>
          <div className="space-y-2.5 mb-6">
            <Link href="/au/personal-finance" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <Home className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} /><span>Home Loan Comparison</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--sfp-gold-dark)' }}>New</span>
            </Link>
            <Link href="/au/personal-finance/athena-home-loans-review" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <span>Athena Home Loans</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href="/au/personal-finance/commbank-home-loan-review" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <span>CommBank Home Loan</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href="/au/personal-finance/ubank-home-loan-review" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <span>ubank Home Loan</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href="/au/tools/au-mortgage-calculator" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <Calculator className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} /><span>Mortgage Calculator</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
          </div>
        </>
      )}

      {market === 'uk' && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">ISA Investments</p>
          <div className="space-y-2.5 mb-6">
            <Link href="/uk/personal-finance/vanguard-isa-review" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <PiggyBank className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} /><span>Vanguard ISA</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(26,107,58,0.12)', color: 'var(--sfp-green)' }}>Best Value</span>
            </Link>
            <Link href="/uk/personal-finance/hargreaves-lansdown-isa-review" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <span>Hargreaves Lansdown ISA</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href="/uk/personal-finance/fidelity-isa-review" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <span>Fidelity ISA</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link href="/uk/personal-finance/trading-212-isa-review" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <span>Trading 212 ISA</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(26,107,58,0.12)', color: 'var(--sfp-green)' }}>Free</span>
            </Link>
            <Link href="/uk/tools/isa-tax-savings-calculator" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
              <Calculator className="h-3.5 w-3.5" style={{ color: 'var(--sfp-navy)' }} /><span>ISA Tax Calculator</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
          </div>
        </>
      )}

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Popular</p>
      <div className="space-y-2.5">
        <Link href="/trading-platforms/tradingview" className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
          <span>TradingView Platform</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </Link>
        <Link href={`${prefix}/reviews/etoro`} className="group flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }} onClick={onClose}>
          <span>Top Rated: eToro</span><ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </Link>
      </div>
    </>
  );
}

// ── Mobile Market-Specific Links ────────────────────────────────

function MobileMarketLinks({ market, prefix, onClose }: { market: Market; prefix: string; onClose: () => void }) {
  const cls = 'flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors';
  return (
    <>
      {market === 'us' && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-200"><p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Credit Cards</p></div>
          <Link href="/personal-finance/credit-cards-comparison" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><CreditCard className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} /><span className="text-sm">Card Comparison</span><span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--sfp-gold-dark)' }}>New</span></Link>
          <Link href="/personal-finance/amex-gold-card-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><CreditCard className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Amex Gold</span></Link>
          <Link href="/personal-finance/chase-sapphire-preferred-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><CreditCard className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Chase Sapphire Preferred</span></Link>
          <Link href="/personal-finance/chase-sapphire-reserve-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><CreditCard className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Chase Sapphire Reserve</span></Link>
        </>
      )}
      {market === 'ca' && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-200"><p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Wealthsimple</p></div>
          <Link href="/ca/personal-finance/wealthsimple-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Landmark className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} /><span className="text-sm">Wealthsimple Review</span><span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(26,107,58,0.12)', color: 'var(--sfp-green)' }}>Top</span></Link>
          <Link href="/ca/personal-finance/wealthsimple-tax" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Landmark className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Wealthsimple Tax</span></Link>
          <Link href="/ca/personal-finance/wealthsimple-vs-questrade" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Landmark className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">vs Questrade</span></Link>
        </>
      )}
      {market === 'au' && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-200"><p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Home Loans</p></div>
          <Link href="/au/personal-finance" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Home className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} /><span className="text-sm">Compare Home Loans</span><span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--sfp-gold-dark)' }}>New</span></Link>
          <Link href="/au/personal-finance/athena-home-loans-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Home className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Athena Home Loans</span></Link>
          <Link href="/au/personal-finance/commbank-home-loan-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Home className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">CommBank Home Loan</span></Link>
          <Link href="/au/personal-finance/ubank-home-loan-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Home className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">ubank Home Loan</span></Link>
          <Link href="/au/tools/au-mortgage-calculator" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Calculator className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} /><span className="text-sm">Mortgage Calculator</span></Link>
        </>
      )}
      {market === 'uk' && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-200"><p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ISA Investments</p></div>
          <Link href="/uk/personal-finance/vanguard-isa-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} /><span className="text-sm">Vanguard ISA</span><span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(26,107,58,0.12)', color: 'var(--sfp-green)' }}>Best</span></Link>
          <Link href="/uk/personal-finance/hargreaves-lansdown-isa-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Hargreaves Lansdown ISA</span></Link>
          <Link href="/uk/personal-finance/fidelity-isa-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Fidelity ISA</span></Link>
          <Link href="/uk/personal-finance/trading-212-isa-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Trading 212 ISA</span><span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(26,107,58,0.12)', color: 'var(--sfp-green)' }}>Free</span></Link>
          <Link href="/uk/tools/isa-tax-savings-calculator" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Calculator className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">ISA Tax Calculator</span></Link>
        </>
      )}
    </>
  );
}

// ── Main Header Component ────────────────────────────────────────

export function Header({ market: marketProp, trendingPartners: trendingProp = [] }: HeaderProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [trendingPartners, setTrendingPartners] = useState<TrendingPartner[]>(trendingProp);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  // Hydration-safe: always use 'us' as default (matches static export)
  // then update on client after mount to avoid server/client mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const detectedMarket = marketProp || detectMarket(pathname);
  const market = mounted ? detectedMarket : 'us';
  const currentMarket = marketConfig[market];
  const prefix = market === 'us' ? '' : `/${market}`;
  const navGroups = getNavGroupsForMarket(market);

  // Fetch trending partners (top CPA) client-side if not provided via props
  useEffect(() => {
    if (trendingProp.length > 0) return;
    let cancelled = false;
    fetch(`/api/affiliate-rates?market=${market}`)
      .then((res) => res.json())
      .then((rates: Array<{ providerName: string; cpaValue: number; currency: string }>) => {
        if (cancelled) return;
        setTrendingPartners(
          rates.slice(0, 3).map((r) => ({
            providerName: r.providerName,
            cpaValue: r.cpaValue,
            currency: r.currency,
          })),
        );
      }).catch(() => {});
    return () => { cancelled = true; };
  }, [market, trendingProp.length]);

  const openMenu = useCallback((menu: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(menu);
  }, []);

  const closeMenu = useCallback(() => {
    timeoutRef.current = setTimeout(() => setActiveMenu(null), 150);
  }, []);

  const toggleMobileSection = (section: string) => {
    setMobileExpanded((prev) => (prev === section ? null : section));
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="border-b border-white/10" style={{ background: 'var(--sfp-navy)' }}>
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href={prefix || '/'} className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-xl font-bold text-white">Smart<span style={{ color: 'var(--sfp-gold)' }}>Fin</span>Pro</span>
          </Link>

          {/* Desktop Navigation — Investing | Banking | Trading | Tools */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1 ml-8">
            {navGroups.map(({ group }) => (
              <div key={group} onMouseEnter={() => openMenu(group.toLowerCase())} onMouseLeave={closeMenu}>
                <button className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${activeMenu === group.toLowerCase() ? 'text-white bg-white/15' : 'text-white/70 hover:text-white'}`}>
                  {group}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${activeMenu === group.toLowerCase() ? 'rotate-180' : ''}`} />
                </button>
              </div>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white hover:bg-white/15">
                  <span>{currentMarket.flag}</span>
                  <span>{currentMarket.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-lg">
                {Object.entries(marketConfig).map(([key, config]) => (
                  <DropdownMenuItem key={key} asChild className="focus:bg-gray-100" style={{ color: 'var(--sfp-ink)' }}>
                    <Link href={key === 'us' ? '/' : `/${key}`}><span className="mr-2">{config.flag}</span>{config.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild className="text-white border-0 font-semibold" style={{ background: 'var(--sfp-gold)' }} onMouseOver={(e) => (e.currentTarget.style.background = 'var(--sfp-gold-dark)')} onMouseOut={(e) => (e.currentTarget.style.background = 'var(--sfp-gold)')}>
              <Link href="/tools">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/15">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px] bg-white border-gray-200 p-0">
              <nav className="flex flex-col mt-8 px-4">
                {navGroups.map(({ group, categories: groupCats }) => (
                  <div key={group} className="border-b border-gray-200">
                    <button onClick={() => toggleMobileSection(group.toLowerCase())} className="flex items-center justify-between w-full py-4 text-sm font-medium" style={{ color: 'var(--sfp-navy)' }}>
                      {group}
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${mobileExpanded === group.toLowerCase() ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileExpanded === group.toLowerCase() && (
                      <div className="pb-4 space-y-1">
                        {group === 'Tools' ? (
                          getToolCardsForMarket(market).map((tool) => (
                            <Link key={tool.href} href={tool.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'var(--sfp-ink)' }} onClick={() => setMobileMenuOpen(false)}>
                              <tool.icon className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                              <span className="text-sm">{tool.name}</span>
                              {tool.badge && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--sfp-gold-dark)' }}>{tool.badge}</span>}
                            </Link>
                          ))
                        ) : (
                          <>
                            {groupCats.map((cat) => {
                              const config = categoryConfig[cat];
                              const Icon = iconMap[config.icon] || Sparkles;
                              return (
                                <Link key={cat} href={`${prefix}/${cat}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'var(--sfp-ink)' }} onClick={() => setMobileMenuOpen(false)}>
                                  <Icon className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                                  <span className="text-sm">{config.name}</span>
                                </Link>
                              );
                            })}
                            {group === 'Investing' && <MobileMarketLinks market={market} prefix={prefix} onClose={() => setMobileMenuOpen(false)} />}
                            {group === 'Trading' && (
                              <>
                                <div className="mt-2 pt-2 border-t border-gray-200"><p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Top Reviews</p></div>
                                {brokerCards.slice(0, 4).map((broker) => (
                                  <Link key={broker.slug} href={`${prefix}/reviews/${broker.slug}`} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'var(--sfp-ink)' }} onClick={() => setMobileMenuOpen(false)}>
                                    <span className="text-sm">{broker.name}</span>
                                    <span className="flex items-center gap-1 text-xs text-amber-400"><Star className="h-3 w-3 fill-amber-400" />{broker.rating}</span>
                                  </Link>
                                ))}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Region */}
                <div className="pt-6 pb-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Select Region</p>
                  <div className="space-y-1">
                    {Object.entries(marketConfig).map(([key, config]) => (
                      <Link key={key} href={key === 'us' ? '/' : `/${key}`} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${key === market ? 'font-semibold bg-gray-100' : 'hover:bg-gray-100'}`} style={{ color: key === market ? 'var(--sfp-navy)' : 'var(--sfp-ink)' }} onClick={() => setMobileMenuOpen(false)}>
                        <span>{config.flag}</span><span>{config.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <Button asChild className="w-full text-white border-0 mt-2 font-semibold" style={{ background: 'var(--sfp-gold)' }}>
                  <Link href="/tools" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </nav>
      </div>

      {/* ── Mega-menu panels ───────────────────────────────────── */}
      {activeMenu && (
        <div className="absolute left-0 right-0 z-40 hidden lg:block" onMouseEnter={() => openMenu(activeMenu)} onMouseLeave={closeMenu}>
          <div className="border-b border-gray-200 shadow-xl bg-white">
            <div className="container mx-auto px-6 py-8">

              {/* Category-based panels (Investing, Banking, Trading) */}
              {navGroups
                .filter(({ group }) => group !== 'Tools' && activeMenu === group.toLowerCase())
                .map(({ group, categories: groupCats }) => (
                  <div key={group} className="flex gap-10">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">{group}</p>
                      <div className={`grid ${groupCats.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 xl:grid-cols-3'} gap-3`}>
                        {groupCats.map((cat) => {
                          const config = categoryConfig[cat];
                          const Icon = iconMap[config.icon] || Sparkles;
                          return (
                            <Link key={cat} href={`${prefix}/${cat}`} className="group flex items-start gap-3 p-4 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all duration-200" onClick={() => setActiveMenu(null)}>
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
                                <Icon className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                              </div>
                              <div>
                                <p className="text-sm font-medium group-hover:text-opacity-80 transition-colors" style={{ color: 'var(--sfp-ink)' }}>{config.name}</p>
                                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{config.description}</p>
                              </div>
                            </Link>
                          );
                        })}

                        {/* Trending Partners */}
                        {trendingPartners.length > 0 && (
                          <div className="col-span-full mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Flame className="h-3.5 w-3.5 text-amber-400" />Trending Partners
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {trendingPartners.slice(0, 3).map((p) => (
                                <span key={p.providerName} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border" style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--sfp-gold-dark)', borderColor: 'rgba(245,166,35,0.25)' }}>
                                  <Flame className="h-3 w-3" />{p.providerName}
                                  <span style={{ color: 'var(--sfp-slate)' }}>${p.cpaValue}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Broker reviews in Trading mega-panel */}
                      {group === 'Trading' && (
                        <div className="mt-6 pt-5 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Broker Reviews</p>
                          <div className="grid grid-cols-4 xl:grid-cols-7 gap-3">
                            {brokerCards.map((broker) => (
                              <Link key={broker.slug} href={`${prefix}/reviews/${broker.slug}`} className="group p-3 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 text-center" onClick={() => setActiveMenu(null)}>
                                <div className="h-8 mb-2 flex items-center justify-center">
                                  <Image src={`/images/brokers/${broker.slug}.svg`} alt={broker.name} width={120} height={32} className="h-6 w-auto transition-all" />
                                </div>
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span className="text-xs font-medium" style={{ color: 'var(--sfp-ink)' }}>{broker.rating}</span>
                                </div>
                                <span className="text-[10px] transition-colors flex items-center justify-center gap-0.5" style={{ color: 'var(--sfp-slate)' }}>
                                  Review <ArrowRight className="h-2.5 w-2.5" />
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="w-64 border-l border-gray-200 pl-10">
                      <MarketSidebar market={market} prefix={prefix} onClose={() => setActiveMenu(null)} />
                    </div>
                  </div>
                ))}

              {/* Tools Mega-Menu */}
              {activeMenu === 'tools' && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Free Tools & Calculators</p>
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                    {getToolCardsForMarket(market).map((tool) => (
                      <Link key={tool.href} href={tool.href} className="group flex items-start gap-3 p-4 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all duration-200" onClick={() => setActiveMenu(null)}>
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
                          <tool.icon className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium transition-colors flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                            {tool.name}
                            {tool.badge && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--sfp-gold-dark)' }}>{tool.badge}</span>}
                          </p>
                          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{tool.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-200">
                    <Link href="/tools" className="group inline-flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-navy)' }} onClick={() => setActiveMenu(null)}>
                      View All Tools<ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {activeMenu && (
        <div className="fixed inset-0 z-30 bg-black/20 hidden lg:block" onMouseEnter={closeMenu} style={{ top: '64px' }} />
      )}
    </header>
  );
}
