// app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-configurator.tsx
'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useAnalytics } from '@/lib/hooks/use-analytics';
import {
  buildFirewallPlan,
  type FirewallPlan,
  type FounderLocation,
  type MonthlySpend,
  type StackItem,
  type TeamAccess,
} from './firewall-plan';

const LOCATIONS: { value: FounderLocation; label: string }[] = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'other', label: 'Other' },
];
const SPENDS: { value: MonthlySpend; label: string }[] = [
  { value: 'under-5k', label: '<$5k' },
  { value: '5k-25k', label: '$5k–$25k' },
  { value: '25k-plus', label: '$25k+' },
];
const STACK_ITEMS: { value: StackItem; label: string }[] = [
  { value: 'ads', label: 'Ads' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'saas', label: 'SaaS' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'contractors', label: 'Contractors' },
];
const TEAMS: { value: TeamAccess; label: string }[] = [
  { value: 'solo', label: 'Solo' },
  { value: '2-5', label: '2–5' },
  { value: '6-plus', label: '6+' },
];

const NODE_BORDER: Record<string, string> = {
  cyan: 'border-cyan-400/40',
  emerald: 'border-emerald-400/40',
  amber: 'border-amber-400/40',
  sky: 'border-sky-400/40',
  violet: 'border-violet-400/40',
};
const NODE_TEXT: Record<string, string> = {
  cyan: 'text-cyan-300',
  emerald: 'text-emerald-300',
  amber: 'text-amber-300',
  sky: 'text-sky-300',
  violet: 'text-violet-300',
};

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ' +
        (active
          ? 'border-cyan-300/60 bg-cyan-950/30 text-white'
          : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-cyan-300/40 hover:text-white')
      }
    >
      {children}
    </button>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function FirewallConfigurator({
  location,
  onLocationChange,
}: {
  location: FounderLocation;
  onLocationChange: (loc: FounderLocation) => void;
}) {
  const { trackEvent } = useAnalytics({ trackPageViews: false });
  const [monthlySpend, setMonthlySpend] = useState<MonthlySpend>('5k-25k');
  const [stack, setStack] = useState<StackItem[]>([]);
  const [teamAccess, setTeamAccess] = useState<TeamAccess>('solo');
  const [plan, setPlan] = useState<FirewallPlan | null>(null);
  const startedRef = useRef(false);

  function markStarted(field: string) {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent('firewall_config_started', { category: 'firewall_configurator', properties: { firstField: field } });
  }

  function pickLocation(value: FounderLocation) {
    markStarted('location');
    onLocationChange(value);
  }
  function pickSpend(value: MonthlySpend) {
    markStarted('monthlySpend');
    setMonthlySpend(value);
  }
  function toggleStack(value: StackItem) {
    markStarted('stack');
    setStack((s) => (s.includes(value) ? s.filter((x) => x !== value) : [...s, value]));
  }
  function pickTeam(value: TeamAccess) {
    markStarted('teamAccess');
    setTeamAccess(value);
  }

  function generate() {
    const built = buildFirewallPlan({ location, monthlySpend, stack, teamAccess });
    setPlan(built);
    trackEvent('firewall_plan_generated', {
      category: 'firewall_configurator',
      properties: { location, monthlySpend, stack, teamAccess, nodeCount: built.nodes.length, totalBudget: built.totalBudget },
    });
  }

  return (
    <section id="firewall-configurator" className="scroll-mt-32 px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 md:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Build your own firewall</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">Answer four things — get your card map.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
          A personalized, copy-paste setup: virtual card structure, recommended limits per node, and a hardening SOP.
        </p>

        <div className="mt-8 grid gap-6">
          <Question label="Founder location">
            {LOCATIONS.map((o) => (
              <Pill key={o.value} active={location === o.value} onClick={() => pickLocation(o.value)}>
                {o.label}
              </Pill>
            ))}
          </Question>
          <Question label="Monthly spend">
            {SPENDS.map((o) => (
              <Pill key={o.value} active={monthlySpend === o.value} onClick={() => pickSpend(o.value)}>
                {o.label}
              </Pill>
            ))}
          </Question>
          <Question label="Stack (pick all that apply)">
            {STACK_ITEMS.map((o) => (
              <Pill key={o.value} active={stack.includes(o.value)} onClick={() => toggleStack(o.value)}>
                {o.label}
              </Pill>
            ))}
          </Question>
          <Question label="Team access">
            {TEAMS.map((o) => (
              <Pill key={o.value} active={teamAccess === o.value} onClick={() => pickTeam(o.value)}>
                {o.label}
              </Pill>
            ))}
          </Question>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={generate}
            disabled={stack.length === 0}
            className={
              'inline-flex items-center gap-2 rounded-[1rem] border px-6 py-3 text-sm font-bold transition-all duration-300 ' +
              (stack.length === 0
                ? 'cursor-not-allowed border-white/10 bg-white/[0.03] text-zinc-600'
                : 'border-cyan-300/50 bg-black/80 text-white hover:-translate-y-0.5 hover:border-cyan-200/70')
            }
          >
            Build my firewall plan
            <span className="text-cyan-300" aria-hidden>
              →
            </span>
          </button>
          {stack.length === 0 ? <p className="mt-2 text-xs text-zinc-500">Pick at least one stack lane to generate your plan.</p> : null}
        </div>

        {plan ? (
          <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-[#0a0a0c] p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Your firewall plan</p>
            <p className="mt-2 text-2xl font-extrabold text-white">{plan.headline}</p>
            <p className="mt-1 text-sm text-zinc-400">{plan.subline}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plan.nodes.map((n) => (
                <div key={n.key} className={'rounded-2xl border bg-white/[0.02] p-4 ' + NODE_BORDER[n.accent]}>
                  <p className={'text-xs font-bold ' + NODE_TEXT[n.accent]}>{n.label}</p>
                  <p className="mt-1 text-xl font-extrabold text-white">${n.monthlyLimit.toLocaleString('en-US')}/mo</p>
                  <p className="text-[10px] text-zinc-500">recommended cap</p>
                  <p className="mt-2 text-[11px] leading-5 text-zinc-400">{n.vendors}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">Hardening SOP</p>
            <ul className="mt-2 space-y-2">
              {plan.hardening.map((h) => (
                <li key={h} className="flex gap-2 text-[13px] leading-6 text-zinc-300">
                  <span className="mt-0.5 shrink-0 text-cyan-300" aria-hidden>
                    ✓
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-2.5 text-xs font-semibold text-amber-200">
              SmartFinPro recommended operating limits, not Mercury product limits — you set your own caps in Mercury.
            </p>

            <div className="mt-6">
              <Link
                href={plan.cta.href}
                target="_blank"
                rel="noopener sponsored"
                onClick={() =>
                  trackEvent('firewall_cta_after_plan_click', {
                    category: 'firewall_configurator',
                    properties: { location, monthlySpend, nodeCount: plan.nodes.length },
                  })
                }
                className="inline-flex items-center gap-2 rounded-[1rem] border border-cyan-300/50 bg-black/80 px-6 py-3 text-sm font-bold text-white no-underline transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/70"
              >
                {plan.cta.label}
                <span className="text-cyan-300" aria-hidden>
                  →
                </span>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
