import { Suspense } from 'react';
import { Sparkles, Info } from 'lucide-react';
import { getQuizAnalytics } from '@/lib/actions/quiz-analytics';
import { QuizAnalytics } from '@/components/dashboard/quiz-analytics';
import { TimeRangeSelector } from '@/components/dashboard/time-range-selector';
import { TimeRange } from '@/lib/actions/dashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface QuizPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function QuizAnalyticsPage({ searchParams }: QuizPageProps) {
  const params = await searchParams;
  const range = (params.range as TimeRange) || '7d';
  const stats = await getQuizAnalytics(range);

  const rangeLabels: Record<TimeRange, string> = {
    '24h': 'last 24 hours',
    '7d': 'last 7 days',
    '30d': 'last 30 days',
    'all': 'all time',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-500" />
            Quiz Analytics
          </h1>
          <p className="text-slate-500 mt-1">
            Track high-intent events from the Smart Finder Quiz • {rangeLabels[range]}
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-40 bg-slate-200 animate-pulse rounded-lg" />}>
          <TimeRangeSelector />
        </Suspense>
      </div>

      {/* Quiz Explanation */}
      <div className="dashboard-card p-5 border-l-4 border-l-blue-500">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Info className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">
              Was sind High-Intent Events?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              High-Intent Events sind Klicks auf Affiliate-CTAs <strong>nach Abschluss des Quiz</strong>.
              Diese Nutzer haben aktiv nach einer Lösung gesucht, ihre Bedürfnisse angegeben und eine
              personalisierte Empfehlung erhalten – sie konvertieren mit bis zu <strong className="text-emerald-600">3x höherer Rate</strong>{' '}
              als reguläre Link-Klicks.
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Analytics Component */}
      <QuizAnalytics data={stats} />
    </div>
  );
}
