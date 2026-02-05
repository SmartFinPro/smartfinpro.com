'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data for development
const recentClicks = [
  {
    id: '1',
    link: 'jasper-ai',
    country: 'US',
    source: 'google',
    time: '2 min ago',
  },
  {
    id: '2',
    link: 'perimeter-81',
    country: 'UK',
    source: 'linkedin',
    time: '5 min ago',
  },
  {
    id: '3',
    link: 'systeme-io',
    country: 'CA',
    source: 'direct',
    time: '12 min ago',
  },
  {
    id: '4',
    link: 'nordvpn-teams',
    country: 'AU',
    source: 'google',
    time: '15 min ago',
  },
  {
    id: '5',
    link: 'copy-ai',
    country: 'US',
    source: 'reddit',
    time: '22 min ago',
  },
];

const countryFlags: Record<string, string> = {
  US: '🇺🇸',
  UK: '🇬🇧',
  CA: '🇨🇦',
  AU: '🇦🇺',
};

export function RecentClicks() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Link</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Source</TableHead>
          <TableHead className="text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentClicks.map((click) => (
          <TableRow key={click.id}>
            <TableCell className="font-medium">{click.link}</TableCell>
            <TableCell>
              <span className="flex items-center gap-1">
                {countryFlags[click.country] || '🌍'} {click.country}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{click.source}</Badge>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {click.time}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
