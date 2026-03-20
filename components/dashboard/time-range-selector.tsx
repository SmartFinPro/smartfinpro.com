'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { TimeRange } from '@/lib/actions/dashboard';

const ranges: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'all', label: 'All Time' },
];

export function TimeRangeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentRange = (searchParams.get('range') as TimeRange) || '24h';

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => handleRangeChange(range.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-all
            ${currentRange === range.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }
          `}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
