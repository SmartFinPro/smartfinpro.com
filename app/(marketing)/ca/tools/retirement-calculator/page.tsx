// app/ca/tools/retirement-calculator/page.tsx
// Wealth Horizon CA (FDL 4.3) — GuidedJourney via the market-parametrized
// WealthHorizonLive island (components/tools/wealth-horizon/wealth-horizon-live.tsx — Wealth Horizon v2 Live-Workspace).
// Deliberately noindex + hidden (see lib/tools/registry/registry.ts
// 'wealth-horizon' entry) until a separate launch PR after the analytics
// baseline window ends (~2026-07-20) — bindende Plan-Abweichung, see that
// registry entry's comment and the PR 4.3 report.

import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/tools/registry/metadata';
import { resolveRuleSnapshot } from '@/lib/rules';
import { buildWealthHorizonResult, WEALTH_HORIZON_CA_RULE_KEYS } from '@/lib/tools/results/wealth-horizon-result';
import { WEALTH_HORIZON_DEFAULT_INPUTS, WEALTH_HORIZON_DEFAULT_RETURN_ASSUMPTIONS } from '@/lib/tools/results/wealth-horizon-defaults';
import { buildRealReturnRuleSnapshot } from '@/lib/tools/results/wealth-horizon-real-return';
import type { RetirementAccountType } from '@/lib/calc/retirement/types';
import { ToolShell } from '@/components/tools/shell/tool-shell';
import { WealthHorizonLive } from '@/components/tools/wealth-horizon/wealth-horizon-live';
import type { FAQ } from '@/types';

const ACCOUNT_TYPE_OPTIONS: { value: RetirementAccountType; label: string }[] = [
  { value: 'ca-tfsa', label: 'TFSA' },
  { value: 'ca-rrsp', label: 'RRSP' },
  { value: 'ca-taxable', label: 'Taxable (non-registered) account' },
];

export const revalidate = 86400; // SPEC 8.5 — daily, so rule-window date flips (e.g. Jan 1 limit changes) apply without a deploy.

export const metadata: Metadata = buildToolMetadata('wealth-horizon', 'ca');

// Worked Example persona (SPEC 8.3/6.1: rendered fully server-side, visible
// with JS off) — Fable-Design-Review Fix 2: this is the SAME shared
// constant the Live-Workspace island seeds its `useState` from
// (`defaultInputs` prop below), so the SSR "Example result" and the live
// start state can never drift apart again.
const EXAMPLE_INPUTS = WEALTH_HORIZON_DEFAULT_INPUTS.ca;
const EXAMPLE_RETURN_ASSUMPTIONS = WEALTH_HORIZON_DEFAULT_RETURN_ASSUMPTIONS.ca;

const CRA_RETIREMENT_INCOME_CALCULATOR_URL =
  'https://www.canada.ca/en/services/benefits/publicpensions/cpp/retirement-income-calculator.html';

const FAQ_ITEMS: FAQ[] = [
  {
    question: 'Is this financial advice?',
    answer:
      "No. Wealth Horizon is an educational planning tool, not personalized financial or tax advice. It illustrates three scenarios from the numbers you enter — talk to a licensed financial advisor before making retirement decisions.",
  },
  {
    question: "Why is everything shown in today's money instead of nominal dollars?",
    answer:
      "All figures use real (inflation-adjusted) returns, so a result of \"$3,000/month\" means $3,000 of today's purchasing power — not a bigger nominal number that buys less in the future. This avoids the illusion of growth from inflation alone.",
  },
  {
    question: 'How does the calculator know my TFSA and RRSP room?',
    answer:
      "It doesn't guess it — TFSA and RRSP room is always your personal room from CRA My Account, never a number we derive from the national annual or lifetime maximum. If you enter your available room for an account in Account breakdown mode, we clamp your contribution to it and show the clamp; if you leave it blank, we show an informational note only.",
  },
  {
    question: 'How is my CPP/OAS benefit calculated?',
    answer:
      "It isn't — Wealth Horizon never estimates your CPP or OAS entitlement. Get your own estimate from the Canadian Retirement Income Calculator and enter the monthly amount and the age it starts; the calculator counts it only from that age onward.",
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
  {
    question: 'Why do you subtract inflation?',
    answer:
      "You enter a nominal return and expected inflation; we subtract inflation to project in today's purchasing power (real return ≈ nominal − inflation). A 9% nominal return during 4% inflation buys the same as a 5% real return during 0% inflation — showing the real number avoids the illusion of growth from inflation alone.",
  },
];

export default function WealthHorizonCAPage() {
  const asOf = new Date().toISOString().slice(0, 10); // revalidate=86400 → this can move day to day, per SPEC 8.5
  const rules = resolveRuleSnapshot('ca', [...WEALTH_HORIZON_CA_RULE_KEYS], asOf);
  const { rules: exampleRules } = buildRealReturnRuleSnapshot(
    rules,
    EXAMPLE_RETURN_ASSUMPTIONS.returnNominalPct,
    EXAMPLE_RETURN_ASSUMPTIONS.inflationPct,
  );
  const exampleResult = buildWealthHorizonResult(EXAMPLE_INPUTS, exampleRules, 'example');

  return (
    <ToolShell
      toolId="wealth-horizon"
      market="ca"
      breadcrumb={[
        { label: 'Home', href: '/ca' },
        { label: 'Tools', href: '/ca/tools' },
        { label: 'Retirement & Financial Freedom Calculator', href: '/ca/tools/retirement-calculator' },
      ]}
      h1="Retirement & Financial Freedom Calculator"
      benefit="Project your TFSA and RRSP savings across three real-return scenarios and see your financial independence date — free, no sign-up."
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
              You enter a nominal return and expected inflation; we subtract inflation to project in today&rsquo;s
              purchasing power (real return ≈ nominal − inflation). Conservative and optimistic scenarios are a
              ±1.5 percentage point editorial range around your own real-return figure, not a second set of inputs.
            </p>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              TFSA and RRSP room is always <strong>your personal room from CRA My Account</strong> — this calculator
              never derives a contribution limit from the national annual or lifetime maximum. In Account breakdown
              mode you can enter your own available room for a TFSA or RRSP account, and a contribution is only
              clamped when you&rsquo;ve supplied that number yourself.
            </p>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              Any expected CPP, OAS or other retirement benefit comes entirely from your own official estimate — see
              &ldquo;How is my CPP/OAS benefit calculated?&rdquo; below — and counts only from the age you say it
              starts.
            </p>
            <p className="m-0 text-sm text-[var(--sfp-slate)]">
              <strong>Not financial advice.</strong> This tool is for education and planning only. It does not know
              your full financial picture, tax situation or risk tolerance — consult a licensed financial advisor
              before acting on retirement decisions.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">
              Worked example
            </h2>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              A 30-year-old planning to retire at 65 with $20,000 in TFSA and RRSP savings and $5,000 in a taxable
              account, contributing $400/month at a 0.5% annual fee, targeting $4,000/month in today&rsquo;s money at
              a 4.0% withdrawal rate — these are the same numbers already filled in above, shown as the
              &ldquo;Example result&rdquo; until you change anything.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">
              Your official retirement income estimate
            </h2>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              Wealth Horizon never estimates entitlement or benefit amounts automatically. Get your own personalized
              estimate from the{' '}
              <a href={CRA_RETIREMENT_INCOME_CALCULATOR_URL} className="text-[var(--sfp-navy)] no-underline hover:underline">
                Canadian Retirement Income Calculator
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
                <a href="/ca/tools/money-leak-scanner" className="no-underline hover:underline">
                  Money Leak Scanner Canada
                </a>{' '}
                <span className="text-[var(--sfp-slate)]">— find more money to put toward these contributions.</span>
              </li>
              <li>
                <a href="/ca/tools/tfsa-rrsp-calculator" className="no-underline hover:underline">
                  TFSA vs RRSP Calculator
                </a>{' '}
                <span className="text-[var(--sfp-slate)]">— model just your TFSA/RRSP account choice.</span>
              </li>
              <li>
                <a href="/ca/personal-finance" className="no-underline hover:underline">
                  Personal Finance guides
                </a>{' '}
                <span className="text-[var(--sfp-slate)]">— broader Canadian saving and investing coverage.</span>
              </li>
            </ul>
          </section>
        </>
      }
    >
      <WealthHorizonLive
        market="ca"
        variantPath="/ca/tools/retirement-calculator"
        rules={rules}
        exampleResult={exampleResult}
        defaultInputs={EXAMPLE_INPUTS}
        currency="CAD"
        locale="en-CA"
        accountTypeOptions={ACCOUNT_TYPE_OPTIONS}
        defaultReturnAssumptions={EXAMPLE_RETURN_ASSUMPTIONS}
        benefitName="CPP/OAS"
        benefitLinkUrl={CRA_RETIREMENT_INCOME_CALCULATOR_URL}
        benefitLinkLabel="Canadian Retirement Income Calculator"
      />
    </ToolShell>
  );
}
