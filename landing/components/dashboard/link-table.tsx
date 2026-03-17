'use client';

import { useState } from 'react';
import { MoreHorizontal, ExternalLink, Copy, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

// Mock data for development
const mockLinks = [
  {
    id: '1',
    slug: 'jasper-ai',
    partner_name: 'Jasper AI',
    destination_url: 'https://jasper.ai/?ref=smartfinpro',
    category: 'ai-tools',
    market: 'us',
    commission_type: 'recurring',
    commission_value: 30,
    active: true,
    clicks: 3420,
  },
  {
    id: '2',
    slug: 'perimeter-81',
    partner_name: 'Perimeter 81',
    destination_url: 'https://perimeter81.com/?ref=smartfinpro',
    category: 'cybersecurity',
    market: 'us',
    commission_type: 'cpa',
    commission_value: 700,
    active: true,
    clicks: 2100,
  },
  {
    id: '3',
    slug: 'systeme-io',
    partner_name: 'Systeme.io',
    destination_url: 'https://systeme.io/?ref=smartfinpro',
    category: 'ai-tools',
    market: 'us',
    commission_type: 'recurring',
    commission_value: 60,
    active: true,
    clicks: 1890,
  },
  {
    id: '4',
    slug: 'tide-uk',
    partner_name: 'Tide',
    destination_url: 'https://tide.co/?ref=smartfinpro',
    category: 'business-banking',
    market: 'uk',
    commission_type: 'cpa',
    commission_value: 50,
    active: true,
    clicks: 890,
  },
  {
    id: '5',
    slug: 'avatrade-au',
    partner_name: 'AvaTrade',
    destination_url: 'https://avatrade.com/?ref=smartfinpro',
    category: 'trading',
    market: 'au',
    commission_type: 'hybrid',
    commission_value: 500,
    active: false,
    clicks: 450,
  },
];

const categoryColors: Record<string, string> = {
  'ai-tools': 'bg-purple-500/10 text-purple-500',
  cybersecurity: 'bg-blue-500/10 text-blue-500',
  trading: 'bg-green-500/10 text-green-500',
  forex: 'bg-yellow-500/10 text-yellow-500',
  'personal-finance': 'bg-emerald-500/10 text-emerald-500',
  'business-banking': 'bg-indigo-500/10 text-indigo-500',
};

const marketFlags: Record<string, string> = {
  us: '🇺🇸',
  uk: '🇬🇧',
  ca: '🇨🇦',
  au: '🇦🇺',
};

export function LinkTable() {
  const [links] = useState(mockLinks);

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/go/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Partner</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Market</TableHead>
          <TableHead>Commission</TableHead>
          <TableHead className="text-right">Clicks</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {links.map((link) => (
          <TableRow key={link.id}>
            <TableCell className="font-medium">{link.partner_name}</TableCell>
            <TableCell>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                /go/{link.slug}
              </code>
            </TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={categoryColors[link.category]}
              >
                {link.category}
              </Badge>
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-1">
                {marketFlags[link.market]} {link.market.toUpperCase()}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm">
                {link.commission_type === 'recurring'
                  ? `${link.commission_value}% recurring`
                  : link.commission_type === 'cpa'
                    ? `$${link.commission_value} CPA`
                    : `$${link.commission_value} hybrid`}
              </span>
            </TableCell>
            <TableCell className="text-right font-medium">
              {link.clicks.toLocaleString('en-US')}
            </TableCell>
            <TableCell>
              <Badge variant={link.active ? 'default' : 'secondary'}>
                {link.active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => copyLink(link.slug)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(link.destination_url, '_blank')
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit URL
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
