// app/(marketing)/uk/tools/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, PiggyBank, Home, ArrowRight, Sparkles, Droplet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Free UK Financial Tools & Calculators | SmartFinPro',
  description: 'Free financial calculators for UK investors. ISA tax savings calculator, remortgage calculator, and more tools tailored for UK markets.',
  alternates: {
    canonical: 'https://smartfinpro.com/uk/tools',
  },
  openGraph: {
    title: 'Free UK Financial Tools & Calculators | SmartFinPro',
    description: 'Free financial calculators for UK investors and homeowners.',
    url: 'https://smartfinpro.com/uk/tools',
  },
};

const tools = [
  {
    title: 'Money Leak Scanner',
    description: 'Find how much your household is overpaying across banking fees, subscriptions, credit cards, insurance, investing and FX — live, in 60 seconds.',
    icon: Droplet,
    href: '/uk/tools/money-leak-scanner',
    badge: 'New',
  },
  {
    title: 'ISA Tax Savings Calculator',
    description: 'See how much you could save in capital gains tax and dividend tax by investing inside a Stocks & Shares ISA vs a General Investment Account.',
    icon: PiggyBank,
    href: '/uk/tools/isa-tax-savings-calculator',
    badge: 'Popular',
  },
  {
    title: 'Remortgage Calculator',
    description: 'Calculate your new monthly payment after remortgaging. Compare fixed vs tracker rates and see how much you could save by switching.',
    icon: Home,
    href: '/uk/tools/remortgage-calculator',
    badge: 'New',
  },
];

export default function UKToolsPage() {
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
              UK Financial Tools & Calculators
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Free tools tailored for UK investors and homeowners.
              ISA tax savings, remortgage planning, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-6">
        <nav className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
          <Link href="/uk" className="hover:underline">UK</Link>
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
                {tool.badge && (
                  <span className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
                    {tool.badge}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
                  <tool.icon className="h-6 w-6" />
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
