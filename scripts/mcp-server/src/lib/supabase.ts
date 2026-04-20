// Service-role Supabase client for MCP tools.
// Pattern mirrors lib/supabase/server.ts:32 but uses the standalone
// @supabase/supabase-js client (no Next.js cookies adapter needed).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      '[mcp-server] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY missing. ' +
        'Check repo-root .env.local is readable and dotenv loaded it.',
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
