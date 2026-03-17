'use client';

import Link from 'next/link';
import {
  Sparkles,
  Shield,
  TrendingUp,
  DollarSign,
  Wallet,
  Building,
  type LucideIcon,
} from 'lucide-react';
import { Category, categoryConfig, Market, marketCategories } from '@/lib/i18n/config';

interface OverviewSidebarProps {
  market: Market;
  activeCategory: string;
}

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  Shield,
  TrendingUp,
  DollarSign,
  Wallet,
  Building,
};

export function OverviewSidebar({ market, activeCategory }: OverviewSidebarProps) {
  const categories = marketCategories[market] || marketCategories.us;
  const prefix = market === 'us' ? '' : `/${market}`;

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 px-2" style={{ color: 'var(--sfp-slate)' }}>
            Report Categories
          </h3>
          <nav className="space-y-1">
            {categories.map((cat) => {
              const config = categoryConfig[cat as Category];
              if (!config) return null;
              const Icon = iconMap[config.icon] || Sparkles;
              const isActive = cat === activeCategory;

              return (
                <Link
                  key={cat}
                  href={`${prefix}/${cat}/overview`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'border-l-[3px]'
                      : 'hover:bg-gray-50'
                  }`}
                  style={
                    isActive
                      ? { background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)', color: 'var(--sfp-ink)' }
                      : { color: 'var(--sfp-slate)' }
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" style={{ color: isActive ? 'var(--sfp-navy)' : 'var(--sfp-slate)' }} />
                  <span>{config.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile horizontal pill bar */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => {
            const config = categoryConfig[cat as Category];
            if (!config) return null;
            const Icon = iconMap[config.icon] || Sparkles;
            const isActive = cat === activeCategory;

            return (
              <Link
                key={cat}
                href={`${prefix}/${cat}/overview`}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
                style={
                  isActive
                    ? { background: 'var(--sfp-navy)' }
                    : { background: 'white', color: 'var(--sfp-slate)' }
                }
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{config.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
