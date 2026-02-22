// components/tools/credit-score-simulator.tsx
'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  BarChart3,
  ArrowRight,
  Clock,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface CreditScoreProjection {
  months_3: number;
  months_6: number;
  months_12: number;
  change_3: number;
  change_6: number;
  change_12: number;
}

interface ScoreRange {
  label: string;
  min: number;
  max: number;
  color: string;
  textColor: string;
  bgColor: string;
  description: string;
}

const SCORE_RANGES: ScoreRange[] = [
  {
    label: 'Poor',
    min: 300,
    max: 579,
    color: 'var(--sfp-red)',
    textColor: '#ffffff',
    bgColor: 'rgba(214, 64, 69, 0.1)',
    description: 'Difficult to get approved. High interest rates.',
  },
  {
    label: 'Fair',
    min: 580,
    max: 669,
    color: '#FFA500',
    textColor: '#ffffff',
    bgColor: 'rgba(255, 165, 0, 0.1)',
    description: 'Some approval options. Higher interest rates.',
  },
  {
    label: 'Good',
    min: 670,
    max: 739,
    color: '#FFCC00',
    textColor: 'var(--sfp-ink)',
    bgColor: 'rgba(255, 204, 0, 0.1)',
    description: 'Good approval chances. Competitive rates.',
  },
  {
    label: 'Very Good',
    min: 740,
    max: 799,
    color: 'var(--sfp-green)',
    textColor: '#ffffff',
    bgColor: 'rgba(26, 107, 58, 0.1)',
    description: 'Excellent approval chances. Best rates available.',
  },
  {
    label: 'Excellent',
    min: 800,
    max: 850,
    color: 'var(--sfp-green)',
    textColor: '#ffffff',
    bgColor: 'rgba(26, 107, 58, 0.15)',
    description: 'Premium approval rates. Lowest interest rates.',
  },
];

const ACTIONS = [
  {
    id: 'pay-off-cc',
    label: 'Pay off credit card debt',
    impact_3: 20,
    impact_6: 40,
    impact_12: 60,
    description: 'Reduces credit utilization ratio',
  },
  {
    id: 'open-new-cc',
    label: 'Open new credit card',
    impact_3: -5,
    impact_6: -2,
    impact_12: 15,
    description: 'Hard inquiry + new account initially hurt, then improve',
  },
  {
    id: 'close-old-cc',
    label: 'Close old credit card',
    impact_3: -10,
    impact_6: -8,
    impact_12: -5,
    description: 'Shortens credit history and increases utilization',
  },
  {
    id: 'apply-personal-loan',
    label: 'Apply for personal loan',
    impact_3: -15,
    impact_6: -5,
    impact_12: 20,
    description: 'Hard inquiry hurts; improves credit mix and history',
  },
  {
    id: 'late-payment',
    label: 'Make late payment (negative)',
    impact_3: -50,
    impact_6: -40,
    impact_12: -25,
    description: 'Severely damages payment history for 7 years',
  },
  {
    id: 'settle-collections',
    label: 'Settle collections account',
    impact_3: 10,
    impact_6: 30,
    impact_12: 50,
    description: 'Negative impact diminishes over time',
  },
  {
    id: 'authorized-user',
    label: 'Become authorized user',
    impact_3: 15,
    impact_6: 25,
    impact_12: 35,
    description: 'Benefits from primary account holder\'s good history',
  },
  {
    id: 'dispute-error',
    label: 'Dispute credit report error',
    impact_3: 25,
    impact_6: 40,
    impact_12: 50,
    description: 'Removes negative items that reduce score',
  },
];

function getScoreRange(score: number): ScoreRange {
  return SCORE_RANGES.find((range) => score >= range.min && score <= range.max) || SCORE_RANGES[2];
}

function calculateProjection(currentScore: number, action: string): CreditScoreProjection {
  const selectedAction = ACTIONS.find((a) => a.id === action);

  if (!selectedAction) {
    return {
      months_3: currentScore,
      months_6: currentScore,
      months_12: currentScore,
      change_3: 0,
      change_6: 0,
      change_12: 0,
    };
  }

  // Clamp scores to 300-850 range
  const months_3 = Math.max(300, Math.min(850, currentScore + selectedAction.impact_3));
  const months_6 = Math.max(300, Math.min(850, currentScore + selectedAction.impact_6));
  const months_12 = Math.max(300, Math.min(850, currentScore + selectedAction.impact_12));

  return {
    months_3,
    months_6,
    months_12,
    change_3: months_3 - currentScore,
    change_6: months_6 - currentScore,
    change_12: months_12 - currentScore,
  };
}

function formatChange(change: number): string {
  if (change > 0) return `+${change}`;
  return change.toString();
}

export function CreditScoreSimulator() {
  const [currentScore, setCurrentScore] = useState(650);
  const [selectedAction, setSelectedAction] = useState('pay-off-cc');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const projection = useMemo(
    () => calculateProjection(currentScore, selectedAction),
    [currentScore, selectedAction]
  );

  const currentRange = getScoreRange(currentScore);
  const projectedRange12 = getScoreRange(projection.months_12);
  const selectedActionObj = ACTIONS.find((a) => a.id === selectedAction);

  // Chart data for visualization (simplified to 12 months)
  const chartData = [
    { month: 'Now', score: currentScore },
    { month: '3m', score: projection.months_3 },
    { month: '6m', score: projection.months_6 },
    { month: '12m', score: projection.months_12 },
  ];

  const maxChartScore = Math.max(...chartData.map((d) => d.score), 850);
  const minChartScore = Math.min(...chartData.map((d) => d.score), 300);
  const scoreRange = maxChartScore - minChartScore || 1;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Current Score Input */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-navy)' }}>
              <CreditCard className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
              Your Credit Profile
            </h3>

            {/* Current Score Display */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <BarChart3 className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Current Credit Score
                </label>
                <div
                  className="text-3xl font-bold px-4 py-2 rounded-lg"
                  style={{
                    background: currentRange.bgColor,
                    color: currentRange.color,
                  }}
                >
                  {currentScore}
                </div>
              </div>

              <Slider
                value={[currentScore]}
                onValueChange={(value) => setCurrentScore(value[0])}
                min={300}
                max={850}
                step={1}
                className="py-2"
              />

              <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--sfp-slate)' }}>
                <span>300 (Poor)</span>
                <span>575 (Fair)</span>
                <span>700 (Good)</span>
                <span>850 (Excellent)</span>
              </div>

              {/* Score Range Info */}
              <div className="mt-4 p-3 rounded-lg" style={{ background: currentRange.bgColor }}>
                <div className="flex items-start gap-2">
                  <div
                    className="text-sm font-bold px-3 py-1 rounded mt-0.5"
                    style={{
                      background: currentRange.color,
                      color: currentRange.textColor,
                    }}
                  >
                    {currentRange.label}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--sfp-ink)' }}>
                    {currentRange.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Selector */}
            <div>
              <label className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                Simulated Action
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm"
                style={{
                  color: 'var(--sfp-ink)',
                  background: '#ffffff',
                }}
              >
                {ACTIONS.map((action) => (
                  <option key={action.id} value={action.id}>
                    {action.label}
                  </option>
                ))}
              </select>
              {selectedActionObj && (
                <p className="text-xs mt-2" style={{ color: 'var(--sfp-slate)' }}>
                  {selectedActionObj.description}
                </p>
              )}
            </div>
          </div>

          {/* Credit Score Breakdown */}
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
          >
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--sfp-navy)' }}>
              Credit Score Factors
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Payment History', percent: 35, icon: '✓' },
                { label: 'Credit Utilization', percent: 30, icon: '💳' },
                { label: 'Credit History Length', percent: 15, icon: '📅' },
                { label: 'New Credit Inquiries', percent: 10, icon: '+' },
                { label: 'Credit Mix', percent: 10, icon: '🔄' },
              ].map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--sfp-ink)' }}>{factor.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${factor.percent}%`,
                          background: 'var(--sfp-navy)',
                        }}
                      />
                    </div>
                    <span
                      className="font-semibold text-xs w-8 text-right"
                      style={{ color: 'var(--sfp-navy)' }}
                    >
                      {factor.percent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
          >
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Score Improvement Tips
            </h4>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--sfp-ink)' }}>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span>Pay bills on time every month (35% of score)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span>Keep credit card balances below 30% of limits</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span>Dispute errors on your credit report immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span>Keep old accounts open to maintain history</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* 12-Month Projection Highlight */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl p-6 text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Projected Score in 12 Months</span>
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <div className="text-5xl font-bold">{projection.months_12}</div>
              <div
                className="text-2xl font-bold px-3 py-1 rounded"
                style={{
                  background: projection.change_12 >= 0 ? 'rgba(26, 107, 58, 0.3)' : 'rgba(214, 64, 69, 0.3)',
                  color: '#ffffff',
                }}
              >
                {projection.change_12 >= 0 ? '↑' : '↓'} {formatChange(projection.change_12)}
              </div>
            </div>
            <p className="text-sm opacity-90">
              {projectedRange12.label} range ({projectedRange12.min}–{projectedRange12.max})
            </p>
          </motion.div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '3 Months', score: projection.months_3, change: projection.change_3 },
              { label: '6 Months', score: projection.months_6, change: projection.change_6 },
              { label: '12 Months', score: projection.months_12, change: projection.change_12 },
            ].map((timeline) => (
              <div
                key={timeline.label}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center"
              >
                <div className="text-xs mb-2" style={{ color: 'var(--sfp-slate)' }}>
                  {timeline.label}
                </div>
                <div
                  className="text-2xl font-bold mb-1"
                  style={{
                    color: getScoreRange(timeline.score).color,
                  }}
                >
                  {timeline.score}
                </div>
                <div
                  className="text-xs font-semibold"
                  style={{
                    color: timeline.change >= 0 ? 'var(--sfp-green)' : 'var(--sfp-red)',
                  }}
                >
                  {timeline.change >= 0 ? '↑' : '↓'} {formatChange(timeline.change)}
                </div>
              </div>
            ))}
          </div>

          {/* Chart Visualization */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="text-sm font-medium mb-4" style={{ color: 'var(--sfp-ink)' }}>
              Score Progression
            </h4>

            {/* Simple bar chart */}
            <div className="space-y-4">
              {chartData.map((point, idx) => {
                const normalizedScore = (point.score - minChartScore) / scoreRange;
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--sfp-slate)' }}>
                        {point.month}
                      </span>
                      <span className="text-sm font-bold" style={{ color: 'var(--sfp-navy)' }}>
                        {point.score}
                      </span>
                    </div>
                    <div className="w-full h-8 rounded-lg bg-gray-100 overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${normalizedScore * 100}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className="h-full rounded-lg transition-all"
                        style={{
                          background: `linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-3">
                        <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100">
                          {point.score}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs" style={{ color: 'var(--sfp-slate)' }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--sfp-navy)' }} />
                <span>Lower Range (Poor/Fair)</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--sfp-gold)' }} />
                <span>Higher Range (Excellent)</span>
              </div>
            </div>
          </div>

          {/* Impact Analysis */}
          {selectedActionObj && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h4 className="font-semibold mb-3" style={{ color: 'var(--sfp-navy)' }}>
                Action Impact: {selectedActionObj.label}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--sfp-slate)' }}>Short term (3 months)</span>
                  <span
                    className="font-semibold"
                    style={{
                      color: selectedActionObj.impact_3 >= 0 ? 'var(--sfp-green)' : 'var(--sfp-red)',
                    }}
                  >
                    {selectedActionObj.impact_3 >= 0 ? '+' : ''}{selectedActionObj.impact_3} points
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--sfp-slate)' }}>Medium term (6 months)</span>
                  <span
                    className="font-semibold"
                    style={{
                      color: selectedActionObj.impact_6 >= 0 ? 'var(--sfp-green)' : 'var(--sfp-red)',
                    }}
                  >
                    {selectedActionObj.impact_6 >= 0 ? '+' : ''}{selectedActionObj.impact_6} points
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--sfp-slate)' }}>Long term (12 months)</span>
                  <span
                    className="font-semibold"
                    style={{
                      color: selectedActionObj.impact_12 >= 0 ? 'var(--sfp-green)' : 'var(--sfp-red)',
                    }}
                  >
                    {selectedActionObj.impact_12 >= 0 ? '+' : ''}{selectedActionObj.impact_12} points
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* CTA */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Repair Your Credit Fast
            </h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Professional credit repair services can dispute errors and boost your score. See how much you could improve.
            </p>
            <Button
              asChild
              variant="gold"
              className="w-full"
            >
              <a href="/go/the-credit-people" target="_blank" rel="noopener noreferrer">
                Get Free Credit Repair Consultation
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Free review. No credit impact. Trusted by thousands.
            </p>
          </div>

          {/* Breakdown Toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full text-sm font-medium flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--sfp-navy)' }}
          >
            <Percent className="h-4 w-4" />
            {showBreakdown ? 'Hide' : 'Show'} Factor Details
          </button>
        </div>
      </div>

      {/* Factor Breakdown Table */}
      {showBreakdown && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sfp-navy)' }}>
            How Your Score Breaks Down
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--sfp-slate)' }}>
                    Factor
                  </th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--sfp-slate)' }}>
                    Weight
                  </th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--sfp-slate)' }}>
                    Description
                  </th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--sfp-slate)' }}>
                    Your Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium" style={{ color: 'var(--sfp-navy)' }}>
                    Payment History
                  </td>
                  <td className="py-3 px-4 text-right" style={{ color: 'var(--sfp-ink)' }}>
                    35%
                  </td>
                  <td className="py-3 px-4" style={{ color: 'var(--sfp-slate)' }}>
                    On-time payment record and delinquencies
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        background: 'rgba(26, 107, 58, 0.1)',
                        color: 'var(--sfp-green)',
                      }}
                    >
                      Key
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium" style={{ color: 'var(--sfp-navy)' }}>
                    Credit Utilization
                  </td>
                  <td className="py-3 px-4 text-right" style={{ color: 'var(--sfp-ink)' }}>
                    30%
                  </td>
                  <td className="py-3 px-4" style={{ color: 'var(--sfp-slate)' }}>
                    Amount of available credit you're using
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        background: 'rgba(26, 107, 58, 0.1)',
                        color: 'var(--sfp-green)',
                      }}
                    >
                      Key
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium" style={{ color: 'var(--sfp-navy)' }}>
                    Credit History Length
                  </td>
                  <td className="py-3 px-4 text-right" style={{ color: 'var(--sfp-ink)' }}>
                    15%
                  </td>
                  <td className="py-3 px-4" style={{ color: 'var(--sfp-slate)' }}>
                    Age of accounts and average account age
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        background: 'rgba(27, 79, 140, 0.1)',
                        color: 'var(--sfp-navy)',
                      }}
                    >
                      Medium
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium" style={{ color: 'var(--sfp-navy)' }}>
                    New Credit Inquiries
                  </td>
                  <td className="py-3 px-4 text-right" style={{ color: 'var(--sfp-ink)' }}>
                    10%
                  </td>
                  <td className="py-3 px-4" style={{ color: 'var(--sfp-slate)' }}>
                    Hard inquiries from recent credit applications
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        background: 'rgba(27, 79, 140, 0.1)',
                        color: 'var(--sfp-navy)',
                      }}
                    >
                      Low
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium" style={{ color: 'var(--sfp-navy)' }}>
                    Credit Mix
                  </td>
                  <td className="py-3 px-4 text-right" style={{ color: 'var(--sfp-ink)' }}>
                    10%
                  </td>
                  <td className="py-3 px-4" style={{ color: 'var(--sfp-slate)' }}>
                    Variety of credit types (cards, loans, etc.)
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        background: 'rgba(27, 79, 140, 0.1)',
                        color: 'var(--sfp-navy)',
                      }}
                    >
                      Moderate
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
