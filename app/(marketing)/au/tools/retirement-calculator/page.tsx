// app/au/tools/retirement-calculator/page.tsx
// Wealth Horizon AU (FDL 4.3) — GuidedJourney via the market-parametrized
// WealthHorizonLive island (components/tools/wealth-horizon/wealth-horizon-live.tsx — Wealth Horizon v2 Live-Workspace).
// Launched 2026-07-14 together with US/UK/CA (User-Entscheidung, vor Ende
// des tool_v1 Analytics-Baseline-Fensters) — indexable + linked from every
// hub/footer/llms.txt consumer, see lib/tools/registry/registry.ts
// 'wealth-horizon' entry and lib/analytics/analytics-annotations.ts.

import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/tools/registry/metadata';
import { resolveRuleSnapshot } from '@/lib/rules';
import { buildWealthHorizonResult, WEALTH_HORIZON_AU_RULE_KEYS } from '@/lib/tools/results/wealth-horizon-result';
import { WEALTH_HORIZON_DEFAULT_INPUTS, WEALTH_HORIZON_DEFAULT_RETURN_ASSUMPTIONS } from '@/lib/tools/results/wealth-horizon-defaults';
import { buildRealReturnRuleSnapshot } from '@/lib/tools/results/wealth-horizon-real-return';
import type { RetirementAccountType } from '@/lib/calc/retirement/types';
import { ToolShell } from '@/components/tools/shell/tool-shell';
import { WealthHorizonLive } from '@/components/tools/wealth-horizon/wealth-horizon-live';
import { formatCurrency, formatPercent } from '@/lib/tools/field-format';
import type { FAQ } from '@/types';

const ACCOUNT_TYPE_OPTIONS: { value: RetirementAccountType; label: string }[] = [
  { value: 'au-super', label: 'Superannuation' },
  { value: 'au-taxable', label: 'Taxable (outside super) account' },
];

export const revalidate = 86400; // SPEC 8.5 — daily, so rule-window date flips (e.g. 1 July SG-rate/cap changes) apply without a deploy.

export const metadata: Metadata = buildToolMetadata('wealth-horizon', 'au');

// Worked Example persona (SPEC 8.3/6.1: rendered fully server-side, visible
// with JS off) — Fable-Design-Review Fix 2: this is the SAME shared
// constant the Live-Workspace island seeds its `useState` from
// (`defaultInputs` prop below), so the SSR "Example result" and the live
// start state can never drift apart again.
const EXAMPLE_INPUTS = WEALTH_HORIZON_DEFAULT_INPUTS.au;
const EXAMPLE_RETURN_ASSUMPTIONS = WEALTH_HORIZON_DEFAULT_RETURN_ASSUMPTIONS.au;

const MONEYSMART_PREPARE_TO_RETIRE_URL = 'https://moneysmart.gov.au/retirement-income/prepare-to-retire';

export default function WealthHorizonAUPage() {
  const asOf = new Date().toISOString().slice(0, 10); // revalidate=86400 → this can move day to day, per SPEC 8.5
  const rules = resolveRuleSnapshot('au', [...WEALTH_HORIZON_AU_RULE_KEYS], asOf);
  const { rules: exampleRules } = buildRealReturnRuleSnapshot(
    rules,
    EXAMPLE_RETURN_ASSUMPTIONS.returnNominalPct,
    EXAMPLE_RETURN_ASSUMPTIONS.inflationPct,
  );
  const exampleResult = buildWealthHorizonResult(EXAMPLE_INPUTS, exampleRules, 'example');
  const sgRatePct = formatPercent(rules.values.superGuaranteeRate * 100, 'en-AU', 0); // "12%"
  const concessionalCap = formatCurrency(rules.values.concessionalCap, 'AUD', 'en-AU'); // "$32,500"

  const FAQ_ITEMS: FAQ[] = [
    {
      question: 'Is this financial advice?',
      answer:
        "No. Wealth Horizon is an educational planning tool, not personal financial or tax advice. It illustrates three scenarios from the numbers you enter — talk to a licensed financial adviser before making retirement decisions.",
    },
    {
      question: "Why is everything shown in today's money instead of nominal dollars?",
      answer:
        "All figures use real (inflation-adjusted) returns, so a result of \"$3,000/month\" means $3,000 of today's purchasing power — not a bigger nominal number that buys less in the future. This avoids the illusion of growth from inflation alone.",
    },
    {
      question: 'How does the Super Guarantee contribution helper work?',
      answer:
        `Enter your annual eligible earnings in the Contributions step and the calculator suggests an employer super contribution of your earnings × the current ${sgRatePct} Super Guarantee (SG) rate ÷ 12 — the suggestion pre-fills the employer contribution field, but it stays fully editable, it never locks the field.`,
    },
    {
      question: 'What happens if my super contribution goes above the concessional cap?',
      answer: `In simple mode, your total is used exactly as entered and never clamped — you'll see an informational note that account-level limits may apply. In account breakdown mode, the concessional (before-tax) cap of ${concessionalCap}/yr is applied only when you've also entered that account's year-to-date contribution, and the clamp is always shown with the amount applied. Unused cap you carry forward from previous years is only ever counted when you enter it yourself as available room, never assumed.`,
    },
    {
      question: 'How is my Age Pension calculated?',
      answer:
        "It isn't — Wealth Horizon never estimates your Age Pension entitlement. Get your own guidance from Moneysmart's \"Prepare to retire\" guide and enter the monthly amount and the age it starts; the calculator counts it only from that age onward.",
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

  return (
    <ToolShell
      toolId="wealth-horizon"
      market="au"
      breadcrumb={[
        { label: 'Home', href: '/au' },
        { label: 'Tools', href: '/au/tools' },
        { label: 'Retirement & Financial Freedom Calculator', href: '/au/tools/retirement-calculator' },
      ]}
      h1="Retirement & Financial Freedom Calculator"
      benefit={`Project your super savings across three real-return scenarios at the current ${sgRatePct} Super Guarantee rate and see your FIRE date — free, no sign-up.`}
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
              The current Super Guarantee (SG) rate is <strong>{sgRatePct}</strong> of eligible earnings — the
              Contributions step includes an editable helper that suggests an employer contribution of your annual
              eligible earnings × {sgRatePct} ÷ 12, which you can always overwrite. The concessional (before-tax)
              contributions cap is currently <strong>{concessionalCap}</strong> per year; unused cap carried forward
              from previous years counts only when you enter it yourself as available room, never assumed from the
              national cap.
            </p>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              Any expected Age Pension or other retirement benefit comes entirely from your own official estimate —
              see &ldquo;How is my Age Pension calculated?&rdquo; below — and counts only from the age you say it
              starts.
            </p>
            <p className="m-0 text-sm text-[var(--sfp-slate)]">
              <strong>Not financial advice.</strong> This tool is for education and planning only. It does not know
              your full financial picture, tax situation or risk tolerance — consult a licensed financial adviser
              before acting on retirement decisions.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">
              Worked example
            </h2>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              A 30-year-old planning to retire at 65 with $20,000 in super and $5,000 in a taxable account,
              contributing $400/month in voluntary salary-sacrifice at a 0.5% annual fee, targeting $4,000/month in
              today&rsquo;s money at a 4.0% withdrawal rate — these are the same numbers already filled in above,
              shown as the &ldquo;Example result&rdquo; until you change anything.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">
              Your official retirement planning guidance
            </h2>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              Wealth Horizon never estimates entitlement or benefit amounts automatically. Get your own guidance from{' '}
              <a href={MONEYSMART_PREPARE_TO_RETIRE_URL} className="text-[var(--sfp-navy)] no-underline hover:underline">
                Moneysmart&rsquo;s &ldquo;Prepare to retire&rdquo; guide
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
                <a href="/au/tools/money-leak-scanner" className="no-underline hover:underline">
                  Money Leak Scanner Australia
                </a>{' '}
                <span className="text-[var(--sfp-slate)]">— find more money to put toward these contributions.</span>
              </li>
              <li>
                <a href="/au/tools/superannuation-calculator" className="no-underline hover:underline">
                  Superannuation Calculator
                </a>{' '}
                <span className="text-[var(--sfp-slate)]">— model just your super account mechanics.</span>
              </li>
              <li>
                <a href="/au/personal-finance" className="no-underline hover:underline">
                  Personal Finance guides
                </a>{' '}
                <span className="text-[var(--sfp-slate)]">— broader Australian saving and investing coverage.</span>
              </li>
            </ul>
          </section>
        </>
      }
    >
      <WealthHorizonLive
        market="au"
        variantPath="/au/tools/retirement-calculator"
        rules={rules}
        exampleResult={exampleResult}
        defaultInputs={EXAMPLE_INPUTS}
        currency="AUD"
        locale="en-AU"
        accountTypeOptions={ACCOUNT_TYPE_OPTIONS}
        defaultReturnAssumptions={EXAMPLE_RETURN_ASSUMPTIONS}
        benefitName="Age Pension"
        benefitLinkUrl={MONEYSMART_PREPARE_TO_RETIRE_URL}
        benefitLinkLabel="Moneysmart’s Prepare to retire guide"
      />
    </ToolShell>
  );
}
