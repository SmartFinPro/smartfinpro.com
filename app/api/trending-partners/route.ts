// app/api/trending-partners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market') || 'us';

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('affiliate_rates')
      .select('provider_name, cpa_value, currency')
      .eq('active', true)
      .or(`market.eq.${market},market.is.null`)
      .order('cpa_value', { ascending: false })
      .limit(3);

    const partners = (data || []).map((r) => ({
      providerName: r.provider_name,
      cpaValue: r.cpa_value,
      currency: r.currency,
    }));

    return NextResponse.json(partners, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
