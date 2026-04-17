'use client';

// components/tools/money-leak-scanner/MoneyLeakScanner.tsx
// Single-page live calculator (Groww-style).
// Inputs stream into computeLeakScore() on every change (pure, client-side).
// A debounced POST /api/tools/money-leak/scan persists + returns matched recommendations.
// Email submission is additive: it triggers the PDF via /unlock.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Banknote,
  CreditCard,
  Globe,
  LineChart,
  Repeat,
  ShieldHalf,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { SliderField } from './SliderField';
import { ToggleChip } from './ToggleChip';
import { ResultsPanel, type EmailState } from './ResultsPanel';
import { LeakBar } from './LeakBar';
import { RecommendationCard } from './RecommendationCard';
import { MethodologyCard } from './MethodologyCard';
import { StickyMobileBar } from './StickyMobileBar';
import { computeLeakScore } from '@/lib/money-leak/score-engine';
import type {
  LeakExpenses,
  LeakInputs,
  LeakLifestyle,
  Recommendation,
  ScanResponse,
} from '@/lib/money-leak/types';
import type { Market } from '@/types';

interface MoneyLeakScannerProps {
  market: Market;
}

const MARKET_CURRENCY: Record<
  Market,
  { code: 'USD' | 'GBP' | 'CAD' | 'AUD'; symbol: string }
> = {
  us: { code: 'USD', symbol: '$' },
  uk: { code: 'GBP', symbol: '£' },
  ca: { code: 'CAD', symbol: 'C$' },
  au: { code: 'AUD', symbol: 'A$' },
};

const DEFAULT_INCOME = 5000;
const DEFAULT_EXPENSES: LeakExpenses = {
  banking: 15,
  subscriptions: 80,
  creditCardInterest: 60,
  insurance: 150,
  investing: 40,
  forex: 25,
};
const DEFAULT_LIFESTYLE: LeakLifestyle = {
  hasMultipleBankAccounts: false,
  usesRoboAdvisor: false,
  refinancedRecently: false,
  comparesInsuranceAnnually: false,
  investsRegularly: false,
};

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'sfp_session_id';
  let id = window.sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(key, id);
  }
  return id;
}

function track(event: string, payload: Record<string, unknown> = {}): void {
  fetch('/api/track-cta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, ...payload }),
    keepalive: true,
  }).catch(() => {
    // Silent — analytics must never block UX.
  });
}

export function MoneyLeakScanner({ market }: MoneyLeakScannerProps) {
  const currency = MARKET_CURRENCY[market];

  // ── Inputs ──────────────────────────────────────────────────────────────
  const [income, setIncome] = useState<number>(DEFAULT_INCOME);
  const [expenses, setExpenses] = useState<LeakExpenses>(DEFAULT_EXPENSES);
  const [lifestyle, setLifestyle] = useState<LeakLifestyle>(DEFAULT_LIFESTYLE);

  // ── Persistence / email state ───────────────────────────────────────────
  const [scanId, setScanId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [emailState, setEmailState] = useState<EmailState>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);

  const interactedRef = useRef(false);
  const resultsPanelRef = useRef<HTMLDivElement>(null);

  // ── Live derived result (client-side, pure) ─────────────────────────────
  const result = useMemo(() => {
    const inputs: LeakInputs = {
      monthlyIncome: income,
      currency: currency.code,
      market,
      expenses,
      lifestyle,
    };
    return computeLeakScore(inputs);
  }, [income, currency.code, market, expenses, lifestyle]);

  // ── Body silo class ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add(`silo-${market}`);
      return () => document.body.classList.remove(`silo-${market}`);
    }
  }, [market]);

  // ── One-shot loaded event ───────────────────────────────────────────────
  useEffect(() => {
    track('leak_scanner_loaded', { market });
  }, [market]);

  // ── Debounced persist ───────────────────────────────────────────────────
  useEffect(() => {
    // Only persist after the user has interacted at least once — the default
    // state is identical for all visitors and there is no value in writing it.
    if (!interactedRef.current) return;

    const handle = setTimeout(async () => {
      try {
        const res = await fetch('/api/tools/money-leak/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: getOrCreateSessionId(),
            market,
            currency: currency.code,
            monthlyIncome: income,
            expenses,
            lifestyle,
          }),
        });
        const json = (await res.json()) as
          | ScanResponse
          | { ok: false; error?: string };
        if (!res.ok || !('ok' in json) || !json.ok) return;
        setScanId(json.scanId);
        setRecommendations(json.recommendations ?? []);
        track('leak_scanner_persisted', {
          market,
          scanId: json.scanId,
          severity: json.preview.overallSeverity,
          annualLeak: json.preview.totalAnnualLeak,
        });
      } catch {
        // Silent — the UI stays functional, we just don't have a scanId.
      }
    }, 400);

    return () => clearTimeout(handle);
  }, [income, expenses, lifestyle, market, currency.code]);

  // ── Interaction tracker ─────────────────────────────────────────────────
  const markInteracted = useCallback(() => {
    if (!interactedRef.current) {
      interactedRef.current = true;
      track('leak_scanner_interacted', { market });
    }
  }, [market]);

  const updateIncome = (v: number) => {
    markInteracted();
    setIncome(v);
  };
  const updateExpense = (key: keyof LeakExpenses) => (v: number) => {
    markInteracted();
    setExpenses((prev) => ({ ...prev, [key]: v }));
  };
  const updateLifestyle = (key: keyof LeakLifestyle) => (v: boolean) => {
    markInteracted();
    setLifestyle((prev) => ({ ...prev, [key]: v }));
  };

  // ── Email submit ────────────────────────────────────────────────────────
  const handleSubmitEmail = async (emailValue: string) => {
    if (!scanId) return;
    setEmailState('submitting');
    setEmailError(null);
    try {
      const res = await fetch('/api/tools/money-leak/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId,
          email: emailValue,
          consent: true,
        }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; error?: string };
      if (!res.ok || !('ok' in json) || !json.ok) {
        throw new Error(
          'error' in json && typeof json.error === 'string'
            ? json.error
            : 'Unable to send the report right now.',
        );
      }
      setEmailState('success');
      track('leak_scanner_email_submitted', { market, scanId });
    } catch (err) {
      setEmailState('error');
      setEmailError(err instanceof Error ? err.message : 'Unexpected error');
    }
  };

  // ── Recommendation click ────────────────────────────────────────────────
  const handleRecommendationClick = (rec: Recommendation) => {
    track('leak_scanner_recommendation_clicked', {
      market,
      scanId,
      partnerSlug: rec.slug,
      matchedCategory: rec.matchedCategory,
    });
  };

  // ── Smooth scroll for mobile sticky CTA ─────────────────────────────────
  const scrollToResults = () => {
    resultsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Breakdown max for LeakBar scaling ──────────────────────────────────
  const maxSavings = useMemo(
    () => Math.max(1, ...result.categories.map((c) => c.potentialSavings)),
    [result.categories],
  );

  return (
    <section
      className="w-full py-10 md:py-14 print:py-0"
      style={{ background: 'var(--sfp-gray)' }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 2-column live calculator */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">
          {/* LEFT · Inputs */}
          <div className="space-y-6">
            {/* Income */}
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--sfp-slate)' }}
              >
                Your monthly income
              </h2>
              <SliderField
                label="Monthly take-home income"
                hint="After tax"
                icon={Wallet}
                value={income}
                onChange={updateIncome}
                min={0}
                max={20000}
                step={250}
                prefix={currency.symbol}
                ariaLabel="Monthly take-home income"
              />
            </div>

            {/* Expenses */}
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--sfp-slate)' }}
              >
                Your monthly spend
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <SliderField
                  label="Banking fees"
                  hint="Account + ATM + overdraft"
                  icon={Banknote}
                  value={expenses.banking}
                  onChange={updateExpense('banking')}
                  min={0}
                  max={100}
                  step={1}
                  prefix={currency.symbol}
                />
                <SliderField
                  label="Subscriptions"
                  hint="Streaming, SaaS, memberships"
                  icon={Repeat}
                  value={expenses.subscriptions}
                  onChange={updateExpense('subscriptions')}
                  min={0}
                  max={500}
                  step={5}
                  prefix={currency.symbol}
                />
                <SliderField
                  label="Credit card interest"
                  hint="Monthly interest paid"
                  icon={CreditCard}
                  value={expenses.creditCardInterest}
                  onChange={updateExpense('creditCardInterest')}
                  min={0}
                  max={800}
                  step={10}
                  prefix={currency.symbol}
                />
                <SliderField
                  label="Insurance"
                  hint="Home, auto, life, health"
                  icon={ShieldHalf}
                  value={expenses.insurance}
                  onChange={updateExpense('insurance')}
                  min={0}
                  max={800}
                  step={10}
                  prefix={currency.symbol}
                />
                <SliderField
                  label="Investment fees"
                  hint="Advisor + fund fees"
                  icon={LineChart}
                  value={expenses.investing}
                  onChange={updateExpense('investing')}
                  min={0}
                  max={500}
                  step={5}
                  prefix={currency.symbol}
                />
                <SliderField
                  label="FX & remittance"
                  hint="International transfers"
                  icon={Globe}
                  value={expenses.forex}
                  onChange={updateExpense('forex')}
                  min={0}
                  max={500}
                  step={5}
                  prefix={currency.symbol}
                />
              </div>
            </div>

            {/* Lifestyle */}
            <div>
              <h2
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--sfp-slate)' }}
              >
                Habits <span className="normal-case font-normal opacity-70">(optional)</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-2.5">
                <ToggleChip
                  label="I invest regularly"
                  hint="Monthly contributions to ETFs, 401k, ISA, etc."
                  checked={lifestyle.investsRegularly}
                  onChange={updateLifestyle('investsRegularly')}
                />
                <ToggleChip
                  label="I use a robo-advisor"
                  hint="Low-fee automated investing"
                  checked={lifestyle.usesRoboAdvisor}
                  onChange={updateLifestyle('usesRoboAdvisor')}
                />
                <ToggleChip
                  label="I compare insurance yearly"
                  hint="Shop premiums every renewal"
                  checked={lifestyle.comparesInsuranceAnnually}
                  onChange={updateLifestyle('comparesInsuranceAnnually')}
                />
                <ToggleChip
                  label="Refinanced recently"
                  hint="Mortgage/loan in the last 2 years"
                  checked={lifestyle.refinancedRecently}
                  onChange={updateLifestyle('refinancedRecently')}
                />
                <ToggleChip
                  label="Multiple bank accounts"
                  hint="2+ current/chequing accounts"
                  checked={lifestyle.hasMultipleBankAccounts}
                  onChange={updateLifestyle('hasMultipleBankAccounts')}
                />
              </div>
            </div>
          </div>

          {/* RIGHT · Results (sticky on lg+) */}
          <div>
            <ResultsPanel
              ref={resultsPanelRef}
              result={result}
              currencySymbol={currency.symbol}
              scanId={scanId}
              emailState={emailState}
              emailError={emailError}
              onSubmitEmail={handleSubmitEmail}
            />
          </div>
        </div>

        {/* FULL BREAKDOWN */}
        <div
          className="mt-10 rounded-2xl bg-white border p-5 md:p-7"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <span
              className="inline-flex items-center justify-center rounded-lg"
              style={{
                width: 36,
                height: 36,
                background: 'var(--sfp-sky)',
                color: 'var(--sfp-navy)',
              }}
            >
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                className="text-lg md:text-xl font-bold"
                style={{ color: 'var(--sfp-ink)' }}
              >
                Full 6-category breakdown
              </h2>
              <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                How each spending bucket stacks up against healthy benchmarks.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {result.categories.map((c, i) => (
              <LeakBar
                key={c.id}
                label={c.label}
                currentSpend={c.currentSpend}
                potentialSavings={c.potentialSavings}
                maxSavings={maxSavings}
                currencySymbol={currency.symbol}
                severity={c.severity}
                reason={c.reason}
                delay={i * 60}
              />
            ))}
          </div>
        </div>

        {/* RECOMMENDATIONS */}
        {recommendations.length > 0 && scanId && (
          <div className="mt-10">
            <div className="mb-5">
              <h2
                className="text-lg md:text-xl font-bold"
                style={{ color: 'var(--sfp-ink)' }}
              >
                Best-match products for your leaks
              </h2>
              <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                Independently reviewed by SmartFinPro. Commissions never alter the
                leak score — only the ordering among already-matched partners.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.slug}
                  recommendation={rec}
                  currencySymbol={currency.symbol}
                  scanId={scanId}
                  onClick={handleRecommendationClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* METHODOLOGY */}
        <div className="mt-10">
          <MethodologyCard />
        </div>
      </div>

      {/* Mobile sticky bar — only when there's a leak worth reporting */}
      {result.totalAnnualLeak > 0 && (
        <StickyMobileBar
          annualLeak={result.totalAnnualLeak}
          currencySymbol={currency.symbol}
          onClick={scrollToResults}
        />
      )}
    </section>
  );
}
