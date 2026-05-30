'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AddConversionFormProps {
  affiliateLinks: { id: string; slug: string; partner_name: string }[];
}

// Radix Select forbids an empty-string value, so we use a sentinel for "no link".
const NO_LINK = '__none__';

export function AddConversionForm({ affiliateLinks }: AddConversionFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [linkId, setLinkId] = useState(NO_LINK);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState<'pending' | 'approved'>('approved');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(false);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Bitte einen gültigen Betrag (> 0) eingeben.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/add-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_id: linkId === NO_LINK ? undefined : linkId,
          converted_at: new Date(date).toISOString(),
          commission_earned: amountNum,
          network_reference: reference || undefined,
          status,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to add conversion');
      }

      setSuccess(true);
      resetForm();
      router.refresh();
      // Auto-close shortly after showing the success state.
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to add conversion:', err);
      setError(
        err instanceof Error
          ? `Conversion konnte nicht gespeichert werden: ${err.message}`
          : 'Conversion konnte nicht gespeichert werden. Bitte erneut versuchen.',
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLinkId(NO_LINK);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setReference('');
    setStatus('approved');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setError(null);
          setSuccess(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Conversion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Manual Conversion</DialogTitle>
          <DialogDescription>
            Enter a single conversion manually. For bulk imports, use the CSV importer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="link">Affiliate Link</Label>
            <Select value={linkId} onValueChange={setLinkId}>
              <SelectTrigger>
                <SelectValue placeholder="Select link (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_LINK}>None / Unassigned</SelectItem>
                {affiliateLinks.map((link) => (
                  <SelectItem key={link.id} value={link.id}>
                    {link.partner_name} ({link.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Commission Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Conversion Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Network Reference / Order ID</Label>
            <Input
              id="reference"
              placeholder="e.g., ORD-12345"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'pending' | 'approved')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm font-medium text-[var(--sfp-red)]" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--sfp-green)]">
              <CheckCircle2 className="h-4 w-4" />
              Conversion gespeichert.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Conversion'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
