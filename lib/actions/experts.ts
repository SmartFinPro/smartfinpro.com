'use server';

import 'server-only';
import { logger } from '@/lib/logging';

import { createServiceClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';
import type { ExpertData } from '@/types';

// ── Fallback ─────────────────────────────────────────────────

const FALLBACK_EXPERT: ExpertData = {
  name: 'SmartFinPro Team',
  role: 'Editorial Team',
  bio: null,
  image_url: null,
  credentials: ['Expert Reviewer'],
  linkedin_url: null,
  verified: true,
};

// ── Safe query helper ────────────────────────────────────────

type SupabaseResult<T> = {
  data: T | null;
  error: { code?: string; message?: string } | null;
};

function safeSingle<T>(result: SupabaseResult<T>): T | null {
  if (result.error) {
    if (
      result.error.code === 'PGRST204' ||
      result.error.code === '42P01' ||
      result.error.message?.includes('schema cache') ||
      result.error.message?.includes('does not exist')
    ) {
      return null;
    }
    logger.warn('[experts] Query warning:', result.error.message);
  }
  return result.data;
}

// ── Fetch Expert ─────────────────────────────────────────────

async function fetchExpert(market: string, category?: string): Promise<ExpertData> {
  try {
    const supabase = createServiceClient();

    // 1. Try category-specific expert first
    if (category) {
      const result = await supabase
        .from('experts')
        .select('name, role, bio, image_url, credentials, linkedin_url, verified')
        .eq('market_slug', market)
        .eq('category', category)
        .eq('verified', true)
        .single();

      const expert = safeSingle(result);
      if (expert) return expert as ExpertData;
    }

    // 2. Fall back to market-level default (category IS NULL)
    const result = await supabase
      .from('experts')
      .select('name, role, bio, image_url, credentials, linkedin_url, verified')
      .eq('market_slug', market)
      .is('category', null)
      .eq('verified', true)
      .single();

    const expert = safeSingle(result);
    if (expert) return expert as ExpertData;

    // 3. Ultimate fallback
    return FALLBACK_EXPERT;
  } catch (error) {
    logger.error('[experts] Failed to fetch expert:', error);
    return FALLBACK_EXPERT;
  }
}

// ── Cached Export (24h revalidation) ─────────────────────────

export const getMarketExpert = unstable_cache(
  fetchExpert,
  ['market-expert'],
  { revalidate: 86400 } // 24 hours
);

