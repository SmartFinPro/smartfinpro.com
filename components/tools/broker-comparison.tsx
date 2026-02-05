'use client';

import { useState } from 'react';
import {
  Scale,
  Star,
  Check,
  X,
  ExternalLink,
  Shield,
  Zap,
  DollarSign,
  Globe,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Broker {
  id: string;
  name: string;
  logo: string;
  rating: number;
  reviews: number;
  minDeposit: number;
  spreads: string;
  leverage: string;
  platforms: string[];
  regulation: string[];
  markets: string[];
  features: {
    demoAccount: boolean;
    mobileApp: boolean;
    copyTrading: boolean;
    educationalResources: boolean;
    negativeBalanceProtection: boolean;
    segregatedAccounts: boolean;
  };
  pros: string[];
  cons: string[];
  affiliateLink: string;
  bestFor: string;
}

const BROKERS: Broker[] = [
  {
    id: 'avatrade',
    name: 'AvaTrade',
    logo: '/images/brokers/avatrade.svg',
    rating: 4.7,
    reviews: 12500,
    minDeposit: 100,
    spreads: 'From 0.9 pips',
    leverage: 'Up to 1:400',
    platforms: ['MT4', 'MT5', 'AvaTradeGO', 'WebTrader'],
    regulation: ['ASIC', 'CBI', 'FSA', 'FSCA'],
    markets: ['us', 'uk', 'au', 'ca'],
    features: {
      demoAccount: true,
      mobileApp: true,
      copyTrading: true,
      educationalResources: true,
      negativeBalanceProtection: true,
      segregatedAccounts: true,
    },
    pros: [
      'Highly regulated across multiple jurisdictions',
      'Wide range of trading platforms',
      'Excellent educational resources',
      'Copy trading available',
    ],
    cons: [
      'Inactivity fees after 3 months',
      'No US clients accepted',
    ],
    affiliateLink: '/go/avatrade',
    bestFor: 'Beginners & Copy Trading',
  },
  {
    id: 'vantage',
    name: 'Vantage',
    logo: '/images/brokers/vantage.svg',
    rating: 4.5,
    reviews: 8200,
    minDeposit: 50,
    spreads: 'From 0.0 pips',
    leverage: 'Up to 1:500',
    platforms: ['MT4', 'MT5', 'ProTrader'],
    regulation: ['ASIC', 'CIMA', 'VFSC'],
    markets: ['au', 'uk', 'ca'],
    features: {
      demoAccount: true,
      mobileApp: true,
      copyTrading: true,
      educationalResources: true,
      negativeBalanceProtection: true,
      segregatedAccounts: true,
    },
    pros: [
      'Ultra-low spreads from 0.0 pips',
      'Low minimum deposit ($50)',
      'Fast execution speeds',
      'Multiple account types',
    ],
    cons: [
      'Limited research tools',
      'Not available in all regions',
    ],
    affiliateLink: '/go/vantage',
    bestFor: 'Low-Cost Trading',
  },
  {
    id: 'ic-markets',
    name: 'IC Markets',
    logo: '/images/brokers/ic-markets.svg',
    rating: 4.6,
    reviews: 15000,
    minDeposit: 200,
    spreads: 'From 0.0 pips',
    leverage: 'Up to 1:500',
    platforms: ['MT4', 'MT5', 'cTrader'],
    regulation: ['ASIC', 'CySEC', 'FSA'],
    markets: ['au', 'uk', 'ca'],
    features: {
      demoAccount: true,
      mobileApp: true,
      copyTrading: false,
      educationalResources: true,
      negativeBalanceProtection: true,
      segregatedAccounts: true,
    },
    pros: [
      'True ECN pricing',
      'Excellent for scalping',
      'Deep liquidity',
      'cTrader platform available',
    ],
    cons: [
      'Higher minimum deposit',
      'Limited educational content',
    ],
    affiliateLink: '/go/ic-markets',
    bestFor: 'Professional Traders',
  },
  {
    id: 'etoro',
    name: 'eToro',
    logo: '/images/brokers/etoro.svg',
    rating: 4.4,
    reviews: 25000,
    minDeposit: 50,
    spreads: 'From 1.0 pips',
    leverage: 'Up to 1:30',
    platforms: ['eToro Platform', 'eToro Mobile'],
    regulation: ['FCA', 'CySEC', 'ASIC', 'FinCEN'],
    markets: ['us', 'uk', 'au', 'ca'],
    features: {
      demoAccount: true,
      mobileApp: true,
      copyTrading: true,
      educationalResources: true,
      negativeBalanceProtection: true,
      segregatedAccounts: true,
    },
    pros: [
      'Industry-leading copy trading',
      'User-friendly platform',
      'Large community of traders',
      'Stocks and crypto available',
    ],
    cons: [
      'Higher spreads than ECN brokers',
      'Withdrawal fees apply',
    ],
    affiliateLink: '/go/etoro',
    bestFor: 'Social & Copy Trading',
  },
];

const FILTER_OPTIONS = {
  markets: [
    { value: 'all', label: 'All Markets' },
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
    { value: 'ca', label: 'Canada' },
  ],
  features: [
    { value: 'copyTrading', label: 'Copy Trading' },
    { value: 'demoAccount', label: 'Demo Account' },
    { value: 'mobileApp', label: 'Mobile App' },
    { value: 'negativeBalanceProtection', label: 'Negative Balance Protection' },
  ],
};

export function BrokerComparison() {
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'minDeposit' | 'spreads'>('rating');

  const filteredBrokers = BROKERS
    .filter((broker) => {
      if (selectedMarket !== 'all' && !broker.markets.includes(selectedMarket)) {
        return false;
      }
      if (selectedFeatures.length > 0) {
        return selectedFeatures.every(
          (feature) => broker.features[feature as keyof typeof broker.features]
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'minDeposit') return a.minDeposit - b.minDeposit;
      return 0;
    });

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-slate-800">Filter Brokers</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Market Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Globe className="h-4 w-4 inline mr-1" />
              Your Market
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {FILTER_OPTIONS.markets.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="rating">Highest Rating</option>
              <option value="minDeposit">Lowest Deposit</option>
            </select>
          </div>

          {/* Feature Filters */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Required Features
            </label>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.features.map((feature) => (
                <button
                  key={feature.value}
                  onClick={() => toggleFeature(feature.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedFeatures.includes(feature.value)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {feature.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-600">
          Showing <strong>{filteredBrokers.length}</strong> of {BROKERS.length} brokers
        </p>
      </div>

      {/* Broker Cards */}
      <div className="space-y-4">
        {filteredBrokers.map((broker, index) => (
          <div
            key={broker.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Main Info */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                {/* Broker Info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-800">{broker.name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                        {broker.bestFor}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-slate-700">{broker.rating}</span>
                        <span className="text-xs text-slate-400">({broker.reviews.toLocaleString()} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-slate-500">{broker.regulation.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-right shrink-0">
                  <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
                    <a href={broker.affiliateLink} target="_blank" rel="noopener noreferrer">
                      Visit Broker
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                  <p className="text-xs text-slate-400 mt-1">
                    Min. deposit: ${broker.minDeposit}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">Min. Deposit</p>
                  <p className="text-sm font-semibold text-slate-800">${broker.minDeposit}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Spreads</p>
                  <p className="text-sm font-semibold text-slate-800">{broker.spreads}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Leverage</p>
                  <p className="text-sm font-semibold text-slate-800">{broker.leverage}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Platforms</p>
                  <p className="text-sm font-semibold text-slate-800">{broker.platforms.slice(0, 2).join(', ')}</p>
                </div>
              </div>

              {/* Expand Toggle */}
              <button
                onClick={() => setExpandedBroker(expandedBroker === broker.id ? null : broker.id)}
                className="w-full mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {expandedBroker === broker.id ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show Details
                  </>
                )}
              </button>
            </div>

            {/* Expanded Details */}
            {expandedBroker === broker.id && (
              <div className="px-6 pb-6 space-y-4">
                {/* Features */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Features</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(broker.features).map(([feature, available]) => (
                      <div key={feature} className="flex items-center gap-2">
                        {available ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-slate-300" />
                        )}
                        <span className={`text-xs ${available ? 'text-slate-700' : 'text-slate-400'}`}>
                          {feature.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-emerald-700 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Pros
                    </h4>
                    <ul className="space-y-1">
                      {broker.pros.map((pro, i) => (
                        <li key={i} className="text-xs text-emerald-800 flex items-start gap-2">
                          <Check className="h-3 w-3 mt-0.5 shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Cons
                    </h4>
                    <ul className="space-y-1">
                      {broker.cons.map((con, i) => (
                        <li key={i} className="text-xs text-red-800 flex items-start gap-2">
                          <X className="h-3 w-3 mt-0.5 shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Risk Disclaimer */}
      <div className="mt-8 bg-amber-50 rounded-xl p-4 border border-amber-200">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <strong>Risk Warning:</strong> CFDs are complex instruments and come with a high risk
            of losing money rapidly due to leverage. Between 74-89% of retail investor accounts
            lose money when trading CFDs. You should consider whether you understand how CFDs work
            and whether you can afford to take the high risk of losing your money.
          </div>
        </div>
      </div>
    </div>
  );
}
