'use client';

import Link from 'next/link';
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
import { detectMarketFromPath, marketSiloConfig } from '@/config/navigation';

interface HeaderProps {
  market?: Market;
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
function detectMarket(pathname: string): Market {
  return detectMarketFromPath(pathname);
}

// ── Mobile Market-Specific Links ────────────────────────────────

function MobileMarketLinks({ market, prefix, onClose }: { market: Market; prefix: string; onClose: () => void }) {
  const cls = 'flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors';
  return (
    <>
      {market === 'us' && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-200"><p className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Credit Cards</p></div>
          <Link href="/us/personal-finance/credit-cards-comparison" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><CreditCard className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} /><span className="text-sm">Card Comparison</span><span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--sfp-gold-dark)' }}>New</span></Link>
          <Link href="/us/personal-finance/amex-gold-card-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><CreditCard className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Amex Gold</span></Link>
          <Link href="/us/personal-finance/chase-sapphire-preferred-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><CreditCard className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Chase Sapphire Preferred</span></Link>
          <Link href="/us/personal-finance/chase-sapphire-reserve-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><CreditCard className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Chase Sapphire Reserve</span></Link>
        </>
      )}
      {market === 'ca' && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-200"><p className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Wealthsimple</p></div>
          <Link href="/ca/personal-finance/wealthsimple-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Landmark className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} /><span className="text-sm">Wealthsimple Review</span><span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(26,107,58,0.12)', color: 'var(--sfp-green)' }}>Top</span></Link>
          <Link href="/ca/personal-finance/wealthsimple-tax" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Landmark className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Wealthsimple Tax</span></Link>
          <Link href="/ca/personal-finance/wealthsimple-vs-questrade" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Landmark className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">vs Questrade</span></Link>
        </>
      )}
      {market === 'au' && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-200"><p className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Home Loans</p></div>
          <Link href="/au/personal-finance" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Home className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} /><span className="text-sm">Compare Home Loans</span><span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--sfp-gold-dark)' }}>New</span></Link>
          <Link href="/au/personal-finance/athena-home-loans-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Home className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">Athena Home Loans</span></Link>
          <Link href="/au/personal-finance/commbank-home-loan-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Home className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">CommBank Home Loan</span></Link>
          <Link href="/au/personal-finance/ubank-home-loan-review" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Home className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} /><span className="text-sm">ubank Home Loan</span></Link>
          <Link href="/au/tools/au-mortgage-calculator" className={cls} style={{ color: 'var(--sfp-ink)' }} onClick={onClose}><Calculator className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} /><span className="text-sm">Mortgage Calculator</span></Link>
        </>
      )}
      {market === 'uk' && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-200"><p className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">ISA Investments</p></div>
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

export default function Header({ market: marketProp }: HeaderProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  // Hydration-safe: always use 'us' as default (matches static export)
  // then update on client after mount to avoid server/client mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const detectedMarket = marketProp || detectMarket(pathname);
  const market = mounted ? detectedMarket : 'us';
  const currentMarket = marketConfig[market];
  const prefix = `/${market}`;
  const navGroups = getNavGroupsForMarket(market);
  const featuredLinks = marketSiloConfig[market]?.featured || [];

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
    <header className="sticky top-0 z-50 w-full border-b border-white/10" style={{ background: 'linear-gradient(to bottom, var(--sfp-navy), #2563EB)' }}>
      {/* Skip-to-Content (Accessibility) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:bg-white focus:shadow-lg"
        style={{ color: 'var(--sfp-navy)' }}
      >
        Skip to main content
      </a>
      <div>
        <nav className="flex h-16 items-center justify-between" style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 40px' }}>
          {/* Logo */}
          <Link href={prefix || '/'} className="flex items-center gap-2.5 flex-shrink-0">
            {/* Logo mark — navy square with gold "+" */}
            <span className="flex items-center justify-center w-[30px] h-[30px] rounded-[7px] flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <rect x="6.5" y="1" width="5" height="16" rx="1.5" fill="#FFC942"/>
                <rect x="1" y="6.5" width="16" height="5" rx="1.5" fill="#FFC942"/>
              </svg>
            </span>
            <span className="text-[19px] font-bold tracking-[-0.6px]" style={{ color: '#fff' }}>Smart<span style={{ color: 'rgba(255,255,255,0.85)' }}>Fin</span>Pro</span>
          </Link>

          {/* Desktop Navigation — Investing | Banking | Trading | Tools */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1 ml-8">
            {navGroups.map(({ group }) => (
              <div key={group} onMouseEnter={() => openMenu(group.toLowerCase())} onMouseLeave={closeMenu}>
                <button className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium transition-colors rounded-lg ${activeMenu === group.toLowerCase() ? 'bg-white/15' : 'hover:bg-white/10'}`} style={{ color: activeMenu === group.toLowerCase() ? '#fff' : 'rgba(255,255,255,0.85)' }}>
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
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.85)' }}>
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
            <Link
              href="/tools"
              className="inline-flex items-center text-[11px] font-bold transition-colors"
              style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', padding: '5px 14px', borderRadius: '6px' }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="hover:bg-white/10" style={{ color: '#fff' }}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px] bg-white border-gray-200 p-0">
              <nav className="flex flex-col mt-8 px-4">
                {navGroups.map(({ group, categories: groupCats }) => (
                  <div key={group} className="border-b border-gray-200">
                    <button onClick={() => toggleMobileSection(group.toLowerCase())} className="flex items-center justify-between w-full py-4 text-sm font-medium" style={{ color: 'var(--sfp-navy)' }}>
                      {group}
                      <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${mobileExpanded === group.toLowerCase() ? 'rotate-180' : ''}`} />
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
                                <div className="mt-2 pt-2 border-t border-gray-200"><p className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Top Reviews</p></div>
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
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Select Region</p>
                  <div className="space-y-1">
                    {Object.entries(marketConfig).map(([key, config]) => (
                      <Link key={key} href={key === 'us' ? '/' : `/${key}`} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${key === market ? 'font-semibold bg-gray-100' : 'hover:bg-gray-100'}`} style={{ color: key === market ? 'var(--sfp-navy)' : 'var(--sfp-ink)' }} onClick={() => setMobileMenuOpen(false)}>
                        <span>{config.flag}</span><span>{config.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <Button asChild className="w-full text-white border-0 mt-2 font-medium" style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}>
                  <Link href="/tools" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </nav>
      </div>

      {/* ── Mega-menu panels (market.us compact style) ──────────── */}
      {activeMenu && (
        <div className="absolute left-0 right-0 z-40 hidden lg:block" onMouseEnter={() => openMenu(activeMenu)} onMouseLeave={closeMenu}>
          <div className="border-b border-gray-200 shadow-xl bg-white">
            <div className="py-6" style={{ maxWidth: '1140px', margin: '0 auto', padding: '24px 40px' }}>

              {/* Category-based panels (Investing, Banking, Trading) */}
              {navGroups
                .filter(({ group }) => group !== 'Tools' && activeMenu === group.toLowerCase())
                .map(({ group, categories: groupCats }) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{group}</p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-1">
                      {/* Category links — compact text-only */}
                      {groupCats.map((cat) => {
                        const config = categoryConfig[cat];
                        return (
                          <Link
                            key={cat}
                            href={`${prefix}/${cat}`}
                            className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={() => setActiveMenu(null)}
                          >
                            <span className="text-sm font-medium transition-colors" style={{ color: 'var(--sfp-ink)' }}>
                              {config.name}
                            </span>
                            <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all" style={{ color: 'var(--sfp-navy)' }} />
                          </Link>
                        );
                      })}

                      {/* Featured links for this market — inline in the grid */}
                      {featuredLinks.length > 0 && (
                        <div className="col-span-1 row-span-3">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                            Featured in {currentMarket.name}
                          </p>
                          <div className="space-y-0.5">
                            {featuredLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                                onClick={() => setActiveMenu(null)}
                              >
                                <span className="text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }}>
                                  {link.label}
                                </span>
                                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all" style={{ color: 'var(--sfp-navy)' }} />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Broker reviews in Trading mega-panel — compact text pills */}
                    {group === 'Trading' && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Broker Reviews</p>
                        <div className="flex flex-wrap gap-2">
                          {brokerCards.map((broker) => (
                            <Link
                              key={broker.slug}
                              href={`${prefix}/reviews/${broker.slug}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                              style={{ color: 'var(--sfp-ink)' }}
                              onClick={() => setActiveMenu(null)}
                            >
                              {broker.name}
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-amber-500">{broker.rating}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {/* Tools Mega-Menu — compact text-only */}
              {activeMenu === 'tools' && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Free Tools & Calculators</p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                    {getToolCardsForMarket(market).map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setActiveMenu(null)}
                      >
                        <span className="text-sm font-medium transition-colors" style={{ color: 'var(--sfp-ink)' }}>
                          {tool.name}
                        </span>
                        {tool.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--sfp-gold-dark)' }}>
                            {tool.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <Link href="/tools" className="group inline-flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--sfp-navy)' }} onClick={() => setActiveMenu(null)}>
                      View All Tools
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
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
