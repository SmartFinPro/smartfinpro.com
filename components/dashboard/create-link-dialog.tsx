'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createAffiliateLink } from '@/lib/actions/affiliate-links';
import type { Category, Market } from '@/types';

interface CreateLinkDialogProps {
  children: React.ReactNode;
}

export function CreateLinkDialog({ children }: CreateLinkDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    partner_name: '',
    slug: '',
    destination_url: '',
    category: '',
    market: '',
    commission_type: '',
    commission_value: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const commissionValue = Number(formData.commission_value);
      if (Number.isNaN(commissionValue) || commissionValue < 0) {
        toast.error('Commission value must be a valid positive number');
        return;
      }

      const result = await createAffiliateLink({
        partner_name: formData.partner_name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        destination_url: formData.destination_url.trim(),
        category: formData.category as Category,
        market: formData.market as Market,
        commission_type: formData.commission_type as 'cpa' | 'recurring' | 'hybrid',
        commission_value: commissionValue,
        active: true,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Affiliate link created successfully');
      setOpen(false);
      setFormData({
        partner_name: '',
        slug: '',
        destination_url: '',
        category: '',
        market: '',
        commission_type: '',
        commission_value: '',
      });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create affiliate link');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Affiliate Link</DialogTitle>
          <DialogDescription>
            Add a new affiliate link to track clicks and conversions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="partner_name">Partner Name</Label>
              <Input
                id="partner_name"
                placeholder="e.g., Jasper AI"
                value={formData.partner_name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    partner_name: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/go/</span>
                <Input
                  id="slug"
                  placeholder="jasper-ai"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="destination_url">Destination URL</Label>
              <Input
                id="destination_url"
                type="url"
                placeholder="https://example.com/?ref=smartfinpro"
                value={formData.destination_url}
                onChange={(e) =>
                  setFormData({ ...formData, destination_url: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai-tools">AI Tools</SelectItem>
                    <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="personal-finance">
                      Personal Finance
                    </SelectItem>
                    <SelectItem value="business-banking">
                      Business Banking
                    </SelectItem>
                    <SelectItem value="credit-repair">Credit Repair</SelectItem>
                    <SelectItem value="debt-relief">Debt Relief</SelectItem>
                    <SelectItem value="credit-score">Credit Score</SelectItem>
                    <SelectItem value="remortgaging">Remortgaging</SelectItem>
                    <SelectItem value="cost-of-living">Cost of Living</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="superannuation">Superannuation</SelectItem>
                    <SelectItem value="gold-investing">Gold Investing</SelectItem>
                    <SelectItem value="tax-efficient-investing">Tax-Efficient Investing</SelectItem>
                    <SelectItem value="housing">Housing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="market">Market</Label>
                <Select
                  value={formData.market}
                  onValueChange={(value) =>
                    setFormData({ ...formData, market: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">🇺🇸 United States</SelectItem>
                    <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                    <SelectItem value="au">🇦🇺 Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="commission_type">Commission Type</Label>
                <Select
                  value={formData.commission_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, commission_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpa">CPA (One-time)</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="commission_value">
                  {formData.commission_type === 'recurring'
                    ? 'Commission %'
                    : 'Commission $'}
                </Label>
                <Input
                  id="commission_value"
                  type="number"
                  placeholder={
                    formData.commission_type === 'recurring' ? '30' : '100'
                  }
                  value={formData.commission_value}
                  onChange={(e) =>
                    setFormData({ ...formData, commission_value: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
