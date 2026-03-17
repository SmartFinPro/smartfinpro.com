'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Globe,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Pencil,
  Trash2,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield,
  Replace,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
// Tabs replaced with native buttons to avoid shadcn dark-theme specificity issues
import { toast } from 'sonner';
import type { AffiliateLink, Market, Category } from '@/types';

// ── Types ────────────────────────────────────────────────────

interface LinkWithStats extends AffiliateLink {
  clicks_30d?: number;
  revenue_30d?: number;
}

interface HealthCheckResult {
  results: Array<{
    link_id: string;
    slug: string;
    status_code: number | null;
    healthy: boolean;
    response_time_ms: number | null;
    error?: string;
  }>;
  healthy: number;
  degraded: number;
  dead: number;
}

interface ExpiryReport {
  expiringSoon: Array<{
    id: string;
    slug: string;
    partner_name: string;
    market: string;
    offer_expires_at: string;
    days_remaining: number;
  }>;
  expiredActive: Array<{
    id: string;
    slug: string;
    partner_name: string;
    market: string;
    offer_expires_at: string;
    days_overdue: number;
  }>;
}

// ── Constants ────────────────────────────────────────────────

const MARKET_FLAGS: Record<string, string> = {
  us: '🇺🇸',
  uk: '🇬🇧',
  ca: '🇨🇦',
  au: '🇦🇺',
};

const MARKET_NAMES: Record<string, string> = {
  us: 'United States',
  uk: 'United Kingdom',
  ca: 'Canada',
  au: 'Australia',
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  'ai-tools': { label: 'AI Tools', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  cybersecurity: { label: 'Cybersecurity', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  trading: { label: 'Trading', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  forex: { label: 'Forex', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'personal-finance': { label: 'Personal Finance', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  'business-banking': { label: 'Business Banking', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

const HEALTH_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  healthy: { label: 'Healthy', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  degraded: { label: 'Slow', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
  dead: { label: 'Dead', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  unchecked: { label: 'Unchecked', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock },
};

// ── Health Status Badge ──────────────────────────────────────

function HealthBadge({ status }: { status: string }) {
  const config = HEALTH_CONFIG[status] || HEALTH_CONFIG.unchecked;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// ── Expiry Badge ─────────────────────────────────────────────

function ExpiryBadge({ expiresAt }: { expiresAt: string | null | undefined }) {
  if (!expiresAt) return <span className="text-xs text-slate-400">-</span>;

  const now = new Date();
  const expires = new Date(expiresAt);
  const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
        <XCircle className="h-3 w-3" />
        Expired {Math.abs(diffDays)}d ago
      </span>
    );
  }

  if (diffDays <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
        <AlertTriangle className="h-3 w-3" />
        {diffDays}d left
      </span>
    );
  }

  if (diffDays <= 30) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
        <Clock className="h-3 w-3" />
        {diffDays}d left
      </span>
    );
  }

  return (
    <span className="text-xs text-slate-500">
      {expires.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
    </span>
  );
}

// ── Market Matrix View ───────────────────────────────────────

function MarketMatrixView({ links }: { links: LinkWithStats[] }) {
  // Group by partner name
  const partnerMap = new Map<string, Map<Market, LinkWithStats>>();

  for (const link of links) {
    if (!partnerMap.has(link.partner_name)) {
      partnerMap.set(link.partner_name, new Map());
    }
    partnerMap.get(link.partner_name)!.set(link.market, link);
  }

  const markets: Market[] = ['us', 'uk', 'ca', 'au'];
  const partners = Array.from(partnerMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200">
            <TableHead className="min-w-[180px]">Partner</TableHead>
            {markets.map((m) => (
              <TableHead key={m} className="text-center min-w-[120px]">
                <span className="flex items-center justify-center gap-1.5">
                  {MARKET_FLAGS[m]}
                  <span className="font-semibold">{m.toUpperCase()}</span>
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map(([partnerName, marketLinks]) => (
            <TableRow key={partnerName} className="border-slate-100 hover:bg-slate-50/50">
              <TableCell className="font-medium text-slate-900">{partnerName}</TableCell>
              {markets.map((market) => {
                const link = marketLinks.get(market);
                if (!link) {
                  return (
                    <TableCell key={market} className="text-center">
                      <span className="text-slate-300">-</span>
                    </TableCell>
                  );
                }
                return (
                  <TableCell key={market} className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <HealthBadge status={link.health_status || 'unchecked'} />
                      {link.active ? (
                        <span className="text-xs text-emerald-600 font-medium">Active</span>
                      ) : (
                        <span className="text-xs text-slate-400">Inactive</span>
                      )}
                      <code className="text-[10px] text-slate-400">/go/{link.slug}</code>
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Search & Replace Dialog ──────────────────────────────────

function SearchReplaceDialog({
  open,
  onOpenChange,
  onReplace,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplace: (paramKey: string, oldValue: string, newValue: string) => Promise<void>;
}) {
  const [paramKey, setParamKey] = useState('ref');
  const [oldValue, setOldValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReplace = async () => {
    if (!paramKey || !oldValue || !newValue) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await onReplace(paramKey, oldValue, newValue);
      setParamKey('ref');
      setOldValue('');
      setNewValue('');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Replace className="h-5 w-5 text-violet-500" />
            Global Search & Replace
          </DialogTitle>
          <DialogDescription>
            Replace a URL parameter value across all affiliate links.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Parameter Key</Label>
            <Input
              placeholder="e.g., ref, aff_id, partner"
              value={paramKey}
              onChange={(e) => setParamKey(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Old Value</Label>
            <Input
              placeholder="e.g., smartfinpro-old"
              value={oldValue}
              onChange={(e) => setOldValue(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>New Value</Label>
            <Input
              placeholder="e.g., smartfinpro-2026"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReplace}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Replacing...
              </>
            ) : (
              <>
                <Replace className="h-4 w-4" />
                Replace All
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Expiry Alerts Panel ──────────────────────────────────────

function ExpiryAlertsPanel({ report }: { report: ExpiryReport | null }) {
  if (!report) {
    return (
      <div className="dashboard-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-800">Offer Expiry Alerts</h3>
        </div>
        <p className="text-sm text-slate-500">Loading expiry data...</p>
      </div>
    );
  }

  const hasAlerts = report.expiredActive.length > 0 || report.expiringSoon.length > 0;

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${hasAlerts ? 'text-amber-500' : 'text-emerald-500'}`} />
          <h3 className="font-semibold text-slate-800">Offer Expiry Alerts</h3>
        </div>
        {hasAlerts && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            {report.expiredActive.length + report.expiringSoon.length} alerts
          </Badge>
        )}
      </div>

      {!hasAlerts && (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          All offers are current — no expiry issues.
        </div>
      )}

      {report.expiredActive.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
            Expired & Still Active
          </h4>
          <div className="space-y-2">
            {report.expiredActive.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 border border-red-100"
              >
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-slate-800">{item.partner_name}</span>
                  <span className="text-xs text-slate-500">{MARKET_FLAGS[item.market]} {item.market.toUpperCase()}</span>
                </div>
                <span className="text-xs font-medium text-red-600">{item.days_overdue}d overdue</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.expiringSoon.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
            Expiring Soon
          </h4>
          <div className="space-y-2">
            {report.expiringSoon.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 border border-amber-100"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-800">{item.partner_name}</span>
                  <span className="text-xs text-slate-500">{MARKET_FLAGS[item.market]} {item.market.toUpperCase()}</span>
                </div>
                <span className="text-xs font-medium text-amber-600">{item.days_remaining}d remaining</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Health Summary Panel ─────────────────────────────────────

function HealthSummaryPanel({
  links,
  onRunChecks,
  checking,
  activeFilter,
  onFilterChange,
}: {
  links: LinkWithStats[];
  onRunChecks: () => void;
  checking: boolean;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}) {
  const active = links.filter((l) => l.active);
  const healthy = active.filter((l) => l.health_status === 'healthy').length;
  const degraded = active.filter((l) => l.health_status === 'degraded').length;
  const dead = active.filter((l) => l.health_status === 'dead').length;
  const unchecked = active.filter(
    (l) => !l.health_status || l.health_status === 'unchecked'
  ).length;

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-800">Link Health</h3>
        </div>
        <button
          onClick={onRunChecks}
          disabled={checking}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-200 text-violet-700 bg-white hover:bg-violet-50 hover:text-violet-800 transition-colors disabled:opacity-50"
        >
          {checking ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3" />
              Run Checks
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {([
          { key: 'healthy', value: healthy, label: 'Healthy', bg: 'bg-emerald-50', border: 'border-emerald-100', ring: 'ring-emerald-400', text: 'text-emerald-600' },
          { key: 'degraded', value: degraded, label: 'Slow', bg: 'bg-amber-50', border: 'border-amber-100', ring: 'ring-amber-400', text: 'text-amber-600' },
          { key: 'dead', value: dead, label: 'Dead', bg: 'bg-red-50', border: 'border-red-100', ring: 'ring-red-400', text: 'text-red-600' },
          { key: 'unchecked', value: unchecked, label: 'Unchecked', bg: 'bg-slate-50', border: 'border-slate-100', ring: 'ring-slate-400', text: 'text-slate-500' },
        ] as const).map((card) => (
          <button
            key={card.key}
            onClick={() => onFilterChange(activeFilter === card.key ? 'all' : card.key)}
            className={`text-center p-3 rounded-lg ${card.bg} border ${card.border} cursor-pointer transition-all hover:scale-105 ${
              activeFilter === card.key ? `ring-2 ${card.ring} shadow-sm` : ''
            }`}
          >
            <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
            <p className={`text-xs ${card.text}`}>{card.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Stats Row ────────────────────────────────────────────────

function StatsRow({ links }: { links: LinkWithStats[] }) {
  const totalLinks = links.length;
  const activeLinks = links.filter((l) => l.active).length;
  const markets = new Set(links.map((l) => l.market)).size;
  const categories = new Set(links.map((l) => l.category)).size;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Links', value: totalLinks, icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Active', value: activeLinks, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Markets', value: markets, icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Categories', value: categories, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      ].map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="dashboard-card p-4 dashboard-stat">
          <div className="flex items-center gap-3">
            <div className={`stat-icon ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="stat-value text-xl">{value}</p>
              <p className="stat-label text-xs">{label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

interface AffiliateCommandCenterProps {
  initialLinks: AffiliateLink[];
}

export function AffiliateCommandCenter({ initialLinks }: AffiliateCommandCenterProps) {
  const [links, setLinks] = useState<LinkWithStats[]>(initialLinks);
  const [search, setSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [checking, setChecking] = useState(false);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'matrix'>('table');
  const [expiryReport, setExpiryReport] = useState<ExpiryReport | null>(null);

  // Load expiry report on mount
  useEffect(() => {
    async function loadExpiryReport() {
      try {
        const res = await fetch('/api/dashboard/link-health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getOfferExpiryReport', withinDays: 14 }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const report = await res.json();
        setExpiryReport(report);
      } catch (err) {
        console.error('Failed to load expiry report:', err);
      }
    }
    loadExpiryReport();
  }, []);

  // Filter links
  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      !search ||
      link.partner_name.toLowerCase().includes(search.toLowerCase()) ||
      link.slug.toLowerCase().includes(search.toLowerCase()) ||
      link.destination_url.toLowerCase().includes(search.toLowerCase());

    const matchesMarket = marketFilter === 'all' || link.market === marketFilter;
    const matchesCategory = categoryFilter === 'all' || link.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && link.active) ||
      (statusFilter === 'inactive' && !link.active);
    const matchesHealth =
      healthFilter === 'all' ||
      (link.health_status || 'unchecked') === healthFilter;

    return matchesSearch && matchesMarket && matchesCategory && matchesStatus && matchesHealth;
  });

  const handleRunHealthChecks = useCallback(async () => {
    setChecking(true);
    try {
      const healthRes = await fetch('/api/dashboard/link-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'runHealthChecks' }),
      });
      if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
      const result = await healthRes.json();
      toast.success(
        `Health check complete: ${result.healthy} healthy, ${result.degraded} slow, ${result.dead} dead`
      );
      // Reload links
      const linksRes = await fetch('/api/dashboard/affiliate-links');
      if (!linksRes.ok) throw new Error(`HTTP ${linksRes.status}`);
      const { data } = await linksRes.json();
      if (data) setLinks(data as LinkWithStats[]);
    } catch (err) {
      toast.error('Health check failed');
      console.error(err);
    } finally {
      setChecking(false);
    }
  }, []);

  const handleSearchReplace = useCallback(
    async (paramKey: string, oldValue: string, newValue: string) => {
      try {
        const replaceRes = await fetch('/api/dashboard/link-health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bulkReplaceParam', paramKey, oldValue, newValue }),
        });
        if (!replaceRes.ok) throw new Error(`HTTP ${replaceRes.status}`);
        const result = await replaceRes.json();
        if (result.updated > 0) {
          toast.success(`Updated ${result.updated} links`);
          // Reload links
          const linksRes = await fetch('/api/dashboard/affiliate-links');
          if (!linksRes.ok) throw new Error(`HTTP ${linksRes.status}`);
          const { data } = await linksRes.json();
          if (data) setLinks(data as LinkWithStats[]);
        } else {
          toast.info('No matching links found');
        }
        if (result.errors.length > 0) {
          toast.error(`${result.errors.length} errors occurred`);
        }
      } catch (err) {
        toast.error('Replace failed');
        console.error(err);
      }
    },
    []
  );

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/go/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const toggleStatus = useCallback(async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/dashboard/affiliate-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStatus', id, active: !active }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, active: !active } : l))
      );
      toast.success(`Link ${!active ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update link status');
    }
  }, []);

  const deleteLink = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/dashboard/affiliate-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success('Link deleted');
    } catch {
      toast.error('Failed to delete link');
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Affiliate Command Center</h1>
          <p className="text-slate-500 mt-1">
            Centralized link management across all 4 markets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearchReplace(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-violet-200 text-violet-700 bg-white hover:bg-violet-50 hover:text-violet-800 transition-colors"
          >
            <Replace className="h-4 w-4" />
            Search & Replace
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsRow links={links} />

      {/* Health + Expiry Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthSummaryPanel
          links={links}
          onRunChecks={handleRunHealthChecks}
          checking={checking}
          activeFilter={healthFilter}
          onFilterChange={setHealthFilter}
        />
        <ExpiryAlertsPanel report={expiryReport} />
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-slate-100 border border-slate-200">
            <button
              onClick={() => setActiveTab('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'table'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              Link Table
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'matrix'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Globe className="h-4 w-4" />
              Market Matrix
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search partners, slugs, URLs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={marketFilter} onValueChange={setMarketFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Market" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              <SelectItem value="us">🇺🇸 US</SelectItem>
              <SelectItem value="uk">🇬🇧 UK</SelectItem>
              <SelectItem value="ca">🇨🇦 CA</SelectItem>
              <SelectItem value="au">🇦🇺 AU</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="degraded">Slow</SelectItem>
              <SelectItem value="dead">Dead</SelectItem>
              <SelectItem value="unchecked">Unchecked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table View */}
        {activeTab === 'table' && (
          <div className="dashboard-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead>Partner</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <p className="text-slate-500">No links match your filters.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLinks.map((link) => {
                    const catConfig = CATEGORY_CONFIG[link.category];
                    return (
                      <TableRow key={link.id} className="border-slate-100 hover:bg-slate-50/50">
                        <TableCell>
                          <div className="font-medium text-slate-900">{link.partner_name}</div>
                          {link.network && (
                            <span className="text-xs text-slate-400">{link.network}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                            /go/{link.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          {catConfig && (
                            <Badge variant="outline" className={`text-xs ${catConfig.color}`}>
                              {catConfig.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm">
                            {MARKET_FLAGS[link.market]}
                            <span className="font-medium">{link.market.toUpperCase()}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-700">
                            {link.commission_type === 'recurring'
                              ? `${link.commission_value}% rev share`
                              : link.commission_type === 'cpa'
                                ? `$${link.commission_value} CPA`
                                : `$${link.commission_value} hybrid`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <HealthBadge status={link.health_status || 'unchecked'} />
                        </TableCell>
                        <TableCell>
                          <ExpiryBadge expiresAt={link.offer_expires_at} />
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleStatus(link.id, link.active)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                              link.active
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              link.active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`} />
                            {link.active ? 'Active' : 'Inactive'}
                          </button>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyLink(link.slug)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.open(link.destination_url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Visit URL
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => deleteLink(link.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Market Matrix View */}
        {activeTab === 'matrix' && (
          <div className="dashboard-card overflow-hidden p-0">
            <MarketMatrixView links={filteredLinks} />
          </div>
        )}
      </div>

      {/* Search & Replace Dialog */}
      <SearchReplaceDialog
        open={showSearchReplace}
        onOpenChange={setShowSearchReplace}
        onReplace={handleSearchReplace}
      />
    </div>
  );
}
