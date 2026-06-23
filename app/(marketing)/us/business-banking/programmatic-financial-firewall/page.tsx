'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Banknote,
  Check,
  ChevronRight,
  Code2,
  DatabaseZap,
  Fingerprint,
  GitBranch,
  KeyRound,
  LockKeyhole,
  Network,
  ServerCog,
  Shield,
  ShieldAlert,
  Terminal,
  WalletCards,
  Webhook,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MERCURY_AFFILIATE_URL = '/go/mercury';

type FirewallNode = {
  id: string;
  name: string;
  label: string;
  vendors: string;
  limit: string;
  policy: string;
  trigger: string;
  risk: string;
  icon: LucideIcon;
  accent: string;
  border: string;
  gradient: string;
};

const firewallNodes: FirewallNode[] = [
  {
    id: 'ad-spend',
    name: 'Node A',
    label: 'Ad Spend',
    vendors: 'Google Ads, Meta, TikTok, LinkedIn',
    limit: '$18,000 monthly cap',
    policy: 'Card locked to media platforms; daily anomaly alerts above 20% variance.',
    trigger: 'Freeze only this node if a pixel partner, agency login, or ad account is compromised.',
    risk: 'Protects the operating account from runaway campaign spend.',
    icon: Zap,
    accent: 'text-cyan-300',
    border: 'border-cyan-400/40',
    gradient: 'from-cyan-400/20 via-cyan-300/5 to-transparent',
  },
  {
    id: 'core-infra',
    name: 'Node B',
    label: 'Core Infrastructure',
    vendors: 'Vercel, Supabase, OpenAI, Resend',
    limit: '$4,500 monthly cap',
    policy: 'Dedicated virtual card with approval workflow for tier upgrades.',
    trigger: 'Rotate without touching payroll, reserves, taxes, or ad spend.',
    risk: 'Keeps uptime-critical subscriptions isolated from marketing noise.',
    icon: ServerCog,
    accent: 'text-emerald-300',
    border: 'border-emerald-400/40',
    gradient: 'from-emerald-400/20 via-emerald-300/5 to-transparent',
  },
  {
    id: 'team-saas',
    name: 'Node C',
    label: 'Team SaaS',
    vendors: 'Google Workspace, Slack, Notion, Loom',
    limit: '$2,000 monthly cap',
    policy: 'Receipt required, owner assigned, renewal date tagged.',
    trigger: 'Deactivate the node when a contractor, workspace, or seat audit changes.',
    risk: 'Stops subscription sprawl from becoming a silent cash leak.',
    icon: WalletCards,
    accent: 'text-amber-300',
    border: 'border-amber-400/40',
    gradient: 'from-amber-400/20 via-amber-300/5 to-transparent',
  },
];

const threatCards = [
  {
    title: 'AI phishing is now operationally credible',
    body: 'Attackers can clone vendor emails, replay executive voice patterns, and run real-time OTP proxy pages that look like normal finance workflows.',
    icon: ShieldAlert,
  },
  {
    title: 'SMS 2FA is a telecom dependency',
    body: 'A SIM swap turns account recovery into a phone-carrier support problem. For company cash flow, that is an unacceptable control plane.',
    icon: Fingerprint,
  },
  {
    title: 'Subscription sprawl creates hidden rails',
    body: 'Every stored card at a SaaS vendor is a live route into the LLC. One compromised vendor should never expose the primary operating account.',
    icon: Network,
  },
];

const protocolStats = [
  { label: 'Primary blast radius', value: 'One vendor lane', detail: 'Never the full operating balance' },
  { label: 'Receipt SLA', value: '< 24 hours', detail: 'Webhook-first reconciliation' },
  { label: 'Authentication floor', value: 'No SMS', detail: 'Phishing-resistant team policy' },
  { label: 'Founder action', value: '$0/mo', detail: 'No account minimums for core banking' },
];

const architectureSteps = [
  {
    label: 'Mercury webhook',
    detail: 'Transaction event arrives from the account layer.',
    icon: Webhook,
  },
  {
    label: 'Signature gate',
    detail: 'Fail closed before parsing or queueing work.',
    icon: LockKeyhole,
  },
  {
    label: 'Invoice matcher',
    detail: 'Match amount, merchant, card node, timestamp, and Stripe invoice metadata.',
    icon: GitBranch,
  },
  {
    label: 'Ledger write',
    detail: 'Attach receipt status, confidence score, and review owner.',
    icon: DatabaseZap,
  },
];

const codeTabs = [
  {
    id: 'route',
    label: 'Next.js Route',
    code: String.raw`// app/api/finance/mercury-webhook/route.ts
import { timingSafeEqual, createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type MercuryTransactionEvent = {
  id: string;
  type: "transaction.created" | "transaction.updated";
  data: {
    transactionId: string;
    amount: number;
    currency: "USD";
    cardId?: string;
    counterpartyName?: string;
    postedAt: string;
    attachmentCount?: number;
  };
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-mercury-signature");

  if (!verifyWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as MercuryTransactionEvent;

  if (!event.type.startsWith("transaction.")) {
    return NextResponse.json({ received: true });
  }

  await reconcileMercuryTransaction({
    idempotencyKey: event.id,
    transactionId: event.data.transactionId,
    cardId: event.data.cardId,
    merchant: event.data.counterpartyName ?? "Unknown merchant",
    amount: event.data.amount,
    currency: event.data.currency,
    postedAt: event.data.postedAt,
    hasReceipt: Number(event.data.attachmentCount ?? 0) > 0,
  });

  return NextResponse.json({ received: true });
}

function verifyWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.MERCURY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);

  return left.length === right.length && timingSafeEqual(left, right);
}`,
  },
  {
    id: 'matcher',
    label: 'Receipt Matcher',
    code: String.raw`type ReconcileInput = {
  idempotencyKey: string;
  transactionId: string;
  cardId?: string;
  merchant: string;
  amount: number;
  currency: "USD";
  postedAt: string;
  hasReceipt: boolean;
};

async function reconcileMercuryTransaction(input: ReconcileInput) {
  const existing = await db.reconciliations.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) return existing;

  const invoice = await db.invoices.findFirst({
    where: {
      amount: input.amount,
      currency: input.currency,
      issuedAt: {
        gte: new Date(Date.parse(input.postedAt) - 48 * 60 * 60 * 1000),
        lte: new Date(Date.parse(input.postedAt) + 48 * 60 * 60 * 1000),
      },
      OR: [
        { merchantName: { contains: input.merchant, mode: "insensitive" } },
        { mercuryCardId: input.cardId },
      ],
    },
  });

  const confidence = invoice && input.hasReceipt ? "auto_closed" : "needs_review";

  return db.reconciliations.create({
    data: {
      idempotencyKey: input.idempotencyKey,
      mercuryTransactionId: input.transactionId,
      matchedInvoiceId: invoice?.id ?? null,
      receiptStatus: input.hasReceipt ? "attached" : "missing",
      confidence,
      reviewOwner: confidence === "needs_review" ? "finance-ops" : null,
    },
  });
}`,
  },
  {
    id: 'policy',
    label: 'Control Policy',
    code: String.raw`const CARD_NODE_POLICY = {
  "node-a-ad-spend": {
    allowedMerchants: ["google", "meta", "tiktok", "linkedin"],
    monthlyLimitUsd: 18000,
    alertWhenDailyVarianceExceeds: 0.2,
    owner: "growth",
  },
  "node-b-core-infra": {
    allowedMerchants: ["vercel", "supabase", "openai", "resend"],
    monthlyLimitUsd: 4500,
    approvalRequiredFor: ["plan_upgrade", "new_vendor"],
    owner: "engineering",
  },
  "node-c-team-saas": {
    receiptRequired: true,
    renewalReviewDaysBefore: 14,
    seatAuditCadence: "monthly",
    owner: "operations",
  },
} as const;`,
  },
];

const hardeningSteps = [
  {
    number: '01',
    title: 'Remove SMS from the recovery path',
    body: 'Mercury already avoids insecure SMS codes; extend that standard across the email, password manager, domain registrar, payroll, and identity-provider accounts that can reset finance access.',
    icon: Shield,
  },
  {
    number: '02',
    title: 'Mandate FIDO2/WebAuthn keys for the team perimeter',
    body: 'Issue two hardware keys per privileged operator: one daily key and one sealed backup. Require the same control on Google Workspace, GitHub, password vaults, and every account that can approve money movement.',
    icon: KeyRound,
  },
  {
    number: '03',
    title: 'Split read monitoring from write authority',
    body: 'Use scoped API tokens, IP allow-listing, and read-only workflows for dashboards. Only a separate write token should create payments, upload receipts, or modify card controls.',
    icon: Terminal,
  },
  {
    number: '04',
    title: 'Monitor cash flow without living in the browser',
    body: 'Run Mercury CLI checks for balances, transactions, invoices, and webhooks from a hardened terminal or CI job. Browser sessions become approval surfaces, not monitoring surfaces.',
    icon: Code2,
  },
];

const internalLinks = [
  { label: 'Mercury Review', href: '/us/business-banking/mercury-review' },
  { label: 'Business Banking Hub', href: '/us/business-banking' },
  { label: 'Relay Review', href: '/us/business-banking/relay-review' },
  { label: 'Bluevine Review', href: '/us/business-banking/bluevine-review' },
  { label: 'Wise Business Review', href: '/us/business-banking/wise-business-review' },
  { label: 'Novo Review', href: '/us/business-banking/novo-review' },
  { label: 'Review Methodology', href: '/methodology' },
  { label: 'Affiliate Disclosure', href: '/affiliate-disclosure' },
];

const sourceLinks = [
  { label: 'Mercury Pricing', href: 'https://mercury.com/pricing' },
  { label: 'Mercury Security', href: 'https://mercury.com/security' },
  { label: 'Mercury API and CLI', href: 'https://mercury.com/api' },
  { label: 'Mercury Webhooks', href: 'https://docs.mercury.com/reference/webhooks' },
  { label: 'Expense Management', href: 'https://mercury.com/expense-management' },
  { label: 'Accounting Automations', href: 'https://mercury.com/accounting-automations' },
  { label: 'FIDO Passkeys', href: 'https://fidoalliance.org/passkeys/' },
];

const PAGE_TITLE = 'Programmatic Financial Firewall for LLC Cash Flow';
const PAGE_DESCRIPTION =
  'Deploy Mercury as an API-driven LLC cash-flow firewall: isolate subscriptions, automate receipts, harden access, and claim the SmartFinPro bonus.';

const protocolButtonBase =
  "group relative isolate inline-flex items-center justify-center overflow-hidden border border-cyan-300/35 bg-zinc-950/95 font-extrabold !text-white !no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_0_34px_rgba(34,211,238,0.12)] transition-all duration-300 before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.22),transparent_46%)] before:opacity-70 before:transition-opacity hover:-translate-y-0.5 hover:border-cyan-200/70 hover:bg-cyan-950/25 hover:!text-white hover:!no-underline hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_0_44px_rgba(34,211,238,0.22)] hover:before:opacity-100 active:!no-underline visited:!text-white visited:!no-underline focus:!no-underline focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-black";

const protocolButtonSizes = {
  compact: 'min-h-11 rounded-[1.1rem] gap-2 px-4 py-2 text-xs sm:px-5',
  default: 'min-h-14 rounded-[1.35rem] gap-3 px-7 py-4 text-sm',
  wide: 'min-h-14 rounded-[1.35rem] gap-3 px-8 py-4 text-sm',
} as const;

function protocolButtonClass(size: keyof typeof protocolButtonSizes = 'default') {
  return cn(protocolButtonBase, protocolButtonSizes[size]);
}

const protocolButtonIconClass =
  'h-5 w-5 shrink-0 stroke-[2.5] text-cyan-200 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white';

export default function ProgrammaticFinancialFirewallPage() {
  const [activeNodeId, setActiveNodeId] = useState(firewallNodes[0].id);
  const [activeCodeTab, setActiveCodeTab] = useState(codeTabs[0].id);
  const [activeHardeningStep, setActiveHardeningStep] = useState(0);

  useEffect(() => {
    const syncHead = () => {
      document.title = PAGE_TITLE;

      let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = PAGE_DESCRIPTION;
    };

    syncHead();
    const frame = window.requestAnimationFrame(syncHead);
    const timeout = window.setTimeout(syncHead, 250);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  const activeNode = useMemo(
    () => firewallNodes.find((node) => node.id === activeNodeId) ?? firewallNodes[0],
    [activeNodeId]
  );
  const activeCode = useMemo(
    () => codeTabs.find((tab) => tab.id === activeCodeTab) ?? codeTabs[0],
    [activeCodeTab]
  );
  const ActiveNodeIcon = activeNode.icon;
  const ActiveHardeningIcon = hardeningSteps[activeHardeningStep].icon;

  return (
    <>
      <title>{PAGE_TITLE}</title>
      <meta name="description" content={PAGE_DESCRIPTION} />
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="sticky top-16 z-40 border-b border-white/10 bg-black/85 backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="#top" className="min-w-0 text-sm font-semibold text-white">
            <span className="hidden sm:inline">US Banking Infrastructure Protocol (v2.6)</span>
            <span className="sm:hidden">Protocol v2.6</span>
          </Link>
          <div className="hidden items-center gap-6 text-xs font-medium text-zinc-400 md:flex">
            <Link href="#phase-01" className="transition hover:text-white">
              Cards
            </Link>
            <Link href="#phase-02" className="transition hover:text-white">
              API
            </Link>
            <Link href="#phase-03" className="transition hover:text-white">
              Access
            </Link>
          </div>
          <Link
            href={MERCURY_AFFILIATE_URL}
            target="_blank"
            rel="noopener sponsored"
            className={cn('shrink-0', protocolButtonClass('compact'))}
          >
            Launch Free Account
            <ChevronRight className={cn(protocolButtonIconClass, 'h-4 w-4')} />
          </Link>
        </nav>
      </div>

      <div id="top" className="overflow-hidden">
        <section className="relative px-4 py-24 sm:px-6 md:py-32 lg:px-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  Technical Founder Banking Protocol
                </div>
                <h1 className="max-w-5xl bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
                  The Programmatic Financial Firewall: How to Orchestrate and Isolate Your LLC&apos;s Cash Flow.
                </h1>
                <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-300 md:text-xl">
                  This is not a standard bank review. It is a deployment protocol for founders who want their
                  international LLC&apos;s money stack to behave like hardened infrastructure: isolated vendor rails,
                  automated reconciliation, narrow permissions, and a clean API operating layer.
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href={MERCURY_AFFILIATE_URL}
                    target="_blank"
                    rel="noopener sponsored"
                    className={protocolButtonClass()}
                  >
                    Launch Free Mercury Account
                    <ChevronRight className={protocolButtonIconClass} />
                  </Link>
                  <Link
                    href="#phase-01"
                    className={protocolButtonClass()}
                  >
                    Read the protocol
                    <ChevronRight className={protocolButtonIconClass} />
                  </Link>
                </div>
                <p className="mt-5 max-w-2xl text-xs leading-5 text-zinc-500">
                  Affiliate disclosure: SmartFinPro may earn compensation if you open an account through
                  our Mercury routing link. Editorial recommendations remain independent.
                </p>
              </div>

              <div className="relative">
                <div className="rounded-[2rem] border border-white/10 bg-zinc-950/90 p-4 shadow-[0_0_80px_rgba(14,165,233,0.14)]">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black">
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-400" />
                        <span className="h-3 w-3 rounded-full bg-amber-300" />
                        <span className="h-3 w-3 rounded-full bg-emerald-300" />
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500">cash-flow-firewall.ts</span>
                    </div>
                    <div className="space-y-5 p-5">
                      <div className="grid grid-cols-3 gap-3">
                        {firewallNodes.map((node) => {
                          const Icon = node.icon;
                          const isActive = node.id === activeNode.id;

                          return (
                            <button
                              key={node.id}
                              type="button"
                              aria-pressed={isActive}
                              onClick={() => setActiveNodeId(node.id)}
                              className={cn(
                                'group rounded-2xl border bg-zinc-950/85 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-950/15',
                                isActive
                                  ? `${node.border} shadow-[0_0_34px_rgba(34,211,238,0.13)]`
                                  : 'border-white/10'
                              )}
                            >
                              <Icon className={cn('mb-5 h-5 w-5 transition-transform duration-300 group-hover:scale-110', node.accent)} />
                              <div className="text-xs font-bold text-white">{node.name}</div>
                              <div className="mt-1 text-[11px] text-zinc-500">{node.label}</div>
                            </button>
                          );
                        })}
                      </div>

                      <div className={cn('rounded-3xl border bg-gradient-to-br p-5', activeNode.border, activeNode.gradient)}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                              Active isolation lane
                            </p>
                            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
                              {activeNode.name}: {activeNode.label}
                            </h2>
                          </div>
                          <ActiveNodeIcon className={cn('h-8 w-8', activeNode.accent)} />
                        </div>
                        <dl className="mt-6 grid gap-4 text-sm">
                          <div>
                            <dt className="text-zinc-500">Mapped vendors</dt>
                            <dd className="mt-1 font-medium text-zinc-100">{activeNode.vendors}</dd>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <dt className="text-zinc-500">Spend ceiling</dt>
                              <dd className="mt-1 font-medium text-zinc-100">{activeNode.limit}</dd>
                            </div>
                            <div>
                              <dt className="text-zinc-500">Kill switch</dt>
                              <dd className="mt-1 font-medium text-zinc-100">Freeze node only</dd>
                            </div>
                          </div>
                        </dl>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {protocolStats.map((stat) => (
                          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                              {stat.label}
                            </p>
                            <p className="mt-2 text-xl font-extrabold text-white">{stat.value}</p>
                            <p className="mt-1 text-xs text-zinc-500">{stat.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 md:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Section 1 - Core Threat</p>
              <h2 className="mt-5 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
                Password hygiene is table stakes. Cash-flow isolation is the control that matters.
              </h2>
              <p className="mt-8 text-lg leading-8 text-zinc-300">
                In 2026, a clean password manager and SMS 2FA are not enough. The practical threat is a
                convincing payment workflow that reaches a founder while they are tired, traveling, or context
                switching. The defense is to move the LLC&apos;s financial stack into segmented, observable,
                programmatic infrastructure with Mercury as the operating hub.
              </p>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
              {threatCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article key={card.title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                    <Icon className="h-8 w-8 text-red-300" />
                    <h3 className="mt-8 text-xl font-bold text-white">{card.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-zinc-400">{card.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="phase-01" className="border-y border-white/10 bg-black px-4 py-24 sm:px-6 md:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">Phase 01</p>
                <h2 className="mt-5 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
                  The multi-card subscription isolation blueprint.
                </h2>
                <p className="mt-8 text-lg leading-8 text-zinc-300">
                  The founder&apos;s mistake is using one company card as a universal API key. Instead, create a
                  dedicated virtual card lane for each infrastructure node. Mercury lets teams issue virtual or
                  physical cards for free, apply spend controls, require receipts, and freeze the affected lane
                  without breaking the rest of the LLC.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {firewallNodes.map((node) => {
                  const Icon = node.icon;
                  const isActive = node.id === activeNode.id;

                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setActiveNodeId(node.id)}
                      className={cn(
                        'group rounded-3xl border bg-zinc-950 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/45 hover:bg-cyan-950/15 hover:shadow-[0_0_42px_rgba(34,211,238,0.12)]',
                        isActive
                          ? `${node.border} shadow-[0_0_46px_rgba(34,211,238,0.14)]`
                          : 'border-white/10'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={cn('h-7 w-7 transition-transform duration-300 group-hover:scale-110', node.accent)} />
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-zinc-400">
                          {node.name}
                        </span>
                      </div>
                      <h3 className="mt-8 text-2xl font-extrabold tracking-tight text-white">{node.label}</h3>
                      <p className="mt-4 text-sm leading-7 text-zinc-400">{node.policy}</p>
                      <div className="mt-8 h-1.5 rounded-full bg-white/10">
                        <div className={cn('h-1.5 rounded-full bg-gradient-to-r', node.gradient)} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-12 rounded-[2rem] border border-white/10 bg-zinc-950 p-6 md:p-8">
              <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <div className="flex items-center gap-3">
                    <ActiveNodeIcon className={cn('h-8 w-8', activeNode.accent)} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Selected control</p>
                      <h3 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
                        {activeNode.name}: {activeNode.label}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-6 text-sm leading-7 text-zinc-400">{activeNode.risk}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Vendors</p>
                    <p className="mt-4 text-sm leading-6 text-zinc-200">{activeNode.vendors}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Limit</p>
                    <p className="mt-4 text-sm leading-6 text-zinc-200">{activeNode.limit}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Response</p>
                    <p className="mt-4 text-sm leading-6 text-zinc-200">{activeNode.trigger}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="phase-02" className="px-4 py-24 sm:px-6 md:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Phase 02</p>
                <h2 className="mt-5 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
                  Automated receipt reconciling via a Next.js API layer.
                </h2>
                <p className="mt-8 text-lg leading-8 text-zinc-300">
                  Mercury&apos;s API and webhook model lets the finance stack behave like production software.
                  Transactions arrive in real time, your backend validates the event, matches it against Stripe
                  invoices or server invoices, then pushes unresolved items into review before month-end drift
                  becomes expensive.
                </p>
                <div className="mt-10 grid gap-4">
                  {architectureSteps.map((step) => {
                    const Icon = step.icon;

                    return (
                      <div key={step.label} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{step.label}</h3>
                          <p className="mt-1 text-sm leading-6 text-zinc-400">{step.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-black shadow-[0_0_90px_rgba(245,158,11,0.10)]">
                <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
                  {codeTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCodeTab(tab.id)}
                      className={cn(
                        'rounded-[1rem] border px-4 py-2 text-xs font-bold transition-all duration-300 hover:-translate-y-0.5',
                        activeCodeTab === tab.id
                          ? 'border-cyan-300/60 bg-cyan-950/30 text-white shadow-[0_0_24px_rgba(34,211,238,0.14)]'
                          : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-cyan-300/45 hover:bg-cyan-950/15 hover:text-white'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <pre className="max-h-[720px] overflow-auto p-5 text-[12px] leading-6 text-zinc-200 sm:text-sm">
                  <code>{activeCode.code}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section id="phase-03" className="border-y border-white/10 bg-black px-4 py-24 sm:px-6 md:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Phase 03</p>
              <h2 className="mt-5 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
                Zero-trust access layer and hardware hardening.
              </h2>
              <p className="mt-8 text-lg leading-8 text-zinc-300">
                Account approval is not the finish line. It is the moment to lock down recovery paths, remove
                weak authentication dependencies, separate read from write access, and turn browser sessions into
                deliberate approval surfaces.
              </p>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="grid gap-3">
                {hardeningSteps.map((step, index) => (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => setActiveHardeningStep(index)}
                    className={cn(
                      'group rounded-[1.5rem] border bg-zinc-950/85 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-950/15',
                      activeHardeningStep === index
                        ? 'border-cyan-300/60 text-white shadow-[0_0_34px_rgba(34,211,238,0.15)]'
                        : 'border-white/10 text-white'
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-sm font-bold">{step.number}</span>
                      <ChevronRight className="h-4 w-4 text-cyan-200 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                    <h3 className="mt-4 text-lg font-extrabold tracking-tight">{step.title}</h3>
                  </button>
                ))}
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
                <ActiveHardeningIcon className="h-12 w-12 text-cyan-300" />
                <p className="mt-8 font-mono text-sm font-bold text-zinc-500">
                  SOP STEP {hardeningSteps[activeHardeningStep].number}
                </p>
                <h3 className="mt-3 text-4xl font-extrabold tracking-tight text-white">
                  {hardeningSteps[activeHardeningStep].title}
                </h3>
                <p className="mt-6 text-lg leading-8 text-zinc-300">{hardeningSteps[activeHardeningStep].body}</p>
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  {[
                    'Two-person approval for payment changes',
                    'Read-only telemetry for dashboards',
                    'Scoped tokens with IP allow-listing',
                    'Quarterly access and card-node review',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                      <span className="text-sm leading-6 text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 md:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black p-px shadow-[0_0_110px_rgba(34,197,94,0.13)]">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/40 via-cyan-300/25 to-amber-300/40 opacity-70" />
              <div className="relative rounded-[calc(2rem-1px)] bg-zinc-950 p-8 md:p-12 lg:p-16">
                <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.85fr]">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">The win-win close</p>
                    <h2 className="mt-5 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
                      Open the account. Build the firewall. Keep the bonus.
                    </h2>
                    <p className="mt-8 text-lg leading-8 text-zinc-300">
                      Open a fee-free Mercury account through the verified SmartFinPro priority routing link.
                      Eligible founders can claim a $250 cash bonus after funding their entity, while still getting
                      core business banking with no monthly maintenance fees and no account minimums.
                    </p>
                    <p className="mt-4 text-sm leading-6 text-zinc-500">
                      Bonus availability and qualification rules can change. Verify the final offer screen before
                      applying and treat approval, KYC, and funding requirements as binding.
                    </p>
                    <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                      <Link
                        href={MERCURY_AFFILIATE_URL}
                        target="_blank"
                        rel="noopener sponsored"
                        className={protocolButtonClass('wide')}
                      >
                        Launch Free Account
                        <ChevronRight className={protocolButtonIconClass} />
                      </Link>
                      <Link
                        href="/us/business-banking/mercury-review"
                        className={protocolButtonClass('wide')}
                      >
                        Read Mercury Review
                        <ChevronRight className={protocolButtonIconClass} />
                      </Link>
                    </div>
                  </div>
                  <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Founder incentive</p>
                        <p className="mt-2 text-5xl font-extrabold tracking-tight text-white">$250</p>
                      </div>
                      <Banknote className="h-12 w-12 text-emerald-300" />
                    </div>
                    <div className="mt-6 space-y-4">
                      {[
                        'Fee-free core business checking and savings',
                        'No monthly maintenance fee or account minimum',
                        'Virtual cards, spend controls, receipts, API, webhooks, and CLI workflows',
                        'SmartFinPro routing keeps attribution clean for founder bonus tracking',
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                          <p className="text-sm leading-6 text-zinc-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Continue the SmartFinPro stack</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {internalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center justify-between rounded-[1.15rem] border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-950/15 hover:text-white"
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-cyan-200 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Verification references</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {sourceLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-[1.15rem] border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-950/15 hover:text-white"
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-cyan-200 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      </div>
    </>
  );
}
