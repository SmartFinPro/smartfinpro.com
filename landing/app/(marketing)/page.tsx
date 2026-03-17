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
    'Discover AI-powered tools, cybersecurity solutions, and financial products for modern professionals. Expert reviews, comparisons, and guides across 4 global markets.',
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
    color: 'text-[var(--sfp-navy)]',
    glowColor: 'group-hover:shadow-md',
    iconBg: 'bg-[var(--sfp-sky)]',
  },
  {
    title: 'Cybersecurity',
    description:
      'Enterprise-grade security solutions for financial services. Protect your business from cyber threats.',
    href: '/cybersecurity',
    icon: Shield,
    featured: ['Perimeter 81', 'NordVPN Teams', 'Heimdal'],
    color: 'text-[var(--sfp-navy)]',
    glowColor: 'group-hover:shadow-md',
    iconBg: 'bg-[var(--sfp-sky)]',
  },
  {
    title: 'Personal Finance',
    description:
      'Loans, credit solutions, and personal finance tools. Get approved fast with competitive rates.',
    href: '/personal-finance',
    icon: Wallet,
    featured: ['Personal Loans', 'Credit Score', 'Debt Consolidation'],
    color: 'text-[var(--sfp-green)]',
    glowColor: 'group-hover:shadow-md',
    iconBg: 'bg-[var(--sfp-sky)]',
  },
];

const features = [
  { text: 'Expert reviews by finance professionals', icon: Star },
  { text: 'Unbiased comparisons across 100+ products', icon: BarChart3 },
  { text: 'Exclusive deals and discounts', icon: TrendingUp },
  { text: 'Enterprise-grade security standards', icon: Lock },
];

const stats = [
  { value: '100+', label: 'Products Reviewed', icon: '📊' },
  { value: '9', label: 'Free Tools', icon: '🧮' },
  { value: '4', label: 'Global Markets', icon: '🌍' },
  { value: '50+', label: 'Expert Comparisons', icon: '📋' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Trust Ticker — E-E-A-T Signal */}
      <div className="border-y border-gray-200 overflow-hidden py-3" style={{ background: 'var(--sfp-sky)' }}>
        <div className="trust-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 shrink-0">
              {[
                'WE REVIEW FCA-REGULATED BROKERS',
                'ASIC-LICENSED PARTNERS',
                'REAL-TIME MARKET DATA',
                'CIRO-COMPLIANT PARTNERS',
                'EXPERT-REVIEWED',
                'SECURE & ENCRYPTED',
              ].map((item) => (
                <span key={`${i}-${item}`} className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: 'var(--sfp-slate)' }}>
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--sfp-green)' }} />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Categories Section - Light Trust Design */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 border border-gray-200 bg-white shadow-sm">
              <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--sfp-slate)' }}>Explore Categories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Find the Right Tools for{' '}
              <span style={{ color: 'var(--sfp-navy)' }}>Your Business</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              We test and review the best financial technology products so you
              can make informed decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className={`group rounded-2xl border border-gray-200 bg-white shadow-sm p-8 transition-all duration-500 hover:scale-[1.03] ${category.glowColor} hover:shadow-xl`}
              >
                <div className={`relative w-14 h-14 rounded-xl ${category.iconBg} flex items-center justify-center mb-6`}>
                  <category.icon className={`h-7 w-7 ${category.color}`} />
                </div>

                <h3 className="text-xl font-semibold flex items-center justify-between mb-4" style={{ color: 'var(--sfp-ink)' }}>
                  {category.title}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-all" style={{ color: 'var(--sfp-gold)' }} />
                </h3>

                <p className="mb-6 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                  {category.description}
                </p>

                {/* Featured tags */}
                <div className="flex flex-wrap gap-2">
                  {category.featured.map((item) => (
                    <span
                      key={item}
                      className="text-xs px-3 py-1 rounded-full border border-gray-200" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-slate)' }}
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

      {/* Stats Section - Light Cards */}
      <section className="py-16 bg-white relative overflow-hidden">
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 text-center group hover:shadow-lg hover:scale-[1.03] transition-all duration-300"
              >
                <div className="text-3xl mb-3">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold mb-2 tabular-nums" style={{ color: 'var(--sfp-navy)' }}>
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: 'var(--sfp-slate)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Section - Light Trust Design */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 border border-gray-200 bg-white shadow-sm">
                <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--sfp-slate)' }}>Why SmartFinPro?</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: 'var(--sfp-ink)' }}>
                Make <span style={{ color: 'var(--sfp-navy)' }}>Smarter</span> Financial Decisions:{' '}
                <span className="text-3xl md:text-4xl" style={{ color: 'var(--sfp-slate)' }}>Why We Are Your Essential Advantage</span>
              </h2>

              <p className="text-lg mb-10 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
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
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'var(--sfp-sky)' }}>
                      <feature.icon className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
                    </div>
                    <span style={{ color: 'var(--sfp-ink)' }}>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-lg border-0 shadow-md hover:shadow-lg text-white"
                style={{ background: 'var(--sfp-gold)' }}
              >
                <Link href="/tools">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Visual element - Amber CFO Image */}
            <div className="relative hidden lg:block">
              {/* Light frame */}
              <div className="relative rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                {/* Image container */}
                <div className="relative rounded-xl" style={{ overflow: 'hidden' }}>
                  <Image
                    src="/images/Amber_CFO.webp"
                    alt="Amber - CFO & Finance Expert"
                    width={500}
                    height={600}
                    className="w-full h-auto block"
                    priority
                  />

                  {/* Gradient overlay — bottom-up so face stays clear */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 via-40% to-transparent" />

                  {/* Name & title overlay */}
                  <div className="absolute bottom-20 left-0 right-0 px-5">
                    <p className="text-lg font-bold drop-shadow-lg" style={{ color: 'var(--sfp-ink)' }}>Amber Richardson</p>
                    <p className="text-xs drop-shadow-md" style={{ color: 'var(--sfp-slate)' }}>CFO & Senior Financial Analyst</p>
                  </div>
                </div>

                {/* Stats bar */}
                <div className="mt-2 rounded-xl border border-gray-200 px-4 py-3" style={{ background: 'var(--sfp-sky)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
                        <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                      </div>
                      <div>
                        <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--sfp-ink)' }}>+127%</div>
                        <div className="text-[10px]" style={{ color: 'var(--sfp-slate)' }}>ROI Increase</div>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
                        <BarChart3 className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                      </div>
                      <div>
                        <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--sfp-ink)' }}>50K+</div>
                        <div className="text-[10px]" style={{ color: 'var(--sfp-slate)' }}>Professionals</div>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
                        <Shield className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>SOC 2</div>
                        <div className="text-[10px]" style={{ color: 'var(--sfp-slate)' }}>Certified</div>
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
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 border border-gray-200 bg-white shadow-sm">
              <Zap className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--sfp-slate)' }}>What You Get</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Everything You Need,{' '}
              <span style={{ color: 'var(--sfp-navy)' }}>Nothing You Don&apos;t</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Built for professionals who demand precision, speed, and transparency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: 'Instant Access to Top Tools',
                description: 'Get up and running in minutes. We pre-vet every platform so you can start with confidence — no guesswork, no wasted time.',
                color: 'var(--sfp-gold)',
                bg: 'var(--sfp-sky)',
              },
              {
                icon: LineChart,
                title: 'Expert-Verified Comparisons',
                description: 'Side-by-side comparisons of 100+ products with transparent scoring. Every review is backed by real-world testing and data.',
                color: 'var(--sfp-navy)',
                bg: 'var(--sfp-sky)',
              },
              {
                icon: Shield,
                title: 'A Platform You Can Trust',
                description: 'We only recommend regulated, SOC 2 certified partners. Your security and data protection are non-negotiable.',
                color: 'var(--sfp-navy)',
                bg: 'var(--sfp-sky)',
              },
              {
                icon: Headphones,
                title: 'World-Class Support & Education',
                description: 'Access in-depth guides, expert webinars, and dedicated support. We help you make informed decisions at every stage.',
                color: 'var(--sfp-gold)',
                bg: 'var(--sfp-sky)',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 group hover:scale-[1.03] hover:shadow-lg transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: feature.bg }}>
                  <feature.icon className="h-6 w-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          WHY SMARTFINPRO — 6 Detailed Benefit Cards
          ============================================================ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 border border-gray-200 bg-white shadow-sm">
              <Star className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--sfp-slate)' }}>Why SmartFinPro</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Your <span style={{ color: 'var(--sfp-navy)' }}>Competitive Edge</span> in Finance
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              From AI tools to trading platforms — discover why professionals across 4 markets trust SmartFinPro.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: 'Serving 4 Global Markets',
                description: 'Expert reviews for finance professionals across the US, UK, Canada, and Australia. Over 100 products rigorously reviewed and ranked.',
                cta: { text: 'Explore our reviews', href: '/trading' },
                color: 'var(--sfp-green)',
                bg: 'var(--sfp-sky)',
              },
              {
                icon: Zap,
                title: 'Start in Minutes',
                description: 'Our curated recommendations get you to the right tool fast. No endless research — just expert-matched solutions for your specific needs.',
                cta: { text: 'Explore tools', href: '/ai-tools' },
                color: 'var(--sfp-gold)',
                bg: 'var(--sfp-sky)',
              },
              {
                icon: BarChart3,
                title: 'Your Markets, Your Strategy',
                description: 'AI tools, cybersecurity, trading platforms, forex brokers, personal finance, and business banking — all categories, one trusted source.',
                cta: { text: 'Browse categories', href: '/ai-tools' },
                color: 'var(--sfp-navy)',
                bg: 'var(--sfp-sky)',
              },
              {
                icon: Lock,
                title: 'Transparent & Unbiased',
                description: 'Zero hidden agendas. We disclose all affiliate relationships and maintain editorial independence. Our revenue model never influences our rankings.',
                cta: { text: 'Our methodology', href: '/methodology' },
                color: 'var(--sfp-gold)',
                bg: 'var(--sfp-sky)',
              },
              {
                icon: Headphones,
                title: 'Expert Support & Guidance',
                description: 'Our team of finance professionals is here to help. Get personalized recommendations, in-depth guides, and responsive support when you need it.',
                cta: { text: 'Get in touch', href: '/tools' },
                color: 'var(--sfp-green)',
                bg: 'var(--sfp-sky)',
              },
              {
                icon: MonitorSmartphone,
                title: 'Seamless Cross-Platform Experience',
                description: 'Access reviews, comparisons, and tools on any device. Our platform is optimized for desktop, tablet, and mobile — research anywhere, anytime.',
                cta: { text: 'Try it now', href: '/ai-tools' },
                color: 'var(--sfp-navy)',
                bg: 'var(--sfp-sky)',
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 group hover:scale-[1.02] hover:shadow-lg transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: benefit.bg }}>
                  <benefit.icon className="h-6 w-6" style={{ color: benefit.color }} />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>{benefit.title}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--sfp-slate)' }}>{benefit.description}</p>
                <Link
                  href={benefit.cta.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors group/link"
                  style={{ color: 'var(--sfp-navy)' }}
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
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Built for <span style={{ color: 'var(--sfp-navy)' }}>Every Level</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Whether you&apos;re just starting out or optimizing an existing stack — we have you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Beginners */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8" style={{ borderTopWidth: '3px', borderTopColor: 'var(--sfp-green)' }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'var(--sfp-sky)' }}>
                <GraduationCap className="h-7 w-7" style={{ color: 'var(--sfp-green)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>New to Finance Tech?</h3>
              <p className="mb-6" style={{ color: 'var(--sfp-slate)' }}>Everything you need to get started with confidence.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Step-by-step guides and tutorials',
                  'Beginner-friendly product recommendations',
                  'Jargon-free reviews and explanations',
                  'Free tools and calculators',
                  'Dedicated support for first-time users',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm" style={{ color: 'var(--sfp-ink)' }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--sfp-green)' }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full border-0 text-white shadow-md hover:shadow-lg" style={{ background: 'var(--sfp-gold)' }}>
                <Link href="/tools">
                  Start Learning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Experienced */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8" style={{ borderTopWidth: '3px', borderTopColor: 'var(--sfp-navy)' }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'var(--sfp-sky)' }}>
                <LifeBuoy className="h-7 w-7" style={{ color: 'var(--sfp-navy)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>Seasoned Professional?</h3>
              <p className="mb-6" style={{ color: 'var(--sfp-slate)' }}>Advanced tools and insights to sharpen your edge.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'In-depth platform stress tests and benchmarks',
                  'Head-to-head comparisons with raw data',
                  'Advanced ROI calculators and analytics',
                  'Exclusive deals and negotiated pricing',
                  'Priority access to new product reviews',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm" style={{ color: 'var(--sfp-ink)' }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--sfp-navy)' }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full border-0 text-white shadow-md hover:shadow-lg" style={{ background: 'var(--sfp-navy)' }}>
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
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Ready to Find Your <span style={{ color: 'var(--sfp-navy)' }}>Perfect Tool</span>?
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
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
                bgColor: 'var(--sfp-green)',
              },
              {
                step: '02',
                icon: BarChart3,
                title: 'Compare & Analyze',
                description: 'Use our expert reviews, side-by-side comparisons, and interactive tools to find the best match.',
                bgColor: 'var(--sfp-navy)',
              },
              {
                step: '03',
                icon: Activity,
                title: 'Start with Confidence',
                description: 'Sign up through our vetted links with exclusive deals. Every recommendation is backed by real testing.',
                bgColor: 'var(--sfp-gold)',
              },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md group-hover:scale-110 transition-transform duration-300" style={{ background: item.bgColor }}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--sfp-slate)' }}>Step {item.step}</div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="h-14 px-10 text-lg border-0 shadow-md hover:shadow-lg text-white" style={{ background: 'var(--sfp-gold)' }}>
              <Link href="/ai-tools">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section - Light Trust Design */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--sfp-sky)' }}>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 border border-gray-200 bg-white shadow-sm">
              <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--sfp-slate)' }}>Newsletter</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Stay <span style={{ color: 'var(--sfp-navy)' }}>Ahead</span> of the Curve
            </h2>

            <p className="text-lg mb-10" style={{ color: 'var(--sfp-slate)' }}>
              Get weekly insights on AI tools, cybersecurity trends, and
              financial strategies delivered straight to your inbox.
            </p>

            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 rounded-xl bg-white border border-gray-200 placeholder:text-gray-400 focus:outline-none transition-colors shadow-sm"
                style={{ color: 'var(--sfp-ink)', borderColor: undefined }}
                required
              />
              <Button
                size="lg"
                type="submit"
                className="h-14 px-8 border-0 shadow-md hover:shadow-lg text-white"
                style={{ background: 'var(--sfp-gold)' }}
              >
                Subscribe
              </Button>
            </form>

            <p className="text-xs mt-6" style={{ color: 'var(--sfp-slate)' }}>
              Free weekly insights. No spam, unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
