// app/(marketing)/au/tools/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Calculator, ArrowRight, Sparkles,
  ScanSearch, Compass, Columns3, Coins, Sunrise, House, TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { getToolsForMarket } from '@/lib/tools/registry';

export const metadata: Metadata = {
  title: 'Free Australian Financial Tools & Calculators | SmartFinPro',
  description: 'Free financial calculators for Australian investors. Superannuation calculator, mortgage calculator, and more tools tailored for the Australian market.',
  alternates: {
    canonical: 'https://smartfinpro.com/au/tools',
  },
  openGraph: {
    title: 'Free Australian Financial Tools & Calculators | SmartFinPro',
    description: 'Free financial calculators for Australian investors and homebuyers.',
    url: 'https://smartfinpro.com/au/tools',
  },
};

// Registry icon key (SPEC 9.1, lucide-Key) → Lucide component.
const iconMap: Record<string, LucideIcon> = {
  'scan-search': ScanSearch,
  compass: Compass,
  calculator: Calculator,
  'columns-3': Columns3,
  coins: Coins,
  sunrise: Sunrise,
  house: House,
  'trending-up': TrendingUp,
};

const tools = getToolsForMarket('au').map((t) => ({
  title: t.name,
  description: t.blurb,
  icon: iconMap[t.icon] ?? Calculator,
  href: t.entryHref,
  isNew: t.isNew,
}));

export default function AUToolsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-white/20 text-white">
              <Sparkles className="h-4 w-4" />
              Free to Use
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Australian Financial Tools & Calculators
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Free tools designed for Australian investors and homebuyers.
              Super projections, mortgage planning, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-6">
        <nav className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
          <Link href="/au" className="hover:underline">Australia</Link>
          <span className="mx-2">›</span>
          <span style={{ color: 'var(--sfp-ink)' }}>Tools</span>
        </nav>
      </div>

      {/* Tools Grid */}
      <section className="py-12 pb-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg bg-white"
              >
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
                    <tool.icon className="h-6 w-6" />
                  </div>
                  {tool.isNew && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                      style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--sfp-gold-dark)' }}
                    >
                      New
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold mt-1 mb-2 transition-colors" style={{ color: 'var(--sfp-ink)' }}>
                  {tool.title}
                </h2>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                  {tool.description}
                </p>
                <span className="inline-flex items-center gap-2 font-medium text-sm group-hover:gap-3 transition-all" style={{ color: 'var(--sfp-navy)' }}>
                  Use Tool
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>

          {/* Link to global tools */}
          <div className="text-center mt-12">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 font-medium transition-colors hover:underline"
              style={{ color: 'var(--sfp-navy)' }}
            >
              <Calculator className="h-4 w-4" />
              View all global tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
