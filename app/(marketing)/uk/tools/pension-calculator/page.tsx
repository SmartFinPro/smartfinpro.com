// app/uk/tools/pension-calculator/page.tsx
// Wealth Horizon UK (FDL 4.3) — GuidedJourney via the market-parametrized
// WealthHorizonLive island (components/tools/wealth-horizon/wealth-horizon-live.tsx — Wealth Horizon v2 Live-Workspace).
// Slug is deliberately "pension-calculator" (Head-Term, SPEC 9.1 line 663),
// NOT "retirement-calculator" like the other 3 markets.
// Deliberately noindex + hidden (see lib/tools/registry/registry.ts
// 'wealth-horizon' entry) until a separate launch PR after the analytics
// baseline window ends (~2026-07-20) — bindende Plan-Abweichung, see that
// registry entry's comment and the PR 4.3 report.

import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/tools/registry/metadata';
import { resolveRuleSnapshot } from '@/lib/rules';
import { buildWealthHorizonResult, WEALTH_HORIZON_UK_RULE_KEYS } from '@/lib/tools/results/wealth-horizon-result';
import { WEALTH_HORIZON_DEFAULT_INPUTS } from '@/lib/tools/results/wealth-horizon-defaults';
import type { RetirementAccountType } from '@/lib/calc/retirement/types';
import { ToolShell } from '@/components/tools/shell/tool-shell';
import { WealthHorizonLive } from '@/components/tools/wealth-horizon/wealth-horizon-live';
import type { FAQ } from '@/types';

const ACCOUNT_TYPE_OPTIONS: { value: RetirementAccountType; label: string }[] = [
  { value: 'uk-isa', label: 'Stocks & Shares ISA' },
  { value: 'uk-sipp', label: 'SIPP' },
  { value: 'uk-taxable', label: 'Taxable (general investment) account' },
];

export const revalidate = 86400; // SPEC 8.5 — daily, so rule-window date flips (e.g. 6 April tax-year changes) apply without a deploy.

export const metadata: Metadata = buildToolMetadata('wealth-horizon', 'uk');

// Worked Example persona (SPEC 8.3/6.1: rendered fully server-side, visible
// with JS off) — Fable-Design-Review Fix 2: this is the SAME shared
// constant the Live-Workspace island seeds its `useState` from
// (`defaultInputs` prop below), so the SSR "Example result" and the live
// start state can never drift apart again.
const EXAMPLE_INPUTS = WEALTH_HORIZON_DEFAULT_INPUTS.uk;

const GOV_UK_STATE_PENSION_URL = 'https://www.gov.uk/check-state-pension';

const FAQ_ITEMS: FAQ[] = [
  {
    question: 'Is this financial advice?',
    answer:
      "No. Wealth Horizon is an educational planning tool, not personalised financial or tax advice. It illustrates three scenarios from the numbers you enter — talk to an FCA-regulated financial adviser before making retirement decisions.",
  },
  {
    question: "Why is everything shown in today's money instead of nominal pounds?",
    answer:
      "All figures use real (inflation-adjusted) returns, so a result of \"£3,000/month\" means £3,000 of today's purchasing power — not a bigger nominal number that buys less in the future. This avoids the illusion of growth from inflation alone.",
  },
  {
    question: 'What happens if I enter an ISA contribution above the annual allowance?',
    answer:
      "In simple mode, your total is used exactly as entered and never clamped — you'll see an informational note that account-level limits may apply. In account breakdown mode, the ISA allowance is applied only when you've also entered that account's year-to-date contribution, and the clamp is always shown with the amount applied.",
  },
  {
    question: 'How is my State Pension calculated?',
    answer:
      "It isn't — Wealth Horizon never estimates your State Pension entitlement. Get your own forecast from GOV.UK's \"Check your State Pension forecast\" service and enter the monthly amount and the age it starts; the calculator counts it only from that age onward.",
  },
  {
    question: 'What does "financial independence" mean here?',
    answer:
      'The financial independence (FI) date is the first projected year in which your illustrative withdrawal plus any benefit you\'ve entered would cover your target monthly income, for the scenario shown. If that never happens by your chosen retirement age, we say so instead of showing a date.',
  },
  {
    question: 'Can I change the withdrawal rate?',
    answer:
      'Yes — the withdrawal rate is adjustable from 2.5% to 5.0% (default 4.0%) in the Assumptions step, and every result recalculates immediately using the rate you choose.',
  },
];

export default function WealthHorizonUKPage() {
  const asOf = new Date().toISOString().slice(0, 10); // revalidate=86400 → this can move day to day, per SPEC 8.5
  const rules = resolveRuleSnapshot('uk', [...WEALTH_HORIZON_UK_RULE_KEYS], asOf);
  const exampleResult = buildWealthHorizonResult(EXAMPLE_INPUTS, rules, 'example');

  return (
    <ToolShell
      toolId="wealth-horizon"
      market="uk"
      breadcrumb={[
        { label: 'Home', href: '/uk' },
        { label: 'Tools', href: '/uk/tools' },
        { label: 'Pension & Financial Freedom Calculator', href: '/uk/tools/pension-calculator' },
      ]}
      h1="Pension & Financial Freedom Calculator"
      benefit="Project your ISA and SIPP savings across three real-return scenarios and see your financial independence date — free, no sign-up."
      estimatedMinutes={3}
      verifiedAt={exampleResult.verifiedAt}
      methodologyHref="#methodology"
      privacyHref="/privacy"
      faq={FAQ_ITEMS}
      belowFold={
        <>
          <section id="methodology" className="flex flex-col gap-3">
            <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">Methodology</h2>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              Every figure on this page is in today&rsquo;s purchasing power. Growth uses three <strong>real</strong> (already
              inflation-adjusted) return scenarios — conservative, base and optimistic — so nothing is inflated a second
              time. Your annual fee is subtracted from each scenario exactly once.
            </p>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              The three scenarios are editorial planning ranges, not forecasts or regulatory figures. We derive them by
              triangulating the published nominal return ranges of diversified portfolios from three research
              providers — the{' '}
              <a
                href="https://corporate.vanguard.com/content/corporatesite/us/en/corp/vemo/vemo-return-forecasts.html"
                className="text-[var(--sfp-navy)] no-underline hover:underline"
              >
                Vanguard Capital Markets Model
              </a>
              , the{' '}
              <a
                href="https://www.blackrock.com/institutions/en-global/institutional-insights/thought-leadership/capital-market-assumptions"
                className="text-[var(--sfp-navy)] no-underline hover:underline"
              >
                BlackRock Capital Market Assumptions
              </a>{' '}
              and the{' '}
              <a
                href="https://am.jpmorgan.com/us/en/asset-management/adv/insights/portfolio-insights/ltcma/"
                className="text-[var(--sfp-navy)] no-underline hover:underline"
              >
                J.P. Morgan Long-Term Capital Market Assumptions
              </a>{' '}
              — then subtracting a documented 2.5% inflation assumption and rounding to three deliberately wide
              scenarios (nominal ≈ real + inflation). We do not claim probabilities for any scenario, and we review
              this methodology at least annually against fresh publications from the same three providers.
            </p>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              Your ISA and SIPP balances shelter growth from UK tax the same way the accounts themselves do — the
              engine does not model CGT or dividend tax separately for the ISA/SIPP portion. The current ISA
              allowance is{' '}
              <strong>{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(rules.values.isaAllowance)}</strong>{' '}
              per tax year, across all ISA types combined — used only as an informational context chip in the
              Contributions step, never as an automatic clamp on your simple-mode total.
            </p>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              Any expected State Pension or other retirement benefit comes entirely from your own official estimate —
              see &ldquo;How is my State Pension calculated?&rdquo; below — and counts only from the age you say it
              starts.
            </p>
            <p className="m-0 text-sm text-[var(--sfp-slate)]">
              <strong>Not financial advice.</strong> This tool is for education and planning only. It does not know
              your full financial picture, tax situation or risk tolerance — consult an FCA-regulated financial
              adviser before acting on retirement decisions. Tax treatment depends on your individual circumstances
              and may change in future.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">
              Worked example
            </h2>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              A 30-year-old planning to retire at 65 with £20,000 in ISA and SIPP savings and £5,000 in a taxable
              account, contributing £400/month at a 0.5% annual fee, targeting £4,000/month in today&rsquo;s money at
              a 4.0% withdrawal rate — these are the same numbers already filled in above, shown as the
              &ldquo;Example result&rdquo; until you change anything.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">
              Your official State Pension forecast
            </h2>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              Wealth Horizon never estimates entitlement or benefit amounts automatically. Get your own personalised
              forecast from{' '}
              <a href={GOV_UK_STATE_PENSION_URL} className="text-[var(--sfp-navy)] no-underline hover:underline">
                GOV.UK&rsquo;s &ldquo;Check your State Pension forecast&rdquo; service
              </a>{' '}
              and enter the monthly amount and starting age in the Assumptions step — the projection counts it only
              from that age onward.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">FAQ</h2>
            <div className="flex flex-col gap-3">
              {FAQ_ITEMS.map((f) => (
                <div key={f.question} className="flex flex-col gap-1">
                  <h3 className="m-0 text-[15px] font-semibold text-[var(--sfp-ink)]">{f.question}</h3>
                  <p className="m-0 text-sm leading-6 text-[var(--sfp-slate)]">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">
              Related tools
            </h2>
            <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-sm text-[var(--sfp-navy)]">
              <li>
                <a href="/uk/tools/money-leak-scanner" className="no-underline hover:underline">
                  Money Leak Scanner UK
                </a>{' '}
                <span className="text-[var(--sfp-slate)]">— find more money to put toward these contributions.</span>
              </li>
              <li>
                <a href="/uk/tools/isa-tax-savings-calculator" className="no-underline hover:underline">
                  ISA Tax Savings Calculator
                </a>{' '}
                <span className="text-[var(--sfp-slate)]">— model just your ISA&rsquo;s tax-free growth.</span>
              </li>
              <li>
                <a href="/uk/personal-finance" className="no-underline hover:underline">
                  Personal Finance guides
                </a>{' '}
                <span className="text-[var(--sfp-slate)]">— broader UK saving and investing coverage.</span>
              </li>
            </ul>
          </section>
        </>
      }
    >
      <WealthHorizonLive
        market="uk"
        variantPath="/uk/tools/pension-calculator"
        rules={rules}
        exampleResult={exampleResult}
        defaultInputs={EXAMPLE_INPUTS}
        currency="GBP"
        locale="en-GB"
        accountTypeOptions={ACCOUNT_TYPE_OPTIONS}
        taxAdvantagedLabel="ISA/SIPP"
        benefitName="State Pension"
        benefitLinkUrl={GOV_UK_STATE_PENSION_URL}
        benefitLinkLabel="GOV.UK’s State Pension forecast"
      />
    </ToolShell>
  );
}
