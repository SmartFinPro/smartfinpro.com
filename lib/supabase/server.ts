import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Service client for server-side operations with elevated privileges
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    // During build-time static generation, env vars may not be available.
    // Return a stub that silently returns empty results instead of crashing.
    console.warn('[supabase] Service client not configured — returning stub');
    const stub = {
      from: () => ({
        select: () => ({ data: null, error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
        eq: () => ({ data: null, error: null }),
        or: () => ({ data: null, error: null }),
        order: () => ({ data: null, error: null }),
        limit: () => ({ data: null, error: null }),
        single: () => ({ data: null, error: null }),
      }),
      rpc: () => ({ data: null, error: null }),
      auth: { getUser: () => ({ data: { user: null }, error: null }) },
    };
    return stub as unknown as ReturnType<typeof createServerClient>;
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}
