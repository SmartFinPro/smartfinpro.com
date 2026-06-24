// components/marketing/tracked-review-link.tsx
'use client';

/**
 * TrackedReviewLink — a thin client wrapper around next/link that fires a
 * fire-and-forget analytics event on click. Lets Server Components (e.g.
 * EditorialBacklink) keep their own server rendering while still tracking a
 * single link, without going 'use client' themselves.
 *
 * Tracking is best-effort only (useAnalytics().trackEvent uses sendBeacon /
 * keepalive + silent catch) — it never blocks navigation.
 */

import Link from 'next/link';
import { useAnalytics } from '@/lib/hooks/use-analytics';

export function TrackedReviewLink({
  href,
  eventName,
  eventCategory = 'firewall_configurator',
  className,
  children,
}: {
  href: string;
  eventName: string;
  eventCategory?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { trackEvent } = useAnalytics({ trackPageViews: false });
  return (
    <Link href={href} className={className} onClick={() => trackEvent(eventName, { category: eventCategory })}>
      {children}
    </Link>
  );
}
