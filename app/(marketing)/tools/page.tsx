import { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, Scale, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Free Financial Tools & Calculators | SmartFinPro',
  description: 'Use our free financial calculators and comparison tools. Calculate AI ROI, loan payments, compare brokers, and make smarter financial decisions.',
  openGraph: {
    title: 'Free Financial Tools & Calculators | SmartFinPro',
    description: 'Use our free financial calculators and comparison tools.',
  },
};

const tools = [
  {
    title: 'AI ROI Calculator',
    description: 'Calculate the return on investment for AI tools like Jasper, Copy.ai, and more. See how much time and money your team can save.',
    icon: TrendingUp,
    href: '/tools/ai-roi-calculator',
    color: 'bg-emerald-500',
    category: 'Productivity',
  },
  {
    title: 'Loan Calculator',
    description: 'Calculate monthly payments, total interest, and see a full amortization schedule for personal loans, debt consolidation, and more.',
    icon: Calculator,
    href: '/tools/loan-calculator',
    color: 'bg-blue-500',
    category: 'Personal Finance',
  },
  {
    title: 'Broker Comparison',
    description: 'Compare forex and CFD brokers side by side. Filter by features, regulation, and find the best broker for your trading needs.',
    icon: Scale,
    href: '/tools/broker-comparison',
    color: 'bg-purple-500',
    category: 'Trading',
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Free to Use
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Financial Tools & Calculators
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Make smarter financial decisions with our free interactive tools.
              No sign-up required.
            </p>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-4`}>
                  <tool.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  {tool.category}
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-1 mb-2 group-hover:text-emerald-600 transition-colors">
                  {tool.title}
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  {tool.description}
                </p>
                <span className="inline-flex items-center gap-2 text-emerald-600 font-medium text-sm group-hover:gap-3 transition-all">
                  Use Tool
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Need personalized recommendations?
          </h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            Take our Smart Finder Quiz to get tailored product recommendations
            based on your specific needs.
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
          >
            <Sparkles className="h-5 w-5" />
            Take the Quiz
          </Link>
        </div>
      </section>
    </div>
  );
}
