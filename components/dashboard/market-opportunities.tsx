'use client';

import { TrendingUp, AlertTriangle, Settings, Rocket, ChevronRight } from 'lucide-react';
import type { MarketOpportunity, MarketCode } from '@/lib/actions/dashboard';

interface MarketOpportunitiesProps {
  opportunities: MarketOpportunity[];
}

// Market flags
const marketFlags: Record<MarketCode, string> = {
  US: '🇺🇸',
  GB: '🇬🇧',
  CA: '🇨🇦',
  AU: '🇦🇺',
};

// Opportunity type icons and colors
const typeConfig: Record<MarketOpportunity['type'], {
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  growth: {
    icon: TrendingUp,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  optimization: {
    icon: Settings,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  expansion: {
    icon: Rocket,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
};

// Priority badge
function PriorityBadge({ priority }: { priority: MarketOpportunity['priority'] }) {
  const colors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium uppercase ${colors[priority]}`}>
      {priority}
    </span>
  );
}

// Single opportunity row
function OpportunityRow({ opportunity }: { opportunity: MarketOpportunity }) {
  const config = typeConfig[opportunity.type];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      {/* Icon */}
      <div className={`p-1.5 rounded-md bg-white border ${config.borderColor}`}>
        <Icon className={`h-4 w-4 ${config.textColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{marketFlags[opportunity.market]}</span>
          <h4 className="text-sm font-medium text-slate-900 truncate">
            {opportunity.title}
          </h4>
          <PriorityBadge priority={opportunity.priority} />
        </div>
        <p className="text-xs text-slate-600 mb-1.5 line-clamp-2">
          {opportunity.description}
        </p>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${config.textColor}`}>
            {opportunity.metric}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-0.5 hover:text-slate-700 cursor-pointer">
            {opportunity.action.slice(0, 40)}...
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function MarketOpportunities({ opportunities }: MarketOpportunitiesProps) {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
        <p className="text-sm text-slate-600">All markets performing well!</p>
        <p className="text-xs text-slate-400 mt-1">No immediate action items detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {opportunities.map((opp) => (
        <OpportunityRow key={opp.id} opportunity={opp} />
      ))}
    </div>
  );
}
