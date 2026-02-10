import Link from 'next/link';
import Image from 'next/image';
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
  Zap,
  GraduationCap,
  Globe,
  Headphones,
  LineChart,
  BookOpen,
  MonitorSmartphone,
  LifeBuoy,
  UserPlus,
  CreditCard,
  Activity,
  ChevronRight,
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

      {/* Trust Ticker — E-E-A-T Signal */}
      <div className="bg-slate-900 border-y border-slate-800/50 overflow-hidden py-3">
        <div className="trust-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 shrink-0">
              {[
                'FCA REGULATED',
                'ASIC VERIFIED',
                'REAL-TIME MARKET DATA',
                'SOC 2 CERTIFIED',
                'CIRO COMPLIANT',
                'EXPERT-REVIEWED',
                'SECURE & ENCRYPTED',
                'FINRA VERIFIED',
              ].map((item) => (
                <span key={`${i}-${item}`} className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60 shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

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
                className={`group glass-card rounded-2xl p-8 transition-all duration-500 hover:scale-[1.03] ${category.glowColor} hover:shadow-2xl`}
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
      <section className="py-16 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass-card rounded-2xl p-6 text-center stat-glow group hover:border-emerald-500/30 hover:scale-[1.03] transition-all duration-300"
              >
                <div className="text-3xl mb-3">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2 tabular-nums">
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
                Make <span className="gradient-text">Smarter</span> Financial Decisions:{' '}
                <span className="text-slate-300 text-3xl md:text-4xl">Why We Are Your Essential Advantage</span>
              </h2>

              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                We merge rigorous expert analysis with real-world stress testing to deliver
                the most comprehensive insights into financial technology. You, the trader,
                are at the core of everything we do. Our mission is simple: identifying
                high-performance financial tools tailored to your unique risk profile. We
                provide exclusive access to market leaders that deliver proven value,
                state-of-the-art technical execution, and world-class educational resources.
                Whether on web or mobile, we ensure seamless access to your markets through
                an award-winning user experience.
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
                <Link href="/tools">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Visual element - Amber CFO Image */}
            <div className="relative hidden lg:block">
              {/* Ambient glow behind card */}
              <div className="absolute -inset-6 bg-gradient-to-br from-emerald-500/15 via-blue-500/10 to-violet-500/15 rounded-[2rem] blur-3xl" />

              {/* Glass frame */}
              <div className="relative rounded-2xl border border-white/10 p-2 shadow-2xl shadow-black/20" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {/* Image container */}
                <div className="relative rounded-xl" style={{ overflow: 'hidden' }}>
                  <Image
                    src="/images/Amber_CFO.png"
                    alt="Amber - CFO & Finance Expert"
                    width={500}
                    height={600}
                    className="w-full h-auto block"
                    priority
                  />

                  {/* Gradient overlay — bottom-up so face stays clear */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 via-40% to-transparent" />

                  {/* Name & title overlay */}
                  <div className="absolute bottom-20 left-0 right-0 px-5">
                    <p className="text-lg font-bold text-white drop-shadow-lg">Amber Richardson</p>
                    <p className="text-xs text-slate-300/90 drop-shadow-md">CFO & Senior Financial Analyst</p>
                  </div>
                </div>

                {/* Frosted stats bar */}
                <div className="mt-2 rounded-xl border border-white/[0.06] px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white tabular-nums">+127%</div>
                        <div className="text-[10px] text-slate-500">ROI Increase</div>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white tabular-nums">50K+</div>
                        <div className="text-[10px] text-slate-500">Professionals</div>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-violet-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">SOC 2</div>
                        <div className="text-[10px] text-slate-500">Certified</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          WHAT YOU GET — 4 Feature Cards
          ============================================================ */}
      <section className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px]" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span className="kicker text-slate-300">What You Get</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Everything You Need,{' '}
              <span className="gradient-text">Nothing You Don&apos;t</span>
            </h2>
            <p className="text-slate-400 text-lg">
              Built for professionals who demand precision, speed, and transparency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: 'Instant Access to Top Tools',
                description: 'Get up and running in minutes. We pre-vet every platform so you can start with confidence — no guesswork, no wasted time.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/15',
              },
              {
                icon: LineChart,
                title: 'Expert-Verified Comparisons',
                description: 'Side-by-side comparisons of 100+ products with transparent scoring. Every review is backed by real-world testing and data.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/15',
              },
              {
                icon: Shield,
                title: 'A Platform You Can Trust',
                description: 'We only recommend regulated, SOC 2 certified partners. Your security and data protection are non-negotiable.',
                color: 'text-violet-400',
                bg: 'bg-violet-500/15',
              },
              {
                icon: Headphones,
                title: 'World-Class Support & Education',
                description: 'Access in-depth guides, expert webinars, and dedicated support. We help you make informed decisions at every stage.',
                color: 'text-amber-400',
                bg: 'bg-amber-500/15',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 group hover:scale-[1.03] transition-all duration-500"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 icon-glow`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          WHY SMARTFINPRO — 6 Detailed Benefit Cards
          ============================================================ */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="kicker text-slate-300">Why SmartFinPro</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Your <span className="gradient-text">Competitive Edge</span> in Finance
            </h2>
            <p className="text-slate-400 text-lg">
              From AI tools to trading platforms — discover why 50,000+ professionals trust SmartFinPro.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: 'Trusted by 50,000+ Professionals',
                description: 'Serving finance professionals across the US, UK, Canada, and Australia. Over 100 products rigorously reviewed and ranked.',
                cta: { text: 'Explore our reviews', href: '/trading' },
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/15',
              },
              {
                icon: Zap,
                title: 'Start in Minutes',
                description: 'Our curated recommendations get you to the right tool fast. No endless research — just expert-matched solutions for your specific needs.',
                cta: { text: 'Explore tools', href: '/ai-tools' },
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/15',
              },
              {
                icon: BarChart3,
                title: 'Your Markets, Your Strategy',
                description: 'AI tools, cybersecurity, trading platforms, forex brokers, personal finance, and business banking — all categories, one trusted source.',
                cta: { text: 'Browse categories', href: '/ai-tools' },
                color: 'text-violet-400',
                bg: 'bg-violet-500/15',
              },
              {
                icon: Lock,
                title: 'Transparent & Unbiased',
                description: 'Zero hidden agendas. We disclose all affiliate relationships and maintain editorial independence. Our revenue model never influences our rankings.',
                cta: { text: 'Our methodology', href: '/ai-tools' },
                color: 'text-amber-400',
                bg: 'bg-amber-500/15',
              },
              {
                icon: Headphones,
                title: 'Expert Support & Guidance',
                description: 'Our team of finance professionals is here to help. Get personalized recommendations, in-depth guides, and responsive support when you need it.',
                cta: { text: 'Get in touch', href: '/tools' },
                color: 'text-rose-400',
                bg: 'bg-rose-500/15',
              },
              {
                icon: MonitorSmartphone,
                title: 'Seamless Cross-Platform Experience',
                description: 'Access reviews, comparisons, and tools on any device. Our platform is optimized for desktop, tablet, and mobile — research anywhere, anytime.',
                cta: { text: 'Try it now', href: '/ai-tools' },
                color: 'text-blue-400',
                bg: 'bg-blue-500/15',
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="glass-card rounded-2xl p-8 group hover:scale-[1.02] transition-all duration-500"
              >
                <div className={`w-12 h-12 rounded-xl ${benefit.bg} flex items-center justify-center mb-5 icon-glow`}>
                  <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{benefit.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-5">{benefit.description}</p>
                <Link
                  href={benefit.cta.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors group/link"
                >
                  {benefit.cta.text}
                  <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FOR ALL LEVELS — Beginner vs. Experienced Split
          ============================================================ */}
      <section className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Built for <span className="gradient-text">Every Level</span>
            </h2>
            <p className="text-slate-400 text-lg">
              Whether you&apos;re just starting out or optimizing an existing stack — we have you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Beginners */}
            <div className="glass-card rounded-2xl p-8 border-t-2 border-emerald-500/50">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-6">
                <GraduationCap className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">New to Finance Tech?</h3>
              <p className="text-slate-400 mb-6">Everything you need to get started with confidence.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Step-by-step guides and tutorials',
                  'Beginner-friendly product recommendations',
                  'Jargon-free reviews and explanations',
                  'Free tools and calculators',
                  'Dedicated support for first-time users',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0">
                <Link href="/tools">
                  Start Learning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Experienced */}
            <div className="glass-card rounded-2xl p-8 border-t-2 border-violet-500/50">
              <div className="w-14 h-14 rounded-xl bg-violet-500/15 flex items-center justify-center mb-6">
                <LifeBuoy className="h-7 w-7 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Seasoned Professional?</h3>
              <p className="text-slate-400 mb-6">Advanced tools and insights to sharpen your edge.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'In-depth platform stress tests and benchmarks',
                  'Head-to-head comparisons with raw data',
                  'Advanced ROI calculators and analytics',
                  'Exclusive deals and negotiated pricing',
                  'Priority access to new product reviews',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 border-0">
                <Link href="/ai-tools">
                  Explore Pro Tools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          GET STARTED — 3 Step Process
          ============================================================ */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Find Your <span className="gradient-text">Perfect Tool</span>?
            </h2>
            <p className="text-slate-400 text-lg">
              Three simple steps to smarter financial decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            {[
              {
                step: '01',
                icon: UserPlus,
                title: 'Choose Your Category',
                description: 'Select from AI tools, cybersecurity, trading platforms, forex, personal finance, or business banking.',
                color: 'text-emerald-400',
                bg: 'from-emerald-500 to-emerald-600',
              },
              {
                step: '02',
                icon: BarChart3,
                title: 'Compare & Analyze',
                description: 'Use our expert reviews, side-by-side comparisons, and interactive tools to find the best match.',
                color: 'text-cyan-400',
                bg: 'from-cyan-500 to-cyan-600',
              },
              {
                step: '03',
                icon: Activity,
                title: 'Start with Confidence',
                description: 'Sign up through our vetted links with exclusive deals. Every recommendation is backed by real testing.',
                color: 'text-violet-400',
                bg: 'from-violet-500 to-violet-600',
              },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.bg} flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Step {item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="btn-shimmer h-14 px-10 text-lg bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 border-0 shadow-lg shadow-violet-500/25">
              <Link href="/ai-tools">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
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
