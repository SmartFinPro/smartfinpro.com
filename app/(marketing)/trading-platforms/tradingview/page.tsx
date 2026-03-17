import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Code2,
  Globe,
  Layers,
  LineChart,
  MonitorSmartphone,
  MousePointerClick,
  Palette,
  PenTool,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'TradingView Platform Review & Guide | SmartFinPro',
  description:
    'Discover TradingView — the world\'s most powerful charting platform with 50M+ users. Advanced charts, 100+ indicators, Pine Script, and a thriving trading community. Our expert review and setup guide.',
  alternates: {
    canonical: '/trading-platforms/tradingview',
  },
  openGraph: {
    title: 'TradingView Platform Review & Guide | SmartFinPro',
    description:
      'Discover TradingView — the world\'s most powerful charting platform with 50M+ users. Our expert review, setup guide, and exclusive tips.',
    type: 'article',
  },
};

/* ────────────────────────────────────────────────────────────── */
/*  DATA                                                         */
/* ────────────────────────────────────────────────────────────── */

const platformStats = [
  { value: '50M+', label: 'Active Users' },
  { value: '100+', label: 'Built-in Indicators' },
  { value: '12+', label: 'Chart Types' },
  { value: '50+', label: 'Drawing Tools' },
];

const discoverFeatures = [
  {
    icon: MousePointerClick,
    title: 'Intuitive & Powerful Interface',
    description:
      'A clean, customizable workspace that adapts to your trading style. From beginner to quant — TradingView scales with you.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Seamless Multi-Device Experience',
    description:
      'Access your charts, watchlists, and alerts on desktop, tablet, and mobile. Your layout syncs automatically across all devices.',
  },
];

const connectionSteps = [
  {
    step: '01',
    title: 'Create Your Broker Account',
    description:
      'Sign up with a TradingView-compatible broker. SmartFinPro reviews the top brokers that integrate seamlessly with TradingView.',
  },
  {
    step: '02',
    title: 'Connect Your Broker in TradingView',
    description:
      'Open TradingView, navigate to the Trading Panel, and select your broker from the list. Log in to authorize the connection.',
  },
  {
    step: '03',
    title: 'Customize Your Workspace',
    description:
      'Set up your chart layouts, add indicators, create alerts, and configure your preferred drawing tools for maximum efficiency.',
  },
  {
    step: '04',
    title: 'Start Trading with Advanced Charts',
    description:
      'Place trades directly from TradingView charts. Use advanced order types, manage positions, and monitor your P&L in real time.',
  },
];

const accessOptions = [
  {
    platform: 'Desktop App',
    subtitle: 'Windows',
    description: 'Native desktop experience with maximum performance and multi-monitor support.',
    cta: 'Download for Windows',
    href: 'https://www.tradingview.com/desktop/',
  },
  {
    platform: 'Desktop App',
    subtitle: 'macOS',
    description: 'Optimized for Apple Silicon and Intel Macs. Smooth, native performance.',
    cta: 'Download for Mac',
    href: 'https://www.tradingview.com/desktop/',
  },
  {
    platform: 'Web Browser',
    subtitle: 'Any device',
    description: 'No installation required. Access the full platform directly in your browser.',
    cta: 'Launch in Browser',
    href: 'https://www.tradingview.com/chart/',
  },
  {
    platform: 'Mobile App',
    subtitle: 'iOS & Android',
    description: 'Full charting and trading on the go. Alerts, watchlists, and real-time data.',
    cta: 'Get the App',
    href: 'https://www.tradingview.com/mobile/',
  },
];

const tradingFeatures = [
  {
    icon: LineChart,
    title: 'Exclusive Charting Tools',
    description:
      'Access 110+ intelligent drawing tools including trend lines, Fibonacci retracements, Gann fans, Elliott waves, and custom patterns. Build the exact analysis framework you need.',
    highlight: '110+ drawing tools',
  },
  {
    icon: Layers,
    title: 'All-in-One Trading Hub',
    description:
      'Combine multiple indicators, screeners, real-time newsfeeds, and economic calendars in a single workspace. No more switching between platforms.',
    highlight: 'Unified workspace',
  },
  {
    icon: Users,
    title: 'Thriving Community',
    description:
      'Connect with 50M+ traders worldwide. Share ideas, follow top analysts, participate in livestreams, and discover new strategies from the community.',
    highlight: '50M+ traders',
  },
];

const detailedFeatures = [
  {
    icon: BarChart3,
    title: 'Advanced Customizable Charts',
    description:
      'Choose from 12+ chart types including candlestick, Heikin Ashi, Renko, Kagi, Point & Figure, and Range bars. Customize colors, timeframes, and multi-chart layouts to match your strategy.',
    color: 'text-[var(--sfp-green)]',
    bg: 'bg-[#E8F5ED]',
  },
  {
    icon: Bell,
    title: 'Personalized Smart Alerts',
    description:
      'Set up 12+ alert types based on price levels, indicator values, drawing tool intersections, and custom conditions. Get notified via app, email, SMS, or webhook.',
    color: 'text-[var(--sfp-navy)]',
    bg: 'bg-[var(--sfp-sky)]',
  },
  {
    icon: BrainCircuit,
    title: '100+ Technical Indicators',
    description:
      'From classic RSI and MACD to advanced Ichimoku clouds and volume profiles. Plus 100,000+ community-built indicators you can apply instantly.',
    color: 'text-[var(--sfp-navy)]',
    bg: 'bg-[var(--sfp-sky)]',
  },
  {
    icon: TrendingUp,
    title: 'Fundamental Analysis Tools',
    description:
      'Access financial statements, key ratios, earnings data, and economic indicators. Overlay fundamental data directly on your charts for a complete picture.',
    color: 'text-[var(--sfp-gold)]',
    bg: 'bg-[#FEF5E7]',
  },
  {
    icon: Code2,
    title: 'Pine Script Programming',
    description:
      'Build custom indicators, strategies, and automated alerts with Pine Script — TradingView\'s proprietary scripting language. Backtest strategies with historical data.',
    color: 'text-[var(--sfp-red)]',
    bg: 'bg-[#FEE8E8]',
  },
  {
    icon: Globe,
    title: 'Social Network & Livestreams',
    description:
      'Follow expert traders, share your analysis, and watch live trading sessions. The world\'s largest trading community at your fingertips.',
    color: 'text-[var(--sfp-navy)]',
    bg: 'bg-[var(--sfp-sky)]',
  },
];

const whySmartFinPro = [
  {
    icon: Star,
    title: 'Expert-Verified Review',
    description:
      'Our finance professionals have stress-tested TradingView across markets, devices, and strategies. We provide transparent, unbiased analysis.',
  },
  {
    icon: Shield,
    title: 'Trusted Broker Matching',
    description:
      'We review and rank the best brokers that integrate with TradingView. Only regulated, vetted partners make our recommendation list.',
  },
  {
    icon: BookOpen,
    title: 'In-Depth Tutorials & Guides',
    description:
      'Step-by-step setup guides, Pine Script tutorials, and advanced charting strategies — all created by our trading experts.',
  },
  {
    icon: Bot,
    title: 'AI-Powered Tool Discovery',
    description:
      'Our SmartFinder quiz matches you with the ideal TradingView plan and compatible broker based on your trading style and budget.',
  },
  {
    icon: Zap,
    title: 'Exclusive Tips & Strategies',
    description:
      'Unlock insider tips on TradingView features most traders miss — from hidden shortcuts to advanced Pine Script templates.',
  },
  {
    icon: Palette,
    title: 'Free Comparison Tools',
    description:
      'Compare TradingView plans side by side, benchmark against competitors, and calculate the ROI of upgrading to Premium.',
  },
];

const faqs = [
  {
    question: 'What devices can I use TradingView on?',
    answer:
      'TradingView works on virtually any device. You can use the web browser version on any computer, download native desktop apps for Windows, macOS, and Linux, or use the mobile apps for iOS and Android. Your layouts, watchlists, and alerts sync automatically across all devices.',
  },
  {
    question: 'Is TradingView free to use?',
    answer:
      'Yes, TradingView offers a generous free plan (Basic) that includes essential charting tools, 3 indicators per chart, and 1 alert. Paid plans (Essential, Plus, Premium) unlock more indicators, alerts, multi-chart layouts, and advanced features. SmartFinPro provides detailed plan comparisons to help you choose.',
  },
  {
    question: 'Can I trade directly from TradingView?',
    answer:
      'Yes! TradingView integrates with 50+ supported brokers. Once you connect your broker account, you can place trades, manage orders, and monitor positions directly from your charts. Check our broker reviews to find the best TradingView-compatible broker for your needs.',
  },
  {
    question: 'What markets can I analyze on TradingView?',
    answer:
      'TradingView covers stocks, forex, crypto, commodities, indices, bonds, and futures across 100+ global exchanges. You can analyze virtually any tradeable instrument with real-time or delayed data depending on your plan and exchange subscriptions.',
  },
  {
    question: 'What is Pine Script and do I need it?',
    answer:
      'Pine Script is TradingView\'s built-in programming language for creating custom indicators and automated strategies. You don\'t need it to use TradingView effectively — the 100+ built-in indicators cover most needs. However, Pine Script gives advanced users the power to build unique tools and backtest strategies.',
  },
];

/* ────────────────────────────────────────────────────────────── */
/*  PAGE                                                         */
/* ────────────────────────────────────────────────────────────── */

export default function TradingViewPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden" style={{ background: 'var(--sfp-navy)' }}>
        <div className="container relative z-10 mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center gap-2 text-sm mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/us/trading" className="hover:text-white transition-colors">Trading</Link>
              <span>/</span>
              <span className="text-white">TradingView</span>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Expert-Reviewed Platform</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
              Trade Smarter with{' '}
              <span style={{ color: 'var(--sfp-gold)' }}>TradingView</span>
            </h1>

            <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
              The world&apos;s most popular charting platform with 50M+ users. Advanced charts,
              100+ indicators, Pine Script, and a thriving social trading community — all in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                asChild
                size="lg"
                className="h-14 px-10 text-lg text-white border-0 shadow-lg"
                style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
              >
                <Link href="https://www.tradingview.com/?aff_id=SMARTFINPRO" target="_blank" rel="noopener sponsored">
                  Try TradingView Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-10 text-lg border-white/30 text-white hover:bg-white/10"
              >
                <Link href="#features">
                  Explore Features
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {platformStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl px-4 py-4 text-center border border-white/15 bg-white/10 transition-colors"
                >
                  <div className="text-2xl md:text-3xl font-bold tabular-nums mb-1" style={{ color: 'var(--sfp-gold)' }}>
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0,60 L0,20 Q360,0 720,20 Q1080,40 1440,20 L1440,60 Z" fill="var(--sfp-gray)" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          DISCOVER TRADINGVIEW
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white shadow-sm px-4 py-2 mb-6">
              <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>Discover</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Discover <span style={{ color: 'var(--sfp-navy)' }}>TradingView</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              The most popular social network for traders and investors on the web — trusted by
              50+ million users worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {discoverFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 group hover:scale-[1.03] transition-all duration-500"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'var(--sfp-sky)' }}>
                  <feature.icon className="h-7 w-7" style={{ color: 'var(--sfp-navy)' }} />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>{feature.title}</h3>
                <p className="leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW TO GET STARTED — 4 Steps
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white shadow-sm px-4 py-2 mb-6">
              <Zap className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>Quick Start</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Get Started with <span style={{ color: 'var(--sfp-navy)' }}>TradingView</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Connect your broker and start trading with professional-grade charts in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
            {connectionSteps.map((item) => (
              <div key={item.step} className="relative group">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 h-full transition-all duration-300">
                  {/* Step number */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: 'var(--sfp-navy)' }}>
                    <span className="text-lg font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="h-14 px-10 text-lg text-white border-0 shadow-lg"
              style={{ background: 'var(--sfp-navy)' }}
            >
              <Link href="https://www.tradingview.com/?aff_id=SMARTFINPRO" target="_blank" rel="noopener sponsored">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          ACCESS / DOWNLOAD OPTIONS
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Access TradingView <span style={{ color: 'var(--sfp-navy)' }}>Anywhere</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Choose your preferred platform — your charts and settings sync across all devices.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {accessOptions.map((option) => (
              <div
                key={`${option.platform}-${option.subtitle}`}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 text-center group hover:scale-[1.03] transition-all duration-500"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--sfp-sky)' }}>
                  <MonitorSmartphone className="h-7 w-7" style={{ color: 'var(--sfp-navy)' }} />
                </div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>{option.platform}</h3>
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--sfp-navy)' }}>{option.subtitle}</p>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{option.description}</p>
                <Button
                  asChild
                  size="sm"
                  className="w-full text-white border-0"
                  style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
                >
                  <Link href={option.href} target="_blank" rel="noopener sponsored">
                    {option.cta}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WHY TRADE ON TRADINGVIEW — 3 Key Highlights
          ═══════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 bg-white relative overflow-hidden">
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white shadow-sm px-4 py-2 mb-6">
              <Star className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>Key Advantages</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Why Trade on <span style={{ color: 'var(--sfp-navy)' }}>TradingView</span>?
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              The tools, community, and data that make TradingView the go-to platform for serious traders.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tradingFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 group hover:scale-[1.03] transition-all duration-500 border-t-2"
                style={{ borderTopColor: 'var(--sfp-navy)' }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'var(--sfp-sky)' }}>
                  <feature.icon className="h-7 w-7" style={{ color: 'var(--sfp-navy)' }} />
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4" style={{ background: 'var(--sfp-sky)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--sfp-navy)' }}>{feature.highlight}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PLATFORM FEATURES — 6 Detailed Cards
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white shadow-sm px-4 py-2 mb-6">
              <PenTool className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>Deep Dive</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Powerful Features,{' '}
              <span style={{ color: 'var(--sfp-navy)' }}>Endless Possibilities</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Everything you need to analyze, strategize, and execute — all within one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {detailedFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 group hover:scale-[1.02] transition-all duration-500"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WHY USE SMARTFINPRO — 6 Value Props
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white shadow-sm px-4 py-2 mb-6">
              <Shield className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>SmartFinPro Advantage</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Why Discover TradingView{' '}
              <span style={{ color: 'var(--sfp-navy)' }}>Through Us</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              We don&apos;t just review TradingView — we help you master it with expert guides,
              broker matching, and exclusive insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whySmartFinPro.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 group hover:scale-[1.02] transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(26,107,58,0.08)' }}>
                  <item.icon className="h-6 w-6" style={{ color: 'var(--sfp-green)' }} />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button
              asChild
              size="lg"
              className="h-14 px-10 text-lg text-white border-0 shadow-lg"
              style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
            >
              <Link href="/us/trading">
                Read Our Trading Reviews
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-10 text-lg border-gray-200 hover:bg-gray-50"
              style={{ color: 'var(--sfp-ink)' }}
            >
              <Link href="https://www.tradingview.com/?aff_id=SMARTFINPRO" target="_blank" rel="noopener sponsored">
                Try TradingView Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PLAN COMPARISON — CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-white shadow-sm p-10 md:p-14 text-center border-t-2" style={{ borderTopColor: 'var(--sfp-navy)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg" style={{ background: 'var(--sfp-navy)' }}>
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              Ready to Elevate Your Trading?
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
              Join 50 million traders using the most advanced charting platform.
              Start free and upgrade when you&apos;re ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="h-14 px-10 text-lg text-white border-0 shadow-lg"
                style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
              >
                <Link href="https://www.tradingview.com/?aff_id=SMARTFINPRO" target="_blank" rel="noopener sponsored">
                  Start Trading for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="text-xs mt-6" style={{ color: 'var(--sfp-slate)' }}>
              Free plan available. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FAQ
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Frequently Asked <span style={{ color: 'var(--sfp-navy)' }}>Questions</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Everything you need to know about TradingView.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="rounded-xl border border-gray-200 bg-white shadow-sm group"
              >
                <summary className="flex items-center justify-between cursor-pointer p-6 font-medium transition-colors list-none" style={{ color: 'var(--sfp-ink)' }}>
                  {faq.question}
                  <ChevronDown className="h-5 w-5 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4" style={{ color: 'var(--sfp-slate)' }} />
                </summary>
                <div className="px-6 pb-6 pt-0 text-sm leading-relaxed border-t border-gray-200 mt-0 pt-4" style={{ color: 'var(--sfp-slate)' }}>
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          NEWSLETTER
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white shadow-sm px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>Stay Informed</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Get Trading <span style={{ color: 'var(--sfp-navy)' }}>Insights</span>
            </h2>

            <p className="text-lg mb-10" style={{ color: 'var(--sfp-slate)' }}>
              Weekly TradingView tips, strategy breakdowns, and platform updates
              delivered to your inbox.
            </p>

            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 rounded-xl bg-white border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ color: 'var(--sfp-ink)' }}
                required
              />
              <Button
                size="lg"
                type="submit"
                className="h-14 px-8 text-white border-0 shadow-lg"
                style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
              >
                Subscribe
              </Button>
            </form>

            <p className="text-xs mt-6" style={{ color: 'var(--sfp-slate)' }}>
              Join 10,000+ subscribers. We respect your privacy.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
