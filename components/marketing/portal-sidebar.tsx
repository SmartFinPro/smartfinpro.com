// components/marketing/portal-sidebar.tsx
// Enterprise premium sidebar for Market & Category listing pages

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
  ChevronRight,
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
  categoryCounts?: Record<string, number>;
}

export function PortalSidebar({ market, activeCategory, categoryCounts }: PortalSidebarProps) {
  const categories = marketCategories[market];
  const marketPrefix = `/${market}`;

  return (
    <aside className="lg:w-[280px] xl:w-[300px] flex-shrink-0 hidden lg:block">
      <div className="lg:sticky lg:top-24">
        <div
          className="overflow-hidden"
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          {/* Header — Navy gradient */}
          <div
            style={{
              background: 'linear-gradient(to bottom, var(--sfp-navy), #2563EB)',
              padding: '20px 24px',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-0.2px',
                margin: 0,
              }}
            >
              Report Categories
            </h3>
          </div>

          {/* Category Links */}
          <nav style={{ padding: '8px 0' }}>
            {categories.map((cat) => {
              const Icon = categoryIcons[cat] || BarChart3;
              const isActive = activeCategory === cat;
              const config = categoryConfig[cat];
              const count = categoryCounts?.[cat];

              return (
                <Link
                  key={cat}
                  href={`${marketPrefix}/${cat}`}
                  className={`no-underline flex items-center gap-3 transition-colors${isActive ? '' : ' sidebar-link-hover'}`}
                  style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    color: isActive ? 'var(--sfp-navy)' : 'var(--sfp-ink)',
                    fontWeight: isActive ? 600 : 400,
                    borderLeft: isActive ? '3px solid var(--sfp-navy)' : '3px solid transparent',
                    background: isActive ? 'var(--sfp-sky)' : 'transparent',
                  }}
                >
                  <Icon
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: isActive ? 'var(--sfp-navy)' : 'var(--sfp-slate)' }}
                  />
                  <span className="flex-1">{config.name}</span>
                  {count !== undefined && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: 'var(--sfp-slate)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom CTA */}
          <div style={{ padding: '12px 24px 16px', borderTop: '1px solid #E2E8F0' }}>
            <Link
              href={`${marketPrefix}`}
              className="no-underline inline-flex items-center gap-1"
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sfp-navy)' }}
            >
              View All Reports
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
