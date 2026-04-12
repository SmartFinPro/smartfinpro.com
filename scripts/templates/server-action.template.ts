// lib/actions/{{NAME}}.ts
'use server';
import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
// import { withRetry } from '@/lib/utils/retry'; // for external API calls

export interface {{PASCAL_NAME}}Params {
  market?: 'us' | 'uk' | 'ca' | 'au';
  // TODO: define params
}

export interface {{PASCAL_NAME}}Result {
  success: boolean;
  data?: unknown[];
  error?: string;
  count?: number;
}

export async function get{{PASCAL_NAME}}(params: {{PASCAL_NAME}}Params = {}): Promise<{{PASCAL_NAME}}Result> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('TODO_TABLE_NAME')
      .select('*')
      // TODO: add filters
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('[{{NAME}}] query failed', { error: error.message, params });
      return { success: false, error: error.message };
    }

    logger.info('[{{NAME}}] success', { count: data.length });
    return { success: true, data, count: data.length };

  } catch (err) {
    logger.error('[{{NAME}}] unexpected error', err);
    return { success: false, error: 'Internal error' };
  }
}
