import Link from 'next/link';
import { ArrowRight, Landmark, ShieldCheck } from 'lucide-react';

interface BrokerCtaCardsProps {
  brokers: string[];
}

const brokerContent: Record<string, {
  name: string;
  eyebrow: string;
  summary: string;
  detail: string;
}> = {
  'interactive-brokers': {
    name: 'Interactive Brokers',
    eyebrow: 'Primary route for AEM access',
    summary: 'NYSE and TSX access, low trading costs, and multi-currency funding.',
    detail: 'Useful for US and Canadian investors who want one account for gold miners, ETFs, and broader portfolio execution.',
  },
  'questrade-ca': {
    name: 'Questrade',
    eyebrow: 'Canadian route',
    summary: 'Registered-account support and domestic CAD workflows for Canadian investors.',
    detail: 'Enable this only after the affiliate slug is active in the database and the destination URL has been verified.',
  },
};

export function BrokerCtaCards({ brokers }: BrokerCtaCardsProps) {
  const available = brokers
    .map((slug) => ({ slug, copy: brokerContent[slug] }))
    .filter((item): item is { slug: string; copy: typeof brokerContent[string] } => Boolean(item.copy));

  if (available.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <Landmark className="h-4 w-4" />
        Trade AEM
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        These routes are included for venue access, not as personalized broker
        recommendations. Compare fees, account protections, and tax treatment
        independently before choosing a platform.
      </p>
      <div className="mt-4 space-y-3">
        {available.map(({ slug, copy }) => (
          <Link
            key={slug}
            href={`/go/${slug}`}
            target="_blank"
            rel="nofollow noopener sponsored"
            className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {copy.eyebrow}
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-950">
                  {copy.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {copy.summary}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {copy.detail}
                </p>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 text-slate-500" />
            </div>
          </Link>
        ))}
      </div>
      <div
        className="mt-4 flex items-start gap-2 rounded-xl border px-3 py-3 text-xs leading-5"
        style={{ background: 'rgba(245,166,35,0.08)', borderColor: 'var(--sfp-gold)', color: 'var(--sfp-ink)' }}
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--sfp-gold-dark)' }} />
        <p>
          SmartFinPro may receive referral compensation from the links above. That
          compensation does not change the research conclusion and does not replace
          the need for your own broker due diligence.
        </p>
      </div>
    </section>
  );
}
