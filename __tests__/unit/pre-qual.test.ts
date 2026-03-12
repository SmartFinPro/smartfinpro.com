// __tests__/unit/pre-qual.test.ts
// P3: Pre-Qual Quiz — unit tests for question generation logic
//
// Tests:
//   1. All categories return 3 questions
//   2. Each question has 3-4 options
//   3. Unknown category falls back to generic questions
//   4. Option values are non-empty strings

import { describe, it, expect } from 'vitest';
import { getQuizQuestions } from '@/lib/pre-qual/questions';

const CATEGORIES = ['trading', 'forex', 'personal-finance', 'business-banking'];

describe('Pre-Qual Quiz Questions', () => {
  describe('getQuizQuestions', () => {
    for (const category of CATEGORIES) {
      it(`returns 3 questions for category: ${category}`, () => {
        const questions = getQuizQuestions(category);
        expect(questions).toHaveLength(3);
      });

      it(`each question for ${category} has 3-4 options`, () => {
        const questions = getQuizQuestions(category);
        for (const q of questions) {
          expect(q.options.length).toBeGreaterThanOrEqual(3);
          expect(q.options.length).toBeLessThanOrEqual(4);
        }
      });

      it(`all options for ${category} have non-empty labels and values`, () => {
        const questions = getQuizQuestions(category);
        for (const q of questions) {
          expect(q.question).toBeTruthy();
          for (const opt of q.options) {
            expect(opt.label).toBeTruthy();
            expect(opt.value).toBeTruthy();
          }
        }
      });
    }

    it('returns generic questions for unknown category', () => {
      const questions = getQuizQuestions('unknown-category');
      expect(questions).toHaveLength(3);
    });

    it('returns generic questions for ai-tools (non-finance)', () => {
      const questions = getQuizQuestions('ai-tools');
      expect(questions).toHaveLength(3);
    });
  });
});
