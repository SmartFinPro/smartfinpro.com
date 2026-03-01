'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  LineChart,
  Users,
  Sparkles,
  RotateCcw,
  Award,
} from 'lucide-react';
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

/* ─── A/B Variant ─── */
function getQuizCtaVariant(): 'A' | 'B' {
  if (typeof window === 'undefined') return 'A';
  try {
    const stored = localStorage.getItem('sfp_quiz_cta_variant');
    if (stored === 'A' || stored === 'B') return stored;
    const variant = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem('sfp_quiz_cta_variant', variant);
    return variant;
  } catch { return 'A'; }
}

/* ─── Types ─── */
type BrokerSlug = 'etoro' | 'capital-com' | 'ibkr' | 'investing' | 'revolut';

interface QuizOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  feedback: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  subtitle: string;
  options: QuizOption[];
}

interface BrokerMeta {
  name: string;
  tagline: string;
  rating: number;
  features: string[];
  affiliateUrl: string;
  regulation: string;
  feeSummary: string;
  bestFor: string;
  notIdealFor: string;
  whyFitsYou: Record<string, string>;
}

interface BrokerResult extends BrokerMeta {
  slug: BrokerSlug;
  score: number;
  reason: string;
}

/* ─── Questions (4) ─── */
const questions: QuizQuestion[] = [
  {
    id: 'experience',
    question: 'How would you describe your trading experience?',
    subtitle: 'This helps us match you with the right platform complexity.',
    options: [
      { id: 'beginner', label: "I'm just starting out", description: 'New to trading', icon: <Sparkles className="h-5 w-5" />, feedback: "Great starting point — we'll find a platform that makes learning easy." },
      { id: 'intermediate', label: 'I have some experience', description: 'Traded for 1–3 years', icon: <TrendingUp className="h-5 w-5" />, feedback: "Nice — you're past the basics. We'll match tools that grow with you." },
      { id: 'advanced', label: "I'm experienced", description: 'Active trader, 3+ years', icon: <BarChart3 className="h-5 w-5" />, feedback: "Solid — we'll prioritize advanced charting and low commissions." },
      { id: 'professional', label: 'Professional trader', description: 'Full-time / institutional', icon: <Award className="h-5 w-5" />, feedback: "Pro-level — we'll focus on institutional-grade execution and pricing." },
    ],
  },
  {
    id: 'goal',
    question: "What's your primary investing goal?",
    subtitle: "We'll prioritize platforms that align with your objectives.",
    options: [
      { id: 'growth', label: 'Long-term Growth', description: 'Build wealth over 5+ years', icon: <TrendingUp className="h-5 w-5" />, feedback: "Smart — compound returns are the most reliable wealth builder." },
      { id: 'income', label: 'Regular Income', description: 'Dividends & yield', icon: <DollarSign className="h-5 w-5" />, feedback: "Steady cash flow — we'll look for strong income-focused tools." },
      { id: 'social', label: 'Learn from Others', description: 'Copy & social trading', icon: <Users className="h-5 w-5" />, feedback: "Great shortcut — copy trading lets you mirror proven strategies from day one." },
      { id: 'analysis', label: 'Data-Driven Trading', description: 'Research & analytics', icon: <LineChart className="h-5 w-5" />, feedback: "Analytical edge — we'll match you with the deepest research platforms." },
    ],
  },
  {
    id: 'budget',
    question: "What's your planned starting capital?",
    subtitle: 'Some platforms have minimum deposit requirements.',
    options: [
      { id: 'small', label: 'Under $1,000', description: 'Getting started', icon: <DollarSign className="h-5 w-5" />, feedback: "No problem — several top platforms have $0 minimums." },
      { id: 'medium', label: '$1,000 – $10,000', description: 'Moderate budget', icon: <DollarSign className="h-5 w-5" />, feedback: "Solid start — this unlocks most platforms and margin accounts." },
      { id: 'large', label: '$10,000 – $50,000', description: 'Serious investment', icon: <DollarSign className="h-5 w-5" />, feedback: "Great capital base — you'll qualify for premium account tiers." },
      { id: 'xlarge', label: '$50,000+', description: 'Professional capital', icon: <DollarSign className="h-5 w-5" />, feedback: "Significant capital — low commissions and premium tools matter most." },
    ],
  },
  {
    id: 'risk_tolerance',
    question: 'How would you describe your risk tolerance?',
    subtitle: 'This helps us match platforms to your comfort level.',
    options: [
      { id: 'conservative', label: 'Conservative', description: 'Capital preservation first', icon: <Shield className="h-5 w-5" />, feedback: "Safety first — we'll prioritize regulated platforms with strong protections." },
      { id: 'moderate', label: 'Moderate', description: 'Balanced risk & reward', icon: <Target className="h-5 w-5" />, feedback: "Balanced approach — the sweet spot for most successful investors." },
      { id: 'aggressive', label: 'Aggressive', description: 'Higher risk, higher reward', icon: <Zap className="h-5 w-5" />, feedback: "Bold strategy — we'll find platforms with tools for active trading." },
      { id: 'very_aggressive', label: 'Very Aggressive', description: 'Maximum growth potential', icon: <TrendingUp className="h-5 w-5" />, feedback: "High conviction — we'll match you with pro-grade leverage and options." },
    ],
  },
];

/* ─── Scoring Matrix (4 dimensions × 25 max = 100 max) ─── */
const scoringMatrix: Record<BrokerSlug, Record<string, Record<string, number>>> = {
  etoro: {
    experience: { beginner: 25, intermediate: 20, advanced: 10, professional: 5 },
    goal: { growth: 20, income: 15, social: 25, analysis: 10 },
    budget: { small: 25, medium: 20, large: 15, xlarge: 5 },
    risk_tolerance: { conservative: 20, moderate: 22, aggressive: 10, very_aggressive: 5 },
  },
  'capital-com': {
    experience: { beginner: 18, intermediate: 25, advanced: 18, professional: 10 },
    goal: { growth: 15, income: 20, social: 10, analysis: 25 },
    budget: { small: 20, medium: 22, large: 18, xlarge: 10 },
    risk_tolerance: { conservative: 12, moderate: 18, aggressive: 22, very_aggressive: 18 },
  },
  ibkr: {
    experience: { beginner: 5, intermediate: 15, advanced: 25, professional: 25 },
    goal: { growth: 22, income: 20, social: 5, analysis: 22 },
    budget: { small: 5, medium: 15, large: 25, xlarge: 25 },
    risk_tolerance: { conservative: 15, moderate: 18, aggressive: 22, very_aggressive: 25 },
  },
  investing: {
    experience: { beginner: 15, intermediate: 22, advanced: 20, professional: 15 },
    goal: { growth: 15, income: 15, social: 12, analysis: 25 },
    budget: { small: 20, medium: 20, large: 18, xlarge: 15 },
    risk_tolerance: { conservative: 18, moderate: 22, aggressive: 15, very_aggressive: 10 },
  },
  revolut: {
    experience: { beginner: 25, intermediate: 20, advanced: 8, professional: 5 },
    goal: { growth: 20, income: 12, social: 10, analysis: 8 },
    budget: { small: 25, medium: 22, large: 10, xlarge: 5 },
    risk_tolerance: { conservative: 22, moderate: 20, aggressive: 10, very_aggressive: 5 },
  },
};

/* ─── Broker Metadata ─── */
const brokerMeta: Record<BrokerSlug, BrokerMeta> = {
  etoro: {
    name: 'eToro',
    tagline: 'Social Trading Pioneer',
    rating: 4.8,
    features: ['Copy Trading from top investors', 'Zero-commission stocks', '30M+ global community', 'User-friendly mobile app'],
    affiliateUrl: '/go/etoro',
    regulation: 'FCA, CySEC & ASIC regulated',
    feeSummary: 'Zero-commission stocks · 1% crypto fee · $5 withdrawal',
    bestFor: 'beginners & social traders',
    notIdealFor: 'Not ideal for advanced charting or options trading',
    whyFitsYou: {
      default: "eToro scores highest based on your unique combination of preferences.",
      'beginner+social': "eToro's copy trading lets you mirror successful traders while you learn the ropes — the fastest way to start.",
      'beginner+conservative': "eToro's regulated platform and copy trading make it the safest way to start investing with guidance.",
      'beginner+growth': "With $0 minimum and commission-free stocks, eToro is perfect for building a long-term portfolio from scratch.",
      'small+social': "Copy top traders with zero commissions and no minimum deposit — eToro removes every barrier to entry.",
      'small+conservative': "Zero-commission stocks on a triple-regulated platform — ideal for growing a small portfolio safely.",
      'intermediate+moderate': "eToro's blend of social insights and commission-free trading gives intermediate traders a unique edge.",
    },
  },
  'capital-com': {
    name: 'Capital.com',
    tagline: 'AI-Powered Trading',
    rating: 4.7,
    features: ['AI-powered market analysis', 'Tight spreads from 0.6 pips', 'TradingView integration', 'Advanced charting tools'],
    affiliateUrl: '/go/capital-com',
    regulation: 'FCA, CySEC & ASIC regulated',
    feeSummary: 'Zero commissions · Spreads from 0.6 pips · No deposit fees',
    bestFor: 'data-driven traders & intermediates',
    notIdealFor: 'Not ideal for long-term buy-and-hold or social trading',
    whyFitsYou: {
      default: "Capital.com scores highest based on your unique combination of trading preferences.",
      'intermediate+analysis': "Capital.com's AI-powered insights and TradingView integration give data-driven traders the deepest toolkit.",
      'advanced+aggressive': "Tight spreads from 0.6 pips and pro-grade charting tools match your active trading style perfectly.",
      'intermediate+aggressive': "Capital.com's AI analysis helps intermediate traders make smarter, data-backed aggressive moves.",
      'medium+analysis': "AI-powered research tools on a zero-commission platform — maximum analytical depth at your budget level.",
      'advanced+analysis': "Deep TradingView integration with AI overlays — the most analytical platform for experienced traders.",
    },
  },
  ibkr: {
    name: 'Interactive Brokers',
    tagline: 'Professional-Grade Platform',
    rating: 4.9,
    features: ['Lowest commissions industry-wide', '150+ markets in 33 countries', 'Professional TWS platform', 'Up to 4.83% on idle cash'],
    affiliateUrl: '/go/ibkr',
    regulation: 'SEC, FCA, ASIC & MAS regulated',
    feeSummary: 'From $0.005/share · No account fees · 4.83% interest on cash',
    bestFor: 'serious & professional traders',
    notIdealFor: 'Not ideal for absolute beginners or small budgets under $1k',
    whyFitsYou: {
      default: "Interactive Brokers scores highest based on your unique combination of trading needs.",
      'professional+very_aggressive': "IBKR offers institutional-grade execution with the lowest commissions and broadest market access.",
      'advanced+aggressive': "150+ markets and professional TWS tools — built for experienced traders who demand the best execution.",
      'large+aggressive': "With $10k+ capital, IBKR's tiered pricing means you'll save significantly on commissions vs. competitors.",
      'xlarge+very_aggressive': "Institutional pricing, portfolio margin, and 150+ markets — IBKR is the only platform built for this level.",
      'professional+analysis': "TWS platform with 100+ order types and API access — the deepest analytical toolkit for professionals.",
      'advanced+growth': "Lowest costs industry-wide plus 4.83% on idle cash — maximize long-term returns with minimal drag.",
    },
  },
  investing: {
    name: 'Investing.com',
    tagline: 'Research & Data Platform',
    rating: 4.6,
    features: ['Real-time market data', 'Economic calendar & news', 'Technical analysis tools', 'Portfolio tracking'],
    affiliateUrl: '/go/investing',
    regulation: 'CySEC regulated',
    feeSummary: 'Free research tools · Commission varies by broker · No platform fee',
    bestFor: 'research-focused & moderate-risk traders',
    notIdealFor: 'Not ideal for social trading or crypto-first investors',
    whyFitsYou: {
      default: "Investing.com scores highest based on your preference for research and data-driven decisions.",
      'intermediate+analysis': "Real-time data, economic calendars, and technical tools — everything a research-focused trader needs.",
      'intermediate+moderate': "Comprehensive market research tools with a moderate risk approach — the informed investor's platform.",
      'advanced+moderate': "Deep technical analysis overlaid with fundamental data — perfect for methodical, data-driven trading.",
      'medium+analysis': "Free research tools with portfolio tracking — maximize your analytical edge without platform fees.",
    },
  },
  revolut: {
    name: 'Revolut',
    tagline: 'Financial Super-App',
    rating: 4.5,
    features: ['Commission-free stock trading', 'Crypto with instant conversion', 'Multi-currency accounts', 'All-in-one financial app'],
    affiliateUrl: '/go/revolut',
    regulation: 'FCA & ECB regulated',
    feeSummary: 'Commission-free stocks · Crypto from 1.49% · No account fees',
    bestFor: 'beginners & all-in-one simplicity',
    notIdealFor: 'Not ideal for advanced charting or professional traders',
    whyFitsYou: {
      default: "Revolut scores highest based on your unique combination of preferences for simplicity and accessibility.",
      'beginner+conservative': "Revolut's all-in-one app makes investing simple and safe — the easiest way to start building wealth.",
      'beginner+growth': "Commission-free stocks in an app you already love — no friction to start your wealth-building journey.",
      'small+conservative': "Zero minimums, commission-free stocks, and FCA regulation — the safest start for small portfolios.",
      'small+moderate': "Start investing with any amount on a beautifully simple platform — ideal for balanced, moderate growth.",
    },
  },
};

/* ─── Scoring ─── */
function calculateScores(answers: Record<string, string>): BrokerResult[] {
  const slugs: BrokerSlug[] = ['etoro', 'capital-com', 'ibkr', 'investing', 'revolut'];
  const maxPossible = 25 * 4; // 4 questions × 25 max each = 100

  return slugs
    .map((slug) => {
      const matrix = scoringMatrix[slug];
      let rawScore = 0;
      for (const [questionId, answerId] of Object.entries(answers)) {
        rawScore += matrix[questionId]?.[answerId] ?? 0;
      }
      const percentage = Math.min(Math.round((rawScore / maxPossible) * 100), 99);
      const meta = brokerMeta[slug];

      // Build personalized reason via key lookup
      const reason = buildReason(slug, answers, meta);

      return { slug, ...meta, score: percentage, reason };
    })
    .sort((a, b) => b.score - a.score || b.rating - a.rating);
}

function buildReason(slug: BrokerSlug, answers: Record<string, string>, meta: BrokerMeta): string {
  const keys = [
    `${answers.experience}+${answers.goal}`,
    `${answers.experience}+${answers.risk_tolerance}`,
    `${answers.budget}+${answers.risk_tolerance}`,
    `${answers.budget}+${answers.goal}`,
    `${answers.goal}+${answers.risk_tolerance}`,
  ];
  for (const key of keys) {
    if (meta.whyFitsYou[key]) return meta.whyFitsYou[key];
  }
  return meta.whyFitsYou.default;
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
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

/* ─── Progress Ring (Results only) ─── */
function ProgressRing({ progress, size = 64, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(148,163,184,0.15)" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#quiz-gradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
      <defs>
        <linearGradient id="quiz-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'var(--sfp-navy)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--sfp-gold)' }} />
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [resultElapsedMs, setResultElapsedMs] = useState<number>(0);
  const hasTrackedStart = useRef(false);
  const quizStartTimeRef = useRef<number>(0);
  const { trackEvent } = useQuizTracking();
  const [ctaVariant] = useState<'A' | 'B'>(() => getQuizCtaVariant());

  const currentQuestion = questions[currentStep];

  // Track quiz start
  useEffect(() => {
    if (!hasTrackedStart.current) {
      trackEvent('quiz_started', { category: 'broker-finder', action: 'start', properties: { totalQuestions: questions.length } });
      quizStartTimeRef.current = Date.now();
      hasTrackedStart.current = true;
    }
  }, [trackEvent]);

  // Track step view
  useEffect(() => {
    if (!showResult) {
      trackEvent('quiz_step_view', {
        category: 'broker-finder',
        action: 'step_view',
        properties: { questionId: questions[currentStep].id, questionNumber: currentStep + 1 },
      });
    }
  }, [currentStep, showResult, trackEvent]);

  // Track dropoff
  useEffect(() => {
    if (showResult) return;

    const handleDropoff = () => {
      trackEvent('quiz_step_dropoff', {
        category: 'broker-finder',
        action: 'dropoff',
        properties: {
          lastQuestionId: questions[currentStep].id,
          lastQuestionNumber: currentStep + 1,
          answersCompleted: Object.keys(answers).length,
          timeSpentMs: Date.now() - (quizStartTimeRef.current || Date.now()),
        },
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleDropoff();
    };

    window.addEventListener('beforeunload', handleDropoff);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleDropoff);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentStep, answers, showResult, trackEvent]);

  const handleSelect = (optionId: string) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(newAnswers);

    // Track answer
    trackEvent('quiz_answer', {
      category: 'broker-finder',
      action: 'answer',
      label: `${currentQuestion.id}: ${optionId}`,
      properties: { questionId: currentQuestion.id, questionNumber: currentStep + 1, answerId: optionId },
    });

    // Show micro-feedback
    const option = currentQuestion.options.find(o => o.id === optionId);
    setFeedbackText(option?.feedback || null);
    setFeedbackVisible(true);

    // After 1.5s: hide feedback, advance
    setTimeout(() => {
      setFeedbackVisible(false);
      setTimeout(() => {
        if (currentStep < questions.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          setShowResult(true);
          const results = calculateScores(newAnswers);
          const elapsedMs = Date.now() - (quizStartTimeRef.current || Date.now());
          setResultElapsedMs(elapsedMs);
          trackEvent('quiz_completed', {
            category: 'broker-finder',
            action: 'complete',
            label: results[0].name,
            properties: {
              topMatch: results[0].name,
              topScore: results[0].score,
              runnerUp: results[1].name,
              runnerUpScore: results[1].score,
              answers: newAnswers,
              ctaVariant,
              timeToCompleteMs: elapsedMs,
            },
          });
        }
        setFeedbackText(null);
        setIsAnimating(false);
      }, 250);
    }, 1500);
  };

  const handleBack = () => {
    if (currentStep > 0 && !isAnimating) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setResultElapsedMs(0);
    setFeedbackText(null);
    setFeedbackVisible(false);
    hasTrackedStart.current = false;
    trackEvent('quiz_restart', { category: 'broker-finder', action: 'restart' });
  };

  const handleCtaClick = (broker: BrokerResult, isTopMatch: boolean) => {
    const ctaText = ctaVariant === 'A' ? `Get Started with ${broker.name}` : `Open Account with ${broker.name}`;
    trackEvent('quiz_cta_click', {
      category: 'broker-finder',
      action: 'cta_click',
      label: broker.name,
      value: 1,
      properties: { broker: broker.name, score: broker.score, affiliateUrl: broker.affiliateUrl, isHighIntent: true, isTopMatch, ctaVariant, ctaText },
    });
  };

  /* ─── Results View ─── */
  if (showResult) {
    const results = calculateScores(answers);
    const top = results[0];
    const runnerUp = results[1];

    return (
      <ResultsView
        top={top}
        runnerUp={runnerUp}
        ctaVariant={ctaVariant}
        onReset={handleReset}
        onCtaClick={handleCtaClick}
        trackEvent={trackEvent}
        quizStartTime={resultElapsedMs}
      />
    );
  }

  /* ─── Quiz View ─── */
  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="relative rounded-[24px] overflow-hidden bg-white" style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
        <div className="relative z-10 p-8 md:p-12">
          {/* Progress */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>
                Question {currentStep + 1} of {questions.length}
              </p>
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="text-sm flex items-center gap-1.5 transition-colors hover:opacity-70"
                  style={{ color: 'var(--sfp-navy)' }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              )}
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#f5f5f7' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--sfp-navy), var(--sfp-gold))' }}
                initial={false}
                animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Question with AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--sfp-ink)' }}>
                {currentQuestion.question}
              </h2>
              <p className="text-sm md:text-base mb-8" style={{ color: 'var(--sfp-slate)' }}>{currentQuestion.subtitle}</p>

              {/* Options Grid — Apple-style cards */}
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      disabled={isAnimating}
                      className="group relative flex flex-col items-center text-center rounded-[20px] transition-all duration-200 ease-out disabled:pointer-events-none"
                      style={{
                        padding: '28px 20px',
                        background: isSelected ? 'rgba(27,79,140,0.06)' : '#f5f5f7',
                        boxShadow: isSelected ? '0 0 0 2px var(--sfp-navy)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {isSelected && (
                        <CheckCircle className="absolute top-3 right-3 h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                      )}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors"
                        style={isSelected ? { background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' } : { background: 'rgba(0,0,0,0.05)', color: 'var(--sfp-slate)' }}
                      >
                        {option.icon}
                      </div>
                      <p className="font-semibold text-sm md:text-base leading-tight mb-1 transition-colors" style={{ color: isSelected ? 'var(--sfp-navy)' : 'var(--sfp-ink)' }}>
                        {option.label}
                      </p>
                      <p className="text-xs leading-snug" style={{ color: 'var(--sfp-slate)' }}>{option.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Micro-Feedback */}
              <AnimatePresence>
                {feedbackVisible && feedbackText && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="mt-6 flex items-center gap-3 rounded-2xl px-5 py-4"
                    style={{ background: '#f5f5f7' }}
                  >
                    <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--sfp-green)' }} />
                    <p className="text-sm" style={{ color: 'var(--sfp-ink)' }}>{feedbackText}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─── Result Card ─── */
function ResultCard({
  broker,
  rank,
  ctaVariant,
  otherBrokerName,
  onCtaClick,
  delay = 0,
}: {
  broker: BrokerResult;
  rank: 1 | 2;
  ctaVariant: 'A' | 'B';
  otherBrokerName: string;
  onCtaClick: (broker: BrokerResult, isTopMatch: boolean) => void;
  delay?: number;
}) {
  const animatedScore = useAnimatedCounter(broker.score);
  const isTop = rank === 1;
  const ctaText = ctaVariant === 'A' ? `Get Started with ${broker.name}` : `Open Account with ${broker.name}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={`relative rounded-[24px] overflow-hidden bg-white ${isTop ? '' : ''}`}
      style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}
    >
      <div className={`relative z-10 ${isTop ? 'p-8 md:p-12' : 'p-6 md:p-8'}`}>
        {/* Badge */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
            style={isTop
              ? { background: '#f5f5f7', color: 'var(--sfp-green)' }
              : { background: '#f5f5f7', color: 'var(--sfp-navy)' }
            }
          >
            <Award className="h-3.5 w-3.5" />
            {isTop ? '#1 Best Match' : '#2 Strong Alternative'}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Info */}
          <div className="flex-1">
            {/* Logo */}
            <div className="h-10 mb-4">
              <Image
                src={`/images/brokers/${broker.slug}.svg`}
                alt={broker.name}
                width={140}
                height={40}
                className="h-10 w-auto"
              />
            </div>

            <h3 className={`font-bold mb-1 ${isTop ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`} style={{ color: 'var(--sfp-ink)' }}>
              {broker.name}
            </h3>
            <p className="mb-4" style={{ color: 'var(--sfp-slate)' }}>{broker.tagline}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(broker.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>{broker.rating}/5</span>
            </div>

            {/* Why fits you */}
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--sfp-navy)' }}>
                {isTop ? 'Why this fits you' : 'Why also worth considering'}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{broker.reason}</p>
            </div>

            {/* Features */}
            <div className="space-y-2 mb-5">
              {broker.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--sfp-green)' }} />
                  <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>{feature}</span>
                </div>
              ))}
            </div>

            {/* Trust Row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5 text-xs" style={{ color: 'var(--sfp-slate)' }}>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" style={{ color: 'var(--sfp-navy)' }} />
                <span>{broker.regulation}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" style={{ color: 'var(--sfp-navy)' }} />
                <span>{broker.feeSummary}</span>
              </div>
            </div>

            {/* Trade-off */}
            <div className="rounded-2xl px-5 py-3.5 text-sm mb-6" style={{ background: '#f5f5f7', color: 'var(--sfp-ink)' }}>
              Best for <strong>{broker.bestFor}</strong>. {broker.notIdealFor}.
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={broker.affiliateUrl}
                onClick={() => onCtaClick(broker, isTop)}
                className="btn-shimmer inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full font-semibold text-sm transition-all hover:scale-[1.02] hover:opacity-90"
                style={{ background: 'var(--sfp-navy)', color: '#ffffff' }}
              >
                {ctaText}
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href={`/reviews/${broker.slug}`}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full font-medium text-sm transition-all hover:bg-gray-50"
                style={{ color: 'var(--sfp-navy)', background: '#f5f5f7' }}
              >
                Compare {broker.name} vs {otherBrokerName}
              </Link>
            </div>
          </div>

          {/* Right: Score Ring */}
          <div className="flex flex-col items-center justify-center lg:w-48">
            <div className="relative">
              <ProgressRing progress={broker.score} size={isTop ? 160 : 128} strokeWidth={isTop ? 8 : 6} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-bold ${isTop ? 'text-4xl' : 'text-3xl'}`} style={{ color: 'var(--sfp-ink)' }}>{animatedScore}%</span>
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Match</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Results Component ─── */
function ResultsView({
  top,
  runnerUp,
  ctaVariant,
  onReset,
  onCtaClick,
  trackEvent,
  quizStartTime,
}: {
  top: BrokerResult;
  runnerUp: BrokerResult;
  ctaVariant: 'A' | 'B';
  onReset: () => void;
  onCtaClick: (broker: BrokerResult, isTopMatch: boolean) => void;
  trackEvent: (eventName: string, options?: { category?: string; action?: string; label?: string; value?: number; properties?: Record<string, unknown> }) => void;
  quizStartTime: number;
}) {
  const hasTrackedResult = useRef(false);

  // Track result view
  useEffect(() => {
    if (!hasTrackedResult.current) {
      trackEvent('quiz_result_view', {
        category: 'broker-finder',
        action: 'result_view',
        properties: {
          topMatch: top.name,
          runnerUp: runnerUp.name,
          ctaVariant,
          timeToCompleteMs: Date.now() - quizStartTime,
        },
      });
      hasTrackedResult.current = true;
    }
  }, [trackEvent, top.name, runnerUp.name, ctaVariant, quizStartTime]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Match */}
      <ResultCard
        broker={top}
        rank={1}
        ctaVariant={ctaVariant}
        otherBrokerName={runnerUp.name}
        onCtaClick={onCtaClick}
        delay={0}
      />

      {/* Runner-up */}
      <ResultCard
        broker={runnerUp}
        rank={2}
        ctaVariant={ctaVariant}
        otherBrokerName={top.name}
        onCtaClick={onCtaClick}
        delay={0.2}
      />

      {/* Reset */}
      <div className="text-center pt-2">
        <button onClick={onReset} className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-70" style={{ color: 'var(--sfp-slate)' }}>
          <RotateCcw className="h-4 w-4" />
          Start Over
        </button>
      </div>
    </div>
  );
}
