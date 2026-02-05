'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Globe,
  DollarSign,
  Building,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

// Simple event tracking hook that doesn't use useSearchParams
// This avoids the Suspense boundary requirement for static pages
function useQuizTracking() {
  const pathname = usePathname();

  const trackEvent = useCallback(
    async (
      eventName: string,
      options?: {
        category?: string;
        action?: string;
        label?: string;
        value?: number;
        properties?: Record<string, unknown>;
      }
    ) => {
      if (typeof window === 'undefined') return;

      // Get session ID
      let sessionId = sessionStorage.getItem('sfp_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('sfp_session_id', sessionId);
      }

      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'event',
            sessionId,
            data: {
              eventName,
              eventCategory: options?.category,
              eventAction: options?.action,
              eventLabel: options?.label,
              eventValue: options?.value,
              properties: options?.properties,
              pagePath: pathname,
            },
          }),
        });
      } catch (error) {
        console.error('Quiz tracking error:', error);
      }
    },
    [pathname]
  );

  return { trackEvent };
}

// Quiz Types
interface QuizOption {
  id: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

interface Recommendation {
  name: string;
  tagline: string;
  reason: string;
  features: string[];
  affiliateUrl: string;
  rating: number;
  badge?: string;
}

// Quiz Questions
const questions: QuizQuestion[] = [
  {
    id: 'region',
    question: 'Where is your business primarily based?',
    options: [
      {
        id: 'us',
        label: 'United States',
        description: 'US-incorporated business',
        icon: <span className="text-lg">🇺🇸</span>,
      },
      {
        id: 'ca',
        label: 'Canada',
        description: 'Canadian business',
        icon: <span className="text-lg">🇨🇦</span>,
      },
      {
        id: 'au',
        label: 'Australia',
        description: 'Australian business',
        icon: <span className="text-lg">🇦🇺</span>,
      },
      {
        id: 'uk',
        label: 'United Kingdom',
        description: 'UK-based business',
        icon: <span className="text-lg">🇬🇧</span>,
      },
    ],
  },
  {
    id: 'volume',
    question: 'What\'s your monthly international payment volume?',
    options: [
      {
        id: 'low',
        label: 'Under $10,000',
        description: 'Just getting started internationally',
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        id: 'medium',
        label: '$10,000 - $100,000',
        description: 'Regular international operations',
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        id: 'high',
        label: '$100,000 - $500,000',
        description: 'Significant international volume',
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        id: 'enterprise',
        label: 'Over $500,000',
        description: 'Enterprise-level operations',
        icon: <Building className="h-5 w-5" />,
      },
    ],
  },
  {
    id: 'focus',
    question: 'What\'s your primary banking need?',
    options: [
      {
        id: 'fx',
        label: 'International FX & Transfers',
        description: 'Sending/receiving payments globally',
        icon: <Globe className="h-5 w-5" />,
      },
      {
        id: 'domestic',
        label: 'Domestic Operations',
        description: 'Primarily local business banking',
        icon: <Building className="h-5 w-5" />,
      },
      {
        id: 'startup',
        label: 'Startup Banking',
        description: 'Modern features, VC-friendly',
        icon: <Sparkles className="h-5 w-5" />,
      },
      {
        id: 'both',
        label: 'Both International & Domestic',
        description: 'Need a comprehensive solution',
        icon: <CheckCircle className="h-5 w-5" />,
      },
    ],
  },
];

// Recommendation Logic
function getRecommendation(answers: Record<string, string>): Recommendation {
  const { region, volume, focus } = answers;

  // High-volume international = Revolut Scale
  if (
    (volume === 'high' || volume === 'enterprise') &&
    (focus === 'fx' || focus === 'both')
  ) {
    return {
      name: 'Revolut Business Scale',
      tagline: 'Best for High-Volume International',
      reason: `With ${volume === 'enterprise' ? '500k+' : '100k+'}/month in international payments, Revolut's unlimited free transfers on Scale plan will save you thousands.`,
      features: [
        'Unlimited free international transfers',
        '0% FX markup on all currencies',
        'Unlimited virtual & physical cards',
        'API access for automation',
      ],
      affiliateUrl: '/go/revolut-business',
      rating: 4.7,
      badge: 'Best for High Volume',
    };
  }

  // US startup focus = Mercury
  if (region === 'us' && (focus === 'startup' || focus === 'domestic')) {
    return {
      name: 'Mercury',
      tagline: 'Best for US Startups',
      reason:
        'Mercury is built specifically for US startups with FDIC insurance up to $5M, zero fees, and VC-friendly features like SAFE tracking.',
      features: [
        '$0 monthly fees, $0 wire fees',
        'FDIC insured up to $5 million',
        '5.19% APY on Treasury',
        'Startup tools (SAFEs, cap table)',
      ],
      affiliateUrl: '/go/mercury',
      rating: 4.8,
      badge: 'Best for Startups',
    };
  }

  // International focus (any volume below high) = Wise
  if (focus === 'fx' || focus === 'both') {
    const currencyNote =
      region === 'ca'
        ? 'CAD'
        : region === 'au'
          ? 'AUD'
          : region === 'uk'
            ? 'GBP'
            : 'USD';

    return {
      name: 'Wise Business',
      tagline: 'Best for International Payments',
      reason: `Wise offers the real mid-market exchange rate with transparent fees. You'll save 80%+ on FX compared to traditional banks in ${region?.toUpperCase() || 'your region'}.`,
      features: [
        '$0 monthly fee',
        'Real mid-market rate (0.4-0.6% fee only)',
        `Local ${currencyNote} account + 40+ currencies`,
        'US, UK, EU account details included',
      ],
      affiliateUrl: '/go/wise-business',
      rating: 4.9,
      badge: "Editor's Choice",
    };
  }

  // Default to Wise for most scenarios
  return {
    name: 'Wise Business',
    tagline: 'Best All-Round Business Account',
    reason:
      'Based on your needs, Wise offers the best combination of low fees, multi-currency support, and ease of use.',
    features: [
      '$0 monthly fee',
      '40+ currency accounts',
      'Local account details in 10+ countries',
      'Transparent, low-cost transfers',
    ],
    affiliateUrl: '/go/wise-business',
    rating: 4.9,
    badge: "Editor's Choice",
  };
}

// Quiz Component
export function SmartFinderQuiz({ className = '' }: { className?: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const hasTrackedStart = useRef(false);
  const { trackEvent } = useQuizTracking();

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  // Track quiz started (only once)
  useEffect(() => {
    if (!hasTrackedStart.current) {
      trackEvent('quiz_started', {
        category: 'quiz',
        action: 'start',
        label: 'smart-finder-quiz',
        properties: {
          quizType: 'business-account-finder',
          totalQuestions: questions.length,
        },
      });
      hasTrackedStart.current = true;
    }
  }, [trackEvent]);

  const handleSelect = (optionId: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(newAnswers);

    // Track answer selection
    trackEvent('quiz_answer', {
      category: 'quiz',
      action: 'answer',
      label: `${currentQuestion.id}: ${optionId}`,
      properties: {
        questionId: currentQuestion.id,
        questionNumber: currentStep + 1,
        answerId: optionId,
        answerLabel: currentQuestion.options.find((o) => o.id === optionId)?.label,
      },
    });

    // Auto-advance after selection
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setShowResult(true);

        // Track quiz completion with recommendation
        const recommendation = getRecommendation(newAnswers);
        trackEvent('quiz_completed', {
          category: 'quiz',
          action: 'complete',
          label: recommendation.name,
          properties: {
            recommendedProduct: recommendation.name,
            recommendedSlug: recommendation.affiliateUrl.replace('/go/', ''),
            answers: newAnswers,
            badge: recommendation.badge,
          },
        });
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    hasTrackedStart.current = false;

    // Track quiz restart
    trackEvent('quiz_restart', {
      category: 'quiz',
      action: 'restart',
      label: 'smart-finder-quiz',
    });
  };

  // Track CTA click (high-intent event!)
  const handleCtaClick = (recommendation: Recommendation) => {
    trackEvent('quiz_cta_click', {
      category: 'quiz',
      action: 'cta_click',
      label: recommendation.name,
      value: 1, // High-intent marker
      properties: {
        recommendedProduct: recommendation.name,
        affiliateUrl: recommendation.affiliateUrl,
        answers,
        isHighIntent: true,
      },
    });
  };

  // Result View
  if (showResult) {
    const recommendation = getRecommendation(answers);

    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Your Perfect Match
            </CardTitle>
            {recommendation.badge && (
              <Badge className="bg-white/20 text-white border-0">
                {recommendation.badge}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-1">{recommendation.name}</h3>
            <p className="text-muted-foreground">{recommendation.tagline}</p>
          </div>

          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={cn(
                  'text-lg',
                  i < Math.floor(recommendation.rating)
                    ? 'text-yellow-500'
                    : 'text-gray-300'
                )}
              >
                ★
              </span>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {recommendation.rating}/5
            </span>
          </div>

          <p className="text-muted-foreground mb-6">{recommendation.reason}</p>

          <div className="space-y-2 mb-6">
            <p className="font-medium text-sm">Key Features:</p>
            {recommendation.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1 gap-2">
              <a
                href={recommendation.affiliateUrl}
                onClick={() => handleCtaClick(recommendation)}
              >
                Open {recommendation.name.split(' ')[0]} Account
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quiz View
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Find Your Perfect Business Account
          </CardTitle>
          <Badge className="bg-white/20 text-white border-0">
            {currentStep + 1} of {questions.length}
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-6">{currentQuestion.question}</h3>

        <div className="grid gap-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all',
                'hover:border-primary hover:bg-primary/5',
                answers[currentQuestion.id] === option.id
                  ? 'border-primary bg-primary/10'
                  : 'border-muted'
              )}
            >
              {option.icon && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {option.icon}
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">
                  {option.description}
                </div>
              </div>
              {answers[currentQuestion.id] === option.id && (
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Navigation */}
        {currentStep > 0 && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mt-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Inline version for embedding in articles
export function SmartFinderInline({ className = '' }: { className?: string }) {
  return (
    <div className={cn('my-8', className)}>
      <SmartFinderQuiz />
    </div>
  );
}
