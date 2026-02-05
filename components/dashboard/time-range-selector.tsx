'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const currentRange = (searchParams.get('range') as TimeRange) || '24h';

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', value);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <Tabs value={currentRange} onValueChange={handleRangeChange}>
      <TabsList>
        {ranges.map((range) => (
          <TabsTrigger key={range.value} value={range.value}>
            {range.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
