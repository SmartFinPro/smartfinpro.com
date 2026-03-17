import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceClient();

  const { data: logs, error } = await supabase
    .from('auto_genesis_log')
    .select('id, brief_path, market, category, keyword, slug, status, word_count, indexed, error_message, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ logs: [], error: error.message });
  }

  return NextResponse.json({ logs: logs || [] });
}
