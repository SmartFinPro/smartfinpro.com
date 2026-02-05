'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Market, marketConfig, markets, marketCategories } from '@/lib/i18n/config';

interface HeaderProps {
  market?: Market;
}

// Navigation items per market
const getNavigation = (market: Market) => {
  const categories = marketCategories[market] || marketCategories.us;
  const prefix = market === 'us' ? '' : `/${market}`;

  const categoryLabels: Record<string, string> = {
    'ai-tools': 'AI Tools',
    'cybersecurity': 'Cybersecurity',
    'trading': 'Trading',
    'forex': 'Forex',
    'personal-finance': 'Personal Finance',
    'business-banking': 'Business Banking',
  };

  return categories.slice(0, 4).map((cat) => ({
    name: categoryLabels[cat] || cat,
    href: `${prefix}/${cat}`,
  }));
};

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Auto-detect market from URL if not provided
  const market = marketProp || detectMarket(pathname);
  const currentMarket = marketConfig[market];
  const navItems = getNavigation(market);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={market === 'us' ? '/' : `/${market}`} className="flex items-center space-x-2">
          <span className="text-xl font-bold text-white">Smart<span className="text-emerald-400">Fin</span>Pro</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-emerald-400"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right side: Market Selector + CTA */}
        <div className="hidden md:flex md:items-center md:space-x-4">
          {/* Market Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white hover:bg-slate-800/50">
                <span>{currentMarket.flag}</span>
                <span>{currentMarket.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
              {Object.entries(marketConfig).map(([key, config]) => (
                <DropdownMenuItem key={key} asChild className="text-slate-300 focus:bg-slate-800 focus:text-white">
                  <Link href={key === 'us' ? '/' : `/${key}`}>
                    <span className="mr-2">{config.flag}</span>
                    {config.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
            <Link href="/resources">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800/50">
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-slate-950 border-slate-800">
            <nav className="flex flex-col space-y-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-lg font-medium text-slate-300 hover:text-emerald-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-slate-800 pt-4 mt-4">
                <p className="text-sm text-slate-500 mb-2">Select Region</p>
                {Object.entries(marketConfig).map(([key, config]) => (
                  <Link
                    key={key}
                    href={key === 'us' ? '/' : `/${key}`}
                    className="flex items-center space-x-2 py-2 text-slate-300 hover:text-emerald-400 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{config.flag}</span>
                    <span>{config.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
