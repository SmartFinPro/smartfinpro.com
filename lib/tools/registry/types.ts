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
  | 'wealthsimple-fees' | 'ca-affordability' | 'superannuation' | 'au-mortgage';
// 'wealth-horizon' kommt erst in Phase 4 dazu (fs-Parity verlangt existierende Pages).

export interface ToolRouteVariant {
  market: ToolMarket;
  path: string;              // MUSS 1:1 einem app/(marketing)-Verzeichnis mit page.tsx entsprechen
  status: ToolStatus;
  indexable: boolean;        // EINE Wahrheit für robots.index UND Sitemap-Aufnahme
  title: string;             // bare, OHNE "| SmartFinPro" — Root-Template hängt Brand an
  metaDescription: string;
  h1: string;
}

export interface ToolDefinition {
  id: ToolId;                // == analytics toolId ab Phase 1; niemals umbenennen
  name: string;              // kanonischer Anzeigename (beendet Naming-Drift)
  tier: ToolTier;
  decisionCategory: DecisionCategory;
  shellMode: ShellMode;
  icon: string;              // lucide-Key, wie BEST_X_MANIFEST
  blurb: string;             // Hub-Karten-Copy, EN, 1 Satz
  variants: ToolRouteVariant[];   // dieses Array IST der hreflang-Cluster (1 Variante = self-only)
  legacyPaths?: string[];    // 308-Quellen; Test prüft gegen next.config.ts-Redirects
}
