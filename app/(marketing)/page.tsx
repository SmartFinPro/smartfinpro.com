import Link from 'next/link';
import { Metadata } from 'next';
import { Hero } from '@/components/marketing/hero';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Shield,
  Wallet,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Star,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'SmartFinPro - Financial Intelligence for Modern Professionals',
  description:
    'Discover AI-powered tools, cybersecurity solutions, and financial products trusted by 50,000+ finance professionals. Expert reviews, comparisons, and guides.',
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'en-GB': '/uk',
      'en-CA': '/ca',
      'en-AU': '/au',
      'x-default': '/',
    },
  },
};

const categories = [
  {
    title: 'AI Tools',
    description:
      'AI-powered software for finance professionals. Automate tasks, generate content, and boost productivity.',
    href: '/ai-tools',
    icon: Sparkles,
    featured: ['Jasper AI', 'Systeme.io', 'Copy.ai'],
    color: 'text-violet-400',
    glowColor: 'group-hover:shadow-violet-500/20',
    iconBg: 'bg-violet-500/20',
  },
  {
    title: 'Cybersecurity',
    description:
      'Enterprise-grade security solutions for financial services. Protect your business from cyber threats.',
    href: '/cybersecurity',
    icon: Shield,
    featured: ['Perimeter 81', 'NordVPN Teams', 'Heimdal'],
    color: 'text-blue-400',
    glowColor: 'group-hover:shadow-blue-500/20',
    iconBg: 'bg-blue-500/20',
  },
  {
    title: 'Personal Finance',
    description:
      'Loans, credit solutions, and personal finance tools. Get approved fast with competitive rates.',
    href: '/personal-finance',
    icon: Wallet,
    featured: ['Personal Loans', 'Credit Score', 'Debt Consolidation'],
    color: 'text-emerald-400',
    glowColor: 'group-hover:shadow-emerald-500/20',
    iconBg: 'bg-emerald-500/20',
  },
];

const features = [
  { text: 'Expert reviews by finance professionals', icon: Star },
  { text: 'Unbiased comparisons across 100+ products', icon: BarChart3 },
  { text: 'Exclusive deals and discounts', icon: TrendingUp },
  { text: 'Enterprise-grade security standards', icon: Lock },
];

const stats = [
  { value: '50K+', label: 'Active Users', icon: '👥' },
  { value: '100+', label: 'Products Reviewed', icon: '📊' },
  { value: '4.9', label: 'Average Rating', icon: '⭐' },
  { value: '$500M+', label: 'Protected Value', icon: '🔒' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Categories Section - Dark Theme with Glassmorphism */}
      <section className="py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="kicker text-slate-300">Explore Categories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Find the Right Tools for{' '}
              <span className="gradient-text">Your Business</span>
            </h2>
            <p className="text-slate-400 text-lg">
              We test and review the best financial technology products so you
              can make informed decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className={`group glass-card rounded-2xl p-8 transition-all duration-500 ${category.glowColor} hover:shadow-2xl`}
              >
                {/* Icon with glow effect */}
                <div className={`relative w-14 h-14 rounded-xl ${category.iconBg} flex items-center justify-center mb-6 icon-glow`}>
                  <category.icon className={`h-7 w-7 ${category.color}`} />
                </div>

                <h3 className="text-xl font-semibold text-white flex items-center justify-between mb-4">
                  {category.title}
                  <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </h3>

                <p className="text-slate-400 mb-6 leading-relaxed">
                  {category.description}
                </p>

                {/* Featured tags */}
                <div className="flex flex-wrap gap-2">
                  {category.featured.map((item) => (
                    <span
                      key={item}
                      className="text-xs px-3 py-1 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Floating Cards */}
      <section className="py-20 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass-card rounded-2xl p-6 text-center stat-glow group hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Section - Premium Dark */}
      <section className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] -translate-y-1/2" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2 mb-6">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="kicker text-slate-300">Why SmartFinPro?</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                Make <span className="gradient-text">Smarter</span> Financial
                Decisions
              </h2>

              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                We combine expert analysis with real-world testing to bring you
                the most comprehensive reviews of financial technology products.
                Our team of finance professionals evaluates each product
                rigorously.
              </p>

              {/* Feature list with icons */}
              <ul className="space-y-5 mb-10">
                {features.map((feature) => (
                  <li
                    key={feature.text}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                      <feature.icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <span className="text-slate-300">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className="btn-shimmer h-14 px-8 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
              >
                <Link href="/resources">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Visual element - Abstract shape */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-violet-500/20 rounded-3xl blur-3xl" />
              <div className="glass-card rounded-3xl p-10 relative">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">+127%</div>
                      <div className="text-sm text-slate-400">ROI Increase</div>
                    </div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">50K+</div>
                      <div className="text-sm text-slate-400">
                        Professionals Trust Us
                      </div>
                    </div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-violet-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">SOC 2</div>
                      <div className="text-sm text-slate-400">
                        Compliant Partners
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section - Premium Dark with Aurora */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        {/* Aurora background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="kicker text-slate-300">Newsletter</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Stay <span className="gradient-text">Ahead</span> of the Curve
            </h2>

            <p className="text-slate-400 text-lg mb-10">
              Get weekly insights on AI tools, cybersecurity trends, and
              financial strategies delivered straight to your inbox.
            </p>

            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
              <Button
                size="lg"
                type="submit"
                className="btn-shimmer h-14 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
              >
                Subscribe
              </Button>
            </form>

            <p className="text-xs text-slate-500 mt-6">
              Join 10,000+ subscribers. We respect your privacy.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
