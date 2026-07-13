// app/(marketing)/tools/retirement-calculator/page.tsx
// Wealth Horizon US (FDL 4.2) — GuidedJourney. Deliberately noindex + hidden
// (see lib/tools/registry/registry.ts 'wealth-horizon' entry) until the
// 4-market cluster is complete (PR 4.3 flips indexable; the launch PR after
// the baseline window ends removes `hidden`). The route is fully built and
// reachable via direct link starting now.

import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/tools/registry/metadata';
import { resolveRuleSnapshot } from '@/lib/rules';
import { buildWealthHorizonResult, WEALTH_HORIZON_US_RULE_KEYS } from '@/lib/tools/results/wealth-horizon-result';
import type { RetirementInputs } from '@/lib/calc/retirement/types';
import { ToolShell } from '@/components/tools/shell/tool-shell';
import { WealthHorizonJourney } from '@/components/tools/wealth-horizon/wealth-horizon-journey';
import type { FAQ } from '@/types';

export const revalidate = 86400; // SPEC 8.5 — daily, so rule-window date flips (e.g. Jan 1 caps) apply without a deploy.

export const metadata: Metadata = buildToolMetadata('wealth-horizon', 'us');

// Worked Example persona — plausible US saver, simple contribution mode
// (SPEC 8.3/6.1: rendered fully server-side, visible with JS off).
const EXAMPLE_INPUTS: RetirementInputs = {
  market: 'us',
  currentAge: 38,
  retireAge: 65,
  annualFeePct: 0.4,
  targetMonthlyIncomeToday: 5000,
  withdrawalRatePct: 4.0,
  contributionMode: 'simple',
  simple: {
    taxAdvantagedBalance: 95000,
    taxableBalance: 25000,
    employeeContributionMonthly: 800,
    employerContributionMonthly: 300,
  },
};

const FAQ_ITEMS: FAQ[] = [
  {
    question: 'Is this financial advice?',
    answer:
      "No. Wealth Horizon is an educational planning tool, not personalized financial, tax or retirement advice. It illustrates three scenarios from the numbers you enter — talk to a licensed advisor before making retirement decisions.",
  },
  {
    question: "Why is everything shown in today's money instead of nominal dollars?",
    answer:
      "All figures use real (inflation-adjusted) returns, so a result of \"$3,000/month\" means $3,000 of today's purchasing power — not a bigger nominal number that buys less in the future. This avoids the illusion of growth from inflation alone.",
  },
  {
    question: 'What happens if I enter a contribution above the IRS limit?',
    answer:
      "In simple mode, your total is used exactly as entered and never clamped — you'll see an informational note that account-level limits may apply. In account breakdown mode, a statutory cap is only applied when you've also entered that account's year-to-date contribution, and the clamp is always shown with the amount applied.",
  },
  {
    question: 'How is my Social Security benefit calculated?',
    answer:
      "It isn't — Wealth Horizon never estimates your Social Security or pension entitlement. Get your own estimate from the SSA's official benefits estimator and enter the monthly amount and the age it starts; the calculator counts it only from that age onward.",
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

const SSA_ESTIMATOR_URL = 'https://www.ssa.gov/prepare/get-benefits-estimate';

export default function WealthHorizonPage() {
  const asOf = new Date().toISOString().slice(0, 10); // revalidate=86400 → this can move day to day, per SPEC 8.5
  const rules = resolveRuleSnapshot('us', [...WEALTH_HORIZON_US_RULE_KEYS], asOf);
  const exampleResult = buildWealthHorizonResult(EXAMPLE_INPUTS, rules, 'example');

  return (
    <ToolShell
      toolId="wealth-horizon"
      market="us"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/tools' },
        { label: 'Retirement & Financial Freedom Calculator', href: '/tools/retirement-calculator' },
      ]}
      h1="Retirement & Financial Freedom Calculator"
      benefit="Project your retirement savings across three real-return scenarios and see your financial independence date — free, no sign-up."
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
              Any expected Social Security, State Pension or other retirement benefit comes entirely from your own
              official estimate — see &ldquo;How is my Social Security benefit calculated?&rdquo; below — and counts
              only from the age you say it starts.
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
              A 38-year-old planning to retire at 65 with $95,000 in tax-advantaged savings and $25,000 in a taxable
              account, contributing $800/month plus a $300/month employer match at a 0.4% annual fee, targeting
              $5,000/month in today&rsquo;s money at a 4.0% withdrawal rate — shown above as the &ldquo;Example
              result&rdquo;.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">
              Your official benefits estimate
            </h2>
            <p className="m-0 text-[15px] leading-6 text-[var(--sfp-slate)]">
              Wealth Horizon never estimates entitlement or benefit amounts automatically. Get your own personalized
              estimate from the{' '}
              <a href={SSA_ESTIMATOR_URL} className="text-[var(--sfp-navy)] no-underline hover:underline">
                SSA&rsquo;s &ldquo;Get a benefits estimate&rdquo; tool
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
                <a href="/tools/money-leak-scanner" className="no-underline hover:underline">
                  Money Leak Scanner
                </a>{' '}
                <span className="text-[var(--sfp-slate)]">— find more money to put toward these contributions.</span>
              </li>
              <li>
                <a href="/us/personal-finance" className="no-underline hover:underline">
                  Personal Finance guides
                </a>{' '}
                <span className="text-[var(--sfp-slate)]">— broader saving and investing coverage.</span>
              </li>
            </ul>
          </section>
        </>
      }
    >
      <WealthHorizonJourney market="us" rules={rules} exampleResult={exampleResult} ssaEstimatorUrl={SSA_ESTIMATOR_URL} />
    </ToolShell>
  );
}
