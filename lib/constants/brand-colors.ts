/**
 * lib/constants/brand-colors.ts
 *
 * Single Source of Truth für Brand-Farben im JS/TS-Kontext.
 * Spiegelt exakt die CSS-Variablen in app/globals.css.
 *
 * Warum diese Datei? Chart-Libraries (Recharts, D3, SVG-Props) können keine
 * CSS-Variablen direkt lesen — sie brauchen echte Hex-Strings als Props.
 * Diese Datei ist der JS/TS-Mirror von :root { --sfp-* }.
 *
 * Ein Rebranding: CSS-Variablen in globals.css + diese Datei = fertig.
 *
 * AP-03 Phase 3 — Dashboard-Charts Migration
 */

// ── Core Brand Colors ──────────────────────────────────────────────
// Spiegelt :root CSS-Variablen in app/globals.css
export const BRAND = {
  navy:      '#1B4F8C',   // --sfp-navy      — Header, Navigation, primäre CTAs
  navyDark:  '#163D6E',   // --sfp-navy-dark  — Hover-Zustand Navy
  gold:      '#F5A623',   // --sfp-gold       — Conversion, CTA-Buttons
  goldDark:  '#D48B1A',   // --sfp-gold-dark  — Hover-Zustand Gold
  green:     '#1A6B3A',   // --sfp-green      — Success, Trust-Badges, positive KPIs
  red:       '#D64045',   // --sfp-red        — Alerts, Warnhinweise
  sky:       '#E8F0FB',   // --sfp-sky        — Info-Boxen, Tabellen-Header
  gray:      '#F2F4F8',   // --sfp-gray       — Seiten/Karten-Hintergründe
  ink:       '#1A1A2E',   // --sfp-ink        — Primärer Fließtext
  slate:     '#555555',   // --sfp-slate      — Sekundärtext, Meta-Infos
} as const;

// ── Chart Color Palette ────────────────────────────────────────────
// Für Recharts/D3 — spiegelt --chart-1 bis --chart-5 in globals.css
export const CHART_COLORS = {
  primary:   BRAND.gold,    // --chart-1 — Hauptlinie, primäre Bars
  secondary: BRAND.green,   // --chart-2 — Zweite Linie/Bar
  tertiary:  BRAND.navy,    // --chart-3 — Dritte Linie
  light:     BRAND.sky,     // --chart-4 — Hintergrundflächen
  muted:     BRAND.slate,   // --chart-5 — Dezente Elemente
} as const;

// ── Chart Neutral Colors ───────────────────────────────────────────
// Neutrale UI-Farben für Chart-Infrastruktur (kein Brand-Bezug)
export const CHART_NEUTRAL = {
  grid:         '#e2e8f0',   // Gitterlinien (slate-200)
  axisText:     '#64748b',   // Achsenbeschriftungen (slate-500)
  tooltipBg:    '#ffffff',   // Tooltip-Hintergrund
  tooltipBorder: '#e2e8f0',  // Tooltip-Rahmen
  tooltipText:  '#1e293b',   // Tooltip-Text (slate-800)
  axisLine:     '#e2e8f0',   // Achsenlinien
} as const;

// ── Dashboard Chart Colors (LOCKED — bestehende Optik beibehalten) ──
// NICHT mit Brand-Farben vermischen! Das Dashboard hat eine eigene
// Datenvisualisierungs-Palette (Emerald/Blue), die bewusst von den
// Marketing-Brand-Farben abweicht. Hier eingefroren für SSOT.
export const DASHBOARD_CHART = {
  // Primäre Datenfarbe — Emerald-500 (Clicks, Revenue, PageViews)
  primary:  '#10b981',   // emerald-500
  // Sekundäre Datenfarbe — Blue-500 (Sessions, zweite Metrik)
  sessions: '#3b82f6',   // blue-500
} as const;

// ── World Map Color Scale (LOCKED — bestehende Optik beibehalten) ──
// Emerald-Heatmap (100→500): bewusste Designentscheidung, nicht ändern
export const MAP_COLORS = {
  ocean:    '#dbeafe',   // Ozean-Hintergrund (blue-100, sichtbarer Kontrast)
  land:     '#f8fafc',   // Länderflächen (slate-50, hell aber erkennbar)
  border:   '#94a3b8',   // Ländergrenzen (slate-400, deutlich sichtbar)
  muted:    '#e2e8f0',   // Nicht zugeordnete Länder (slate-200)
  text:     '#64748b',   // Legendentext (slate-500)
  // Heatmap-Skala: Emerald-300 → Emerald-700 (kräftig, gut sichtbar auf weißen Ländern)
  scale: [
    '#6ee7b7',   // Stufe 1 (0–5%)   — emerald-300
    '#34d399',   // Stufe 2 (5–15%)  — emerald-400
    '#10b981',   // Stufe 3 (15–30%) — emerald-500
    '#059669',   // Stufe 4 (30–50%) — emerald-600
    '#047857',   // Stufe 5 (50%+)   — emerald-700
  ] as const,
  activeDot: '#10b981',  // emerald-500 — Klick-Indikator-Punkt
  dotCenter: '#ffffff',
} as const;

// ── Dashboard UI State Colors ──────────────────────────────────────
// Feature-spezifische UI-Zustandsfarben (kein Brand-Bezug, Funktions-Farben)
// Simulation Mode: Amber — visuelle Warnung für Test-Modus
// Guardian Mode: Violet — visueller Indikator für KI-Schutzfunktion
export const DASHBOARD_UI = {
  // Simulation Mode — Amber
  simulation: {
    bg:          '#fffbeb',              // amber-50
    border:      '#f59e0b',             // amber-400
    shadow:      'rgba(245,158,11,0.1)', // amber glow
    iconBg:      '#fef3c7',             // amber-100
    iconColor:   '#d97706',             // amber-600
    toggle:      '#f59e0b',             // amber-400 (active)
  },
  // Guardian Mode — Violet
  guardian: {
    bg:          '#f5f3ff',              // violet-50
    border:      '#8b5cf6',             // violet-500
    shadow:      'rgba(139,92,246,0.1)', // violet glow
    iconBg:      '#ede9fe',             // violet-100
    iconColor:   '#7c3aed',             // violet-600
    toggle:      '#8b5cf6',             // violet-500 (active)
    saveBtnGrad: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    saveBtnGlow: '0 0 16px rgba(139,92,246,0.2)',
  },
  // Reset Button
  reset: {
    grad:     'linear-gradient(135deg, #f43f5e, #e11d48)', // rose-500 → rose-700
    disabled: '#e2e8f0',  // slate-200
    disabledText: '#94a3b8', // slate-400
  },
  // Gemeinsame Neutral-Zustände
  toggleOff: '#cbd5e1',  // slate-300 (inaktiver Toggle-Hintergrund)
} as const;
