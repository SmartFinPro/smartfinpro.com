'use client';

import {
  Sparkles,
  MousePointer,
  Target,
  TrendingUp,
  ArrowDown,
  ChevronRight,
} from 'lucide-react';

interface QuizAnalyticsProps {
  data: QuizStats;
}

export interface QuizStats {
  totalStarts: number;
  totalCompletions: number;
  totalCtaClicks: number; // High-intent clicks
  completionRate: number;
  ctaClickRate: number; // Conversion from completion to CTA click
  topRecommendations: Array<{
    product: string;
    count: number;
    clickRate: number;
  }>;
  answerDistribution: {
    region: Record<string, number>;
    volume: Record<string, number>;
    focus: Record<string, number>;
  };
}

// Progress bar component
function ProgressBar({ value, color = 'bg-emerald-500' }: { value: number; color?: string }) {
  return (
    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

// Stat card component
function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor,
  highlight = false,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm ${
      highlight ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${highlight ? 'text-emerald-700' : 'text-slate-500'}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-slate-400 mt-1">{subtext}</p>
          )}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

// Funnel step component
function FunnelStep({
  label,
  value,
  percentage,
  color,
  showArrow = true,
  badge,
}: {
  label: string;
  value: number;
  percentage?: number;
  color: string;
  showArrow?: boolean;
  badge?: string;
}) {
  const percentageDisplay = percentage !== undefined ? ` (${percentage.toFixed(1)}%)` : '';

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-slate-700 font-medium">{label}</span>
            {badge && (
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                {badge}
              </span>
            )}
          </span>
          <span className="font-semibold text-slate-900 tabular-nums">
            {value.toLocaleString('en-US')}{percentageDisplay}
          </span>
        </div>
        <ProgressBar value={percentage ?? 100} color={color} />
      </div>
      {showArrow && (
        <div className="flex justify-center py-1">
          <ArrowDown className="h-4 w-4 text-slate-300" />
        </div>
      )}
    </>
  );
}

export function QuizAnalytics({ data }: QuizAnalyticsProps) {
  const overallConversion = data.totalStarts > 0
    ? ((data.totalCtaClicks / data.totalStarts) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Quiz Starts"
          value={data.totalStarts.toLocaleString('en-US')}
          subtext="Total quiz initiations"
          icon={Sparkles}
          iconColor="bg-purple-50 text-purple-500"
        />
        <StatCard
          label="Completions"
          value={data.totalCompletions.toLocaleString('en-US')}
          subtext={`${data.completionRate.toFixed(1)}% completion rate`}
          icon={Target}
          iconColor="bg-blue-50 text-blue-500"
        />
        <StatCard
          label="High-Intent Clicks"
          value={data.totalCtaClicks.toLocaleString('en-US')}
          subtext={`${data.ctaClickRate.toFixed(1)}% of completions clicked CTA`}
          icon={MousePointer}
          iconColor="bg-emerald-50 text-emerald-600"
          highlight={true}
        />
        <StatCard
          label="Quiz → Affiliate"
          value={`${overallConversion}%`}
          subtext="Overall conversion rate"
          icon={TrendingUp}
          iconColor="bg-amber-50 text-amber-500"
        />
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Target className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Quiz Conversion Funnel</h3>
        </div>
        <div className="p-6 space-y-1">
          <FunnelStep
            label="Started Quiz"
            value={data.totalStarts}
            color="bg-blue-500"
          />
          <FunnelStep
            label="Completed Quiz"
            value={data.totalCompletions}
            percentage={data.completionRate}
            color="bg-emerald-500"
          />
          <FunnelStep
            label="Clicked Affiliate CTA"
            value={data.totalCtaClicks}
            percentage={data.ctaClickRate}
            color="bg-purple-500"
            showArrow={false}
            badge="High-Intent"
          />
        </div>
      </div>

      {/* Top Recommendations */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Top Quiz Recommendations</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Which products get recommended most and their click-through rates
          </p>
        </div>
        <div className="p-4">
          {data.topRecommendations.length > 0 ? (
            <div className="space-y-3">
              {data.topRecommendations.map((rec, index) => (
                <div
                  key={rec.product}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-slate-200 text-slate-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-slate-900">{rec.product}</span>
                      <span className="text-xs text-slate-500">
                        {rec.count} recommendations
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <ProgressBar value={rec.clickRate} color="bg-emerald-500" />
                      </div>
                      <span className={`text-xs font-medium w-14 text-right ${
                        rec.clickRate >= 50 ? 'text-emerald-600' :
                        rec.clickRate >= 25 ? 'text-slate-700' :
                        'text-slate-400'
                      }`}>
                        {rec.clickRate.toFixed(0)}% CTR
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm">
              No quiz recommendations data yet
            </div>
          )}
        </div>
      </div>

      {/* Answer Distribution */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Region Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-900">Region Distribution</h4>
          </div>
          <div className="p-4">
            {Object.keys(data.answerDistribution.region).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(data.answerDistribution.region).map(([region, count]) => {
                  const flags: Record<string, string> = {
                    us: '🇺🇸', uk: '🇬🇧', gb: '🇬🇧', ca: '🇨🇦', au: '🇦🇺',
                  };
                  const total = Object.values(data.answerDistribution.region).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={region} className="flex items-center gap-3">
                      <span className="text-lg">{flags[region.toLowerCase()] || '🌍'}</span>
                      <span className="flex-1 text-sm text-slate-700">{region.toUpperCase()}</span>
                      <div className="w-20">
                        <ProgressBar value={percentage} color="bg-blue-400" />
                      </div>
                      <span className="text-sm text-slate-500 w-8 text-right tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No data</p>
            )}
          </div>
        </div>

        {/* Volume Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-900">Volume Distribution</h4>
          </div>
          <div className="p-4">
            {Object.keys(data.answerDistribution.volume).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(data.answerDistribution.volume).map(([volume, count]) => {
                  const labels: Record<string, string> = {
                    low: '< $10k',
                    medium: '$10k-$100k',
                    high: '$100k-$500k',
                    enterprise: '$500k+',
                  };
                  const total = Object.values(data.answerDistribution.volume).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={volume} className="flex items-center gap-3">
                      <span className="flex-1 text-sm text-slate-700">{labels[volume] || volume}</span>
                      <div className="w-20">
                        <ProgressBar value={percentage} color="bg-purple-400" />
                      </div>
                      <span className="text-sm text-slate-500 w-8 text-right tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No data</p>
            )}
          </div>
        </div>

        {/* Focus Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-900">Primary Need</h4>
          </div>
          <div className="p-4">
            {Object.keys(data.answerDistribution.focus).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(data.answerDistribution.focus).map(([focus, count]) => {
                  const labels: Record<string, string> = {
                    fx: 'International FX',
                    domestic: 'Domestic Ops',
                    startup: 'Startup Banking',
                    both: 'Both',
                  };
                  const total = Object.values(data.answerDistribution.focus).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={focus} className="flex items-center gap-3">
                      <span className="flex-1 text-sm text-slate-700">{labels[focus] || focus}</span>
                      <div className="w-20">
                        <ProgressBar value={percentage} color="bg-amber-400" />
                      </div>
                      <span className="text-sm text-slate-500 w-8 text-right tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
