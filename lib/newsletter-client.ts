// lib/newsletter-client.ts
// Client-safe newsletter subscription helper.
// Calls /api/subscribe instead of importing the 'use server' action directly.
// This prevents Turbopack/Webpack from bundling server-only modules (crypto,
// next/headers, @supabase/ssr) into the client chunk.

interface SubscribeResult {
  success: boolean;
  message: string;
  subscriberId?: string;
  isNew?: boolean;
}

export async function subscribeWithEmail(
  email: string,
  leadMagnet?: string,
  source?: string,
): Promise<SubscribeResult> {
  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, leadMagnet, source }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return {
        success: false,
        message: data?.message || 'Something went wrong. Please try again.',
      };
    }

    return await res.json();
  } catch {
    return { success: false, message: 'Network error. Please try again.' };
  }
}
