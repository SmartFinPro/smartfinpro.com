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

export function getToolsForMarket(market: ToolMarket): (ToolDefinition & { variant: ToolRouteVariant })[] {
  return Object.values(TOOL_REGISTRY)
    .map((t) => ({ ...t, variant: t.variants.find((v) => v.market === market)! }))
    .filter((t) => t.variant);
}

export function countLiveTools(): number {
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
    .filter((t) => t.variant.status === 'live' && t.variant.indexable)
    .map((t) => ({ label: t.name, href: t.variant.path }));
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
