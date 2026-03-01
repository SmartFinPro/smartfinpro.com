// components/marketing/report-highlights.tsx
// Premium data-highlight components for Research Report style MDX pages

import {
  TrendingUp,
  TrendingDown,
  Star,
  Users,
  DollarSign,
  Globe,
  BarChart3,
  Shield,
  Zap,
  Target,
  Calendar,
  FileText,
} from 'lucide-react';

// ── ReportHighlight ─────────────────────────────────────────────────────
// Single key-takeaway box (e.g., "Market Size: $46.2B")
// Usage in MDX:
//   <ReportHighlight label="Market Size 2025" value="$10.3 Billion" change="+16.2% CAGR" period="2025-2035" />

interface ReportHighlightProps {
  label: string;
  value: string;
  change?: string;
  period?: string;
  icon?: string;
}

const highlightIconMap: Record<string, typeof TrendingUp> = {
  trending: TrendingUp,
  chart: BarChart3,
  dollar: DollarSign,
  globe: Globe,
  star: Star,
  users: Users,
  shield: Shield,
  zap: Zap,
  target: Target,
  calendar: Calendar,
  file: FileText,
};

export function ReportHighlight({
  label,
  value,
  change,
  period,
  icon = 'chart',
}: ReportHighlightProps) {
  const Icon = highlightIconMap[icon] || BarChart3;
  const isPositive = change ? !change.startsWith('-') : true;

  return (
    <div className="my-8 not-prose">
      <div
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        style={{ borderLeft: '4px solid var(--sfp-navy)' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
            style={{ background: 'var(--sfp-sky)' }}
          >
            <Icon className="h-6 w-6" style={{ color: 'var(--sfp-navy)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--sfp-slate)' }}>
              {label}
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--sfp-navy)' }}>
                {value}
              </span>
              {change && (
                <span
                  className="inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: isPositive ? 'rgba(26, 107, 58, 0.1)' : 'rgba(214, 64, 69, 0.1)',
                    color: isPositive ? 'var(--sfp-green)' : 'var(--sfp-red)',
                  }}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {change}
                </span>
              )}
            </div>
            {period && (
              <div className="text-xs mt-1.5" style={{ color: 'var(--sfp-slate)' }}>
                Forecast period: {period}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DataSummary ─────────────────────────────────────────────────────────
// Multi-stat grid (2x2 or 4x1) for overview statistics
// Usage in MDX:
//   <DataSummary stats={[
//     { label: "Overall Rating", value: "4.7/5", icon: "star" },
//     { label: "Best For", value: "Day Traders", icon: "users" },
//     { label: "Monthly Cost", value: "$0/mo", icon: "dollar" },
//     { label: "Markets", value: "17,000+", icon: "globe" },
//   ]} />

interface DataSummaryStatItem {
  label: string;
  value: string;
  icon?: string;
}

interface DataSummaryProps {
  stats: DataSummaryStatItem[];
  title?: string;
}

export function DataSummary({ stats, title }: DataSummaryProps) {
  return (
    <div className="my-8 not-prose">
      {title && (
        <h4 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--sfp-slate)' }}>
          {title}
        </h4>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = highlightIconMap[stat.icon || 'chart'] || BarChart3;
          return (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto mb-3"
                style={{ background: 'var(--sfp-sky)' }}
              >
                <Icon className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              </div>
              <div className="text-xl md:text-2xl font-bold mb-0.5" style={{ color: 'var(--sfp-navy)' }}>
                {stat.value}
              </div>
              <div className="text-xs font-medium" style={{ color: 'var(--sfp-slate)' }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
