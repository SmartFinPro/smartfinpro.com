'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Star,
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
} from '@/lib/i18n/config';

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
};

// Broker review cards
const brokerCards = [
  { name: 'eToro', slug: 'etoro', rating: 4.8, color: 'bg-emerald-500/20 text-emerald-400' },
  { name: 'Capital.com', slug: 'capital-com', rating: 4.7, color: 'bg-rose-500/20 text-rose-400' },
  { name: 'IBKR', slug: 'ibkr', rating: 4.9, color: 'bg-violet-500/20 text-violet-400' },
  { name: 'Investing.com', slug: 'investing', rating: 4.6, color: 'bg-amber-500/20 text-amber-400' },
  { name: 'Revolut', slug: 'revolut', rating: 4.5, color: 'bg-blue-500/20 text-blue-400' },
];

// All categories in display order
const allCategories: Category[] = [
  'ai-tools',
  'cybersecurity',
  'trading',
  'forex',
  'personal-finance',
  'business-banking',
];

// Tool cards for mega-menu
const toolCards = [
  { name: 'Broker Finder Quiz', description: 'Personalized broker match in 60 seconds', href: '/tools/broker-finder', icon: Target, badge: 'New' },
  { name: 'Trading Cost Calculator', description: 'Compare fees across top brokers', href: '/tools/trading-cost-calculator', icon: BarChart3, badge: 'New' },
  { name: 'AI ROI Calculator', description: 'Calculate AI tool investment returns', href: '/tools/ai-roi-calculator', icon: TrendingUp, badge: null },
  { name: 'Loan Calculator', description: 'Monthly payments & amortization', href: '/tools/loan-calculator', icon: Calculator, badge: null },
  { name: 'Broker Comparison', description: 'Side-by-side broker comparison', href: '/tools/broker-comparison', icon: Scale, badge: null },
];

// Detect market from pathname
function detectMarket(pathname: string): Market {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  if (firstSegment && markets.includes(firstSegment as Market)) {
    return firstSegment as Market;
  }
  return 'us';
}

export function Header({ market: marketProp }: HeaderProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const market = marketProp || detectMarket(pathname);
  const currentMarket = marketConfig[market];
  const prefix = market === 'us' ? '' : `/${market}`;
  const availableCategories = marketCategories[market] || marketCategories.us;

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
      {/* Header bar */}
      <div className="border-b border-violet-500/20 bg-[#0f0a1a]/80 backdrop-blur-xl">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href={prefix || '/'} className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-xl font-bold text-white">
              Smart<span className="text-cyan-400">Fin</span>Pro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1 ml-8">
            {/* Products */}
            <div
              onMouseEnter={() => openMenu('products')}
              onMouseLeave={closeMenu}
            >
              <button
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  activeMenu === 'products'
                    ? 'text-white bg-slate-800/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Products
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    activeMenu === 'products' ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Reviews */}
            <div
              onMouseEnter={() => openMenu('reviews')}
              onMouseLeave={closeMenu}
            >
              <button
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  activeMenu === 'reviews'
                    ? 'text-white bg-slate-800/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Reviews
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    activeMenu === 'reviews' ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Tools */}
            <div
              onMouseEnter={() => openMenu('tools')}
              onMouseLeave={closeMenu}
            >
              <button
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  activeMenu === 'tools'
                    ? 'text-white bg-slate-800/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tools
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    activeMenu === 'tools' ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

          </div>

          {/* Right side: Market Selector + CTA */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-slate-400 hover:text-white hover:bg-slate-800/50"
                >
                  <span>{currentMarket.flag}</span>
                  <span>{currentMarket.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                {Object.entries(marketConfig).map(([key, config]) => (
                  <DropdownMenuItem
                    key={key}
                    asChild
                    className="text-slate-300 focus:bg-slate-800 focus:text-white"
                  >
                    <Link href={key === 'us' ? '/' : `/${key}`}>
                      <span className="mr-2">{config.flag}</span>
                      {config.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild className="bg-violet-500 hover:bg-violet-600 text-white border-0">
              <Link href="/tools">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px] bg-[#0f0a1a] border-slate-800 p-0">
              <nav className="flex flex-col mt-8 px-4">
                {/* Products Accordion */}
                <div className="border-b border-slate-800/50">
                  <button
                    onClick={() => toggleMobileSection('products')}
                    className="flex items-center justify-between w-full py-4 text-sm font-medium text-slate-200"
                  >
                    Products
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                        mobileExpanded === 'products' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {mobileExpanded === 'products' && (
                    <div className="pb-4 space-y-1">
                      {allCategories
                        .filter((cat) => availableCategories.includes(cat))
                        .map((cat) => {
                          const config = categoryConfig[cat];
                          const Icon = iconMap[config.icon] || Sparkles;
                          return (
                            <Link
                              key={cat}
                              href={`${prefix}/${cat}`}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Icon className="h-4 w-4 text-cyan-400" />
                              <span className="text-sm">{config.name}</span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Overviews Accordion */}
                <div className="border-b border-slate-800/50">
                  <button
                    onClick={() => toggleMobileSection('overviews')}
                    className="flex items-center justify-between w-full py-4 text-sm font-medium text-slate-200"
                  >
                    Market Overviews
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                        mobileExpanded === 'overviews' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {mobileExpanded === 'overviews' && (
                    <div className="pb-4 space-y-1">
                      {allCategories
                        .filter((cat) => availableCategories.includes(cat))
                        .map((cat) => {
                          const config = categoryConfig[cat];
                          const Icon = iconMap[config.icon] || Sparkles;
                          return (
                            <Link
                              key={`mobile-overview-${cat}`}
                              href={`${prefix}/${cat}/overview`}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Icon className="h-4 w-4 text-cyan-400" />
                              <span className="text-sm">{config.name} Overview</span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Reviews Accordion */}
                <div className="border-b border-slate-800/50">
                  <button
                    onClick={() => toggleMobileSection('reviews')}
                    className="flex items-center justify-between w-full py-4 text-sm font-medium text-slate-200"
                  >
                    Reviews
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                        mobileExpanded === 'reviews' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {mobileExpanded === 'reviews' && (
                    <div className="pb-4 space-y-1">
                      {brokerCards.map((broker) => (
                        <Link
                          key={broker.slug}
                          href={`${prefix}/reviews/${broker.slug}`}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="text-sm">{broker.name}</span>
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <Star className="h-3 w-3 fill-amber-400" />
                            {broker.rating}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tools Accordion */}
                <div className="border-b border-slate-800/50">
                  <button
                    onClick={() => toggleMobileSection('tools')}
                    className="flex items-center justify-between w-full py-4 text-sm font-medium text-slate-200"
                  >
                    Tools
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                        mobileExpanded === 'tools' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {mobileExpanded === 'tools' && (
                    <div className="pb-4 space-y-1">
                      {toolCards.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <tool.icon className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm">{tool.name}</span>
                          {tool.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">{tool.badge}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Region Selector */}
                <div className="pt-6 pb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Select Region
                  </p>
                  <div className="space-y-1">
                    {Object.entries(marketConfig).map(([key, config]) => (
                      <Link
                        key={key}
                        href={key === 'us' ? '/' : `/${key}`}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          key === market
                            ? 'text-white bg-violet-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{config.flag}</span>
                        <span>{config.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <Button asChild className="w-full bg-violet-500 hover:bg-violet-600 text-white border-0 mt-2">
                  <Link href="/tools" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </nav>
      </div>

      {/* Mega-menu panels */}
      {activeMenu && (
        <div
          className="absolute left-0 right-0 z-40 hidden lg:block"
          onMouseEnter={() => openMenu(activeMenu)}
          onMouseLeave={closeMenu}
        >
          <div
            className="border-b border-violet-500/20 shadow-2xl"
            style={{ background: 'rgba(15, 10, 26, 0.97)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
          >
            <div className="container mx-auto px-6 py-8">
              {/* Products Mega-Menu */}
              {activeMenu === 'products' && (
                <div className="flex gap-10">
                  {/* Categories Grid */}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">
                      Categories
                    </p>
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                      {allCategories
                        .filter((cat) => availableCategories.includes(cat))
                        .map((cat) => {
                          const config = categoryConfig[cat];
                          const Icon = iconMap[config.icon] || Sparkles;
                          return (
                            <Link
                              key={cat}
                              href={`${prefix}/${cat}`}
                              className="group flex items-start gap-3 p-4 rounded-xl border border-transparent hover:border-violet-500/30 hover:bg-slate-800/40 transition-all duration-200"
                              onClick={() => setActiveMenu(null)}
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                <Icon className="h-5 w-5 text-cyan-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                                  {config.name}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                  {config.description}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                    </div>
                  </div>

                  {/* Sidebar: Overviews + Popular */}
                  <div className="w-64 border-l border-slate-800/50 pl-10">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                      Market Overviews
                    </p>
                    <div className="space-y-2.5 mb-6">
                      {allCategories
                        .filter((cat) => availableCategories.includes(cat))
                        .map((cat) => (
                          <Link
                            key={`overview-${cat}`}
                            href={`${prefix}/${cat}/overview`}
                            className="group flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                            onClick={() => setActiveMenu(null)}
                          >
                            <span>{categoryConfig[cat].name}</span>
                            <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </Link>
                        ))}
                    </div>

                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                      Popular
                    </p>
                    <div className="space-y-2.5">
                      <Link
                        href="/trading-platforms/tradingview"
                        className="group flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                        onClick={() => setActiveMenu(null)}
                      >
                        <span>TradingView Platform</span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                      <Link
                        href={`${prefix}/reviews/etoro`}
                        className="group flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                        onClick={() => setActiveMenu(null)}
                      >
                        <span>Top Rated: eToro</span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Tools Mega-Menu */}
              {activeMenu === 'tools' && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">
                    Free Tools & Calculators
                  </p>
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                    {toolCards.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="group flex items-start gap-3 p-4 rounded-xl border border-transparent hover:border-violet-500/30 hover:bg-slate-800/40 transition-all duration-200"
                        onClick={() => setActiveMenu(null)}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <tool.icon className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                            {tool.name}
                            {tool.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold">{tool.badge}</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-800/50">
                    <Link
                      href="/tools"
                      className="group inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                      onClick={() => setActiveMenu(null)}
                    >
                      View All Tools
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Reviews Mega-Menu */}
              {activeMenu === 'reviews' && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">
                    Broker Reviews
                  </p>
                  <div className="grid grid-cols-5 gap-4">
                    {brokerCards.map((broker) => (
                      <Link
                        key={broker.slug}
                        href={`${prefix}/reviews/${broker.slug}`}
                        className="group p-4 rounded-xl border border-transparent hover:border-violet-500/30 hover:bg-slate-800/40 transition-all duration-200 text-center"
                        onClick={() => setActiveMenu(null)}
                      >
                        <div className="h-10 mb-3 flex items-center justify-center">
                          <Image
                            src={`/images/brokers/${broker.slug}.svg`}
                            alt={broker.name}
                            width={120}
                            height={32}
                            className="h-8 w-auto brightness-90 group-hover:brightness-110 transition-all"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium text-white">{broker.rating}</span>
                        </div>
                        <span className="text-xs text-slate-500 group-hover:text-cyan-400 transition-colors flex items-center justify-center gap-1">
                          View Review
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay when mega-menu is open */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-30 bg-black/20 hidden lg:block"
          onMouseEnter={closeMenu}
          style={{ top: '64px' }}
        />
      )}
    </header>
  );
}
