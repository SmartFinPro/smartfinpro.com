'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  Quote,
  ServerCog,
  Shield,
  ShieldAlert,
  Star,
  Terminal,
  WalletCards,
  Webhook,
  Zap,
} from 'lucide-react';
import type { FAQ } from '@/types';
import { cn } from '@/lib/utils';

const MERCURY_AFFILIATE_URL = '/go/mercury';

// CRO: offer surfaced in the hero (the conversion lever) + risk-reversal microcopy.
const heroOffers = ['$250 cash bonus', '$0 monthly fees', 'No minimum deposit'];
const heroReassurance =
  'Free to open · No credit check to open · FDIC-insured via partner banks · Apply in minutes';

// EEAT: the real reviewer of SmartFinPro's Mercury coverage (portrait matches name).
const REVIEWER = {
  name: 'Robert Hayes, CFP',
  role: 'Certified Financial Planner · Business banking',
  image: '/images/experts/robert-hayes.webp',
};

const trustPoints = [
  'No monthly maintenance fees',
  'No minimum deposit or balance',
  'FDIC-insured via partner banks',
  'Free virtual & physical cards',
];

// "Why Mercury" — 8-point overview. Short, punchy line under each keyword.
// "Up to $5M FDIC" is Mercury's advertised figure via partner-bank sweep (mercury.com/security);
// the standard per-bank limit is $250K. Treasury yields vary — verify before launch.
const mercuryAdvantages: { label: string; value: string }[] = [
  { label: 'Onboarding incl. KYC + ID verification', value: 'Open online in 10 minutes.' },
  { label: 'Fees', value: '$0 monthly fees, no minimums.' },
  { label: 'FDIC coverage', value: 'Up to $5,000,000 FDIC coverage.' },
  { label: 'Cards', value: 'Free $0 virtual & physical cards.' },
  { label: 'Developer tools', value: 'AI-friendly — connect via API & CLI.' },
  { label: 'Treasury', value: 'Earn yield on cash (T-bills).' },
  { label: 'Payments', value: 'Free $0 USD wires.' },
  { label: 'Security', value: '100% MFA with hardware keys (YubiKey).' },
];

// ⚠️ PLACEHOLDER testimonials — illustrative copy only. Before launch, REPLACE with
// real, permissioned, attributable customer quotes (FTC endorsement rules: never
// publish fabricated reviews). Initial-letter avatars are used instead of fake photos.
const testimonials = [
  {
    quote:
      'We gave every vendor its own Mercury card with a hard limit. When an ad account got phished, we froze that one card — payroll and reserves never moved.',
    name: 'Alex M.',
    role: 'Founder · B2B SaaS (US LLC)',
  },
  {
    quote:
      'The webhook reconciliation cut our month-end close from a full day to about twenty minutes. The API and CLI are the reason we stayed.',
    name: 'Priya S.',
    role: 'Technical co-founder · Developer tools',
  },
];

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

const receiptIntakeSteps = [
  {
    label: 'Workspace intake',
    detail: 'Route vendor invoices from Gmail or Google Workspace into a dedicated finance inbox label.',
  },
  {
    label: 'Attachment fingerprint',
    detail: 'Extract amount, merchant, invoice ID, due date, and PDF hash before touching the ledger.',
  },
  {
    label: 'Transaction match',
    detail: 'Match the invoice to the Mercury card node by merchant, amount, timestamp window, and card ID.',
  },
  {
    label: 'Receipt closure',
    detail: 'Attach or email the receipt into Mercury, then send low-confidence cases to finance review.',
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
    id: 'workspace',
    label: 'Workspace Intake',
    code: String.raw`// app/api/finance/workspace-receipt-intake/route.ts
import { NextRequest, NextResponse } from "next/server";

type WorkspaceInvoiceAttachment = {
  messageId: string;
  from: string;
  subject: string;
  receivedAt: string;
  filename: string;
  mimeType: "application/pdf" | "image/png" | "image/jpeg";
  bytesBase64: string;
};

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-automation-token");
  if (token !== process.env.RECEIPT_INTAKE_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = (await request.json()) as WorkspaceInvoiceAttachment;
  const parsed = await extractInvoiceFields(invoice.bytesBase64, invoice.mimeType);

  const transaction = await findMercuryCardTransaction({
    merchant: parsed.vendorName,
    amount: parsed.amountUsd,
    occurredBetween: [
      new Date(Date.parse(invoice.receivedAt) - 72 * 60 * 60 * 1000),
      new Date(Date.parse(invoice.receivedAt) + 72 * 60 * 60 * 1000),
    ],
  });

  if (!transaction || transaction.confidence < 0.92) {
    await queueFinanceReview({
      reason: "LOW_CONFIDENCE_RECEIPT_MATCH",
      messageId: invoice.messageId,
      parsed,
      transactionCandidate: transaction,
    });

    return NextResponse.json({ status: "needs_review" });
  }

  await uploadReceiptToMercury({
    transactionId: transaction.id,
    filename: invoice.filename,
    mimeType: invoice.mimeType,
    bytesBase64: invoice.bytesBase64,
  });

  await markReceiptClosed({
    messageId: invoice.messageId,
    mercuryTransactionId: transaction.id,
    invoiceNumber: parsed.invoiceNumber,
  });

  return NextResponse.json({ status: "auto_closed", transactionId: transaction.id });
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

const commandOps = [
  {
    label: 'Natural-language finance ops',
    detail: 'Use Command for reviewed actions such as issuing cards, freezing cards, assigning GL codes, or asking spend questions without exporting data.',
  },
  {
    label: 'Terminal-native monitoring',
    detail: 'Use the Mercury CLI for balances, transactions, invoices, payments, and webhook checks from a hardened terminal or CI job.',
  },
  {
    label: 'Agent-ready read layer',
    detail: 'Use API, scoped tokens, and Mercury MCP patterns for read-only dashboards and AI analysis without granting payment authority.',
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
  { label: 'Mercury Command', href: 'https://mercury.com/command' },
  { label: 'Mercury Security', href: 'https://mercury.com/security' },
  { label: 'Mercury API and CLI', href: 'https://mercury.com/api' },
  { label: 'Mercury Webhooks', href: 'https://docs.mercury.com/reference/webhooks' },
  { label: 'Expense Management', href: 'https://mercury.com/expense-management' },
  { label: 'Accounting Automations', href: 'https://mercury.com/accounting-automations' },
  { label: 'FIDO Passkeys', href: 'https://fidoalliance.org/passkeys/' },
];

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

// Image slots — placeholders live at these stable paths (solid #09090b WebP at the
// exact final dimensions). To go live, just OVERWRITE the file in
// public/images/firewall/ with the real render; no code change required.
const FIREWALL_IMAGES = {
  hero: {
    src: '/images/firewall/01-hero.webp',
    alt: 'Translucent glass firewall channeling isolated cash-flow lanes',
  },
  fullbleed: {
    src: '/images/firewall/02-fullbleed.webp',
    alt: 'Cinematic wall of isolated virtual debit cards fading into the dark',
  },
  device: {
    src: '/images/firewall/04-device-v2.webp',
    alt: 'Laptop showing a dark-mode receipt reconciliation dashboard and webhook flow',
  },
  hardwareKey: {
    src: '/images/firewall/05-hardware-key-v2.webp',
    alt: 'Macro shot of a FIDO2 hardware security key on a dark surface',
  },
  cta: {
    src: '/images/firewall/06-cta-v2.webp',
    alt: 'Premium business debit card render with a soft emerald glow',
  },
} as const;

const cardRenders = [
  {
    src: '/images/firewall/03-card-ad-spend.webp',
    alt: 'Virtual debit card render with a cyan edge — Node A, Ad Spend',
    accent: 'cyan' as const,
    label: 'Node A · Ad Spend',
  },
  {
    src: '/images/firewall/03-card-core-infra.webp',
    alt: 'Virtual debit card render with an emerald edge — Node B, Core Infrastructure',
    accent: 'emerald' as const,
    label: 'Node B · Core Infrastructure',
  },
  {
    src: '/images/firewall/03-card-team-saas.webp',
    alt: 'Virtual debit card render with an amber edge — Node C, Team SaaS',
    accent: 'amber' as const,
    label: 'Node C · Team SaaS',
  },
];

const glowByAccent: Record<'cyan' | 'emerald' | 'amber', string> = {
  cyan: 'bg-cyan-500/30',
  emerald: 'bg-emerald-500/30',
  amber: 'bg-amber-500/30',
};

// Scroll-reveal wrapper — ROBUST by design: content is visible by default (SSR and
// no-JS render it shown, so it can never get stuck invisible). After mount, JS only
// *arms* (hides) elements still below the fold, then reveals them on scroll. Elements
// already in view stay shown. Reduced-motion users still get the fade (no movement).
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // Only animate elements that are still below the fold; anything already in view
    // stays shown (avoids a visible flash and unnecessary work).
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;

    // Arm via rAF (before paint) — keeps setState out of the synchronous effect body.
    const raf = requestAnimationFrame(() => setHidden(true));
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn('firewall-reveal', hidden && 'firewall-reveal-hide', className)}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

function FirewallMedia({
  src,
  alt,
  accent = 'cyan',
  priority = false,
  sizes = '(min-width: 768px) 33vw, 100vw',
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  accent?: 'cyan' | 'emerald' | 'amber';
  priority?: boolean;
  sizes?: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-4 -z-10 rounded-[2.75rem] opacity-75 blur-2xl',
          glowByAccent[accent]
        )}
      />
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          'rounded-[1.75rem] border border-white/10 bg-[#09090b] object-cover',
          imgClassName
        )}
      />
    </div>
  );
}

export default function FirewallClient({ faqs }: { faqs: FAQ[] }) {
  const [activeNodeId, setActiveNodeId] = useState(firewallNodes[0].id);
  const [activeCodeTab, setActiveCodeTab] = useState(codeTabs[0].id);
  const [activeHardeningStep, setActiveHardeningStep] = useState(0);

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
    <div className="min-h-screen bg-zinc-950 pb-[84px] text-white lg:pb-0">
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
            <Link href="#faq" className="transition hover:text-white">
              FAQ
            </Link>
          </div>
          <Link
            href={MERCURY_AFFILIATE_URL}
            target="_blank"
            rel="noopener sponsored"
            className={cn('shrink-0 cta-glow', protocolButtonClass('compact'))}
          >
            Open Mercury Account
            <ChevronRight className={cn(protocolButtonIconClass, 'h-4 w-4')} />
          </Link>
        </nav>
      </div>

      <div id="top" className="scroll-mt-32 overflow-hidden">
        <section className="relative px-4 pt-12 pb-12 sm:px-6 md:pt-16 md:pb-16 lg:px-8">
          {/* Slot 1 — hero ambient backdrop (LCP). Swap public/images/firewall/01-hero.webp to go live. */}
          <div aria-hidden className="absolute inset-0">
            <Image
              src={FIREWALL_IMAGES.hero.src}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/70 to-zinc-950/25" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950" />
            <div className="absolute inset-0 bg-[radial-gradient(55%_55%_at_80%_25%,rgba(34,211,238,0.20),transparent)]" />
          </div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-500">
                  <Link href="/us" className="transition hover:text-zinc-200">
                    Home
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />
                  <Link href="/us/business-banking" className="transition hover:text-zinc-200">
                    Business Banking
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />
                  <span className="text-zinc-300" aria-current="page">
                    Programmatic Financial Firewall
                  </span>
                </nav>
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
                  automated reconciliation, narrow permissions, AI-assisted command surfaces, and a clean API/CLI
                  operating layer.
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

                {/* CRO: offer surfaced up-front + risk-reversal microcopy */}
                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                  {heroOffers.map((offer) => (
                    <span
                      key={offer}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-200"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {offer}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs font-medium text-zinc-400">{heroReassurance}</p>

                {/* EEAT: real reviewer byline — framed as a trust seal (2x size) */}
                <div className="mt-6 flex w-fit items-center gap-6 rounded-[2rem] border border-white/10 bg-white/[0.03] px-8 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Image
                    src={REVIEWER.image}
                    alt={REVIEWER.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full border border-white/15 object-cover"
                  />
                  <div className="leading-tight">
                    <p className="text-lg font-semibold text-zinc-200">Reviewed by {REVIEWER.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">{REVIEWER.role}</p>
                  </div>
                </div>

                <p className="mt-6 max-w-2xl text-xs leading-5 text-zinc-500">
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

        {/* Win-win offer + the 8 reasons, combined — placed right under the hero/reviewer byline. */}
        <section className="px-4 pt-10 pb-20 sm:px-6 md:pt-14 md:pb-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black p-px shadow-[0_0_110px_rgba(34,197,94,0.13)]">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/40 via-cyan-300/25 to-amber-300/40 opacity-70" />
                <div className="relative rounded-[calc(2rem-1px)] bg-zinc-950 p-8 md:p-12 lg:p-14">
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
                        <Link href="/us/business-banking/mercury-review" className={protocolButtonClass('wide')}>
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

                  {/* The 8 reasons — the "why" that justifies the offer */}
                  <div className="mt-14 border-t border-white/10 pt-12">
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">The Mercury advantage</p>
                    <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                      Eight reasons founders switch.
                    </h3>
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      {mercuryAdvantages.map((item) => (
                        <div
                          key={item.label}
                          className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-300/60 hover:bg-cyan-950/20 hover:shadow-[0_0_48px_rgba(34,211,238,0.16)]"
                        >
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 transition-colors duration-300 group-hover:border-cyan-300/60 group-hover:bg-cyan-500/15">
                            <Check className="h-6 w-6 stroke-[2.5] text-emerald-300 transition-colors duration-300 group-hover:text-cyan-200" />
                          </span>
                          <p className="mt-5 text-base font-extrabold uppercase leading-snug tracking-[0.16em] text-emerald-300 transition-colors duration-300 group-hover:text-cyan-200">
                            {item.value}
                          </p>
                          <p className="mt-2.5 text-sm leading-6 text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
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

        <section id="phase-01" className="scroll-mt-32 border-y border-white/10 bg-black px-4 py-24 sm:px-6 md:py-32 lg:px-8">
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
                      aria-pressed={isActive}
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

            {/* Slot 3 — virtual-card renders (one per node). Swap public/images/firewall/03-card-*.webp to go live. */}
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {cardRenders.map((card, index) => (
                <Reveal key={card.src} delay={index * 0.08}>
                  <figure>
                    <FirewallMedia
                      src={card.src}
                      alt={card.alt}
                      accent={card.accent}
                      className="aspect-[4/3]"
                    />
                    <figcaption className="mt-4 text-center text-sm font-semibold text-zinc-400">
                      {card.label}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
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

            <div className="mt-6 overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-zinc-950/90 shadow-[0_0_54px_rgba(34,211,238,0.08)]">
              <div className="border-b border-white/10 px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Founder copy-paste policy
                </p>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
                  Recommended card limit matrix
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                  <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-zinc-500">
                    <tr>
                      <th className="px-6 py-4 font-bold">Lane</th>
                      <th className="px-6 py-4 font-bold">Vendors</th>
                      <th className="px-6 py-4 font-bold">Recommended ceiling</th>
                      <th className="px-6 py-4 font-bold">Failure response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {firewallNodes.map((node) => (
                      <tr key={node.id} className="transition hover:bg-cyan-950/10">
                        <td className="px-6 py-5 font-bold text-white">
                          {node.name}: {node.label}
                        </td>
                        <td className="max-w-xs px-6 py-5 leading-6 text-zinc-300">{node.vendors}</td>
                        <td className="px-6 py-5 font-semibold text-cyan-200">{node.limit}</td>
                        <td className="max-w-sm px-6 py-5 leading-6 text-zinc-400">{node.trigger}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section id="phase-02" className="scroll-mt-32 px-4 py-24 sm:px-6 md:py-32 lg:px-8">
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
                  invoices, server invoices, or Gmail/Google Workspace receipts, then pushes unresolved items into
                  review before month-end drift becomes expensive.
                </p>
                <div className="mt-10 rounded-[2rem] border border-cyan-300/20 bg-zinc-950/85 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Receipt automation SOP
                  </p>
                  <div className="mt-5 grid gap-3">
                    {receiptIntakeSteps.map((step, index) => (
                      <div key={step.label} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-950/25 font-mono text-xs font-bold text-cyan-200">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{step.label}</h3>
                          <p className="mt-1 text-sm leading-6 text-zinc-400">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                <div
                  role="tablist"
                  aria-label="Receipt automation code examples"
                  className="flex flex-wrap gap-2 border-b border-white/10 p-3"
                >
                  {codeTabs.map((tab) => {
                    const isSelected = activeCodeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`code-tab-${tab.id}`}
                        aria-selected={isSelected}
                        aria-controls="code-tabpanel"
                        onClick={() => setActiveCodeTab(tab.id)}
                        className={cn(
                          'rounded-[1rem] border px-4 py-2 text-xs font-bold transition-all duration-300 hover:-translate-y-0.5',
                          isSelected
                            ? 'border-cyan-300/60 bg-cyan-950/30 text-white shadow-[0_0_24px_rgba(34,211,238,0.14)]'
                            : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-cyan-300/45 hover:bg-cyan-950/15 hover:text-white'
                        )}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <pre
                  id="code-tabpanel"
                  role="tabpanel"
                  aria-labelledby={`code-tab-${activeCode.id}`}
                  tabIndex={0}
                  className="max-h-[720px] overflow-auto p-5 text-[12px] leading-6 text-zinc-200 sm:text-sm"
                >
                  <code>{activeCode.code}</code>
                </pre>
              </div>
            </div>

            {/* Slot 4 — device/terminal mockup. Swap public/images/firewall/04-device.webp to go live. */}
            <Reveal className="mt-12">
              <FirewallMedia
                src={FIREWALL_IMAGES.device.src}
                alt={FIREWALL_IMAGES.device.alt}
                accent="cyan"
                sizes="(min-width: 1024px) 1216px, 100vw"
                className="aspect-[16/9] max-h-[560px]"
              />
            </Reveal>
          </div>
        </section>

        <section id="phase-03" className="scroll-mt-32 border-y border-white/10 bg-black px-4 py-24 sm:px-6 md:py-32 lg:px-8">
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
                    aria-pressed={activeHardeningStep === index}
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

            {/* Slot 5 — hardware security key macro. Swap public/images/firewall/05-hardware-key.webp to go live. */}
            <Reveal className="mt-8">
              <FirewallMedia
                src={FIREWALL_IMAGES.hardwareKey.src}
                alt={FIREWALL_IMAGES.hardwareKey.alt}
                accent="cyan"
                sizes="(min-width: 1024px) 1216px, 100vw"
                className="aspect-[16/9] max-h-[520px]"
                imgClassName="object-center"
              />
            </Reveal>

            <div className="mt-8 rounded-[2rem] border border-cyan-300/20 bg-zinc-950/85 p-6 shadow-[0_0_64px_rgba(34,211,238,0.08)] md:p-8">
              <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Technical proof layer
                  </p>
                  <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
                    Mercury Command for operators. CLI for engineers.
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-zinc-400">
                    The conversion argument is not &quot;another checking account.&quot; It is a programmable control plane:
                    AI-assisted finance operations through Mercury Command, terminal-native monitoring through
                    Mercury CLI, and scoped API access for dashboards that should never gain payment authority.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {commandOps.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <Terminal className="h-6 w-6 text-cyan-200" />
                      <h4 className="mt-5 font-bold text-white">{item.label}</h4>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-32 border-y border-white/10 bg-black px-4 py-24 sm:px-6 md:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Founder FAQ</p>
            <h2 className="mt-5 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
              Questions before you deploy.
            </h2>
            <div className="mt-12 divide-y divide-white/10 overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/60">
              {faqs.map((faq) => (
                <details key={faq.question} className="group px-6 py-5 [&_summary]:list-none sm:px-8">
                  <summary className="flex cursor-pointer items-center justify-between gap-6 text-left text-lg font-bold text-white transition-colors hover:text-cyan-200">
                    {faq.question}
                    <ChevronRight
                      className="h-5 w-5 shrink-0 text-cyan-200 transition-transform duration-300 group-open:rotate-90"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="mt-4 text-base leading-7 text-zinc-400">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-4 py-24 sm:px-6 md:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">Used by founders</p>
              <h2 className="mt-5 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl">
                Built for technical founders.
              </h2>
              <p className="mt-8 text-lg leading-8 text-zinc-300">
                The same controls finance teams rely on — vendor-isolated cards, automated reconciliation,
                and phishing-resistant access — without monthly fees or minimums. Founders running on Vercel,
                Stripe, and OpenAI use this exact stack.
              </p>
            </div>

            <Reveal className="mt-14 grid gap-6 md:grid-cols-2">
              {testimonials.map((t) => (
                <figure key={t.name} className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
                  <Quote className="h-7 w-7 text-cyan-300/70" />
                  <blockquote className="mt-5 text-lg leading-8 text-zinc-200">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-sm font-bold text-cyan-200">
                      {t.name.slice(0, 1)}
                    </span>
                    <span className="text-sm">
                      <span className="block font-bold text-white">{t.name}</span>
                      <span className="block text-zinc-500">{t.role}</span>
                    </span>
                    <span className="ml-auto flex gap-0.5 text-amber-300" aria-label="5 out of 5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </Reveal>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-5">
              {trustPoints.map((point) => (
                <span key={point} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Check className="h-4 w-4 shrink-0 text-emerald-300" />
                  {point}
                </span>
              ))}
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

      {/* CRO: sticky mobile CTA — Mercury is always one tap away (desktop uses the top-nav CTA) */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-white">$250 bonus · $0 monthly fees</p>
            <p className="truncate text-[11px] text-zinc-400">Free to open · no minimum deposit</p>
          </div>
          <Link
            href={MERCURY_AFFILIATE_URL}
            target="_blank"
            rel="noopener sponsored"
            className={cn('shrink-0', protocolButtonClass('compact'))}
          >
            Launch Free
            <ChevronRight className={cn(protocolButtonIconClass, 'h-4 w-4')} />
          </Link>
        </div>
      </div>
    </div>
  );
}
