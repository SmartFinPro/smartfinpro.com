// components/marketing/cta-slot.tsx — Renders dashboard-configured CTA at a placement zone
import type { EnrichedCtaPartner, Placement } from '@/lib/types/page-cta';
import { FrictionlessCTA } from '@/components/marketing/frictionless-cta';
import { MiniQuiz } from '@/components/marketing/mini-quiz';

// ── Topic mapping for MiniQuiz ──────────────────────────────────

type QuizTopic = 'trading' | 'personal-finance' | 'forex' | 'business-banking' | 'ai-tools' | 'broker' | 'banking';

const CATEGORY_TO_TOPIC: Record<string, QuizTopic> = {
  'trading': 'trading',
  'forex': 'forex',
  'personal-finance': 'personal-finance',
  'business-banking': 'business-banking',
  'ai-tools': 'ai-tools',
  'credit-repair': 'personal-finance',
  'debt-relief': 'personal-finance',
  'savings': 'banking',
  'remortgaging': 'personal-finance',
  'superannuation': 'personal-finance',
  'cybersecurity': 'ai-tools',
  'gold-investing': 'trading',
  'tax-efficient-investing': 'personal-finance',
  'housing': 'personal-finance',
};

// ── Main Component ──────────────────────────────────────────────

interface CTASlotProps {
  partners: EnrichedCtaPartner[];
  placement: Placement;
  market: string;
  category: string;
}

export function CTASlot({ partners, placement, market, category }: CTASlotProps) {
  // Filter to partners assigned to this placement position
  const slotPartners = partners.filter((p) => p.placements.includes(placement));
  if (slotPartners.length === 0) return null;

  const primary = slotPartners[0];
  const displayType = primary.display_type;

  // ── Single: one partner CTA ────────────────────────────────
  if (displayType === 'single') {
    return (
      <FrictionlessCTA
        productName={primary.partner_name}
        affiliateUrl={`/go/${primary.slug}`}
        market={market}
      />
    );
  }

  // ── MiniQuiz: interactive recommendation quiz ──────────────
  if (displayType === 'mini_quiz') {
    const topic = CATEGORY_TO_TOPIC[category] || 'personal-finance';
    return (
      <MiniQuiz
        topic={topic}
        market={market as 'us' | 'uk' | 'ca' | 'au' | undefined}
      />
    );
  }

  // ── Table: comparison of all partners at this position ─────
  if (displayType === 'table') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3
          className="text-lg font-bold mb-4 flex items-center gap-2"
          style={{ color: 'var(--sfp-navy)' }}
        >
          Top Picks for You
        </h3>
        <div className="space-y-3">
          {slotPartners.map((partner, idx) => (
            <a
              key={partner.affiliate_link_id}
              href={`/go/${partner.slug}`}
              rel="nofollow noopener sponsored"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors group"
              style={{ background: idx === 0 ? 'var(--sfp-sky)' : undefined }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white"
                  style={{ background: idx === 0 ? 'var(--sfp-gold)' : 'var(--sfp-navy)' }}
                >
                  {idx + 1}
                </span>
                <span className="font-semibold text-sm" style={{ color: 'var(--sfp-ink)' }}>
                  {partner.partner_name}
                </span>
              </div>
              <span
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                style={{ background: 'var(--sfp-gold)' }}
              >
                Visit Site →
              </span>
            </a>
          ))}
        </div>
        <p className="text-[11px] mt-3" style={{ color: 'var(--sfp-slate)' }}>
          Partner links are sponsored. We may earn a commission at no extra cost to you.
        </p>
      </div>
    );
  }

  return null;
}
