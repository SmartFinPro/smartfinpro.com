// lib/tools/registry/index.ts
import { TOOL_REGISTRY } from './registry';
import type { ToolDefinition, ToolId, ToolMarket, ToolRouteVariant } from './types';

export * from './types';
export { TOOL_REGISTRY };

export function getTool(id: ToolId): ToolDefinition { return TOOL_REGISTRY[id]; }

export function getAllVariants(): (ToolRouteVariant & { toolId: ToolId })[] {
  return Object.values(TOOL_REGISTRY).flatMap((t) =>
    t.variants.map((v) => ({ ...v, toolId: t.id })),
  );
}

export function getVariant(id: ToolId, market: ToolMarket): ToolRouteVariant | null {
  return TOOL_REGISTRY[id]?.variants.find((v) => v.market === market) ?? null;
}

export function getAvailableMarkets(t: ToolDefinition): ToolMarket[] {
  return t.availableMarkets ?? Array.from(new Set(t.variants.map((v) => v.market)));
}

/** Einstiegs-URL für einen Markt: lokale Variante, sonst globale Route + validierter ?market=-Param (SPEC 4.2). */
export function getToolEntryHref(id: ToolId, market: ToolMarket): string | null {
  const tool = TOOL_REGISTRY[id];
  const local = tool.variants.find((v) => v.market === market);
  if (local) return local.path;
  if (!getAvailableMarkets(tool).includes(market)) return null;
  const global = tool.variants.find((v) => v.market === 'us') ?? tool.variants[0];
  return market === 'us' ? global.path : `${global.path}?market=${market}`;
}

export function getToolsForMarket(market: ToolMarket): (ToolDefinition & { entryHref: string; localized: boolean })[] {
  return Object.values(TOOL_REGISTRY)
    .filter((t) => getAvailableMarkets(t).includes(market))
    .map((t) => ({ ...t, entryHref: getToolEntryHref(t.id, market)!, localized: t.variants.some((v) => v.market === market) }));
}

/** Öffentliche Kennzahl (Homepage): Konzepte mit ≥1 Live-Variante. */
export function countLiveConcepts(): number {
  return Object.values(TOOL_REGISTRY).filter((t) => t.variants.some((v) => v.status === 'live')).length;
}
/** Interne Kennzahl (Manifest/Health): Anzahl Live-Routen-Varianten. */
export function countLiveRoutes(): number {
  return getAllVariants().filter((v) => v.status === 'live').length;
}

export function getHubPathForMarket(market: ToolMarket): string {
  return market === 'us' ? '/tools' : `/${market}/tools`;
}

export function getSitemapToolEntries(): { url: string }[] {
  const hubs = (['us', 'uk', 'ca', 'au'] as const).map((m) => ({ url: getHubPathForMarket(m) }));
  const tools = getAllVariants()
    .filter((v) => v.status === 'live' && v.indexable)
    .map((v) => ({ url: v.path }));
  return [...hubs, ...tools];
}

export function getFooterToolLinks(market: ToolMarket): { label: string; href: string }[] {
  return getToolsForMarket(market)
    .filter((t) => {
      const v = t.variants.find((x) => x.market === market) ?? t.variants.find((x) => x.market === 'us') ?? t.variants[0];
      return v.status === 'live' && v.indexable;
    })
    .map((t) => ({ label: t.name, href: t.entryHref }));
}

export function getLlmsToolLines(): string[] {
  return getAllVariants()
    .filter((v) => v.status === 'live' && v.indexable)
    .map((v) => `- ${v.title}: https://smartfinpro.com${v.path}`);
}

export function getExpectedTrackingManifest(): { toolId: ToolId; path: string; market: ToolMarket }[] {
  return getAllVariants()
    .filter((v) => v.status === 'live')
    .map((v) => ({ toolId: v.toolId, path: v.path, market: v.market }));
}
