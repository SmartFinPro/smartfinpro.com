'use client';
// MiniQuiz v2 — redesigned to match trading-cost-calculator style (dual cards)
import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  ChevronUp,
  CheckCircle,
  Sparkles,
  TrendingUp,
  BarChart3,
  DollarSign,
  Zap,
  LineChart,
  Users,
  Shield,
  Globe,
  Building2,
  CreditCard,
  Brain,
  PenTool,
  Bot,
  ArrowRight,
  RotateCcw,
  Loader2,
  Crosshair,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import type { Market, Category } from '@/types';

// ── Types ────────────────────────────────────────────────────

type Topic = 'trading' | 'personal-finance' | 'forex' | 'business-banking' | 'ai-tools' | 'broker' | 'banking';

interface MiniQuizProps {
  topic: Topic;
  market?: Market;
  title?: string;
}

interface QuizOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  tags: string[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

interface QuizResult {
  slug: string;
  partnerName: string;
  score: number;
  maxScore: number;
  features: string[];
  bestFor: string;
  notIdealFor: string;
  complianceLabel: string;
}

interface DualResult {
  bestMatch: QuizResult;
  bestPrice: QuizResult;
}

interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  prefix?: string;
  suffix?: string;
  /** Scale labels: [min, mid, max] */
  scale: [string, string, string];
  /** Convert value to scoring tags */
  toTags: (value: number) => string[];
}

// ── Topic → Category Mapping ─────────────────────────────────

const TOPIC_CATEGORY: Record<Topic, Category> = {
  'trading': 'trading',
  'personal-finance': 'personal-finance',
  'forex': 'forex',
  'business-banking': 'business-banking',
  'ai-tools': 'ai-tools',
  'broker': 'trading',
  'banking': 'savings',
};

const TOPIC_LABELS: Record<Topic, string> = {
  'trading': 'trading platform',
  'personal-finance': 'financial product',
  'forex': 'forex broker',
  'business-banking': 'business bank',
  'ai-tools': 'AI tool',
  'broker': 'broker',
  'banking': 'bank account',
};

// ── Question Registry ────────────────────────────────────────

const TOPIC_QUESTIONS: Record<Topic, QuizQuestion[]> = {
  trading: [
    {
      id: 'level',
      question: 'Your experience level?',
      options: [
        { id: 'beginner', label: 'Beginner', icon: <Sparkles className="w-6 h-6" />, tags: ['beginner', 'simple'] },
        { id: 'intermediate', label: 'Intermediate', icon: <TrendingUp className="w-6 h-6" />, tags: ['intermediate'] },
        { id: 'advanced', label: 'Advanced', icon: <BarChart3 className="w-6 h-6" />, tags: ['advanced', 'pro'] },
      ],
    },
    {
      id: 'priority',
      question: 'Top priority?',
      options: [
        { id: 'low-fees', label: 'Low fees', icon: <DollarSign className="w-6 h-6" />, tags: ['low-cost'] },
        { id: 'ease', label: 'Easy to use', icon: <Zap className="w-6 h-6" />, tags: ['beginner', 'simple'] },
        { id: 'tools', label: 'Pro tools', icon: <LineChart className="w-6 h-6" />, tags: ['advanced', 'research'] },
        { id: 'social', label: 'Copy trading', icon: <Users className="w-6 h-6" />, tags: ['social', 'beginner'] },
      ],
    },
  ],
  forex: [
    {
      id: 'level',
      question: 'Your forex experience?',
      options: [
        { id: 'beginner', label: 'New to forex', icon: <Sparkles className="w-6 h-6" />, tags: ['beginner', 'simple'] },
        { id: 'intermediate', label: 'Some experience', icon: <TrendingUp className="w-6 h-6" />, tags: ['intermediate'] },
        { id: 'advanced', label: 'Professional', icon: <BarChart3 className="w-6 h-6" />, tags: ['advanced', 'pro'] },
      ],
    },
    {
      id: 'priority',
      question: 'What matters most?',
      options: [
        { id: 'spreads', label: 'Tight spreads', icon: <DollarSign className="w-6 h-6" />, tags: ['low-cost', 'pro'] },
        { id: 'regulation', label: 'Strong regulation', icon: <Shield className="w-6 h-6" />, tags: ['regulated', 'safe'] },
        { id: 'platforms', label: 'MT4/MT5 access', icon: <LineChart className="w-6 h-6" />, tags: ['advanced', 'metatrader'] },
        { id: 'global', label: 'Multi-currency', icon: <Globe className="w-6 h-6" />, tags: ['global', 'intermediate'] },
      ],
    },
  ],
  'personal-finance': [
    {
      id: 'goal',
      question: 'Your main goal?',
      options: [
        { id: 'invest', label: 'Start investing', icon: <TrendingUp className="w-6 h-6" />, tags: ['investing', 'beginner'] },
        { id: 'save', label: 'Grow savings', icon: <DollarSign className="w-6 h-6" />, tags: ['savings', 'safe'] },
        { id: 'credit', label: 'Build credit', icon: <CreditCard className="w-6 h-6" />, tags: ['credit', 'repair'] },
        { id: 'plan', label: 'Plan finances', icon: <LineChart className="w-6 h-6" />, tags: ['planning', 'robo'] },
      ],
    },
    {
      id: 'priority',
      question: 'Top priority?',
      options: [
        { id: 'low-fees', label: 'Low fees', icon: <DollarSign className="w-6 h-6" />, tags: ['low-cost'] },
        { id: 'ease', label: 'Easy to use', icon: <Zap className="w-6 h-6" />, tags: ['beginner', 'simple'] },
        { id: 'returns', label: 'Best returns', icon: <TrendingUp className="w-6 h-6" />, tags: ['performance', 'advanced'] },
        { id: 'safety', label: 'Safety first', icon: <Shield className="w-6 h-6" />, tags: ['safe', 'insured'] },
      ],
    },
  ],
  'business-banking': [
    {
      id: 'size',
      question: 'Business size?',
      options: [
        { id: 'solo', label: 'Freelancer', icon: <Users className="w-6 h-6" />, tags: ['solo', 'simple'] },
        { id: 'small', label: 'Small team', icon: <Building2 className="w-6 h-6" />, tags: ['small', 'growing'] },
        { id: 'medium', label: 'Scaling up', icon: <TrendingUp className="w-6 h-6" />, tags: ['medium', 'multi-user'] },
      ],
    },
    {
      id: 'need',
      question: 'Most important feature?',
      options: [
        { id: 'international', label: 'Global payments', icon: <Globe className="w-6 h-6" />, tags: ['global', 'fx'] },
        { id: 'low-fees', label: 'Low fees', icon: <DollarSign className="w-6 h-6" />, tags: ['low-cost', 'simple'] },
        { id: 'integrations', label: 'Integrations', icon: <Zap className="w-6 h-6" />, tags: ['integrations', 'api'] },
        { id: 'lending', label: 'Credit line', icon: <CreditCard className="w-6 h-6" />, tags: ['lending', 'growth'] },
      ],
    },
  ],
  'ai-tools': [
    {
      id: 'use',
      question: 'Primary use?',
      options: [
        { id: 'writing', label: 'Content writing', icon: <PenTool className="w-6 h-6" />, tags: ['writing', 'content'] },
        { id: 'analysis', label: 'Data analysis', icon: <Brain className="w-6 h-6" />, tags: ['analysis', 'data'] },
        { id: 'automation', label: 'Automation', icon: <Bot className="w-6 h-6" />, tags: ['automation', 'workflow'] },
      ],
    },
    {
      id: 'priority',
      question: 'What matters most?',
      options: [
        { id: 'accuracy', label: 'Accuracy', icon: <Shield className="w-6 h-6" />, tags: ['accuracy', 'quality'] },
        { id: 'speed', label: 'Speed', icon: <Zap className="w-6 h-6" />, tags: ['speed', 'fast'] },
        { id: 'price', label: 'Best value', icon: <DollarSign className="w-6 h-6" />, tags: ['low-cost', 'value'] },
        { id: 'features', label: 'Most features', icon: <Sparkles className="w-6 h-6" />, tags: ['features', 'advanced'] },
      ],
    },
  ],
  broker: [
    {
      id: 'style',
      question: 'How do you prefer to invest?',
      options: [
        { id: 'self', label: 'Self-directed', icon: <LineChart className="w-6 h-6" />, tags: ['self-directed', 'active'] },
        { id: 'guided', label: 'Guided / robo', icon: <Bot className="w-6 h-6" />, tags: ['robo', 'passive', 'beginner'] },
        { id: 'social', label: 'Copy trading', icon: <Users className="w-6 h-6" />, tags: ['social', 'beginner'] },
        { id: 'pro', label: 'Day trading', icon: <BarChart3 className="w-6 h-6" />, tags: ['advanced', 'pro', 'active'] },
      ],
    },
    {
      id: 'priority',
      question: 'Most important factor?',
      options: [
        { id: 'fees', label: 'Lowest fees', icon: <DollarSign className="w-6 h-6" />, tags: ['low-cost'] },
        { id: 'range', label: 'Product range', icon: <Globe className="w-6 h-6" />, tags: ['global', 'research', 'advanced'] },
        { id: 'ease', label: 'Ease of use', icon: <Zap className="w-6 h-6" />, tags: ['beginner', 'simple'] },
        { id: 'trust', label: 'Reputation', icon: <Shield className="w-6 h-6" />, tags: ['regulated', 'safe'] },
      ],
    },
  ],
  banking: [
    {
      id: 'need',
      question: 'What are you looking for?',
      options: [
        { id: 'savings', label: 'High-yield savings', icon: <DollarSign className="w-6 h-6" />, tags: ['savings', 'high-yield', 'safe'] },
        { id: 'everyday', label: 'Everyday account', icon: <CreditCard className="w-6 h-6" />, tags: ['checking', 'everyday', 'simple'] },
        { id: 'digital', label: 'Digital bank', icon: <Zap className="w-6 h-6" />, tags: ['digital', 'app', 'modern'] },
        { id: 'isa', label: 'ISA / tax-free', icon: <Shield className="w-6 h-6" />, tags: ['isa', 'tax-free', 'investing'] },
      ],
    },
    {
      id: 'priority',
      question: 'Top priority?',
      options: [
        { id: 'rate', label: 'Best rates', icon: <TrendingUp className="w-6 h-6" />, tags: ['high-yield', 'performance'] },
        { id: 'access', label: 'Easy access', icon: <Zap className="w-6 h-6" />, tags: ['simple', 'everyday', 'app'] },
        { id: 'safety', label: 'FSCS / insured', icon: <Shield className="w-6 h-6" />, tags: ['safe', 'insured'] },
        { id: 'features', label: 'Best app', icon: <Sparkles className="w-6 h-6" />, tags: ['digital', 'modern', 'app'] },
      ],
    },
  ],
};

// ── Slider Registry ──────────────────────────────────────────

const TOPIC_SLIDERS: Record<Topic, SliderConfig[]> = {
  trading: [
    {
      id: 'amount', label: 'Trade Amount', min: 100, max: 100000, step: 100, default: 5000,
      prefix: '$', scale: ['$100', '$50k', '$100k'],
      toTags: (v) => v >= 50000 ? ['high-value', 'pro'] : v <= 1000 ? ['small-account', 'beginner'] : ['mid-range'],
    },
    {
      id: 'frequency', label: 'Trades / Month', min: 1, max: 100, step: 1, default: 10,
      suffix: ' trades', scale: ['1', '50', '100'],
      toTags: (v) => v >= 30 ? ['active-trader', 'pro'] : v <= 5 ? ['casual', 'beginner'] : ['moderate'],
    },
  ],
  forex: [
    {
      id: 'lotSize', label: 'Position Size', min: 1000, max: 100000, step: 1000, default: 10000,
      prefix: '$', scale: ['$1k', '$50k', '$100k'],
      toTags: (v) => v >= 50000 ? ['high-value', 'pro'] : v <= 5000 ? ['micro-lot', 'beginner'] : ['standard'],
    },
    {
      id: 'frequency', label: 'Trades / Week', min: 1, max: 50, step: 1, default: 5,
      suffix: ' trades', scale: ['1', '25', '50'],
      toTags: (v) => v >= 20 ? ['scalper', 'active-trader'] : v <= 3 ? ['casual', 'swing'] : ['moderate'],
    },
  ],
  'personal-finance': [
    {
      id: 'investment', label: 'Investment Amount', min: 100, max: 500000, step: 500, default: 10000,
      prefix: '$', scale: ['$100', '$250k', '$500k'],
      toTags: (v) => v >= 100000 ? ['high-value', 'premium'] : v <= 5000 ? ['starter', 'beginner'] : ['mid-range'],
    },
    {
      id: 'monthly', label: 'Monthly Contribution', min: 0, max: 5000, step: 50, default: 500,
      prefix: '$', suffix: '/mo', scale: ['$0', '$2.5k', '$5k'],
      toTags: (v) => v >= 2000 ? ['high-saver', 'serious'] : v <= 200 ? ['casual-saver', 'beginner'] : ['steady-saver'],
    },
  ],
  'business-banking': [
    {
      id: 'revenue', label: 'Monthly Revenue', min: 1000, max: 500000, step: 1000, default: 25000,
      prefix: '$', scale: ['$1k', '$250k', '$500k'],
      toTags: (v) => v >= 100000 ? ['enterprise', 'premium'] : v <= 10000 ? ['startup', 'solo'] : ['growing'],
    },
    {
      id: 'transactions', label: 'Monthly Transactions', min: 10, max: 1000, step: 10, default: 100,
      suffix: ' txns', scale: ['10', '500', '1k'],
      toTags: (v) => v >= 300 ? ['high-volume', 'multi-user'] : v <= 50 ? ['low-volume', 'simple'] : ['moderate'],
    },
  ],
  'ai-tools': [
    {
      id: 'budget', label: 'Monthly Budget', min: 0, max: 500, step: 10, default: 50,
      prefix: '$', suffix: '/mo', scale: ['Free', '$250', '$500'],
      toTags: (v) => v >= 200 ? ['premium', 'enterprise'] : v <= 20 ? ['free-tier', 'value'] : ['mid-tier'],
    },
    {
      id: 'teamSize', label: 'Team Size', min: 1, max: 100, step: 1, default: 3,
      suffix: ' people', scale: ['1', '50', '100'],
      toTags: (v) => v >= 20 ? ['enterprise', 'team'] : v <= 3 ? ['solo', 'individual'] : ['small-team'],
    },
  ],
  broker: [
    {
      id: 'portfolio', label: 'Portfolio Size', min: 100, max: 500000, step: 500, default: 15000,
      prefix: '$', scale: ['$100', '$250k', '$500k'],
      toTags: (v) => v >= 100000 ? ['high-value', 'premium'] : v <= 5000 ? ['starter', 'beginner'] : ['mid-range'],
    },
    {
      id: 'frequency', label: 'Trades / Month', min: 1, max: 100, step: 1, default: 8,
      suffix: ' trades', scale: ['1', '50', '100'],
      toTags: (v) => v >= 30 ? ['active-trader', 'pro'] : v <= 5 ? ['passive', 'beginner'] : ['moderate'],
    },
  ],
  banking: [
    {
      id: 'savings', label: 'Savings Goal', min: 1000, max: 500000, step: 1000, default: 20000,
      prefix: '$', scale: ['$1k', '$250k', '$500k'],
      toTags: (v) => v >= 100000 ? ['high-value', 'premium'] : v <= 10000 ? ['starter', 'casual'] : ['mid-range'],
    },
    {
      id: 'deposit', label: 'Monthly Deposit', min: 100, max: 10000, step: 100, default: 500,
      prefix: '$', suffix: '/mo', scale: ['$100', '$5k', '$10k'],
      toTags: (v) => v >= 3000 ? ['high-saver', 'serious'] : v <= 500 ? ['casual-saver', 'beginner'] : ['steady-saver'],
    },
  ],
};

// ── Helpers ──────────────────────────────────────────────────

function detectMarket(pathname: string): Market {
  if (pathname.startsWith('/uk')) return 'uk';
  if (pathname.startsWith('/ca')) return 'ca';
  if (pathname.startsWith('/au')) return 'au';
  return 'us';
}

// ── Component ───────────────────────────────────────────────

export function MiniQuiz({ topic, market: marketProp, title }: MiniQuizProps) {
  const pathname = usePathname();
  const market = marketProp ?? detectMarket(pathname);
  const category = TOPIC_CATEGORY[topic];
  const questions = TOPIC_QUESTIONS[topic];
  const label = TOPIC_LABELS[topic];

  const sliders = TOPIC_SLIDERS[topic];

  const [expanded, setExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSliders, setShowSliders] = useState(false);
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(sliders.map((s) => [s.id, s.default]))
  );
  const [dualResult, setDualResult] = useState<DualResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalSteps = questions.length + 1; // card questions + slider step
  const teaserTitle = title ?? `Find your perfect ${label} match`;

  const handleExpand = useCallback(() => {
    setExpanded(true);
    // Fire-and-forget tracking
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'quiz_mini_started',
        properties: { topic, market, pagePath: pathname },
      }),
    }).catch(() => {});
  }, [topic, market, pathname]);

  const handleSelect = useCallback(
    (questionId: string, optionId: string) => {
      const newAnswers = { ...answers, [questionId]: optionId };
      setAnswers(newAnswers);

      // Track answer
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'quiz_mini_answer',
          properties: { questionId, answerId: optionId, topic },
        }),
      }).catch(() => {});

      if (currentStep < questions.length - 1) {
        // Next card question
        setTimeout(() => setCurrentStep((s) => s + 1), 300);
      } else {
        // All card questions answered → show slider step
        setTimeout(() => setShowSliders(true), 300);
      }
    },
    [answers, currentStep, questions, topic],
  );

  /** Collect all tags (card answers + slider values) and fetch result */
  const handleSubmitSliders = useCallback(async () => {
    setLoading(true);
    const allTags: string[] = [];

    // Tags from card answers
    for (const q of questions) {
      const selectedId = answers[q.id];
      const opt = q.options.find((o) => o.id === selectedId);
      if (opt) allTags.push(...opt.tags);
    }

    // Tags from sliders
    for (const s of sliders) {
      allTags.push(...s.toTags(sliderValues[s.id]));
    }

    try {
      const res = await fetch('/api/mini-quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market, category, tags: allTags }),
      });
      if (res.ok) {
        const data: DualResult = await res.json();
        setDualResult(data);
        setShowResult(true);

        // Track completion
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'quiz_mini_completed',
            properties: { topic, market, topMatch: data.bestMatch.partnerName, score: data.bestMatch.score, tags: allTags },
          }),
        }).catch(() => {});
      }
    } catch {
      // Silently fail — quiz is non-critical
    } finally {
      setLoading(false);
    }
  }, [answers, questions, sliders, sliderValues, market, category, topic]);

  const handleReset = useCallback(() => {
    setAnswers({});
    setCurrentStep(0);
    setShowSliders(false);
    setSliderValues(Object.fromEntries(sliders.map((s) => [s.id, s.default])));
    setDualResult(null);
    setShowResult(false);
  }, [sliders]);

  const trackCta = useCallback((r: QuizResult, label: string) => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'quiz_mini_cta_click',
        properties: { partner: r.partnerName, slug: r.slug, score: r.score, topic, label },
      }),
    }).catch(() => {});
  }, [topic]);

  // ── A) Collapsed State ─────────────────────────────────────
  if (!expanded) {
    return (
      <button
        onClick={handleExpand}
        className="w-full flex items-center justify-between gap-4 rounded-2xl px-4 py-2.5 text-left group transition-all duration-200 hover:shadow-md"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(245,166,35,0.28)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(245,166,35,0.55)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,166,35,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(245,166,35,0.28)';
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
        }}
      >
        {/* Left: icon + text */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--sfp-sky)' }}
          >
            <Crosshair className="w-4 h-4" style={{ color: 'var(--sfp-navy)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider truncate" style={{ color: 'var(--sfp-slate)' }}>
              Platform Finder
            </p>
            <p className="text-sm font-medium truncate" style={{ color: 'var(--sfp-ink)' }}>
              {teaserTitle}
            </p>
          </div>
        </div>
        {/* Right: pill CTA */}
        <div
          className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl font-medium whitespace-nowrap transition-colors"
          style={{
            background: 'var(--sfp-gold)',
            color: '#ffffff',
            fontSize: '12px',
            padding: '6px 14px',
          }}
        >
          Start
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>
    );
  }

  // ── B) Expanded Quiz ───────────────────────────────────────
  const currentQuestion = questions[currentStep];
  const displayStep = showSliders ? totalSteps : currentStep + 1;

  /** Format a slider value with its prefix/suffix */
  const fmtSliderValue = (cfg: SliderConfig, val: number) => {
    const num = val >= 1000 ? `${(val / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k` : val.toLocaleString('en-US');
    return `${cfg.prefix ?? ''}${num}${cfg.suffix ?? ''}`;
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <Crosshair className="h-5 w-5 shrink-0" style={{ color: 'var(--sfp-navy)' }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--sfp-ink)' }}>
              {teaserTitle}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
            >
              {displayStep} / {totalSteps}
            </span>
            <button
              onClick={() => { setExpanded(false); handleReset(); }}
              className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
            >
              <ChevronUp className="w-4 h-4" style={{ color: 'var(--sfp-slate)' }} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-5 mb-4 h-1 rounded-full overflow-hidden bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(displayStep / totalSteps) * 100}%`,
              background: 'var(--sfp-navy)',
            }}
          />
        </div>

        {/* ── Card Questions ─── */}
        {!showSliders && (
          <div className="px-5 pb-5">
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>
              {currentQuestion.question}
            </label>

            <div className="grid grid-cols-2 gap-2">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(currentQuestion.id, option.id)}
                    disabled={loading}
                    className="p-3 rounded-xl border text-left transition-all disabled:pointer-events-none hover:border-gray-300"
                    style={
                      isSelected
                        ? { borderColor: 'var(--sfp-navy)', background: 'rgba(27,79,140,0.08)' }
                        : { borderColor: '#e5e7eb', background: 'white' }
                    }
                  >
                    <span
                      className="flex items-center gap-2 text-sm font-medium"
                      style={{ color: isSelected ? 'var(--sfp-navy)' : 'var(--sfp-ink)' }}
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        style={
                          isSelected
                            ? { background: 'rgba(27,79,140,0.12)', color: 'var(--sfp-navy)' }
                            : { background: 'var(--sfp-gray)', color: 'var(--sfp-slate)' }
                        }
                      >
                        {option.icon}
                      </span>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Slider Step ─── */}
        {showSliders && (
          <div className="px-5 pb-5 space-y-5">
            <label className="block text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>
              Fine-tune your preferences
            </label>

            {sliders.map((cfg) => (
              <div key={cfg.id}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>
                    {cfg.label}
                  </span>
                  <span
                    className="text-sm font-semibold px-3 py-1 rounded-full"
                    style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                  >
                    {fmtSliderValue(cfg, sliderValues[cfg.id])}
                  </span>
                </div>
                <Slider
                  value={[sliderValues[cfg.id]]}
                  onValueChange={(v) => setSliderValues((prev) => ({ ...prev, [cfg.id]: v[0] }))}
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  className="py-2"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                  <span>{cfg.scale[0]}</span>
                  <span>{cfg.scale[1]}</span>
                  <span>{cfg.scale[2]}</span>
                </div>
              </div>
            ))}

            {/* Submit button */}
            <button
              onClick={handleSubmitSliders}
              disabled={loading}
              className="btn-shimmer w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none"
              style={{ background: 'var(--sfp-navy)', color: '#ffffff' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding your match…
                </>
              ) : (
                <>
                  Find my match <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── C) Result Popup — Dual Cards ──────────────────────── */}
      <Dialog open={showResult && dualResult !== null} onOpenChange={setShowResult}>
        <DialogContent
          className="sm:max-w-lg border-0 p-0 overflow-hidden"
          style={{
            borderRadius: '20px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }}
        >
          <DialogTitle className="sr-only">Your Top Picks</DialogTitle>
          <DialogDescription className="sr-only">
            Quiz results showing your recommended {label} options
          </DialogDescription>

          {dualResult && (
            <div className="p-5">
              {/* Header */}
              <p className="text-center text-xs font-semibold mb-4" style={{ color: 'var(--sfp-slate)' }}>
                YOUR TOP PICKS
              </p>

              {/* Two cards side by side */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { result: dualResult.bestMatch, badge: 'Best Match' as const, badgeBg: 'var(--sfp-navy)', badgeColor: '#fff' },
                  { result: dualResult.bestPrice, badge: 'Best Price' as const, badgeBg: 'var(--sfp-green)', badgeColor: '#fff' },
                ]).filter((item) => item.result && item.result.features).map(({ result: r, badge, badgeBg, badgeColor }) => (
                  <div
                    key={r.slug + badge}
                    className="rounded-xl border border-gray-200 p-3.5 flex flex-col"
                  >
                    {/* Badge */}
                    <span
                      className="self-start inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold mb-2.5 tracking-wide"
                      style={{ background: badgeBg, color: badgeColor }}
                    >
                      {badge}
                    </span>

                    {/* Partner name */}
                    <h4 className="text-sm font-bold mb-2 leading-tight" style={{ color: 'var(--sfp-ink)' }}>
                      {r.partnerName}
                    </h4>

                    {/* Features (2 max) */}
                    <div className="space-y-1.5 mb-3 flex-1">
                      {r.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'var(--sfp-green)' }} />
                          <p className="text-[11px] leading-snug" style={{ color: 'var(--sfp-slate)' }}>{feature}</p>
                        </div>
                      ))}
                    </div>

                    {/* Best for line */}
                    <p className="text-[10px] leading-snug mb-3" style={{ color: 'var(--sfp-slate)' }}>
                      <strong style={{ color: 'var(--sfp-ink)' }}>Best for:</strong> {r.bestFor}
                    </p>

                    {/* CTA */}
                    <a
                      href={`/go/${r.slug}/`}
                      target="_blank"
                      rel="nofollow noopener sponsored"
                      onClick={() => trackCta(r, badge)}
                      className="mt-auto flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-full font-semibold text-xs transition-all hover:scale-[1.02] hover:opacity-90"
                      style={{ background: badgeBg, color: badgeColor }}
                    >
                      Visit <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>

              {/* Try again */}
              <button
                onClick={() => { setShowResult(false); handleReset(); }}
                className="flex items-center justify-center gap-1.5 w-full mt-3 py-1.5 text-xs font-medium transition-colors hover:opacity-70"
                style={{ color: 'var(--sfp-slate)' }}
              >
                <RotateCcw className="w-3 h-3" />
                Try different answers
              </button>

              {/* Compliance */}
              <p className="text-center text-[10px] mt-2 leading-snug" style={{ color: 'var(--sfp-slate)' }}>
                {dualResult.bestMatch.complianceLabel}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
