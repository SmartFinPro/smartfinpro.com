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
  efficiencyGain: number; // percentage
  securityCerts: string[];
  price: string;
  rating: number;
  affiliateUrl: string;
  badge?: 'top-pick' | 'best-value' | 'cfo-approved' | 'fastest';
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
    className: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  },
  'best-value': {
    label: 'Best Value',
    icon: TrendingUp,
    className: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
  },
  'cfo-approved': {
    label: 'CFO-Approved',
    icon: Shield,
    className: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
  },
  'fastest': {
    label: 'Fastest',
    icon: Zap,
    className: 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30',
  },
};

const currencySymbols = {
  us: '$',
  uk: '£',
  ca: 'C$',
  au: 'A$',
};

/**
 * Comparison Matrix - Investing.com style
 * Premium, data-driven comparison table for finance tools
 */
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>
        </div>

        {/* Edition Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 mt-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>2026 Edition - Updated February</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/70 border-b border-slate-700/50">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Tool</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Primary Use Case</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-300">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Efficiency Gain
                  </div>
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-300">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    Security Certs
                  </div>
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-300">Rating</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-300">Price</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool, index) => {
                const BadgeIcon = tool.badge ? badgeConfig[tool.badge].icon : null;

                return (
                  <tr
                    key={tool.slug}
                    className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/30 ${
                      index === 0 ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    {/* Tool Name & Badge */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-bold text-white">{tool.name}</span>
                            <p className="text-xs text-slate-500 mt-0.5">{tool.tagline}</p>
                          </div>
                        </div>
                        {tool.badge && BadgeIcon && (
                          <Badge className={`w-fit text-xs ${badgeConfig[tool.badge].className}`}>
                            <BadgeIcon className="h-3 w-3 mr-1" />
                            {badgeConfig[tool.badge].label}
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Primary Use Case */}
                    <td className="px-6 py-5">
                      <span className="text-sm text-slate-300">{tool.primaryUseCase}</span>
                    </td>

                    {/* Efficiency Gain */}
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                            style={{ width: `${Math.min(tool.efficiencyGain, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-emerald-400 text-sm">{tool.efficiencyGain}%</span>
                      </div>
                    </td>

                    {/* Security Certs */}
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {tool.securityCerts.map((cert) => (
                          <span
                            key={cert}
                            className="px-2 py-0.5 text-xs rounded bg-slate-800/80 text-slate-400 border border-slate-700/50"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < Math.floor(tool.rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-white">{tool.rating}</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-5 text-center">
                      <span className="font-bold text-lg gradient-text">{tool.price}</span>
                      <span className="block text-xs text-slate-500">/month</span>
                    </td>

                    {/* CTA */}
                    <td className="px-6 py-5 text-center">
                      <Button
                        asChild
                        size="sm"
                        className={`gap-1.5 ${
                          index === 0
                            ? 'btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                        }`}
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
        <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                Efficiency based on 6-month testing
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-blue-400" />
                Security verified by independent auditors
              </span>
            </div>
            <span className="text-xs text-slate-600">
              Prices in {currencySymbols[market]} for {market.toUpperCase()} market
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for sidebars
 */
interface CompactMatrixProps {
  tools: Pick<MatrixTool, 'name' | 'efficiencyGain' | 'price' | 'affiliateUrl'>[];
  title?: string;
}

export function CompactMatrix({ tools, title = 'Quick Comparison' }: CompactMatrixProps) {
  return (
    <div className="glass-card rounded-xl p-5">
      <h4 className="font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-emerald-400" />
        {title}
      </h4>
      <div className="space-y-3">
        {tools.map((tool, index) => (
          <Link
            key={tool.name}
            href={tool.affiliateUrl}
            target="_blank"
            rel="noopener sponsored"
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {index + 1}
              </span>
              <span className="font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">
                {tool.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-400">+{tool.efficiencyGain}%</span>
              <span className="text-xs text-slate-500">{tool.price}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
