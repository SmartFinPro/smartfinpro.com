// app/(marketing)/[market]/[category]/best/[topic]/opengraph-image.tsx
// Shared dynamic OG image for ALL Comparison Cockpit topic pages (one file,
// every (market, category, topic) — no per-topic files, no discrepancy between
// the two live topics and future ones). Light brand scheme per CLAUDE.md:
// ImageResponse only supports inline flexbox styles, so CSS custom properties
// (var(--sfp-navy) etc.) do NOT resolve here — hex values are hardcoded to
// match the --sfp-* tokens exactly.
import { ImageResponse } from 'next/og';
import {
  isValidMarket,
  isValidCategory,
  marketCategories,
  type Market,
  type Category,
} from '@/lib/i18n/config';
import { getCockpitData } from '@/lib/comparison/loader';
import { getTopicConfig } from '@/lib/comparison/topics/index';

export const alt = 'SmartFinPro — Independent Comparison';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Same small local helper duplicated in page.tsx (not shared in this codebase).
function isValidCombo(market: string, category: string): market is Market {
  return (
    isValidMarket(market) &&
    isValidCategory(category) &&
    marketCategories[market as Market].includes(category as Category)
  );
}

interface Props {
  params: Promise<{ market: string; category: string; topic: string }>;
}

export default async function OpengraphImage({ params }: Props) {
  const { market, category, topic } = await params;

  let title = 'Compare the best providers';
  let topPick: { name: string; rating: number } | null = null;

  if (isValidCombo(market, category)) {
    const config = getTopicConfig(category, topic, market);
    if (config) {
      title = config.h1(new Date().getFullYear());
      // products is pre-ordered by the loader — index 0 is the top pick, same
      // convention buildBestXIndex() relies on for the homepage winner chip
      // (lib/comparison/loader.ts). A topic can be registered but not yet
      // seeded ("coming soon"), so products may legitimately be empty here —
      // this route must render a generic fallback, never throw.
      const products = await getCockpitData(market as Market, category as Category, topic);
      if (products.length > 0) {
        topPick = { name: products[0].displayName, rating: products[0].rating };
      }
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#F2F4F8',
          backgroundImage:
            'linear-gradient(135deg, rgba(27,79,140,0.08) 0%, rgba(242,244,248,0) 45%), linear-gradient(315deg, rgba(245,166,35,0.10) 0%, rgba(242,244,248,0) 45%)',
          padding: '72px 80px',
          color: '#1A1A2E',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            color: '#555555',
          }}
        >
          <div style={{ display: 'flex', letterSpacing: 4 }}>
            SMARTFINPRO · INDEPENDENT COMPARISON
          </div>
          <div style={{ display: 'flex', fontWeight: 700, color: '#1B4F8C' }}>SmartFinPro</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              color: '#1A1A2E',
              maxWidth: 1000,
            }}
          >
            {title}
          </div>

          {topPick && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: 40,
                padding: '20px 28px',
                borderRadius: 16,
                backgroundColor: '#E8F0FB',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#F5A623',
                  backgroundColor: '#1B4F8C',
                  borderRadius: 999,
                  padding: '8px 20px',
                  marginRight: 24,
                  letterSpacing: 1,
                }}
              >
                TOP PICK
              </div>
              <div style={{ display: 'flex', fontSize: 32, fontWeight: 700, color: '#1A1A2E' }}>
                {topPick.name}
              </div>
              {/*
                Plain numeric rating, not star glyphs: the default ImageResponse/Satori
                font has no Unicode star characters (★/☆ render as tofu boxes — verified
                visually against a local production build), and ImageResponse doesn't do
                browser-style font fallback.
              */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  marginLeft: 20,
                  padding: '4px 16px',
                  borderRadius: 999,
                  backgroundColor: '#F5A623',
                }}
              >
                <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: '#1A1A2E' }}>
                  {topPick.rating.toFixed(1)}
                </div>
                <div style={{ display: 'flex', fontSize: 18, color: '#1A1A2E', marginLeft: 4 }}>
                  /5 rating
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 26,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                width: 16,
                height: 16,
                borderRadius: 8,
                marginRight: 14,
                backgroundColor: '#1A6B3A',
              }}
            />
            <div style={{ display: 'flex', color: '#555555' }}>smartfinpro.com</div>
          </div>
          <div style={{ display: 'flex', color: '#1A6B3A', fontWeight: 700 }}>
            Expert-Verified · Updated {new Date().getFullYear()}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
