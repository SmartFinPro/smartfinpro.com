// app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-content.ts
// Shared, framework-neutral content for the Programmatic Financial Firewall page.
// Imported by BOTH firewall-client.tsx ('use client') and page.tsx (Server Component),
// so it must contain NO 'use client'/'use server' directive and no server-only imports.

export const REVIEWER = {
  name: 'Robert Hayes, CFP',
  role: 'Certified Financial Planner · Business banking',
  image: '/images/experts/robert-hayes.webp',
} as const;
