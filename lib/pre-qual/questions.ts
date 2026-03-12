// lib/pre-qual/questions.ts
// P3: Pre-Qual Quiz — Client-safe questions registry per category
//
// 3 questions per category. Returns generic questions for unknown categories.

export interface QuizOption {
  value: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

const TRADING_QUESTIONS: QuizQuestion[] = [
  {
    id: 'experience',
    question: 'What is your trading experience?',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
  },
  {
    id: 'amount',
    question: 'How much do you plan to invest?',
    options: [
      { value: 'small', label: 'Under $1,000' },
      { value: 'medium', label: '$1,000 – $10,000' },
      { value: 'large', label: '$10,000+' },
    ],
  },
  {
    id: 'priority',
    question: 'What matters most to you?',
    options: [
      { value: 'low-fees', label: 'Low fees' },
      { value: 'ease-of-use', label: 'Easy to use' },
      { value: 'features', label: 'Advanced tools' },
      { value: 'copy-trading', label: 'Copy trading' },
    ],
  },
];

const FOREX_QUESTIONS: QuizQuestion[] = [
  {
    id: 'experience',
    question: 'What is your forex experience?',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
  },
  {
    id: 'amount',
    question: 'What is your starting capital?',
    options: [
      { value: 'small', label: 'Under $500' },
      { value: 'medium', label: '$500 – $5,000' },
      { value: 'large', label: '$5,000+' },
    ],
  },
  {
    id: 'priority',
    question: 'What is your top priority?',
    options: [
      { value: 'low-fees', label: 'Low spreads' },
      { value: 'ease-of-use', label: 'Easy platform' },
      { value: 'features', label: 'MT4/MT5 support' },
      { value: 'safety', label: 'Regulation & safety' },
    ],
  },
];

const PERSONAL_FINANCE_QUESTIONS: QuizQuestion[] = [
  {
    id: 'experience',
    question: 'How experienced are you with investing?',
    options: [
      { value: 'beginner', label: 'Just starting' },
      { value: 'intermediate', label: 'Some experience' },
      { value: 'advanced', label: 'Very experienced' },
    ],
  },
  {
    id: 'amount',
    question: 'What is your monthly savings goal?',
    options: [
      { value: 'small', label: 'Under $200' },
      { value: 'medium', label: '$200 – $1,000' },
      { value: 'large', label: '$1,000+' },
    ],
  },
  {
    id: 'priority',
    question: 'What is most important for you?',
    options: [
      { value: 'low-fees', label: 'Low fees' },
      { value: 'ease-of-use', label: 'Simple interface' },
      { value: 'features', label: 'Robo-advisor' },
      { value: 'safety', label: 'FDIC insured' },
    ],
  },
];

const BUSINESS_BANKING_QUESTIONS: QuizQuestion[] = [
  {
    id: 'experience',
    question: 'What type of business do you run?',
    options: [
      { value: 'beginner', label: 'Freelancer / Solo' },
      { value: 'intermediate', label: 'Small business' },
      { value: 'advanced', label: 'Growing company' },
    ],
  },
  {
    id: 'amount',
    question: 'Expected monthly transactions?',
    options: [
      { value: 'small', label: 'Under $5,000' },
      { value: 'medium', label: '$5,000 – $50,000' },
      { value: 'large', label: '$50,000+' },
    ],
  },
  {
    id: 'priority',
    question: 'What matters most?',
    options: [
      { value: 'low-fees', label: 'No monthly fees' },
      { value: 'ease-of-use', label: 'Easy onboarding' },
      { value: 'features', label: 'Integrations' },
      { value: 'safety', label: 'FDIC / CDIC insured' },
    ],
  },
];

const GENERIC_QUESTIONS: QuizQuestion[] = [
  {
    id: 'experience',
    question: 'What is your experience level?',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
  },
  {
    id: 'amount',
    question: 'What is your budget?',
    options: [
      { value: 'small', label: 'Budget-friendly' },
      { value: 'medium', label: 'Mid-range' },
      { value: 'large', label: 'Premium' },
    ],
  },
  {
    id: 'priority',
    question: 'What matters most to you?',
    options: [
      { value: 'low-fees', label: 'Best value' },
      { value: 'ease-of-use', label: 'Easy to use' },
      { value: 'features', label: 'Most features' },
      { value: 'safety', label: 'Best support' },
    ],
  },
];

const QUESTIONS_BY_CATEGORY: Record<string, QuizQuestion[]> = {
  trading: TRADING_QUESTIONS,
  forex: FOREX_QUESTIONS,
  'personal-finance': PERSONAL_FINANCE_QUESTIONS,
  'business-banking': BUSINESS_BANKING_QUESTIONS,
};

/** Get quiz questions for a category (falls back to generic) */
export function getQuizQuestions(category: string): QuizQuestion[] {
  return QUESTIONS_BY_CATEGORY[category] || GENERIC_QUESTIONS;
}
