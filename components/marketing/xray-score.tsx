'use client';
// components/marketing/xray-score.tsx
// X-Ray Score™ v2 — Apple Card / Wallet Pattern
// Ultra-compact header, segmented controls, 2-layer result, collapsible details.

import { useState, useEffect, useCallback } from 'react';
import {
  ScanLine,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Check,
  Share2,
  Loader2,
  X,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  getQuestionsForCategory,
  type ExperienceOption,
  type PriorityOption,
  type SliderConfig,
} from '@/lib/xray/questions';

// ── Types ─────────────────────────────────────────────────────────────

interface XRayScoreProps {
  slug: string;
  market: string;
  category: string;
  productName: string;
  pricing?: string;
  rating?: number;
  affiliateUrl?: string;
  ctaPartners?: Array<{ slug: string; partner_name: string }>;
}

interface XRayResultData {
  resultId: string;
  fitScore: number;
  costScore: number;
  riskScore: number;
  valueScore: number;
  xrayScore: number;
  annualCost: number;
  topRisks: Array<{ label: string; severity: number }>;
  alternatives: Array<{
    slug: string;
    name: string;
    xrayScore: number;
    decisionLabel: string;
    affiliateUrl: string;
  }>;
  decisionLabel: string;
}

type WidgetState = 'collapsed' | 'step1' | 'step2' | 'step3' | 'loading' | 'result';

// ── Helpers ───────────────────────────────────────────────────────────

const CARD_SHADOW = '0 1px 2px rgba(0,0,0,.06), 0 10px 30px rgba(0,0,0,.06)';

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--sfp-green)';
  if (score >= 65) return 'var(--sfp-navy)';
  if (score >= 50) return 'var(--sfp-gold-dark)';
  return 'var(--sfp-red)';
}

function getLabelColor(label: string): string {
  if (label === 'Strong Fit') return 'var(--sfp-green)';
  if (label === 'Fit with Caveats') return 'var(--sfp-navy)';
  if (label === 'Trade-offs') return 'var(--sfp-gold-dark)';
  return 'var(--sfp-red)';
}

function getLabelBg(label: string): string {
  if (label === 'Strong Fit') return 'rgba(26,107,58,0.10)';
  if (label === 'Fit with Caveats') return 'rgba(27,79,140,0.10)';
  if (label === 'Trade-offs') return 'rgba(213,139,26,0.12)';
  return 'rgba(214,64,69,0.10)';
}

function getChipLabel(label: string): string {
  if (label === 'Strong Fit') return 'Strong Fit';
  if (label === 'Fit with Caveats') return 'Fit';
  if (label === 'Trade-offs') return 'Trade-offs';
  return 'Weak Fit';
}

// ── Main Component ────────────────────────────────────────────────────

export function XRayScore({
  slug,
  market,
  category,
  productName,
  affiliateUrl,
}: XRayScoreProps) {
  const [state, setState] = useState<WidgetState>('collapsed');
  const [result, setResult] = useState<XRayResultData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Form state
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [teamSize, setTeamSize] = useState(1);
  const [monthlyBudget, setMonthlyBudget] = useState(50);
  const [hourlyValue, setHourlyValue] = useState(50);
  const [priority, setPriority] = useState<'low-cost' | 'features' | 'ease-of-use' | 'compliance'>('ease-of-use');

  const config = getQuestionsForCategory(category);

  // ── Event tracking helper ─────────────────────────────────────
  const trackEvent = useCallback(
    (event: string, extra?: Record<string, unknown>) => {
      const sessionId =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('sfp_session') || 'anonymous' // safe — useCallback
          : 'anonymous';
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event',
          sessionId,
          data: { event, slug, market, category, ...extra },
        }),
      }).catch(() => {});
    },
    [slug, market, category],
  );

  // Initialize slider defaults from category config
  useEffect(() => {
    const budgetSlider = config.sliders.find((s) => s.key === 'monthlyBudget');
    const hourlySlider = config.sliders.find((s) => s.key === 'hourlyValue');
    if (budgetSlider) setMonthlyBudget(budgetSlider.defaultValue);
    if (hourlySlider) setHourlyValue(hourlySlider.defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Check for shared result on mount (hydration-safe via useEffect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('xray');
    if (sharedId) {
      fetchSharedResult(sharedId);
    }
  }, []);

  const fetchSharedResult = async (resultId: string) => {
    setState('loading');
    try {
      const res = await fetch(`/api/xray/result/${resultId}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setState('result');
      } else {
        setState('collapsed');
      }
    } catch {
      setState('collapsed');
    }
  };

  const submitScore = useCallback(async () => {
    setState('loading');
    trackEvent('xray_submitted', { experience, teamSize, monthlyBudget, priority, hourlyValue });

    try {
      const sessionId =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('sfp_session') || undefined // safe — useCallback
          : undefined;

      const res = await fetch('/api/xray/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          market,
          category,
          experience,
          teamSize,
          monthlyBudget,
          priority,
          hourlyValue,
          sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error('Score computation failed');
      }

      const data: XRayResultData = await res.json();
      setResult(data);
      setState('result');

      trackEvent('xray_completed', {
        xrayScore: data.xrayScore,
        decisionLabel: data.decisionLabel,
        resultId: data.resultId,
        fitScore: data.fitScore,
        costScore: data.costScore,
        riskScore: data.riskScore,
        valueScore: data.valueScore,
        annualCost: data.annualCost,
      });
    } catch {
      setState('step3'); // Allow retry
    }
  }, [slug, market, category, experience, teamSize, monthlyBudget, priority, hourlyValue, trackEvent]);

  const handleShare = useCallback(() => {
    if (!result) return;
    const url = new URL(window.location.href);
    url.searchParams.set('xray', result.resultId);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    trackEvent('xray_shared', { resultId: result.resultId, xrayScore: result.xrayScore });
  }, [result, trackEvent]);

  const getSliderValue = (key: string): number => {
    if (key === 'teamSize') return teamSize;
    if (key === 'monthlyBudget') return monthlyBudget;
    return hourlyValue;
  };

  const setSliderValue = (key: string, value: number) => {
    if (key === 'teamSize') setTeamSize(value);
    else if (key === 'monthlyBudget') setMonthlyBudget(value);
    else setHourlyValue(value);
  };

  const currentStep = state === 'step1' ? 1 : state === 'step2' ? 2 : state === 'step3' ? 3 : 0;
  const bestAlt = result?.alternatives?.[0];
  const topRisk = result?.topRisks?.[0];

  // ── Collapsed State — Ultra-compact header row ──────────────────────

  if (state === 'collapsed') {
    return (
      <div
        className="rounded-2xl bg-white border border-black/5 px-4 py-3 flex items-center gap-3"
        style={{ boxShadow: CARD_SHADOW }}
      >
        {/* Icon + Label */}
        <div className="flex items-center gap-2 min-w-0">
          <ScanLine className="h-4 w-4 shrink-0" style={{ color: 'var(--sfp-navy)' }} />
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--sfp-ink)' }}>
            X-Ray Score™
          </span>
        </div>

        {/* Status Chip */}
        {result ? (
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums whitespace-nowrap"
            style={{ background: getLabelBg(result.decisionLabel), color: getLabelColor(result.decisionLabel) }}
          >
            {result.xrayScore} · {getChipLabel(result.decisionLabel)}
          </span>
        ) : (
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
            style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-slate)' }}
          >
            Not scored
          </span>
        )}

        {/* Primary Action */}
        <button
          onClick={() => {
            if (!result) trackEvent('xray_started');
            setState(result ? 'result' : 'step1');
          }}
          className="shrink-0 ml-auto rounded-full px-4 py-1.5 text-xs font-semibold transition-all hover:brightness-110 active:scale-[0.97]"
          style={
            result
              ? { background: 'transparent', color: 'var(--sfp-navy)', border: '1px solid rgba(27,79,140,0.2)' }
              : { background: 'var(--sfp-navy)', color: '#ffffff' }
          }
        >
          {result ? 'View score' : 'Score in 20s'}
        </button>
      </div>
    );
  }

  // ── Loading State — Minimal ─────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div
        className="rounded-2xl bg-white border border-black/5 overflow-hidden"
        style={{ boxShadow: CARD_SHADOW }}
      >
        {/* Animated progress bar */}
        <div className="h-[2px] w-full overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
          <div
            className="h-full animate-pulse"
            style={{ background: 'var(--sfp-navy)', width: '100%' }}
          />
        </div>
        <div className="px-4 py-4 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: 'var(--sfp-navy)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
              Analyzing your profile…
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
              Calculating fit, cost, risk &amp; value
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Result State — 2-Layer Layout ───────────────────────────────────

  if (state === 'result' && result) {
    return (
      <div
        className="rounded-2xl bg-white border border-black/5 overflow-hidden"
        style={{ boxShadow: CARD_SHADOW }}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine className="h-3.5 w-3.5" style={{ color: 'var(--sfp-navy)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--sfp-navy)' }}>
              X-Ray Score™
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums"
              style={{ background: getLabelBg(result.decisionLabel), color: getLabelColor(result.decisionLabel) }}
            >
              {result.xrayScore} · {getChipLabel(result.decisionLabel)}
            </span>
            <button
              onClick={() => setState('collapsed')}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" style={{ color: 'var(--sfp-slate)' }} />
            </button>
          </div>
        </div>

        {/* LAYER 1 — Score Hero */}
        <div className="py-5 text-center">
          <p
            className="text-5xl font-extrabold tabular-nums leading-none"
            style={{ color: getScoreColor(result.xrayScore) }}
          >
            {result.xrayScore}
          </p>
          <p className="text-sm font-medium mt-2" style={{ color: getLabelColor(result.decisionLabel) }}>
            {result.decisionLabel}
          </p>
        </div>

        {/* LAYER 2 — 3 compact info lines */}
        <div className="border-t border-gray-100 mx-4 pt-3 pb-3 space-y-2.5">
          {/* Annual Cost */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" style={{ color: 'var(--sfp-slate)' }} />
              <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Est. annual cost</span>
            </div>
            <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
              ${result.annualCost.toLocaleString('en-US')}/yr
            </span>
          </div>

          {/* Top Risk */}
          {topRisk && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'var(--sfp-slate)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Top risk</span>
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: topRisk.severity > 0.5 ? 'var(--sfp-red)' : 'var(--sfp-ink)' }}
              >
                {topRisk.label}
              </span>
            </div>
          )}

          {/* Best Alternative */}
          {bestAlt && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5" style={{ color: 'var(--sfp-slate)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Best alternative</span>
              </div>
              <a
                href={bestAlt.affiliateUrl}
                onClick={() => trackEvent('xray_alt_click', { altSlug: bestAlt.slug, altName: bestAlt.name, altScore: bestAlt.xrayScore })}
                className="text-sm font-semibold hover:underline"
                style={{ color: 'var(--sfp-navy)' }}
              >
                {bestAlt.name}
              </a>
            </div>
          )}
        </div>

        {/* Primary CTA */}
        {affiliateUrl && affiliateUrl !== '#' && (
          <div className="px-4 pt-2">
            <a
              href={affiliateUrl}
              onClick={() => trackEvent('xray_cta_click', { resultId: result.resultId, xrayScore: result.xrayScore, decisionLabel: result.decisionLabel })}
              className="btn-shimmer w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
            >
              Try {productName} free
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Secondary actions */}
        <div className="flex items-center justify-between px-4 pt-3 pb-4">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors rounded-lg px-2 py-1 -ml-2 hover:bg-gray-50"
            style={{ color: 'var(--sfp-navy)' }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs font-medium transition-colors rounded-lg px-2 py-1 -mr-2 hover:bg-gray-50"
            style={{ color: 'var(--sfp-slate)' }}
          >
            More details
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform duration-300"
              style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
        </div>

        {/* Collapsible breakdown */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{ maxHeight: showDetails ? '140px' : '0px', opacity: showDetails ? 1 : 0 }}
        >
          <div className="mx-4 mb-4 px-3 py-3 rounded-xl grid grid-cols-4 gap-2 text-center" style={{ background: 'var(--sfp-gray)' }}>
            {[
              { label: 'Fit', score: result.fitScore },
              { label: 'Cost', score: result.costScore },
              { label: 'Risk', score: result.riskScore },
              { label: 'Value', score: result.valueScore },
            ].map((item) => (
              <div key={item.label}>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: getScoreColor(item.score) }}
                >
                  {item.score}
                </span>
                <span
                  className="block text-[10px] font-medium mt-0.5"
                  style={{ color: 'var(--sfp-slate)' }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Questionnaire Steps — Single Inlay Panel ────────────────────────

  return (
    <div
      className="rounded-2xl bg-white border border-black/5 overflow-hidden"
      style={{ boxShadow: CARD_SHADOW }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanLine className="h-3.5 w-3.5" style={{ color: 'var(--sfp-navy)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--sfp-navy)' }}>
            X-Ray Score™
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
            style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-slate)' }}
          >
            {currentStep}/3
          </span>
          <button
            onClick={() => setState('collapsed')}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" style={{ color: 'var(--sfp-slate)' }} />
          </button>
        </div>
      </div>

      {/* Ultra-thin progress track */}
      <div className="mx-4 h-[2px] rounded-full overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ background: 'var(--sfp-navy)', width: `${(currentStep / 3) * 100}%` }}
        />
      </div>

      {/* Step Content — animated transition */}
      <div key={`step-${currentStep}`} className="px-4 pt-4 pb-5" style={{ animation: 'slideIn 0.2s ease-out' }}>

        {/* Step 1: Experience Level — Segmented Control */}
        {state === 'step1' && (
          <>
            <p className="text-base font-semibold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              What&apos;s your experience level?
            </p>
            {/* iOS-style segmented control */}
            <div className="flex rounded-xl p-0.5" style={{ background: 'var(--sfp-gray)' }}>
              {config.experienceOptions.map((opt: ExperienceOption) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setExperience(opt.value);
                    trackEvent('xray_step_1', { experience: opt.value });
                    setTimeout(() => setState('step2'), 300);
                  }}
                  className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    experience === opt.value
                      ? 'bg-white font-semibold'
                      : ''
                  }`}
                  style={{
                    color: experience === opt.value ? 'var(--sfp-ink)' : 'var(--sfp-slate)',
                    boxShadow: experience === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Sliders */}
        {state === 'step2' && (
          <>
            <p className="text-base font-semibold mb-5" style={{ color: 'var(--sfp-ink)' }}>
              Tell us about your situation
            </p>
            <div className="space-y-5">
              {config.sliders.map((slider: SliderConfig) => (
                <div key={slider.key}>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-medium" style={{ color: 'var(--sfp-slate)' }}>
                      {slider.label}
                    </label>
                    <span
                      className="text-xs font-semibold tabular-nums rounded-full px-2.5 py-0.5"
                      style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-navy)' }}
                    >
                      {slider.formatLabel
                        ? slider.formatLabel(getSliderValue(slider.key))
                        : getSliderValue(slider.key)}
                      {slider.unit}
                    </span>
                  </div>
                  <Slider
                    value={[getSliderValue(slider.key)]}
                    onValueChange={([v]) => setSliderValue(slider.key, v)}
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px]" style={{ color: 'var(--sfp-slate)' }}>
                      {slider.formatLabel ? slider.formatLabel(slider.min) : slider.min}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--sfp-slate)' }}>
                      {slider.formatLabel ? slider.formatLabel(slider.max) : slider.max}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setState('step1')}
                className="flex items-center gap-1 rounded-full px-4 py-2 text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ color: 'var(--sfp-slate)' }}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                onClick={() => { trackEvent('xray_step_2', { teamSize, monthlyBudget, hourlyValue }); setState('step3'); }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: 'var(--sfp-navy)' }}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}

        {/* Step 3: Priority — 2×2 Grid */}
        {state === 'step3' && (
          <>
            <p className="text-base font-semibold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              What matters most to you?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {config.priorityOptions.map((opt: PriorityOption) => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={`rounded-xl border px-3 py-2.5 text-center transition-all duration-200 ${
                    priority === opt.value
                      ? 'bg-white'
                      : 'hover:bg-gray-50'
                  }`}
                  style={{
                    borderColor: priority === opt.value ? 'var(--sfp-navy)' : 'rgba(0,0,0,0.06)',
                    boxShadow: priority === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <span
                    className="text-sm font-medium block"
                    style={{ color: priority === opt.value ? 'var(--sfp-navy)' : 'var(--sfp-ink)' }}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[10px] leading-tight block mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setState('step2')}
                className="flex items-center gap-1 rounded-full px-4 py-2 text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ color: 'var(--sfp-slate)' }}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                onClick={submitScore}
                className="btn-shimmer flex-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: 'var(--sfp-gold)' }}
              >
                <ScanLine className="h-3.5 w-3.5" />
                Get My X-Ray Score
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
