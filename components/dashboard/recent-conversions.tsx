'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, X, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { updateConversionStatus, deleteConversion } from '@/lib/actions/revenue';
import type { ConversionRecord } from '@/lib/actions/revenue';

interface RecentConversionsProps {
  conversions: ConversionRecord[];
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  approved: {
    label: 'Approved',
    icon: Check,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  rejected: {
    label: 'Rejected',
    icon: X,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function RecentConversions({ conversions }: RecentConversionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (!conversions || conversions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No conversions yet. Import data from your affiliate networks to get started.
      </div>
    );
  }

  const handleStatusChange = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    setLoading(id);
    try {
      await updateConversionStatus(id, status);
      router.refresh();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversion?')) return;

    setLoading(id);
    try {
      await deleteConversion(id);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Link</th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Amount</th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Reference</th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {conversions.map((conversion) => {
            const status = statusConfig[conversion.status];
            const StatusIcon = status.icon;

            return (
              <tr key={conversion.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-3 px-2">
                  {new Date(conversion.converted_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-2">
                  {conversion.affiliate_link ? (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{conversion.affiliate_link.partner_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({conversion.affiliate_link.slug})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className="py-3 px-2 text-right font-medium">
                  ${conversion.commission_earned.toFixed(2)}
                  <span className="text-xs text-muted-foreground ml-1">
                    {conversion.currency}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <Badge variant="secondary" className={status.className}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </td>
                <td className="py-3 px-2 text-muted-foreground text-xs truncate max-w-[150px]">
                  {conversion.network_reference || '-'}
                </td>
                <td className="py-3 px-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={loading === conversion.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(conversion.id, 'approved')}>
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        Mark Approved
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(conversion.id, 'pending')}>
                        <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                        Mark Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(conversion.id, 'rejected')}>
                        <X className="h-4 w-4 mr-2 text-red-600" />
                        Mark Rejected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(conversion.id)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
