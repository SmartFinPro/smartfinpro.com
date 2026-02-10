'use client';

import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Clock, DollarSign, Users, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ROIResults {
  monthlyTimeSaved: number;
  yearlyTimeSaved: number;
  monthlyCostSaved: number;
  yearlyCostSaved: number;
  roi: number;
  paybackMonths: number;
  productivityGain: number;
}

const AI_TOOLS = [
  { name: 'Jasper AI', monthlyPrice: 49, timeSavingFactor: 0.4, link: '/go/jasper-ai' },
  { name: 'Copy.ai', monthlyPrice: 36, timeSavingFactor: 0.35, link: '/go/copy-ai' },
  { name: 'Writesonic', monthlyPrice: 19, timeSavingFactor: 0.3, link: '/go/writesonic' },
  { name: 'ChatGPT Plus', monthlyPrice: 20, timeSavingFactor: 0.25, link: '/go/chatgpt' },
];

export function AIROICalculator() {
  const [teamSize, setTeamSize] = useState(5);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [selectedTool, setSelectedTool] = useState(AI_TOOLS[0]);

  const results: ROIResults = useMemo(() => {
    const monthlyHours = hoursPerWeek * 4.33;
    const timeSavedPerPerson = monthlyHours * selectedTool.timeSavingFactor;
    const monthlyTimeSaved = timeSavedPerPerson * teamSize;
    const yearlyTimeSaved = monthlyTimeSaved * 12;

    const monthlyCostSaved = monthlyTimeSaved * hourlyRate;
    const yearlyCostSaved = monthlyCostSaved * 12;

    const monthlyToolCost = selectedTool.monthlyPrice * teamSize;
    const yearlyToolCost = monthlyToolCost * 12;

    const netYearlySavings = yearlyCostSaved - yearlyToolCost;
    const roi = yearlyToolCost > 0 ? ((netYearlySavings / yearlyToolCost) * 100) : 0;
    const paybackMonths = monthlyCostSaved > monthlyToolCost
      ? monthlyToolCost / (monthlyCostSaved - monthlyToolCost)
      : 999;

    const productivityGain = selectedTool.timeSavingFactor * 100;

    return {
      monthlyTimeSaved: Math.round(monthlyTimeSaved),
      yearlyTimeSaved: Math.round(yearlyTimeSaved),
      monthlyCostSaved: Math.round(monthlyCostSaved),
      yearlyCostSaved: Math.round(yearlyCostSaved),
      roi: Math.round(roi),
      paybackMonths: Math.min(Math.round(paybackMonths * 10) / 10, 12),
      productivityGain: Math.round(productivityGain),
    };
  }, [teamSize, hoursPerWeek, hourlyRate, selectedTool]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-700/40 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-violet-400" />
              Configure Your Scenario
            </h3>

            {/* AI Tool Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Select AI Tool
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AI_TOOLS.map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => setSelectedTool(tool)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedTool.name === tool.name
                        ? 'border-violet-400 bg-violet-400/10'
                        : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                    style={selectedTool.name !== tool.name ? { background: 'rgba(255,255,255,0.02)' } : undefined}
                  >
                    <span className={`text-sm font-medium ${selectedTool.name === tool.name ? 'text-white' : 'text-slate-300'}`}>{tool.name}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      ${tool.monthlyPrice}/mo per user
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Team Size */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-300">Team Size</label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                  {teamSize} {teamSize === 1 ? 'person' : 'people'}
                </span>
              </div>
              <Slider
                value={[teamSize]}
                onValueChange={(value) => setTeamSize(value[0])}
                min={1}
                max={50}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>1</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>

            {/* Hours on Content */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-300">
                  Hours on Content/Writing per Week
                </label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                  {hoursPerWeek}h/week
                </span>
              </div>
              <Slider
                value={[hoursPerWeek]}
                onValueChange={(value) => setHoursPerWeek(value[0])}
                min={1}
                max={40}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>1h</span>
                <span>20h</span>
                <span>40h</span>
              </div>
            </div>

            {/* Hourly Rate */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-300">
                  Average Hourly Rate (incl. overhead)
                </label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                  ${hourlyRate}/hour
                </span>
              </div>
              <Slider
                value={[hourlyRate]}
                onValueChange={(value) => setHourlyRate(value[0])}
                min={20}
                max={200}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>$20</span>
                <span>$100</span>
                <span>$200</span>
              </div>
            </div>
          </div>

          {/* Monthly Cost */}
          <div className="rounded-xl p-4 border border-slate-700/40" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Monthly Tool Investment</span>
              <span className="text-lg font-bold text-white">
                ${(selectedTool.monthlyPrice * teamSize).toLocaleString('en-US')}/mo
              </span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* ROI Highlight */}
          <div className="bg-gradient-to-br from-violet-500 to-teal-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium text-violet-100">Estimated ROI</span>
            </div>
            <div className="text-5xl font-bold mb-2">
              {results.roi > 0 ? `${results.roi}%` : 'N/A'}
            </div>
            <p className="text-sm text-violet-100">
              Payback in {results.paybackMonths < 12 ? `${results.paybackMonths} months` : '12+ months'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-700/40 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span className="text-xs text-slate-500">Time Saved/Month</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {results.monthlyTimeSaved}h
              </div>
              <div className="text-xs text-slate-500">
                {results.yearlyTimeSaved}h/year
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/40 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-violet-400" />
                <span className="text-xs text-slate-500">Cost Saved/Month</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${results.monthlyCostSaved.toLocaleString('en-US')}
              </div>
              <div className="text-xs text-slate-500">
                ${results.yearlyCostSaved.toLocaleString('en-US')}/year
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/40 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-slate-500">Team Impact</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {teamSize}x
              </div>
              <div className="text-xs text-slate-500">
                multiplied savings
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/40 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-slate-500">Productivity Gain</span>
              </div>
              <div className="text-2xl font-bold text-white">
                +{results.productivityGain}%
              </div>
              <div className="text-xs text-slate-500">
                efficiency boost
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-slate-700/40 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h4 className="font-semibold text-white mb-2">
              Ready to boost your team&apos;s productivity?
            </h4>
            <p className="text-sm text-slate-400 mb-4">
              Start with {selectedTool.name} and see the ROI for yourself. Most teams see positive returns within the first month.
            </p>
            <Button asChild className="w-full bg-violet-500 hover:bg-emerald-600">
              <a href={selectedTool.link} target="_blank" rel="noopener noreferrer">
                Try {selectedTool.name} Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-slate-500 text-center mt-3">
              Free trial available. No credit card required.
            </p>
          </div>

          {/* Methodology Note */}
          <p className="text-xs text-slate-600 text-center">
            * ROI calculations based on average time savings reported by users.
            Actual results may vary based on use case and implementation.
          </p>
        </div>
      </div>
    </div>
  );
}
