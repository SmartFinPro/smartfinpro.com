// lib/tools/registry/metadata.ts
// SEO-Metadata-Builder für Tool-Seiten — Single Source für Title/Description/
// Canonical/hreflang/robots, gespeist aus der Tool-Registry (FDL 0.2).
//
// Bewusst KEINE Wiederverwendung von lib/seo/hreflang.ts: dessen Helper
// (generateAlternates/getCanonicalUrl) gehen von SYMMETRISCHER Marktrouting
// aus (/{market}-Prefix auch für 'us', Sonderfall nur bei path === '/').
// Tool-Routen sind dagegen ASYMMETRISCH — US liegt ohne Prefix an der Wurzel
// (/tools/...), wie im Rest der Plattform (smartfinpro.com/ = USA). Die
// Registry-`variant.path`-Werte sind bereits die vollständigen, marktkorrekten
// Pfade; ein Aufruf der bestehenden Helper würde für US-Routen fälschlich
// '/us/tools/...' erzeugen. Daher eigener, schlanker Builder direkt auf Basis
// der Registry-Varianten.
import type { Metadata } from 'next';
import { TOOL_REGISTRY } from './registry';
import type { ToolId, ToolMarket } from './types';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
const HREFLANG: Record<ToolMarket, string> = { us: 'en-US', uk: 'en-GB', ca: 'en-CA', au: 'en-AU' };

export function buildToolMetadata(id: ToolId, market: ToolMarket): Metadata {
  const tool = TOOL_REGISTRY[id];
  const variant = tool.variants.find((v) => v.market === market);
  if (!variant) throw new Error(`No ${market} variant for tool ${id}`);

  const canonical = `${BASE}${variant.path}`;
  let languages: Record<string, string> | undefined;
  if (tool.variants.length > 1) {
    languages = Object.fromEntries(tool.variants.map((v) => [HREFLANG[v.market], `${BASE}${v.path}`]));
    const usVariant = tool.variants.find((v) => v.market === 'us') ?? tool.variants[0];
    languages['x-default'] = `${BASE}${usVariant.path}`;
  }

  return {
    title: variant.title,
    description: variant.metaDescription,
    alternates: { canonical, ...(languages ? { languages } : {}) },
    ...(variant.indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: { title: variant.title, description: variant.metaDescription, url: canonical },
  };
}
