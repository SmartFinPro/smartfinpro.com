'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

interface TrackedAffiliateLinkProps {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  eventLabel: string;
  market: string;
  category: string;
  pageType: string;
  layoutVariant: string;
  placement: string;
}

export function TrackedAffiliateLink({
  href,
  className,
  style,
  children,
  eventLabel,
  market,
  category,
  pageType,
  layoutVariant,
  placement,
}: TrackedAffiliateLinkProps) {
  const pathname = usePathname();

  function handleClick() {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        type: 'event',
        sessionId: getSessionId(),
        data: {
          eventName: 'affiliate_cta_click',
          eventCategory: 'affiliate',
          eventAction: 'click',
          eventLabel,
          pagePath: pathname || '/',
          properties: {
            page_type: pageType,
            market,
            category,
            layout_variant: layoutVariant,
            placement,
            target_href: href,
          },
        },
      }),
    }).catch(() => {});
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener sponsored"
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </Link>
  );
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem('sfp_sid');
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; // safe — sessionStorage branch, client-only
    sessionStorage.setItem('sfp_sid', id);
  }
  return id;
}
