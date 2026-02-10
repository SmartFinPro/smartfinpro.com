'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  Shield,
  Zap,
  Eye,
  LineChart,
  Users,
  Sparkles,
  RotateCcw,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

/* ─── Tracking Hook ─── */
function useQuizTracking() {
  const pathname = usePathname();
  const trackEvent = useCallback(
    async (eventName: string, options?: { category?: string; action?: string; label?: string; value?: number; properties?: Record<string, unknown> }) => {
      if (typeof window === 'undefined') return;
      let sessionId = sessionStorage.getItem('sfp_session_id');
      if (!sessionId) { sessionId = crypto.randomUUID(); sessionStorage.setItem('sfp_session_id', sessionId); }
      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'event', sessionId, data: { eventName, eventCategory: options?.category, eventAction: options?.action, eventLabel: options?.label, eventValue: options?.value, properties: options?.properties, pagePath: pathname } }),
        });
      } catch { /* silent */ }
    },
    [pathname]
  );
  return { trackEvent };
}

/* ─── Types ─── */
type BrokerSlug = 'etoro' | 'capital-com' | 'ibkr' | 'investing' | 'revolut';

interface QuizOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface QuizQuestion {
  id: string;
  question: string;
  subtitle: string;
  options: QuizOption[];
}

interface BrokerResult {
  slug: BrokerSlug;
  name: string;
  tagline: string;
  score: number;
  rating: number;
  features: string[];
  affiliateUrl: string;
  accentGradient: string;
  accentColor: string;
  reason: string;
}

/* ─── Questions ─── */
const questions: QuizQuestion[] = [
  {
    id: 'experience',
    question: 'How would you describe your trading experience?',
    subtitle: 'This helps us match you with the right platform complexity.',
    options: [
      { id: 'beginner', label: "I'm just starting out", description: 'New to trading', icon: <Sparkles className="h-5 w-5" /> },
      { id: 'intermediate', label: 'I have some experience', description: 'Traded for 1-2 years', icon: <TrendingUp className="h-5 w-5" /> },
      { id: 'advanced', label: "I'm experienced", description: 'Active trader, 3+ years', icon: <BarChart3 className="h-5 w-5" /> },
      { id: 'professional', label: 'Professional trader', description: 'Full-time / institutional', icon: <Award className="h-5 w-5" /> },
    ],
  },
  {
    id: 'goal',
    question: "What's your primary trading goal?",
    subtitle: 'We\'ll prioritize platforms that align with your objectives.',
    options: [
      { id: 'growth', label: 'Long-term Growth', description: 'Build wealth over time', icon: <TrendingUp className="h-5 w-5" /> },
      { id: 'income', label: 'Regular Income', description: 'Generate consistent returns', icon: <DollarSign className="h-5 w-5" /> },
      { id: 'social', label: 'Learn from Others', description: 'Copy successful traders', icon: <Users className="h-5 w-5" /> },
      { id: 'analysis', label: 'Data-Driven Trading', description: 'Research & analytics focus', icon: <LineChart className="h-5 w-5" /> },
    ],
  },
  {
    id: 'budget',
    question: "What's your planned starting capital?",
    subtitle: 'Some platforms have minimum deposit requirements.',
    options: [
      { id: 'small', label: 'Under $1,000', description: 'Getting started', icon: <DollarSign className="h-5 w-5" /> },
      { id: 'medium', label: '$1,000 – $10,000', description: 'Moderate budget', icon: <DollarSign className="h-5 w-5" /> },
      { id: 'large', label: '$10,000 – $50,000', description: 'Serious investment', icon: <DollarSign className="h-5 w-5" /> },
      { id: 'xlarge', label: '$50,000+', description: 'Professional capital', icon: <DollarSign className="h-5 w-5" /> },
    ],
  },
  {
    id: 'instruments',
    question: 'What do you want to trade?',
    subtitle: 'Different platforms excel at different asset classes.',
    options: [
      { id: 'stocks', label: 'Stocks & ETFs', description: 'Equities and funds', icon: <BarChart3 className="h-5 w-5" /> },
      { id: 'forex', label: 'Forex & Currencies', description: 'FX pairs', icon: <DollarSign className="h-5 w-5" /> },
      { id: 'crypto', label: 'Crypto', description: 'Bitcoin, Ethereum & more', icon: <Zap className="h-5 w-5" /> },
      { id: 'multi', label: 'Everything (Multi-Asset)', description: 'Stocks, FX, crypto & more', icon: <Target className="h-5 w-5" /> },
    ],
  },
  {
    id: 'feature',
    question: 'What matters most to you?',
    subtitle: 'We\'ll weight this factor highest in your results.',
    options: [
      { id: 'fees', label: 'Lowest Fees', description: 'Keep costs minimal', icon: <DollarSign className="h-5 w-5" /> },
      { id: 'platform', label: 'Best Platform & Tools', description: 'Charts, analytics, research', icon: <Eye className="h-5 w-5" /> },
      { id: 'ease', label: 'Ease of Use', description: 'Simple, intuitive interface', icon: <Sparkles className="h-5 w-5" /> },
      { id: 'safety', label: 'Security & Regulation', description: 'Trust & compliance', icon: <Shield className="h-5 w-5" /> },
    ],
  },
];

/* ─── Scoring Matrix ─── */
const scoringMatrix: Record<BrokerSlug, Record<string, Record<string, number>>> = {
  etoro: {
    experience: { beginner: 25, intermediate: 20, advanced: 10, professional: 5 },
    goal: { growth: 20, income: 15, social: 25, analysis: 10 },
    budget: { small: 25, medium: 20, large: 15, xlarge: 5 },
    instruments: { stocks: 20, forex: 15, crypto: 20, multi: 20 },
    feature: { fees: 10, platform: 15, ease: 25, safety: 15 },
  },
  'capital-com': {
    experience: { beginner: 20, intermediate: 25, advanced: 15, professional: 10 },
    goal: { growth: 15, income: 20, social: 10, analysis: 25 },
    budget: { small: 20, medium: 20, large: 15, xlarge: 10 },
    instruments: { stocks: 15, forex: 20, crypto: 15, multi: 20 },
    feature: { fees: 15, platform: 20, ease: 20, safety: 15 },
  },
  ibkr: {
    experience: { beginner: 5, intermediate: 15, advanced: 25, professional: 25 },
    goal: { growth: 20, income: 20, social: 5, analysis: 20 },
    budget: { small: 5, medium: 15, large: 25, xlarge: 25 },
    instruments: { stocks: 25, forex: 20, crypto: 10, multi: 25 },
    feature: { fees: 25, platform: 20, ease: 5, safety: 25 },
  },
  investing: {
    experience: { beginner: 15, intermediate: 20, advanced: 20, professional: 15 },
    goal: { growth: 15, income: 15, social: 15, analysis: 25 },
    budget: { small: 20, medium: 20, large: 20, xlarge: 15 },
    instruments: { stocks: 20, forex: 20, crypto: 15, multi: 20 },
    feature: { fees: 15, platform: 25, ease: 15, safety: 15 },
  },
  revolut: {
    experience: { beginner: 25, intermediate: 20, advanced: 10, professional: 5 },
    goal: { growth: 20, income: 15, social: 10, analysis: 10 },
    budget: { small: 25, medium: 25, large: 10, xlarge: 5 },
    instruments: { stocks: 20, forex: 10, crypto: 25, multi: 15 },
    feature: { fees: 20, platform: 10, ease: 25, safety: 20 },
  },
};

/* ─── Broker Metadata ─── */
const brokerMeta: Record<BrokerSlug, { name: string; tagline: string; rating: number; features: string[]; affiliateUrl: string; accentGradient: string; accentColor: string }> = {
  etoro: {
    name: 'eToro',
    tagline: 'Social Trading Pioneer',
    rating: 4.8,
    features: ['Copy Trading from top investors', 'Zero-commission stocks', '30M+ global community', 'User-friendly mobile app'],
    affiliateUrl: '/go/etoro',
    accentGradient: 'from-emerald-500 to-teal-600',
    accentColor: 'text-emerald-400',
  },
  'capital-com': {
    name: 'Capital.com',
    tagline: 'AI-Powered Trading',
    rating: 4.7,
    features: ['AI-powered market analysis', 'Tight spreads from 0.6 pips', 'TradingView integration', 'Advanced charting tools'],
    affiliateUrl: '/go/capital-com',
    accentGradient: 'from-rose-500 to-pink-600',
    accentColor: 'text-rose-400',
  },
  ibkr: {
    name: 'Interactive Brokers',
    tagline: 'Professional-Grade Platform',
    rating: 4.9,
    features: ['Lowest commissions industry-wide', '150+ markets in 33 countries', 'Professional TWS platform', 'Up to 4.83% on idle cash'],
    affiliateUrl: '/go/ibkr',
    accentGradient: 'from-violet-500 to-purple-600',
    accentColor: 'text-violet-400',
  },
  investing: {
    name: 'Investing.com',
    tagline: 'Research & Data Platform',
    rating: 4.6,
    features: ['Real-time market data', 'Economic calendar & news', 'Technical analysis tools', 'Portfolio tracking'],
    affiliateUrl: '/go/investing',
    accentGradient: 'from-amber-500 to-orange-600',
    accentColor: 'text-amber-400',
  },
  revolut: {
    name: 'Revolut',
    tagline: 'Financial Super-App',
    rating: 4.5,
    features: ['Commission-free stock trading', 'Crypto with instant conversion', 'Multi-currency accounts', 'All-in-one financial app'],
    affiliateUrl: '/go/revolut',
    accentGradient: 'from-blue-500 to-indigo-600',
    accentColor: 'text-blue-400',
  },
};

/* ─── Scoring ─── */
function calculateScores(answers: Record<string, string>): BrokerResult[] {
  const slugs: BrokerSlug[] = ['etoro', 'capital-com', 'ibkr', 'investing', 'revolut'];
  const maxPossible = 25 * 5; // Max score per question is 25, 5 questions

  return slugs
    .map((slug) => {
      const matrix = scoringMatrix[slug];
      let rawScore = 0;
      for (const [questionId, answerId] of Object.entries(answers)) {
        rawScore += matrix[questionId]?.[answerId] ?? 0;
      }
      const percentage = Math.round((rawScore / maxPossible) * 100);
      const meta = brokerMeta[slug];

      // Build personalized reason
      let reason = '';
      if (answers.experience === 'beginner' && slug === 'etoro') reason = 'eToro\'s copy trading lets you mirror successful traders while you learn the ropes.';
      else if (answers.experience === 'professional' && slug === 'ibkr') reason = 'IBKR offers the professional-grade tools and institutional pricing you need.';
      else if (answers.goal === 'analysis' && slug === 'investing') reason = 'Investing.com provides the deepest research and data tools for data-driven decisions.';
      else if (answers.goal === 'social' && slug === 'etoro') reason = 'eToro\'s 30M+ community and copy trading make it the best for social trading.';
      else if (answers.feature === 'fees' && slug === 'ibkr') reason = 'Interactive Brokers has the lowest commissions in the industry.';
      else if (answers.feature === 'ease' && slug === 'revolut') reason = 'Revolut\'s intuitive super-app makes trading accessible from day one.';
      else if (answers.instruments === 'crypto' && slug === 'revolut') reason = 'Revolut offers seamless crypto trading with instant conversion.';
      else reason = `${meta.name} scores highest based on your unique combination of preferences.`;

      return { slug, ...meta, score: percentage, reason };
    })
    .sort((a, b) => b.score - a.score);
}

/* ─── Animated Counter Hook ─── */
function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

/* ─── Progress Ring ─── */
function ProgressRing({ progress, size = 64, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(148,163,184,0.2)" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#gradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Main Component ─── */
export function BrokerFinderQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [isAnimating, setIsAnimating] = useState(false);
  const hasTrackedStart = useRef(false);
  const { trackEvent } = useQuizTracking();

  const currentQuestion = questions[currentStep];
  const progress = showResult ? 100 : ((currentStep) / questions.length) * 100;

  useEffect(() => {
    if (!hasTrackedStart.current) {
      trackEvent('quiz_started', { category: 'broker-finder', action: 'start', label: 'broker-finder-quiz', properties: { totalQuestions: questions.length } });
      hasTrackedStart.current = true;
    }
  }, [trackEvent]);

  const handleSelect = (optionId: string) => {
    if (isAnimating) return;
    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(newAnswers);

    trackEvent('quiz_answer', {
      category: 'broker-finder',
      action: 'answer',
      label: `${currentQuestion.id}: ${optionId}`,
      properties: { questionId: currentQuestion.id, questionNumber: currentStep + 1, answerId: optionId },
    });

    setIsAnimating(true);
    setSlideDirection('left');

    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setShowResult(true);
        const results = calculateScores(newAnswers);
        trackEvent('quiz_completed', {
          category: 'broker-finder',
          action: 'complete',
          label: results[0].name,
          properties: { topMatch: results[0].name, topScore: results[0].score, answers: newAnswers },
        });
      }
      setIsAnimating(false);
    }, 400);
  };

  const handleBack = () => {
    if (currentStep > 0 && !isAnimating) {
      setSlideDirection('right');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    hasTrackedStart.current = false;
    trackEvent('quiz_restart', { category: 'broker-finder', action: 'restart' });
  };

  const handleCtaClick = (broker: BrokerResult) => {
    trackEvent('quiz_cta_click', {
      category: 'broker-finder',
      action: 'cta_click',
      label: broker.name,
      value: 1,
      properties: { broker: broker.name, score: broker.score, affiliateUrl: broker.affiliateUrl, isHighIntent: true },
    });
  };

  /* ─── Results View ─── */
  if (showResult) {
    const results = calculateScores(answers);
    const top = results[0];
    const runners = results.slice(1, 3);

    return <ResultsView top={top} runners={runners} onReset={handleReset} onCtaClick={handleCtaClick} />;
  }

  /* ─── Quiz View ─── */
  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Dark container */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #0f0a1a 100%)' }}>
        {/* Aurora glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        </div>

        <div className="relative z-10 p-6 md:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ProgressRing progress={progress} size={48} strokeWidth={3} />
              <div>
                <p className="text-sm font-medium text-white">Step {currentStep + 1} of {questions.length}</p>
                <p className="text-xs text-slate-500">Broker Finder Quiz</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="hidden sm:block w-48">
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)' }}
                />
              </div>
            </div>
          </div>

          {/* Question */}
          <div
            className={`transition-all duration-300 ${
              isAnimating
                ? slideDirection === 'left'
                  ? 'opacity-0 -translate-x-8'
                  : 'opacity-0 translate-x-8'
                : 'opacity-100 translate-x-0'
            }`}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {currentQuestion.question}
            </h2>
            <p className="text-sm text-slate-400 mb-8">{currentQuestion.subtitle}</p>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`group relative flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400/10'
                        : 'border-slate-700/50 bg-white/[0.03] hover:border-cyan-400/40 hover:bg-cyan-400/[0.05] hover:scale-[1.02]'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-cyan-400/20 text-cyan-400' : 'bg-slate-800/60 text-slate-400 group-hover:text-cyan-400'
                    }`}>
                      {option.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium transition-colors ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          {currentStep > 0 && (
            <button onClick={handleBack} className="mt-6 flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Results Component ─── */
function ResultsView({
  top,
  runners,
  onReset,
  onCtaClick,
}: {
  top: BrokerResult;
  runners: BrokerResult[];
  onReset: () => void;
  onCtaClick: (broker: BrokerResult) => void;
}) {
  const animatedScore = useAnimatedCounter(top.score);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Match */}
      <div
        className={`relative rounded-3xl overflow-hidden transition-all duration-700 ${
          revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #0f0a1a 100%)' }}
      >
        {/* Aurora glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 60%)', filter: 'blur(100px)' }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 60%)', filter: 'blur(100px)' }} />
        </div>

        <div className="relative z-10 p-6 md:p-10">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))', color: '#06b6d4' }}>
              <Award className="h-3.5 w-3.5" />
              #1 Perfect Match
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Info */}
            <div className="flex-1">
              {/* Logo */}
              <div className="h-10 mb-4">
                <Image
                  src={`/images/brokers/${top.slug}.svg`}
                  alt={top.name}
                  width={140}
                  height={40}
                  className="h-10 w-auto"
                />
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">{top.name}</h2>
              <p className="text-slate-400 mb-4">{top.tagline}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(top.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-400">{top.rating}/5</span>
              </div>

              {/* Reason */}
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">{top.reason}</p>

              {/* Features */}
              <div className="space-y-2.5 mb-8">
                {top.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={top.affiliateUrl}
                  onClick={() => onCtaClick(top)}
                  className="btn-shimmer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
                >
                  Try {top.name} Free
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href={`/reviews/${top.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-400 text-sm border border-slate-700/50 hover:border-slate-600 hover:text-white transition-all"
                >
                  Read Full Review
                </Link>
              </div>
            </div>

            {/* Right: Score Ring */}
            <div className="flex flex-col items-center justify-center lg:w-48">
              <div className="relative">
                <ProgressRing progress={top.score} size={160} strokeWidth={8} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{animatedScore}%</span>
                  <span className="text-xs text-slate-500">Match</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Runner-ups */}
      <div className="grid md:grid-cols-2 gap-4">
        {runners.map((broker, i) => (
          <div
            key={broker.slug}
            className={`relative rounded-2xl overflow-hidden transition-all duration-700 ${
              revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 100%)',
              transitionDelay: `${(i + 1) * 200}ms`,
            }}
          >
            <div className="relative z-10 p-5 md:p-6 border border-slate-800/50 rounded-2xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs text-slate-500 font-medium">#{i + 2} Runner-up</span>
                  <div className="flex items-center gap-3 mt-1">
                    <Image
                      src={`/images/brokers/${broker.slug}.svg`}
                      alt={broker.name}
                      width={100}
                      height={28}
                      className="h-7 w-auto"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">{broker.score}%</span>
                  <span className="block text-xs text-slate-500">Match</span>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className={`h-3 w-3 ${j < Math.floor(broker.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                  />
                ))}
                <span className="text-xs text-slate-500 ml-1">{broker.rating}</span>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{broker.reason}</p>

              <Link
                href={`/reviews/${broker.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View Review
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Reset */}
      <div className="text-center">
        <button onClick={onReset} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors">
          <RotateCcw className="h-4 w-4" />
          Start Over
        </button>
      </div>
    </div>
  );
}
