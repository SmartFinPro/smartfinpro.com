'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ============================================================
// Silo Class Provider
// Dynamically sets body.silo-{market} CSS class based on URL.
// This activates market-specific --sfp-silo-tint CSS variables
// defined in globals.css (e.g. body.silo-uk → #D5F0E0).
// ============================================================

const SILO_CLASSES = ['silo-us', 'silo-uk', 'silo-ca', 'silo-au'] as const;

function getMarketFromPath(pathname: string): string {
  // UK pages: /uk/...
  if (pathname.startsWith('/uk')) return 'uk';
  // Canada pages: /ca/...
  if (pathname.startsWith('/ca')) return 'ca';
  // Australia pages: /au/...
  if (pathname.startsWith('/au')) return 'au';
  // Everything else is US (clean URLs without /us prefix)
  return 'us';
}

export default function SiloClassProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const market = getMarketFromPath(pathname);
    const targetClass = `silo-${market}`;

    // Remove all silo classes first
    SILO_CLASSES.forEach((cls) => {
      document.body.classList.remove(cls);
    });

    // Add the correct one
    document.body.classList.add(targetClass);

    // Cleanup on unmount
    return () => {
      document.body.classList.remove(targetClass);
    };
  }, [pathname]);

  return null;
}
