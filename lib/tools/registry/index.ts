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

/** Presentational-only window (days) a tool's hub card shows a "New" badge
 *  after `launchedAt` — purely cosmetic, never gates SEO/hub-inclusion. */
export const NEW_TOOL_BADGE_WINDOW_DAYS = 30;

/**
 * True while `t.launchedAt` is within NEW_TOOL_BADGE_WINDOW_DAYS of
 * `referenceDate` (default: now). Used ONLY to show a small "New" badge on
 * hub cards (User-Direktive: "Flaggschiff, extra hervorheben") — has no
 * effect on indexable/hidden/status, which stay the single source of truth
 * for SEO and hub/footer/llms.txt visibility.
 */
export function isRecentlyLaunched(t: ToolDefinition, referenceDate: Date = new Date()): boolean {
  if (!t.launchedAt) return false;
  const launched = new Date(t.launchedAt);
  if (Number.isNaN(launched.getTime())) return false;
  const diffDays = (referenceDate.getTime() - launched.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= NEW_TOOL_BADGE_WINDOW_DAYS;
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

/** The variant a market actually resolves to for a tool: its own localized
 *  variant, else the global fallback (US variant, or the tool's first). */
function resolveVariantForMarket(t: ToolDefinition, market: ToolMarket): ToolRouteVariant {
  return t.variants.find((v) => v.market === market)
    ?? t.variants.find((v) => v.market === 'us')
    ?? t.variants[0];
}

export function getToolsForMarket(market: ToolMarket): (ToolDefinition & { entryHref: string; localized: boolean; isNew: boolean })[] {
  return Object.values(TOOL_REGISTRY)
    .filter((t) => getAvailableMarkets(t).includes(market))
    // FDL 4.2: `hidden` keeps a live-but-unlaunched tool out of the hub
    // entirely (unused by any current registry entry — see types.ts).
    .filter((t) => !resolveVariantForMarket(t, market).hidden)
    .map((t) => ({
      ...t,
      entryHref: getToolEntryHref(t.id, market)!,
      localized: t.variants.some((v) => v.market === market),
      // Presentational-only "New" badge flag — see isRecentlyLaunched() above.
      isNew: isRecentlyLaunched(t),
    }));
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
  return getToolsForMarket(market)   // already excludes `hidden` variants
    .filter((t) => {
      const v = resolveVariantForMarket(t, market);
      return v.status === 'live' && v.indexable;
    })
    .map((t) => ({ label: t.name, href: t.entryHref }));
}

export function getLlmsToolLines(): string[] {
  return getAllVariants()
    .filter((v) => v.status === 'live' && v.indexable && !v.hidden)
    .map((v) => `- ${v.title}: https://smartfinpro.com${v.path}`);
}

/**
 * Tracking-Manifest = FUNKTIONALE Tool-Markt-Matrix (SPEC 4.2), nicht nur SEO-Routen:
 * expandiert availableMarkets, damit z. B. Broker-Finder-Silence auf UK/CA/AU erkannt
 * wird, obwohl alle vier Märkte dieselbe globale US-Route nutzen.
 * Erwarteter Ist-Umfang: 29 Einträge (20 Routen + Broker-Triple × uk/ca/au).
 */
export function getExpectedTrackingManifest(): { toolId: ToolId; path: string; market: ToolMarket }[] {
  return Object.values(TOOL_REGISTRY).flatMap((t) =>
    getAvailableMarkets(t).flatMap((m) => {
      const v = t.variants.find((x) => x.market === m)
        ?? t.variants.find((x) => x.market === 'us')
        ?? t.variants[0];
      return v.status === 'live' ? [{ toolId: t.id, path: v.path, market: m }] : [];
    }),
  );
}

/** Runtime tuple of all ToolIds for z.enum — single source, no duplicate list. */
export const TOOL_ID_VALUES = Object.keys(TOOL_REGISTRY) as [ToolId, ...ToolId[]];
