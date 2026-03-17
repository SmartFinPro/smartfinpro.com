declare module 'next/dist/compiled/web-vitals' {
  export interface Metric {
    name: string;
    value: number;
    rating?: string;
    delta?: number;
    id: string;
    navigationType?: string;
  }

  export function onLCP(fn: (metric: Metric) => void): void;
  export function onINP(fn: (metric: Metric) => void): void;
  export function onCLS(fn: (metric: Metric) => void): void;
  export function onFCP(fn: (metric: Metric) => void): void;
  export function onTTFB(fn: (metric: Metric) => void): void;
  export function onFID(fn: (metric: Metric) => void): void;
}
