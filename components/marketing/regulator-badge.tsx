/**
 * RegulatorBadge — Micro trust pill for CTA buttons
 *
 * Shows a small colored badge with the primary financial regulator
 * (FCA, ASIC, SEC, CIRO, etc.) near affiliate CTA buttons.
 * Returns null if no regulator applies to the market x category.
 *
 * Client-safe — no server imports.
 */

import { Shield } from 'lucide-react';
import { getPrimaryRegulator, REGULATOR_BADGE_COLORS } from '@/lib/affiliate/regulator-map';
import type { Market, Category } from '@/types';

interface RegulatorBadgeProps {
  market?: Market | string;
  category?: Category | string;
  /** 'sm' for StickyNav (10px), 'md' for AffiliateButton (11px) */
  size?: 'sm' | 'md';
}

export function RegulatorBadge({ market, category, size = 'md' }: RegulatorBadgeProps) {
  const regulator = getPrimaryRegulator(market, category);
  if (!regulator) return null;

  const colors = REGULATOR_BADGE_COLORS[regulator] || 'bg-gray-50 text-gray-600 border-gray-200';

  const sizeClasses = size === 'sm'
    ? 'text-[9px] px-1.5 py-0.5 gap-0.5'
    : 'text-[10px] px-2 py-0.5 gap-1';

  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wide border rounded-full whitespace-nowrap ${colors} ${sizeClasses}`}
    >
      <Shield className={iconSize} />
      {regulator} Regulated
    </span>
  );
}
