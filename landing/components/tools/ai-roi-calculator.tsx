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
  // Coaching-specific fields
  clientCapacity?: number;
  additionalRevenue?: number;
  totalBenefit?: number;
  coachingROI?: number;
}

type Sector = 'content' | 'coaching';

const AI_TOOLS = [
  { name: 'Jasper AI', monthlyPrice: 49, timeSavingFactor: 0.4, link: '/go/jasper-ai' },
  { name: 'Copy.ai', monthlyPrice: 36, timeSavingFactor: 0.35, link: '/go/copy-ai' },
  { name: 'Writesonic', monthlyPrice: 19, timeSavingFactor: 0.3, link: '/go/writesonic' },
  { name: 'ChatGPT Plus', monthlyPrice: 20, timeSavingFactor: 0.25, link: '/go/chatgpt' },
];

const AI_COACHING_TOOLS = [
  { name: 'ChatGPT Plus', monthlyPrice: 20, timeSavingFactor: 0.35, clientGrowthFactor: 0.15, link: '/go/chatgpt' },
  { name: 'Jasper AI', monthlyPrice: 49, timeSavingFactor: 0.40, clientGrowthFactor: 0.20, link: '/go/jasper-ai' },
  { name: 'Claude Pro', monthlyPrice: 20, timeSavingFactor: 0.45, clientGrowthFactor: 0.18, link: '/go/claude-pro' },
  { name: 'Copy.ai', monthlyPrice: 36, timeSavingFactor: 0.30, clientGrowthFactor: 0.12, link: '/go/copy-ai' },
];

export function AIROICalculator() {
  const [sector, setSector] = useState<Sector>('content');
  const [teamSize, setTeamSize] = useState(5);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [selectedTool, setSelectedTool] = useState(AI_TOOLS[0]);

  // Coaching-specific state
  const [selectedCoachingTool, setSelectedCoachingTool] = useState(AI_COACHING_TOOLS[0]);
  const [numClients, setNumClients] = useState(20);
  const [revenuePerClient, setRevenuePerClient] = useState(200);
  const [hoursPerClient, setHoursPerClient] = useState(4);

  const activeTool = sector === 'coaching' ? selectedCoachingTool : selectedTool;

  const results: ROIResults = useMemo(() => {
    if (sector === 'coaching') {
      // Coaching sector calculations
      const totalMonthlyHours = numClients * hoursPerClient;
      const timeSavedHours = totalMonthlyHours * selectedCoachingTool.timeSavingFactor;
      const yearlyTimeSaved = timeSavedHours * 12;

      const monthlyCostSaved = timeSavedHours * hourlyRate;
      const yearlyCostSaved = monthlyCostSaved * 12;

      const monthlyToolCost = selectedCoachingTool.monthlyPrice;
      const yearlyToolCost = monthlyToolCost * 12;

      // Coaching-specific: additional clients from freed time
      const clientCapacity = hoursPerClient > 0
        ? Math.floor(timeSavedHours / hoursPerClient)
        : 0;
      const additionalRevenue = clientCapacity * revenuePerClient;
      const totalBenefit = monthlyCostSaved + additionalRevenue;

      const netMonthlyBenefit = totalBenefit - monthlyToolCost;
      const coachingROI = monthlyToolCost > 0
        ? (netMonthlyBenefit / monthlyToolCost) * 100
        : 0;

      const netYearlySavings = yearlyCostSaved - yearlyToolCost;
      const roi = yearlyToolCost > 0 ? ((netYearlySavings / yearlyToolCost) * 100) : 0;
      const paybackMonths = totalBenefit > monthlyToolCost
        ? monthlyToolCost / (totalBenefit - monthlyToolCost)
        : 999;

      const productivityGain = selectedCoachingTool.timeSavingFactor * 100;

      return {
        monthlyTimeSaved: Math.round(timeSavedHours),
        yearlyTimeSaved: Math.round(yearlyTimeSaved),
        monthlyCostSaved: Math.round(monthlyCostSaved),
        yearlyCostSaved: Math.round(yearlyCostSaved),
        roi: Math.round(roi),
        paybackMonths: Math.min(Math.round(paybackMonths * 10) / 10, 12),
        productivityGain: Math.round(productivityGain),
        clientCapacity,
        additionalRevenue: Math.round(additionalRevenue),
        totalBenefit: Math.round(totalBenefit),
        coachingROI: Math.round(coachingROI),
      };
    }

    // Content & Marketing sector calculations (existing logic)
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
  }, [sector, teamSize, hoursPerWeek, hourlyRate, selectedTool, selectedCoachingTool, numClients, revenuePerClient, hoursPerClient]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-8">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
              <Calculator className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              Configure Your Scenario
            </h3>

            {/* Sector Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>
                Select Sector
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSector('content')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    sector === 'content'
                      ? 'border-gray-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={sector === 'content' ? { borderColor: 'var(--sfp-navy)', background: 'rgba(27,79,140,0.1)' } : { background: 'white' }}
                >
                  <span className="text-sm font-medium" style={{ color: sector === 'content' ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}>
                    Content &amp; Marketing
                  </span>
                </button>
                <button
                  onClick={() => setSector('coaching')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    sector === 'coaching'
                      ? 'border-gray-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={sector === 'coaching' ? { borderColor: 'var(--sfp-navy)', background: 'rgba(27,79,140,0.1)' } : { background: 'white' }}
                >
                  <span className="text-sm font-medium" style={{ color: sector === 'coaching' ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}>
                    Financial Coaching
                  </span>
                </button>
              </div>
            </div>

            {/* AI Tool Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>
                Select AI Tool
              </label>
              <div className="grid grid-cols-2 gap-2">
                {sector === 'content' ? (
                  AI_TOOLS.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => setSelectedTool(tool)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedTool.name === tool.name
                          ? 'border-gray-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={selectedTool.name === tool.name ? { borderColor: 'var(--sfp-navy)', background: 'rgba(27,79,140,0.1)' } : { background: 'white' }}
                    >
                      <span className="text-sm font-medium" style={{ color: selectedTool.name === tool.name ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}>{tool.name}</span>
                      <span className="block text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                        ${tool.monthlyPrice}/mo per user
                      </span>
                    </button>
                  ))
                ) : (
                  AI_COACHING_TOOLS.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => setSelectedCoachingTool(tool)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedCoachingTool.name === tool.name
                          ? 'border-gray-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={selectedCoachingTool.name === tool.name ? { borderColor: 'var(--sfp-navy)', background: 'rgba(27,79,140,0.1)' } : { background: 'white' }}
                    >
                      <span className="text-sm font-medium" style={{ color: selectedCoachingTool.name === tool.name ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}>{tool.name}</span>
                      <span className="block text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                        ${tool.monthlyPrice}/mo
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {sector === 'content' ? (
              <>
                {/* Team Size */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>Team Size</label>
                    <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}>
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
                    <label className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>
                      Hours on Content/Writing per Week
                    </label>
                    <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}>
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
                    <label className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>
                      Average Hourly Rate (incl. overhead)
                    </label>
                    <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}>
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
              </>
            ) : (
              <>
                {/* Number of Clients */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>Number of Clients</label>
                    <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}>
                      {numClients} {numClients === 1 ? 'client' : 'clients'}
                    </span>
                  </div>
                  <Slider
                    value={[numClients]}
                    onValueChange={(value) => setNumClients(value[0])}
                    min={1}
                    max={200}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>1</span>
                    <span>100</span>
                    <span>200</span>
                  </div>
                </div>

                {/* Average Monthly Revenue per Client */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>
                      Avg. Monthly Revenue per Client
                    </label>
                    <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}>
                      ${revenuePerClient}/mo
                    </span>
                  </div>
                  <Slider
                    value={[revenuePerClient]}
                    onValueChange={(value) => setRevenuePerClient(value[0])}
                    min={50}
                    max={2000}
                    step={25}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>$50</span>
                    <span>$1,000</span>
                    <span>$2,000</span>
                  </div>
                </div>

                {/* Hours per Client per Month */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>
                      Hours per Client per Month
                    </label>
                    <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}>
                      {hoursPerClient}h/client
                    </span>
                  </div>
                  <Slider
                    value={[hoursPerClient]}
                    onValueChange={(value) => setHoursPerClient(value[0])}
                    min={1}
                    max={20}
                    step={0.5}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>1h</span>
                    <span>10h</span>
                    <span>20h</span>
                  </div>
                </div>

                {/* Hourly Rate (shared concept, but shown in coaching context) */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>
                      Your Hourly Rate
                    </label>
                    <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}>
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
              </>
            )}
          </div>

          {/* Monthly Cost */}
          <div className="rounded-xl p-4 border border-gray-200 bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Monthly Tool Investment</span>
              <span className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>
                ${sector === 'content'
                  ? (selectedTool.monthlyPrice * teamSize).toLocaleString('en-US')
                  : selectedCoachingTool.monthlyPrice.toLocaleString('en-US')
                }/mo
              </span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* ROI Highlight */}
          <div className="rounded-2xl p-6 text-white" style={{ background: 'var(--sfp-navy)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium text-white/80">
                {sector === 'coaching' ? 'Coaching ROI (incl. new clients)' : 'Estimated ROI'}
              </span>
            </div>
            <div className="text-5xl font-bold mb-2">
              {sector === 'coaching'
                ? (results.coachingROI != null && results.coachingROI > 0 ? `${results.coachingROI}%` : 'N/A')
                : (results.roi > 0 ? `${results.roi}%` : 'N/A')
              }
            </div>
            <p className="text-sm text-white/80">
              Payback in {results.paybackMonths < 12 ? `${results.paybackMonths} months` : '12+ months'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Time Saved/Month</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {results.monthlyTimeSaved}h
              </div>
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                {results.yearlyTimeSaved}h/year
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Cost Saved/Month</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                ${results.monthlyCostSaved.toLocaleString('en-US')}
              </div>
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                ${results.yearlyCostSaved.toLocaleString('en-US')}/year
              </div>
            </div>

            {sector === 'content' ? (
              <>
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                    <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Team Impact</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                    {teamSize}x
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                    multiplied savings
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                    <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Productivity Gain</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                    +{results.productivityGain}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                    efficiency boost
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                    <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Additional Clients You Can Serve</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                    +{results.clientCapacity ?? 0}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                    from freed-up time
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                    <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Productivity Gain</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                    +{results.productivityGain}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                    efficiency boost
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Coaching-Specific Result Cards */}
          {sector === 'coaching' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--sfp-green)', background: 'rgba(26,107,58,0.1)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                  <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Additional Monthly Revenue</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--sfp-green)' }}>
                  ${(results.additionalRevenue ?? 0).toLocaleString('en-US')}
                </div>
                <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                  from {results.clientCapacity ?? 0} new client{(results.clientCapacity ?? 0) !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--sfp-green)', background: 'rgba(26,107,58,0.1)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                  <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Total Monthly Benefit</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--sfp-green)' }}>
                  ${(results.totalBenefit ?? 0).toLocaleString('en-US')}
                </div>
                <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                  time savings + new revenue
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>
              {sector === 'coaching'
                ? 'Ready to scale your coaching practice?'
                : 'Ready to boost your team\u0027s productivity?'
              }
            </h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              {sector === 'coaching'
                ? `Start with ${activeTool.name} to free up time and serve more clients. Most coaches see results within the first month.`
                : `Start with ${activeTool.name} and see the ROI for yourself. Most teams see positive returns within the first month.`
              }
            </p>
            <Button asChild className="w-full text-white hover:opacity-90" style={{ background: 'var(--sfp-gold)' }}>
              <a href={activeTool.link} target="_blank" rel="noopener noreferrer">
                Try {activeTool.name} Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Free trial available. No credit card required.
            </p>
          </div>

          {/* Methodology Note */}
          <p className="text-xs text-center" style={{ color: 'var(--sfp-slate)' }}>
            * ROI calculations based on average time savings reported by users.
            Actual results may vary based on use case and implementation.
          </p>
        </div>
      </div>
    </div>
  );
}
