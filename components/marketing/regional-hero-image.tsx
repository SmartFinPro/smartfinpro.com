'use client';

import { useState } from 'react';
import { getPillarHeroImage, getReviewImage } from '@/lib/images/asset-registry';

interface RegionalHeroImageProps {
  market: string;
  category: string;
  /** Optional review slug — if provided, looks up review-specific image first */
  slug?: string;
  className?: string;
}

const heroConfig: Record<string, Record<string, { gradient: string; label: string; icon: string }>> = {
  us: {
    trading: { gradient: 'from-blue-50 via-white to-blue-50', label: 'Wall Street Trading', icon: '📈' },
    'personal-finance': { gradient: 'from-green-50 via-white to-teal-50', label: 'Personal Finance', icon: '💳' },
    'ai-tools': { gradient: 'from-blue-50 via-white to-sky-50', label: 'AI Tools', icon: '🤖' },
    cybersecurity: { gradient: 'from-red-50 via-white to-orange-50', label: 'Cybersecurity', icon: '🔒' },
    'business-banking': { gradient: 'from-amber-50 via-white to-yellow-50', label: 'Business Banking', icon: '🏦' },
    forex: { gradient: 'from-sky-50 via-white to-blue-50', label: 'Forex Trading', icon: '💱' },
  },
  uk: {
    trading: { gradient: 'from-blue-50 via-white to-blue-50', label: 'London Markets', icon: '📊' },
    'personal-finance': { gradient: 'from-green-50 via-white to-teal-50', label: 'UK Personal Finance', icon: '💷' },
    'ai-tools': { gradient: 'from-blue-50 via-white to-sky-50', label: 'AI Tools', icon: '🤖' },
    cybersecurity: { gradient: 'from-red-50 via-white to-orange-50', label: 'Cybersecurity', icon: '🔒' },
    'business-banking': { gradient: 'from-amber-50 via-white to-yellow-50', label: 'UK Business Banking', icon: '🏦' },
  },
  ca: {
    forex: { gradient: 'from-sky-50 via-white to-blue-50', label: 'Canadian Forex', icon: '🍁' },
    'personal-finance': { gradient: 'from-green-50 via-white to-teal-50', label: 'Canadian Finance', icon: '🇨🇦' },
    'ai-tools': { gradient: 'from-blue-50 via-white to-sky-50', label: 'AI Tools', icon: '🤖' },
    cybersecurity: { gradient: 'from-red-50 via-white to-orange-50', label: 'Cybersecurity', icon: '🔒' },
    'business-banking': { gradient: 'from-amber-50 via-white to-yellow-50', label: 'CA Business Banking', icon: '🏦' },
  },
  au: {
    trading: { gradient: 'from-blue-50 via-white to-blue-50', label: 'ASX Trading', icon: '📈' },
    forex: { gradient: 'from-sky-50 via-white to-blue-50', label: 'Australian Forex', icon: '💱' },
    'personal-finance': { gradient: 'from-green-50 via-white to-teal-50', label: 'AU Home Loans', icon: '🏠' },
    'ai-tools': { gradient: 'from-blue-50 via-white to-sky-50', label: 'AI Tools', icon: '🤖' },
    cybersecurity: { gradient: 'from-red-50 via-white to-orange-50', label: 'Cybersecurity', icon: '🔒' },
    'business-banking': { gradient: 'from-amber-50 via-white to-yellow-50', label: 'AU Business Banking', icon: '🏦' },
  },
};

function GradientFallback({ config, className }: { config: { gradient: string; label: string; icon: string }; className: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 ${className}`}>
      <div className={`relative aspect-[21/9] bg-gradient-to-br ${config.gradient}`}>
        {/* Decorative mesh grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(27,79,140,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,140,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl mb-2 block">{config.icon}</span>
            <span className="text-sm font-medium tracking-wider uppercase" style={{ color: 'var(--sfp-slate)' }}>{config.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegionalHeroImage({ market, category, slug, className = '' }: RegionalHeroImageProps) {
  const [imgError, setImgError] = useState(false);
  const config = heroConfig[market]?.[category] || heroConfig.us.trading;

  // Try to resolve a real image from the asset registry
  const reviewAsset = slug ? getReviewImage(market, category, slug) : null;
  const pillarAsset = getPillarHeroImage(market, category);
  const asset = reviewAsset || pillarAsset;

  // Build conventional path for Genesis-uploaded images (not in registry)
  // Pattern: /images/content/[prefix]/[category]/[slug]/hero.webp
  const prefix = market;
  const conventionalSrc = slug
    ? `/images/content/${prefix ? prefix + '/' : ''}${category}/${slug}/hero.webp`
    : null;

  // Use registry asset if optimized, otherwise try conventional path
  const resolvedSrc = (asset && asset.status === 'optimized')
    ? asset.src
    : conventionalSrc;
  const resolvedAlt = (asset && asset.status === 'optimized')
    ? asset.alt
    : `${slug || category} — Hero`;

  // Show image if we have a source and it hasn't errored
  if (resolvedSrc && !imgError) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-gray-200 ${className}`}>
        <div className="relative aspect-[21/9]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedSrc}
            alt={resolvedAlt}
            className="object-cover w-full h-full"
            onError={() => setImgError(true)}
          />
          {/* No gradient overlay — clean image, label has its own white bg */}
          {/* Category label overlay */}
          <div className="absolute bottom-4 left-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200 shadow-sm">
              <span>{config.icon}</span>
              <span style={{ color: 'var(--sfp-ink)' }}>{config.label}</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: gradient placeholder with decorative elements
  return <GradientFallback config={config} className={className} />;
}
