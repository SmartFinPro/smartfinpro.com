// lib/tools/registry/types.ts
// Reine Typen — kein React, keine Server-Importe (Vorbild: lib/comparison/topics/types.ts)

export type ToolMarket = 'us' | 'uk' | 'ca' | 'au';
export type ToolStatus = 'live' | 'coming_soon' | 'redirected' | 'retired';
export type ToolTier = 'major' | 'supporting' | 'niche';
export type ShellMode = 'live-canvas' | 'guided-journey' | 'precision-worksheet';
export type DecisionCategory =
  | 'spend' | 'retire' | 'broker' | 'home' | 'debt'
  | 'credit-cards' | 'fees' | 'niche' | 'business';

export type ToolId =
  | 'money-leak-scanner' | 'broker-finder' | 'trading-cost' | 'broker-comparison'
  | 'ai-roi' | 'loan' | 'debt-payoff' | 'credit-utilization' | 'gold-roi'
  | 'credit-card-rewards' | 'isa' | 'remortgage' | 'tfsa-rrsp'
  | 'wealthsimple-fees' | 'ca-affordability' | 'superannuation' | 'au-mortgage'
  | 'wealth-horizon'; // FDL 4.2 — Wealth Horizon US (/tools/retirement-calculator)

export interface ToolRouteVariant {
  market: ToolMarket;
  path: string;              // MUSS 1:1 einem app/(marketing)-Verzeichnis mit page.tsx entsprechen
  status: ToolStatus;
  indexable: boolean;        // EINE Wahrheit für robots.index UND Sitemap-Aufnahme
  title: string;             // bare, OHNE "| SmartFinPro" — Root-Template hängt Brand an
  metaDescription: string;
  h1: string;
  /**
   * FDL 4.2 — additive, optional. `true` means the route EXISTS and is
   * reachable via a direct link (indexable can be independently true/false),
   * but must appear in NO hub/footer/nav/llms.txt consumer accessor
   * (getToolsForMarket/getFooterToolLinks/getLlmsToolLines). Used for
   * "build now, link after the analytics baseline window ends" — the
   * launch PR (4.3) removes this flag, nothing else. Sitemap inclusion is
   * governed solely by `indexable` (unaffected by this flag).
   */
  hidden?: boolean;
}

export interface ToolDefinition {
  id: ToolId;                // == analytics toolId ab Phase 1; niemals umbenennen
  name: string;              // kanonischer Anzeigename (beendet Naming-Drift)
  tier: ToolTier;
  decisionCategory: DecisionCategory;
  shellMode: ShellMode;
  icon: string;              // lucide-Key, wie BEST_X_MANIFEST
  blurb: string;             // Hub-Karten-Copy, EN, 1 Satz
  variants: ToolRouteVariant[];   // SEO-Varianten: eigene indexierbare Routen = hreflang-Cluster
  availableMarkets?: ToolMarket[]; // FUNKTIONALE Verfügbarkeit (SPEC 4.2): ein globaler Pfad darf
                                   // mehrere Märkte bedienen; Default = Märkte der variants
  legacyPaths?: string[];    // 308-Quellen; Test prüft gegen next.config.ts-Redirects
  /**
   * Additive, optional. ISO calendar date ('YYYY-MM-DD') a tool went live
   * across its markets (index-flip + `hidden` removed). Purely presentational:
   * hub cards use it to show a small "New" badge for a limited window after
   * launch (see getIsNewTool() in lib/tools/registry/index.ts). Does NOT
   * affect indexable/hidden/status — those stay the single source of truth
   * for SEO and hub/footer/llms.txt visibility.
   */
  launchedAt?: string;
  /**
   * SPEC 8.7 — per-tool allowlist for share-link fragment payloads
   * (`#s=base64url(JSON)`); ONLY these keys may ever be serialized into a
   * shareable link, values bucketed/rounded, never raw amounts. Additive,
   * optional — the share codec itself ships with PR 2.3; declaring the
   * allowlist here for a new tool is forward-compatible metadata only.
   */
  shareableFields?: string[];
}
