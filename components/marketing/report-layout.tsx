// components/marketing/report-layout.tsx
// Premium Research Report layout inspired by market.us
// Two-column layout: Content (left) + Sticky CTA Sidebar (right)

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Calendar,
  Clock,
  User,
  Star,
  Shield,
  CheckCircle,
  XCircle,
  Zap,
  FileText,
  Share2,
  BarChart3,
  ChevronDown,
  BadgeCheck,
  AlertTriangle,
} from 'lucide-react';
import { Breadcrumb } from './breadcrumb';
import { FAQSection } from './faq-section';
import { ComparisonTable } from './comparison-table';
import { ComparisonTablePremium } from './comparison-table-premium';
import { DebtReliefMiniRecommender } from './debt-relief-mini-recommender';
import { ExpertVerifier } from '@/components/marketing/expert-verifier';
import { FrictionlessCTA } from '@/components/marketing/frictionless-cta';
import { StickyFooterCTA } from '@/components/marketing/sticky-footer-cta';
import { SafeMDX } from '@/components/content/SafeMDX';
import { TrustBlockTracker } from '@/components/marketing/trust-block-tracker';
import { generateReviewSchema } from '@/lib/seo/schema';
import { categoryConfig } from '@/lib/i18n/config';
import type { Market, Category } from '@/lib/i18n/config';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';
import type { ContentItem } from '@/lib/mdx';
import type { ReviewData, ExpertData } from '@/types';
import type { MDXRemoteSerializeResult } from '@/lib/mdx/types';
import { getFirstMondayOfMonth } from '@/lib/utils/date-helpers';

interface ReportLayoutProps {
  review: ReviewData;
  mdxSource?: MDXRemoteSerializeResult;
  relatedArticles?: ContentItem[];
  siblingReviews?: ContentItem[];
  expert?: ExpertData;
  market: Market;
  category: Category;
}

function normalizePersonName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^dr\.\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeRole(text: string): boolean {
  return /(attorney|analyst|specialist|planner|researcher|expert|advisor|editor|examiner)/i.test(text);
}

function parseReviewedBy(reviewedBy?: string): { name: string; details: string[] } {
  if (!reviewedBy) return { name: '', details: [] };
  const parts = reviewedBy
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    name: parts[0] || '',
    details: parts.slice(1),
  };
}

function resolveExpertImageFromReviewedBy(reviewedBy?: string): string | null {
  if (!reviewedBy) return null;

  const normalized = normalizePersonName(reviewedBy.split(',')[0]?.trim() || '');

  const byName: Record<string, string> = {
    'james miller': '/images/experts/james-miller.jpg',
    'michael torres': '/images/experts/michael-torres.jpg',
    'robert hayes': '/images/experts/robert-hayes.jpg',
    'james mitchell': '/images/experts/james-mitchell.jpg',
    'michael chen': '/images/experts/michael-chen.jpg',
    'sarah chen': '/images/experts/sarah-chen.jpg',
    'sarah thompson': '/images/experts/sarah-thompson.jpg',
    'james blackwood': '/images/experts/james-blackwood.jpg',
    'marc fontaine': '/images/experts/marc-fontaine.jpg',
    'philippe leblanc': '/images/experts/philippe-leblanc.jpg',
    'daniel whitfield': '/images/experts/daniel-whitfield.jpg',
    'james liu': '/images/experts/james-liu.jpg',
  };

  return byName[normalized] || null;
}

export function ReportLayout({
  review,
  mdxSource,
  relatedArticles,
  siblingReviews,
  expert,
  market,
  category,
}: ReportLayoutProps) {
  const marketPrefix = `/${market}`;
  const categoryName = categoryConfig[category]?.name || category.replace('-', ' ');
  const year = new Date().getFullYear();
  const formattedDate = new Date(review.modifiedDate).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  const reportId = Math.abs(
    review.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 17 + 100000
  );
  // Guide mode: no rating, no CTA, no pros/cons — clean research paper style
  const isGuide = review.isGuide || false;
  const hasRating = !isGuide && review.rating > 0;
  const hasAffiliate = !isGuide && review.affiliateUrl && review.affiliateUrl !== '#';
  const hasProscons = !isGuide && (review.pros.length > 0 || review.cons.length > 0);
  const factCheckedDate = getFirstMondayOfMonth();
  const factCheckedLabel = new Date(factCheckedDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const reviewedByImage = resolveExpertImageFromReviewedBy(review.reviewedBy);
  const dbImage = expert?.image_url?.startsWith('/images/experts/') ? expert.image_url : null;
  const expertImage = reviewedByImage || dbImage || undefined;
  const parsedReviewedBy = parseReviewedBy(review.reviewedBy);
  const reviewerName = parsedReviewedBy.name || expert?.name || 'Expert Reviewer';
  const sameReviewerAsExpert =
    normalizePersonName(parsedReviewedBy.name) &&
    normalizePersonName(parsedReviewedBy.name) === normalizePersonName(expert?.name);
  const firstDetail = parsedReviewedBy.details[0] || '';
  const inferredRole = firstDetail && looksLikeRole(firstDetail) ? firstDetail : '';
  const reviewerTitle = inferredRole || (sameReviewerAsExpert ? expert?.role : '') || 'Expert Reviewer';
  const reviewerCredentials = (() => {
    if (parsedReviewedBy.details.length > 0) {
      if (inferredRole) {
        return parsedReviewedBy.details.slice(1);
      }
      return parsedReviewedBy.details;
    }
    return expert?.credentials || [];
  })();
  const reviewerBio = sameReviewerAsExpert ? expert?.bio || undefined : undefined;
  const reviewerLinkedIn = sameReviewerAsExpert ? expert?.linkedin_url || undefined : undefined;
  const showExpertCards = reviewerName !== 'SmartFinPro Team';

  return (
    <article className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Schema.org JSON-LD — only review schema for actual reviews */}
      {!isGuide && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateReviewSchema(review)),
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          1. REPORT HERO SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 pt-8 pb-6">
          {/* Breadcrumb */}
          <div className="max-w-7xl mx-auto mb-6">
            <Breadcrumb
              items={buildBreadcrumbs(
                market,
                category,
                review.productName,
                category,
              )}
            />
          </div>

          {/* Title */}
          <div className="max-w-7xl mx-auto">
            <h1
              className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-6"
              style={{ color: 'var(--sfp-ink)' }}
            >
              {review.title}{isGuide ? '' : ` — Expert Review & Analysis Report ${year}`}
            </h1>

            {/* Meta Bar */}
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 rounded-xl text-sm mb-6"
              style={{ background: 'var(--sfp-gray)' }}
            >
              <div className="flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                <Calendar className="h-3.5 w-3.5" />
                <span>Published: <strong style={{ color: 'var(--sfp-ink)' }}>{formattedDate}</strong></span>
              </div>
              <div className="w-px h-4 bg-gray-300 hidden md:block" />
              <div className="flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                <span>Report ID: <strong style={{ color: 'var(--sfp-ink)' }}>{reportId}</strong></span>
              </div>
              <div className="w-px h-4 bg-gray-300 hidden md:block" />
              <div className="flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                <FileText className="h-3.5 w-3.5" />
                <span>Sections: <strong style={{ color: 'var(--sfp-ink)' }}>{review.sections?.length || 0}</strong></span>
              </div>
              {hasRating && (
                <>
                  <div className="w-px h-4 bg-gray-300 hidden md:block" />
                  <div className="flex items-center gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(review.rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm font-semibold ml-1" style={{ color: 'var(--sfp-ink)' }}>
                      ({review.reviewCount})
                    </span>
                  </div>
                </>
              )}
              <div className="w-px h-4 bg-gray-300 hidden md:block" />
              <div className="flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                <span>Format: <strong style={{ color: 'var(--sfp-ink)' }}>{isGuide ? 'Expert Guide' : 'Expert Review'}</strong></span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-0 border-b border-gray-200 -mb-px">
              <a
                href="#overview"
                className="px-5 py-3 text-sm font-semibold border-b-2 transition-colors"
                style={{ borderColor: 'var(--sfp-navy)', color: 'var(--sfp-navy)', background: 'rgba(27, 79, 140, 0.05)' }}
              >
                Overview
              </a>
              <a
                href="#quick-navigation"
                className="px-5 py-3 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 transition-colors"
                style={{ color: 'var(--sfp-slate)' }}
              >
                Table of Contents
              </a>
              {review.competitors && review.competitors.length > 0 && (
                <a
                  href="#comparison"
                  className="px-5 py-3 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 transition-colors"
                  style={{ color: 'var(--sfp-slate)' }}
                >
                  Comparison
                </a>
              )}
              {review.faqs && review.faqs.length > 0 && (
                <a
                  href="#faq"
                  className="px-5 py-3 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 transition-colors"
                  style={{ color: 'var(--sfp-slate)' }}
                >
                  FAQ
                </a>
              )}
              {hasAffiliate && (
                <a
                  href={review.affiliateUrl}
                  target="_blank"
                  rel="noopener sponsored"
                  className="ml-auto px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 no-underline hover:no-underline"
                  style={{ background: 'var(--sfp-gold)', color: '#ffffff', textDecoration: 'none' }}
                >
                  Visit {review.productName} <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          2. TWO-COLUMN LAYOUT
          ═══════════════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

          {/* ── LEFT: Main Content (~70%) ────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Quick Verdict Card (reviews only) */}
            {hasProscons && (
              <div id="overview" className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
                    <Zap className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>Quick Verdict</h2>
                </div>

                <p className="mb-6" style={{ color: 'var(--sfp-ink)' }}>{review.description}</p>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Pros */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--sfp-green)' }}>
                      What We Love
                    </h3>
                    <ul className="space-y-2.5">
                      {review.pros.slice(0, 5).map((pro, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                          <span style={{ color: 'var(--sfp-ink)' }}>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Cons */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--sfp-red)' }}>
                      Watch Out For
                    </h3>
                    <ul className="space-y-2.5">
                      {review.cons.slice(0, 5).map((con, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <XCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-red)' }} />
                          <span style={{ color: 'var(--sfp-ink)' }}>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Best For + Pricing */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                  {review.bestFor && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold" style={{ color: 'var(--sfp-navy)' }}>Best For:</span>
                      <span style={{ color: 'var(--sfp-ink)' }}>{review.bestFor}</span>
                    </div>
                  )}
                  {review.pricing && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold" style={{ color: 'var(--sfp-navy)' }}>Pricing:</span>
                      <span style={{ color: 'var(--sfp-ink)' }}>{review.pricing}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Guide Description Card (guides only — replaces Quick Verdict) */}
            {isGuide && (
              <div id="overview" className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
                    <FileText className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>Executive Summary</h2>
                </div>
                <p style={{ color: 'var(--sfp-ink)' }}>{review.description}</p>
              </div>
            )}

            {/* Quick Navigation (Collapsible TOC) */}
            {review.sections && review.sections.length > 0 && (
              <details id="quick-navigation" className="rounded-2xl border border-gray-200 bg-white p-5 mb-8 shadow-sm group" open>
                <summary className="font-bold text-lg cursor-pointer flex items-center justify-between" style={{ color: 'var(--sfp-ink)' }}>
                  <span className="flex items-center gap-3">
                    <FileText className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                    Quick Navigation
                  </span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" style={{ color: 'var(--sfp-slate)' }} />
                </summary>
                <nav className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1.5 pl-0 md:pl-1">
                  {review.sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="group/toc flex items-center justify-between gap-2 text-[13px] md:text-sm py-1.5 px-2 rounded-md hover:bg-gray-50 transition-colors no-underline hover:no-underline"
                      style={{ color: 'var(--sfp-ink)', textDecoration: 'none' }}
                    >
                      <span className="font-medium leading-tight">{section.title}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 opacity-0 -translate-x-1 group-hover/toc:opacity-60 group-hover/toc:translate-x-0 transition-all" style={{ color: 'var(--sfp-navy)' }} />
                    </a>
                  ))}
                </nav>
              </details>
            )}

            {/* MDX Content */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm mb-8">
              <div className="prose prose-lg max-w-none">
                {mdxSource ? (
                  <SafeMDX source={mdxSource} />
                ) : (
                  <p style={{ color: 'var(--sfp-slate)' }}>Review content is being prepared.</p>
                )}
              </div>
            </div>

            {/* Expert Verifier */}
            {showExpertCards && (
              <div className="mb-8">
                <ExpertVerifier
                  name={reviewerName}
                  title={reviewerTitle}
                  credentials={reviewerCredentials.length > 0 ? reviewerCredentials : ['Expert Reviewer']}
                  lastFactChecked={factCheckedDate}
                  bio={reviewerBio}
                  image={expertImage}
                  linkedInUrl={reviewerLinkedIn}
                />
              </div>
            )}

            {/* Last Updated / Editorial Transparency Block */}
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <TrustBlockTracker block="editorial-transparency" slug={`${marketPrefix}/${category}`} market={market} />
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-navy)' }}>
                <Clock className="h-4 w-4" />
                Editorial Transparency
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--sfp-slate)' }} />
                  <div>
                    <span className="font-medium" style={{ color: 'var(--sfp-ink)' }}>Published: </span>
                    <span style={{ color: 'var(--sfp-slate)' }}>
                      {new Date(review.publishDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--sfp-slate)' }} />
                  <div>
                    <span className="font-medium" style={{ color: 'var(--sfp-ink)' }}>Last updated: </span>
                    <span style={{ color: 'var(--sfp-slate)' }}>
                      {new Date(review.modifiedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--sfp-slate)' }} />
                  <div>
                    <span className="font-medium" style={{ color: 'var(--sfp-ink)' }}>Reviewed by: </span>
                    <span style={{ color: 'var(--sfp-slate)' }}>{reviewerName}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--sfp-slate)' }} />
                  <div>
                    <span className="font-medium" style={{ color: 'var(--sfp-ink)' }}>Fact-checked: </span>
                    <span style={{ color: 'var(--sfp-slate)' }}>{factCheckedLabel}</span>
                  </div>
                </div>
              </div>
              {/* Change Log — shows what was updated */}
              {review.modifiedDate !== review.publishDate && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--sfp-navy)' }}>What changed since last update:</p>
                  <ul className="text-xs space-y-1" style={{ color: 'var(--sfp-slate)' }}>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--sfp-green)' }} />
                      Pricing and fee information verified against provider website
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--sfp-green)' }} />
                      Feature availability and regulatory status re-confirmed
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--sfp-green)' }} />
                      Competitor comparison data refreshed
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Comparison Table */}
            {review.competitors && review.competitors.length > 0 && (
              <div id="comparison" className="mb-8">
                <ComparisonTable
                  products={review.competitors.map((c, i) => ({
                    name: c.name,
                    slug: c.name.toLowerCase().replace(/\s+/g, '-'),
                    rating: c.rating,
                    reviewCount: c.reviewCount,
                    price: c.price,
                    affiliateUrl: '#',
                    isRecommended: i === 0,
                    features: c.features,
                  }))}
                  title={`${review.productName} vs Competitors`}
                />
              </div>
            )}

            {/* FAQ Section */}
            {review.faqs && review.faqs.length > 0 && (
              <div id="faq" className="mb-8">
                <FAQSection faqs={review.faqs} />
              </div>
            )}

            {/* Mini Pre-CTA (Debt Relief only) — A: Decision-first */}
            {hasAffiliate && category === 'debt-relief' && (
              <DebtReliefMiniRecommender affiliateUrl={review.affiliateUrl} />
            )}

            {/* Trust Methodology Block */}
            {hasAffiliate && (
              <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <TrustBlockTracker block="methodology-disclosure" slug={`${marketPrefix}/${category}`} market={market} />
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--sfp-navy)' }}>
                  Research Methodology & Disclosure
                </h3>
                <div className="space-y-2 text-sm" style={{ color: 'var(--sfp-ink)' }}>
                  <p>
                    <strong>Last fact-check:</strong> {factCheckedLabel}
                  </p>
                  <p>
                    <strong>Data points reviewed:</strong> {review.reviewCount.toLocaleString('en-US')} consumer records, lender pricing pages, and public regulator guidance.
                  </p>
                  <p>
                    <strong>Primary sources:</strong> CFPB, Federal Reserve, IRS, NFCC, and provider disclosures.
                  </p>
                  <p style={{ color: 'var(--sfp-slate)' }}>
                    We may earn a commission from partner links, but rankings and recommendations are set by editorial criteria.
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-100">
                    <a href="/methodology" className="text-xs font-medium underline" style={{ color: 'var(--sfp-navy)' }}>Our Methodology</a>
                    <a href="/review-policy" className="text-xs font-medium underline" style={{ color: 'var(--sfp-navy)' }}>Review Policy</a>
                    <a href="/editorial-policy" className="text-xs font-medium underline" style={{ color: 'var(--sfp-navy)' }}>Editorial Policy</a>
                    <a href="/corrections-policy" className="text-xs font-medium underline" style={{ color: 'var(--sfp-navy)' }}>Corrections Policy</a>
                  </div>
                </div>
              </div>
            )}

            {/* "Not for you if…" Honesty Box — builds trust before the CTA */}
            {hasAffiliate && review.cons && review.cons.length > 0 && (
              <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm" style={{ borderLeft: '4px solid var(--sfp-red)', border: '1px solid #e5e5e5', borderLeftWidth: '4px', borderLeftColor: 'var(--sfp-red)' }}>
                <TrustBlockTracker block="not-for-you" slug={`${marketPrefix}/${category}`} market={market} />
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-red)' }}>
                  <AlertTriangle className="h-4 w-4" />
                  {review.productName} may not be for you if…
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-ink)' }}>
                  {review.cons.slice(0, 3).map((con, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--sfp-red)' }} />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs mt-3 pt-3 border-t border-gray-100" style={{ color: 'var(--sfp-slate)' }}>
                  We believe honest disclosure of limitations helps you make better financial decisions.
                </p>
              </div>
            )}

            {/* CTA (reviews with affiliate only) — Premium comparison card */}
            {hasAffiliate && (() => {
              // Extract short pricing string (first line / first segment only)
              const shortPricing = review.pricing
                ? review.pricing.split(/[,;|]/)[0].trim().slice(0, 30)
                : '';
              // Extract short guarantee (first segment)
              const shortGuarantee = review.guarantee
                ? review.guarantee.split(/[,;|]/)[0].trim().slice(0, 30)
                : '';
              // Build columns — max 3, only short values
              const columns: { key: string; label: string; isBadgeColumn?: boolean }[] = [];
              const data: Record<string, string> = {};
              if (shortPricing) {
                columns.push({ key: 'pricing', label: 'Pricing' });
                data.pricing = shortPricing;
              }
              if (shortGuarantee) {
                columns.push({ key: 'guarantee', label: 'Guarantee' });
                data.guarantee = shortGuarantee;
              }
              // If we have fewer than 2 columns, add rating as text
              if (columns.length < 2 && review.rating > 0) {
                columns.push({ key: 'score', label: 'Score' });
                data.score = `${review.rating}/5`;
              }
              // Short tagline from bestFor — max 50 chars
              const tagline = review.bestFor
                ? review.bestFor.slice(0, 50) + (review.bestFor.length > 50 ? '…' : '')
                : '';

              return (
                <div className="my-12">
                  <ComparisonTablePremium
                    title={`Ready to try ${review.productName}?`}
                    market={market}
                    ctaLabel="Get Started"
                    editorChoiceLabel="Our Pick"
                    columns={columns}
                    items={[
                      {
                        name: review.productName,
                        slug: '',
                        tagline,
                        rating: review.rating,
                        reviewCount: review.reviewCount,
                        affiliateUrl: review.affiliateUrl,
                        isEditorsChoice: true,
                        data,
                        pros: review.pros.slice(0, 3),
                        con: review.cons[0] || undefined,
                        verdict: review.description || undefined,
                      },
                    ]}
                    expandableVerdict={true}
                  />
                  <div className="mt-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>
                    Not legal, tax, or bankruptcy advice. Terms vary by state and credit profile.
                  </div>
                </div>
              );
            })()}

            {/* Sibling Reviews — "More Reports in {Category}" */}
            {siblingReviews && siblingReviews.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
                  More {categoryName} Reviews
                </h3>
                <div className="space-y-4">
                  {siblingReviews.slice(0, 5).map((item) => (
                    <Link
                      key={item.slug}
                      href={`${marketPrefix}/${category}/${item.slug}`}
                      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
                    >
                      <h4 className="font-semibold mb-1.5 line-clamp-2" style={{ color: 'var(--sfp-navy)' }}>
                        {item.meta.title}
                      </h4>
                      <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--sfp-slate)' }}>
                        {item.meta.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>
                        {item.meta.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(item.meta.rating!)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-1 font-medium" style={{ color: 'var(--sfp-ink)' }}>
                              ({item.meta.reviewCount || 0})
                            </span>
                          </div>
                        )}
                        <div className="w-px h-3 bg-gray-300" />
                        <span>
                          {new Date(item.meta.modifiedDate || item.meta.publishDate).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {item.meta.pricing && (
                          <>
                            <div className="w-px h-3 bg-gray-300" />
                            <span className="font-medium" style={{ color: 'var(--sfp-ink)' }}>{item.meta.pricing}</span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Sticky CTA Sidebar (~300px) ───────────────────── */}
          <aside className="lg:w-[300px] flex-shrink-0 hidden lg:block">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Expert Photo Card */}
              {showExpertCards && (
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  {expertImage && (
                    <div className="relative w-full aspect-[4/3] overflow-hidden" style={{ background: 'var(--sfp-sky)' }}>
                      <Image
                        src={expertImage}
                        alt={`${reviewerName} — ${reviewerTitle}`}
                        fill
                        className="object-cover object-top"
                        sizes="300px"
                        priority
                      />
                    </div>
                  )}
                  <div className="p-4 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--sfp-green)' }}>
                      ✓ Reviewed &amp; Verified
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>{reviewerName}</span>
                      <BadgeCheck className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                    </div>
                    <div className="text-xs mb-2" style={{ color: 'var(--sfp-slate)' }}>{reviewerTitle}</div>
                    {reviewerCredentials.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {reviewerCredentials.slice(0, 3).map((cred, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                            style={{ color: 'var(--sfp-navy)', background: 'var(--sfp-sky)', borderColor: 'rgba(27,79,140,0.15)' }}
                          >
                            {cred}
                          </span>
                        ))}
                      </div>
                    )}
                    {reviewerLinkedIn && (
                      <a
                        href={reviewerLinkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] mt-2 no-underline hover:underline"
                        style={{ color: 'var(--sfp-navy)' }}
                      >
                        View Profile →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Report Info Card */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Report Details */}
                <div className="p-5">
                  <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--sfp-sky)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'var(--sfp-navy)' }}
                      >
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sfp-slate)' }}>
                          {isGuide ? 'Expert Guide' : 'Expert Review'}
                        </div>
                        <div className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>
                          {review.productName}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--sfp-slate)' }}>Report ID</span>
                        <span className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>{reportId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--sfp-slate)' }}>Published</span>
                        <span className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>{formattedDate}</span>
                      </div>
                      {hasRating && (
                        <div className="flex justify-between items-center">
                          <span style={{ color: 'var(--sfp-slate)' }}>Rating</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < Math.floor(review.rating)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-semibold ml-1" style={{ color: 'var(--sfp-ink)' }}>
                              ({review.reviewCount})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary CTA (reviews with affiliate only) */}
                  {hasAffiliate && (
                    <>
                      <Link
                        href={review.affiliateUrl}
                        target="_blank"
                        rel="noopener sponsored"
                        className="w-full h-12 text-base font-semibold border-0 shadow-md hover:shadow-lg transition-all rounded-xl inline-flex items-center justify-center no-underline hover:no-underline hover:brightness-110"
                        style={{ background: 'var(--sfp-gold)', color: '#ffffff', textDecoration: 'none' }}
                      >
                        Visit {review.productName} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                      <p className="mt-2 text-[11px] leading-snug" style={{ color: 'var(--sfp-slate)' }}>
                        No obligation. Approval, fees, and outcomes depend on your debt profile and state regulations.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Trust Badge Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-center">
                <div className="text-sm font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>
                  Trusted by <strong style={{ color: 'var(--sfp-navy)' }}>50,000+</strong> professionals
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--sfp-slate)' }}>
                  Expert-reviewed &amp; independently verified
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--sfp-green)' }}>Verified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--sfp-navy)' }}>
                      {review.reviewedBy ? `By ${review.reviewedBy.split(',')[0]}` : 'Expert Review'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Author Info */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--sfp-slate)' }}>
                  Review Author
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: 'var(--sfp-navy)' }}
                  >
                    {review.author?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SF'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{review.author}</div>
                    <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                      Updated{' '}
                      {new Date(review.modifiedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </aside>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. MOBILE CTA (visible only on mobile, reviews only)
          ═══════════════════════════════════════════════════════════════ */}
      {hasAffiliate && (
        <>
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-white border-t border-gray-200 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--sfp-ink)' }}>{review.productName}</div>
                {hasRating && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(review.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs ml-1" style={{ color: 'var(--sfp-slate)' }}>({review.reviewCount})</span>
                  </div>
                )}
              </div>
              <Link
                href={review.affiliateUrl}
                target="_blank"
                rel="noopener sponsored"
                className="h-10 px-5 text-sm font-semibold border-0 rounded-lg shrink-0 inline-flex items-center justify-center no-underline hover:no-underline hover:brightness-110 transition-all"
                style={{ background: 'var(--sfp-gold)', color: '#ffffff', textDecoration: 'none' }}
              >
                Visit Site <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          {/* Spacer for mobile fixed CTA */}
          <div className="h-16 lg:hidden" />
        </>
      )}

      {/* Disclaimer */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl p-5 text-xs" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-slate)' }}>
            <p className="mb-2">
              <strong>Affiliate Disclosure:</strong> SmartFinPro may earn a commission when you click links and make a purchase.
              This does not affect our editorial independence.{' '}
              <Link href="/affiliate-disclosure" className="underline hover:no-underline" style={{ color: 'var(--sfp-navy)' }}>
                Learn more
              </Link>
            </p>
            {(category === 'trading' || category === 'forex') && (
              <p>
                <strong>Risk Warning:</strong> CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage.
                Past performance is not indicative of future results.
              </p>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}
