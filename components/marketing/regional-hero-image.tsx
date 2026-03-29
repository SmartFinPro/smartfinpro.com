'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getPillarHeroImage, getReviewImage } from '@/lib/images/asset-registry';

interface RegionalHeroImageProps {
  market: string;
  category: string;
  /** Optional review slug — if provided, looks up review-specific image first */
  slug?: string;
  className?: string;
}

type HeroEntry = { gradient: string; label: string; icon: string; aspectRatio?: string };

const heroConfig: Record<string, Record<string, HeroEntry>> = {
  us: {
    trading: { gradient: 'from-blue-50 via-white to-blue-50', label: 'Wall Street Trading', icon: '📈' },
    'personal-finance': { gradient: 'from-green-50 via-white to-teal-50', label: 'Personal Finance', icon: '💳' },
    'ai-tools': { gradient: 'from-blue-50 via-white to-sky-50', label: 'AI Tools', icon: '🤖' },
    cybersecurity: { gradient: 'from-red-50 via-white to-orange-50', label: 'Cybersecurity', icon: '🔒' },
    'business-banking': { gradient: 'from-amber-50 via-white to-yellow-50', label: 'Business Banking', icon: '🏦' },
    forex: { gradient: 'from-sky-50 via-white to-blue-50', label: 'Forex Trading', icon: '💱' },
    'gold-investing': { gradient: 'from-amber-50 via-white to-yellow-50', label: 'Gold Investing', icon: '🥇', aspectRatio: '3/2' },
    'credit-score': { gradient: 'from-green-50 via-white to-emerald-50', label: 'Credit Score', icon: '📊' },
    'credit-repair': { gradient: 'from-orange-50 via-white to-amber-50', label: 'Credit Repair', icon: '🔧' },
    'debt-relief': { gradient: 'from-teal-50 via-white to-green-50', label: 'Debt Relief', icon: '💚' },
  },
  uk: {
    trading: { gradient: 'from-blue-50 via-white to-blue-50', label: 'London Markets', icon: '📊' },
    'personal-finance': { gradient: 'from-green-50 via-white to-teal-50', label: 'UK Personal Finance', icon: '💷' },
    'ai-tools': { gradient: 'from-blue-50 via-white to-sky-50', label: 'AI Tools', icon: '🤖' },
    cybersecurity: { gradient: 'from-red-50 via-white to-orange-50', label: 'Cybersecurity', icon: '🔒' },
    'business-banking': { gradient: 'from-amber-50 via-white to-yellow-50', label: 'UK Business Banking', icon: '🏦' },
    forex: { gradient: 'from-sky-50 via-white to-blue-50', label: 'UK Forex Trading', icon: '💱' },
    savings: { gradient: 'from-green-50 via-white to-teal-50', label: 'UK Savings Accounts', icon: '🏦' },
    remortgaging: { gradient: 'from-sky-50 via-white to-blue-50', label: 'UK Remortgaging', icon: '🏠' },
    'cost-of-living': { gradient: 'from-orange-50 via-white to-amber-50', label: 'UK Cost of Living', icon: '🛒' },
  },
  ca: {
    forex: { gradient: 'from-sky-50 via-white to-blue-50', label: 'Canadian Forex', icon: '🍁' },
    'personal-finance': { gradient: 'from-green-50 via-white to-teal-50', label: 'Canadian Finance', icon: '🇨🇦' },
    'ai-tools': { gradient: 'from-blue-50 via-white to-sky-50', label: 'AI Tools', icon: '🤖' },
    cybersecurity: { gradient: 'from-red-50 via-white to-orange-50', label: 'Cybersecurity', icon: '🔒' },
    'business-banking': { gradient: 'from-amber-50 via-white to-yellow-50', label: 'CA Business Banking', icon: '🏦' },
    housing: { gradient: 'from-sky-50 via-white to-teal-50', label: 'Canadian Housing & Mortgage', icon: '🏠' },
    trading: { gradient: 'from-blue-50 via-white to-blue-50', label: 'Canadian Trading', icon: '📊' },
    'tax-efficient-investing': { gradient: 'from-green-50 via-white to-emerald-50', label: 'Tax-Efficient Investing', icon: '🍁' },
    'gold-investing': { gradient: 'from-amber-50 via-white to-yellow-50', label: 'Gold Investing Canada', icon: '🥇', aspectRatio: '3/2' },
  },
  au: {
    trading: { gradient: 'from-blue-50 via-white to-blue-50', label: 'ASX Trading', icon: '📈' },
    forex: { gradient: 'from-sky-50 via-white to-blue-50', label: 'Australian Forex', icon: '💱' },
    'personal-finance': { gradient: 'from-green-50 via-white to-teal-50', label: 'AU Personal Finance', icon: '🦘' },
    'ai-tools': { gradient: 'from-blue-50 via-white to-sky-50', label: 'AI Tools', icon: '🤖' },
    cybersecurity: { gradient: 'from-red-50 via-white to-orange-50', label: 'Cybersecurity', icon: '🔒' },
    'business-banking': { gradient: 'from-amber-50 via-white to-yellow-50', label: 'AU Business Banking', icon: '🏦' },
    'gold-investing': { gradient: 'from-amber-50 via-white to-yellow-50', label: 'AU Gold Investing', icon: '🥇', aspectRatio: '3/2' },
    savings: { gradient: 'from-green-50 via-white to-teal-50', label: 'AU Savings Accounts', icon: '🏦' },
    superannuation: { gradient: 'from-sky-50 via-white to-blue-50', label: 'Australian Superannuation', icon: '🦘' },
  },
};

function GradientFallback({ config, className }: { config: HeroEntry; className: string }) {
  const aspectRatio = config.aspectRatio ?? '21/9';
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 ${className}`}>
      <div className={`relative bg-gradient-to-br ${config.gradient}`} style={{ aspectRatio }}>
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
  const genericFallback = { gradient: 'from-slate-50 via-white to-blue-50', label: 'SmartFinPro', icon: '📋' };
  const config = heroConfig[market]?.[category] || heroConfig.us?.[category] || genericFallback;

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
  const aspectRatio = config.aspectRatio ?? '21/9';

  if (resolvedSrc && !imgError) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-gray-200 ${className}`}>
        <div className="relative" style={{ aspectRatio }}>
          <Image
            src={resolvedSrc}
            alt={resolvedAlt}
            fill
            priority
            fetchPriority="high"
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
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
