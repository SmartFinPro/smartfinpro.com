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
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 px-2">
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
                      ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-l-[3px] border-violet-400 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
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
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
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
