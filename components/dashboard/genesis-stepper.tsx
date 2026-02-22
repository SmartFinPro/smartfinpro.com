'use client';

import { Check, Search, Wand2, ImageIcon, Rocket } from 'lucide-react';

// ── Genesis Stepper — Progressive 4-Step Indicator ───────────

const STEPS = [
  { id: 'research', label: 'Research', icon: Search },
  { id: 'generate', label: 'Generate', icon: Wand2 },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'launch', label: 'Launch', icon: Rocket },
];

interface GenesisStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
}

export function GenesisStepper({ currentStep, completedSteps, onStepClick }: GenesisStepperProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
      {STEPS.map((step, i) => {
        const isActive = i === currentStep;
        const isCompleted = completedSteps.has(i);
        const isPast = i < currentStep;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <button
              onClick={() => (isPast || isActive) && onStepClick?.(i)}
              disabled={!isPast && !isActive}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted
                    ? 'bg-emerald-50 border-2 border-emerald-400'
                    : isActive
                      ? 'bg-violet-50 border-2 border-violet-400 shadow-md shadow-violet-200/50'
                      : 'bg-slate-50 border-2 border-slate-200'}
                `}
              >
                {isCompleted ? (
                  <Check className="h-4.5 w-4.5 text-emerald-500" />
                ) : (
                  <Icon
                    className={`h-4.5 w-4.5 ${isActive ? 'text-violet-500' : 'text-slate-400'}`}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isCompleted
                    ? 'text-emerald-600'
                    : isActive
                      ? 'text-violet-600'
                      : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-3 h-0.5 rounded-full relative overflow-hidden bg-slate-200">
                {(isCompleted || isPast) && (
                  <div
                    className="absolute inset-0 transition-all duration-500"
                    style={{
                      background: 'linear-gradient(90deg, #34d399, #8b5cf6)',
                      width: isCompleted ? '100%' : '50%',
                    }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
