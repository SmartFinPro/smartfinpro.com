'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Trophy,
  Shield,
  Zap,
  TrendingUp,
  Star,
  CheckCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface MatrixTool {
  name: string;
  slug: string;
  tagline: string;
  primaryUseCase: string;
  efficiencyGain: number;
  securityCerts: string[];
  price: string;
  rating: number;
  affiliateUrl: string;
  badge?: 'top-pick' | 'best-value' | 'cfo-approved' | 'fastest';
  winnerBadge?: string;
  highlights?: string[];
}

interface ComparisonMatrixProps {
  tools: MatrixTool[];
  title?: string;
  subtitle?: string;
  market?: 'us' | 'uk' | 'ca' | 'au';
}

const badgeConfig = {
  'top-pick': {
    label: 'Top Pick',
    icon: Trophy,
    className: 'border',
  },
  'best-value': {
    label: 'Best Value',
    icon: TrendingUp,
    className: 'border',
  },
  'cfo-approved': {
    label: 'CFO-Approved',
    icon: Shield,
    className: 'border',
  },
  'fastest': {
    label: 'Fastest',
    icon: Zap,
    className: 'border',
  },
};

const currencySymbols = {
  us: '$',
  uk: '\u00a3',
  ca: 'C$',
  au: 'A$',
};

export function ComparisonMatrix({
  tools,
  title = '2026 AI Tools Comparison Matrix',
  subtitle = 'CFO-Approved Tools Ranked by Efficiency Gain',
  market = 'us',
}: ComparisonMatrixProps) {
  return (
    <div className="my-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-gray-200" style={{ background: 'var(--sfp-sky)' }}>
            <Sparkles className="h-6 w-6" style={{ color: 'var(--sfp-gold)' }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>{title}</h2>
            <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>{subtitle}</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-xs mt-4" style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-slate)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--sfp-green)' }} />
          <span>2026 Edition - Updated February</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
                <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>Tool</th>
                <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>Primary Use Case</th>
                <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                    Efficiency Gain
                  </div>
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                    Security Certs
                  </div>
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>Rating</th>
                <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>Price</th>
                <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool, index) => {
                const BadgeIcon = tool.badge ? badgeConfig[tool.badge].icon : null;

                return (
                  <tr
                    key={tool.slug}
                    className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                      index === 0 ? '' : ''
                    }`}
                    style={index === 0 ? { background: 'rgba(26,107,58,0.03)' } : {}}
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-ink)' }}>
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-bold" style={{ color: 'var(--sfp-ink)' }}>{tool.name}</span>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>{tool.tagline}</p>
                          </div>
                        </div>
                        {tool.winnerBadge && (
                          <Badge className="w-fit text-xs border" style={{ background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.2)', color: 'var(--sfp-gold)' }}>
                            <Trophy className="h-3 w-3 mr-1" />
                            {tool.winnerBadge}
                          </Badge>
                        )}
                        {!tool.winnerBadge && tool.badge && BadgeIcon && (
                          <Badge className="w-fit text-xs border" style={{ background: 'rgba(27,79,140,0.08)', borderColor: 'rgba(27,79,140,0.2)', color: 'var(--sfp-navy)' }}>
                            <BadgeIcon className="h-3 w-3 mr-1" />
                            {badgeConfig[tool.badge].label}
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-sm" style={{ color: 'var(--sfp-ink)' }}>{tool.primaryUseCase}</span>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(tool.efficiencyGain, 100)}%`, background: 'var(--sfp-green)' }}
                          />
                        </div>
                        <span className="font-bold text-sm" style={{ color: 'var(--sfp-green)' }}>{tool.efficiencyGain}%</span>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {tool.securityCerts.map((cert) => (
                          <span
                            key={cert}
                            className="px-2 py-0.5 text-xs rounded border border-gray-200"
                            style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-slate)' }}
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < Math.floor(tool.rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>{tool.rating}</span>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className="font-bold text-lg" style={{ color: 'var(--sfp-navy)' }}>{tool.price}</span>
                      <span className="block text-xs" style={{ color: 'var(--sfp-slate)' }}>/month</span>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <Button
                        asChild
                        size="sm"
                        className="gap-1.5 text-white"
                        style={{ background: index === 0 ? 'var(--sfp-gold)' : 'var(--sfp-navy)' }}
                      >
                        <Link href={tool.affiliateUrl} target="_blank" rel="noopener sponsored">
                          Try Free
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Legend */}
        <div className="px-6 py-4 border-t border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--sfp-slate)' }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
                Efficiency based on 6-month testing
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" style={{ color: 'var(--sfp-navy)' }} />
                Security verified by independent auditors
              </span>
            </div>
            <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
              Prices in {currencySymbols[market]} for {market.toUpperCase()} market
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CompactMatrixProps {
  tools: Pick<MatrixTool, 'name' | 'efficiencyGain' | 'price' | 'affiliateUrl'>[];
  title?: string;
}

export function CompactMatrix({ tools, title = 'Quick Comparison' }: CompactMatrixProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
      <h4 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
        <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
        {title}
      </h4>
      <div className="space-y-3">
        {tools.map((tool, index) => (
          <Link
            key={tool.name}
            href={tool.affiliateUrl}
            target="_blank"
            rel="noopener sponsored"
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-colors group"
            style={{ background: 'var(--sfp-gray)' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                style={{ background: index === 0 ? 'var(--sfp-gold)' : 'var(--sfp-navy)' }}
              >
                {index + 1}
              </span>
              <span className="font-medium transition-colors" style={{ color: 'var(--sfp-ink)' }}>
                {tool.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold" style={{ color: 'var(--sfp-green)' }}>+{tool.efficiencyGain}%</span>
              <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{tool.price}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
