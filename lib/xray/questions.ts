// lib/xray/questions.ts
// Client-safe configuration for X-Ray Score™ questionnaire steps.
// No server imports — safe to use in 'use client' components.

// ── Types ─────────────────────────────────────────────────────────────

export interface ExperienceOption {
  value: 'beginner' | 'intermediate' | 'advanced';
  label: string;
  description: string;
}

export interface PriorityOption {
  value: 'low-cost' | 'features' | 'ease-of-use' | 'compliance';
  label: string;
  description: string;
}

export interface SliderConfig {
  label: string;
  key: 'teamSize' | 'monthlyBudget' | 'hourlyValue';
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  formatLabel?: (v: number) => string;
}

export interface CategoryQuestionConfig {
  experienceOptions: ExperienceOption[];
  sliders: SliderConfig[];
  priorityOptions: PriorityOption[];
}

// ── Shared Options ────────────────────────────────────────────────────

const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  { value: 'beginner', label: 'Beginner', description: 'New to this category' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience' },
  { value: 'advanced', label: 'Advanced', description: 'Power user / expert' },
];

const PRIORITY_OPTIONS: PriorityOption[] = [
  { value: 'ease-of-use', label: 'Ease of Use', description: 'Simple setup, intuitive UI' },
  { value: 'low-cost', label: 'Low Cost', description: 'Best value for money' },
  { value: 'features', label: 'Features', description: 'Most powerful toolset' },
  { value: 'compliance', label: 'Compliance', description: 'Regulatory safety first' },
];

// ── Per-Category Slider Defaults ──────────────────────────────────────

const BUDGET_RANGES: Record<string, { min: number; max: number; default: number; step: number }> = {
  'ai-tools':         { min: 0, max: 500,   default: 50,  step: 5 },
  'trading':          { min: 0, max: 2000,  default: 100, step: 10 },
  'forex':            { min: 0, max: 2000,  default: 100, step: 10 },
  'cybersecurity':    { min: 0, max: 1000,  default: 100, step: 10 },
  'personal-finance': { min: 0, max: 200,   default: 20,  step: 5 },
  'business-banking': { min: 0, max: 500,   default: 50,  step: 10 },
};

const HOURLY_RANGES: Record<string, { min: number; max: number; default: number; step: number }> = {
  'ai-tools':         { min: 15, max: 300, default: 50,  step: 5 },
  'trading':          { min: 25, max: 500, default: 75,  step: 10 },
  'forex':            { min: 25, max: 500, default: 75,  step: 10 },
  'cybersecurity':    { min: 30, max: 400, default: 80,  step: 10 },
  'personal-finance': { min: 15, max: 200, default: 40,  step: 5 },
  'business-banking': { min: 20, max: 300, default: 50,  step: 10 },
};

// ── Public API ────────────────────────────────────────────────────────

export function getQuestionsForCategory(category: string): CategoryQuestionConfig {
  const budget = BUDGET_RANGES[category] ?? BUDGET_RANGES['ai-tools'];
  const hourly = HOURLY_RANGES[category] ?? HOURLY_RANGES['ai-tools'];

  return {
    experienceOptions: EXPERIENCE_OPTIONS,
    sliders: [
      {
        label: 'Team Size',
        key: 'teamSize',
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 1,
        unit: '',
        formatLabel: (v) => (v === 1 ? 'Solo' : `${v} people`),
      },
      {
        label: 'Monthly Budget',
        key: 'monthlyBudget',
        min: budget.min,
        max: budget.max,
        step: budget.step,
        defaultValue: budget.default,
        unit: '/mo',
        formatLabel: (v) => `$${v}`,
      },
      {
        label: 'Your Hourly Value',
        key: 'hourlyValue',
        min: hourly.min,
        max: hourly.max,
        step: hourly.step,
        defaultValue: hourly.default,
        unit: '/hr',
        formatLabel: (v) => `$${v}`,
      },
    ],
    priorityOptions: PRIORITY_OPTIONS,
  };
}
