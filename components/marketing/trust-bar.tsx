import { Shield, Lock, Award, CheckCircle, Star } from 'lucide-react';

interface TrustBadge {
  icon: 'shield' | 'lock' | 'award' | 'check';
  label: string;
  color?: string;
}

interface TrustBarProps {
  badges?: TrustBadge[];
  market?: string;
  className?: string;
  // MDX-friendly props (converted to badges internally)
  checkmarks?: string[];
  reviewCount?: number;
  rating?: number;
}

const iconMap = {
  shield: Shield,
  lock: Lock,
  award: Award,
  check: CheckCircle,
};

const defaultBadgesByMarket: Record<string, TrustBadge[]> = {
  us: [
    { icon: 'shield', label: 'SEC / FINRA Regulated', color: 'emerald' },
    { icon: 'lock', label: 'Bank-Level Encryption', color: 'emerald' },
    { icon: 'award', label: 'Expert Verified', color: 'navy' },
    { icon: 'check', label: 'Editorial Independent', color: 'slate' },
  ],
  uk: [
    { icon: 'shield', label: 'FCA Regulated', color: 'emerald' },
    { icon: 'lock', label: 'FSCS Protected', color: 'emerald' },
    { icon: 'award', label: 'Expert Verified', color: 'navy' },
    { icon: 'check', label: 'Editorial Independent', color: 'slate' },
  ],
  ca: [
    { icon: 'shield', label: 'CIRO Regulated', color: 'emerald' },
    { icon: 'lock', label: 'CIPF Protected', color: 'emerald' },
    { icon: 'award', label: 'Expert Verified', color: 'navy' },
    { icon: 'check', label: 'Editorial Independent', color: 'slate' },
  ],
  au: [
    { icon: 'shield', label: 'ASIC / AFSL Licensed', color: 'emerald' },
    { icon: 'lock', label: 'Bank-Level Encryption', color: 'emerald' },
    { icon: 'award', label: 'Expert Verified', color: 'navy' },
    { icon: 'check', label: 'Editorial Independent', color: 'slate' },
  ],
};

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'rgba(26,107,58,0.08)', text: 'text-[var(--sfp-green)]', border: 'border-[var(--sfp-green)]/20' },
  navy: { bg: 'rgba(27,79,140,0.08)', text: 'text-[var(--sfp-navy)]', border: 'border-[var(--sfp-navy)]/20' },
  slate: { bg: 'rgba(85,85,85,0.06)', text: 'text-[var(--sfp-slate)]', border: 'border-gray-300' },
  gold: { bg: 'rgba(245,166,35,0.08)', text: 'text-[var(--sfp-gold)]', border: 'border-[var(--sfp-gold)]/20' },
};

export function TrustBar({ badges, market = 'us', className = '', checkmarks, reviewCount, rating }: TrustBarProps) {
  // If MDX-style checkmarks are provided, convert them to badges
  let activeBadges: TrustBadge[];

  if (checkmarks && checkmarks.length > 0) {
    activeBadges = checkmarks.map((label) => ({
      icon: 'check' as const,
      label,
      color: 'emerald',
    }));
  } else {
    activeBadges = badges || defaultBadgesByMarket[market] || defaultBadgesByMarket.us;
  }

  return (
    <div className={`py-4 ${className}`}>
      {/* Rating line (when provided via MDX) */}
      {(reviewCount || rating) && (
        <div className="flex items-center justify-center gap-3 mb-3 text-sm">
          {rating && (
            <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="h-4 w-4 fill-amber-500" />
              {rating}/5
            </span>
          )}
          {reviewCount && (
            <span style={{ color: 'var(--sfp-slate)' }}>
              Based on {reviewCount.toLocaleString('en-US')} reviews
            </span>
          )}
        </div>
      )}
      {/* Badge row */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {activeBadges.map((badge, idx) => {
          const Icon = iconMap[badge.icon];
          const colors = colorClasses[badge.color || 'slate'];
          return (
            <div
              key={idx}
              className={`trust-signal inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colors.border} text-xs font-medium`}
              style={{ background: colors.bg }}
            >
              <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
              <span className={colors.text}>{badge.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
