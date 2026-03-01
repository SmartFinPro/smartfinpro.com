// components/marketing/portal-sidebar.tsx
// Sticky left sidebar for Market & Category listing pages (market.us "Report Categories" style)

import Link from 'next/link';
import {
  Sparkles,
  Shield,
  TrendingUp,
  DollarSign,
  Building,
  CreditCard,
  Wallet,
  Zap,
  Home,
  PiggyBank,
  Landmark,
  Coins,
  BarChart3,
} from 'lucide-react';
import type { Market, Category } from '@/lib/i18n/config';
import { marketCategories, categoryConfig } from '@/lib/i18n/config';

const categoryIcons: Record<string, typeof Sparkles> = {
  'ai-tools': Sparkles,
  cybersecurity: Shield,
  trading: TrendingUp,
  forex: DollarSign,
  'personal-finance': Wallet,
  'business-banking': Building,
  'credit-repair': CreditCard,
  'debt-relief': DollarSign,
  'credit-score': Zap,
  remortgaging: Home,
  'cost-of-living': PiggyBank,
  savings: PiggyBank,
  superannuation: Landmark,
  'gold-investing': Coins,
  'tax-efficient-investing': TrendingUp,
  housing: Home,
};

interface PortalSidebarProps {
  market: Market;
  activeCategory?: Category;
}

export function PortalSidebar({ market, activeCategory }: PortalSidebarProps) {
  const categories = marketCategories[market];
  const marketPrefix = `/${market}`;

  return (
    <aside className="lg:w-[280px] xl:w-[300px] flex-shrink-0 hidden lg:block">
      <div className="lg:sticky lg:top-24">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div
            className="px-5 py-4 border-b border-gray-100"
            style={{ background: 'var(--sfp-gray)' }}
          >
            <h3 className="text-base font-bold" style={{ color: 'var(--sfp-ink)' }}>
              Report Categories
            </h3>
          </div>

          {/* Category Links */}
          <nav className="py-2">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat] || BarChart3;
              const isActive = activeCategory === cat;
              const config = categoryConfig[cat];

              return (
                <Link
                  key={cat}
                  href={`${marketPrefix}/${cat}`}
                  className={`
                    flex items-center gap-3 px-5 py-3 text-sm transition-colors
                    ${isActive
                      ? 'font-semibold border-l-4'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }
                  `}
                  style={isActive ? {
                    color: 'var(--sfp-navy)',
                    borderLeftColor: 'var(--sfp-navy)',
                    background: 'var(--sfp-sky)',
                  } : {
                    color: 'var(--sfp-ink)',
                  }}
                >
                  <Icon
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: isActive ? 'var(--sfp-navy)' : 'var(--sfp-slate)' }}
                  />
                  <span>{config.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
