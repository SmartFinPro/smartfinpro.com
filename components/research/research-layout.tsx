import Link from 'next/link';
import { ChevronRight, LineChart, ListChecks } from 'lucide-react';
import { SafeMDX } from '@/components/content/SafeMDX';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';
import { RiskWarningBox } from '@/components/marketing/risk-warning';
import type { MDXRemoteSerializeResult } from '@/lib/mdx/types';
import type { ResearchItem } from '@/lib/research';
import { BrokerCtaCards } from './broker-cta-cards';
import { FreshnessBanner } from './freshness-banner';
import { ResearchComplianceBanner } from './research-compliance-banner';

interface ResearchLayoutProps {
  item: ResearchItem;
  mdxSource: MDXRemoteSerializeResult;
}

function formatCurrency(
  value: number | undefined,
  currency: 'USD' | 'CAD' | 'EUR',
): string {
  if (typeof value !== 'number') return '-';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | undefined): string {
  if (typeof value !== 'number') return '-';
  return `${value.toFixed(1)}%`;
}

function sectorLabel(sector: string): string {
  return sector
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const cardBorder = { borderColor: 'var(--sfp-sky)' } as const;

export function ResearchLayout({ item, mdxSource }: ResearchLayoutProps) {
  const { meta, readingTime } = item;
  const sectorName = sectorLabel(meta.sector);
  const breadcrumbItems = [
    { label: 'SmartFinPro', href: '/' },
    { label: 'Research', href: '/research' },
    { label: sectorName, href: `/research/${meta.sector}` },
    { label: meta.title },
  ];

  return (
    <article className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      <div
        className="px-4 py-3 text-xs leading-5 text-white"
        style={{ background: 'var(--sfp-navy)' }}
      >
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          General financial information only. SmartFinPro Research is not a
          registered dealer or adviser. Consult a registered adviser before acting.
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-2 text-sm"
          style={{ color: 'var(--sfp-slate)' }}
        >
          {breadcrumbItems.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              {crumb.href ? (
                <Link href={crumb.href} className="transition-colors hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: 'var(--sfp-ink)' }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <header className="overflow-hidden rounded-3xl border bg-white shadow-sm" style={cardBorder}>
              <div className="px-6 py-6 text-white" style={{ background: 'var(--sfp-navy)' }}>
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--sfp-gold)' }}
                    >
                      SmartFinPro Research
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                      {meta.title}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/85">
                      {meta.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
                      <span>{meta.ticker}</span>
                      <span>{meta.exchanges.join(' / ')}</span>
                      <span>{sectorName}</span>
                      <span>{readingTime.text}</span>
                    </div>
                  </div>
                  <div
                    className="min-w-[220px] rounded-2xl p-4"
                    style={{ background: 'var(--sfp-navy-dark)', border: '1px solid var(--sfp-gold)' }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                      Analyst consensus
                    </p>
                    <p className="mt-2 text-3xl font-semibold" style={{ color: 'var(--sfp-gold)' }}>
                      {meta.ratingLabel}
                    </p>
                    <p className="mt-2 text-sm text-white/80">
                      {meta.consensusAnalysts
                        ? `${meta.consensusAnalysts} analysts - public aggregation`
                        : 'Public consensus aggregation'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4" style={{ background: 'var(--sfp-sky)' }}>
                <div className="bg-white px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--sfp-slate)' }}>
                    Current price
                  </p>
                  <p className="mt-2 text-xl font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                    {formatCurrency(meta.currentPriceUsd, 'USD')}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    {formatCurrency(meta.currentPriceCad, 'CAD')} / {formatCurrency(meta.currentPriceEur, 'EUR')}
                  </p>
                </div>
                <div className="bg-white px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--sfp-slate)' }}>
                    12M target
                  </p>
                  <p className="mt-2 text-xl font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                    {formatCurrency(meta.priceTargetUsd, 'USD')}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    {formatCurrency(meta.priceTargetCad, 'CAD')} / {formatCurrency(meta.priceTargetEur, 'EUR')}
                  </p>
                </div>
                <div className="bg-white px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--sfp-slate)' }}>
                    Upside to consensus
                  </p>
                  <p className="mt-2 text-xl font-semibold" style={{ color: 'var(--sfp-green)' }}>
                    {formatPercent(meta.upsidePotential)}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    Versus current price
                  </p>
                </div>
                <div className="bg-white px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--sfp-slate)' }}>
                    Valuation snapshot
                  </p>
                  <p className="mt-2 text-xl font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                    {meta.forwardPe ? `${meta.forwardPe.toFixed(1)}x P/E` : '-'}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    {meta.marketCapUsd ? `Market cap: $${meta.marketCapUsd.toFixed(1)}B` : 'Consensus-driven view'}
                  </p>
                </div>
              </div>
            </header>

            <FreshnessBanner asOf={meta.asOf} nextReview={meta.nextReview} />

            <ResearchComplianceBanner asOf={meta.asOf} nextReview={meta.nextReview} />

            {meta.hasInvestmentContent && (
              <RiskWarningBox
                variant="compact"
                titleOverride="Equity risk warning"
                textOverride="Investing in individual equities involves risk of loss, valuation compression, commodity volatility, and company-specific execution risk. This page is general market commentary, not tailored advice."
              />
            )}

            <div className="rounded-3xl border bg-white p-6 shadow-sm" style={cardBorder}>
              <SafeMDX source={mdxSource} />
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl border bg-white p-5 shadow-sm" style={cardBorder}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--sfp-slate)' }}>
                <LineChart className="h-4 w-4" />
                Research snapshot
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt style={{ color: 'var(--sfp-slate)' }}>Ticker</dt>
                  <dd className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>{meta.ticker}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt style={{ color: 'var(--sfp-slate)' }}>Coverage</dt>
                  <dd className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>{meta.exchanges.join(' / ')}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt style={{ color: 'var(--sfp-slate)' }}>Dividend yield</dt>
                  <dd className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                    {meta.dividendYield ? `${meta.dividendYield.toFixed(2)}%` : '-'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt style={{ color: 'var(--sfp-slate)' }}>Data sources</dt>
                  <dd className="max-w-[170px] text-right font-medium" style={{ color: 'var(--sfp-ink)' }}>
                    {meta.dataSources.join(', ')}
                  </dd>
                </div>
              </dl>
            </section>

            {meta.sections && meta.sections.length > 0 && (
              <section className="rounded-2xl border bg-white p-5 shadow-sm" style={cardBorder}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--sfp-slate)' }}>
                  <ListChecks className="h-4 w-4" />
                  On this page
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {meta.sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="transition-colors hover:underline"
                        style={{ color: 'var(--sfp-slate)' }}
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <BrokerCtaCards brokers={meta.brokers} />

            <AffiliateDisclosure market="us" position="bottom" />

            <section className="rounded-2xl border bg-white p-5 shadow-sm" style={cardBorder}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--sfp-slate)' }}>
                Related SmartFinPro coverage
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <Link href="/ca/gold-investing" className="block underline underline-offset-2" style={{ color: 'var(--sfp-navy)' }}>
                  Gold investing in Canada
                </Link>
                <Link href="/us/gold-investing" className="block underline underline-offset-2" style={{ color: 'var(--sfp-navy)' }}>
                  Gold investing in the US
                </Link>
                <Link href="/us/trading/interactive-brokers-review" className="block underline underline-offset-2" style={{ color: 'var(--sfp-navy)' }}>
                  Interactive Brokers review
                </Link>
                <Link href="/integrity" className="block underline underline-offset-2" style={{ color: 'var(--sfp-navy)' }}>
                  Integrity and editorial controls
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </article>
  );
}
