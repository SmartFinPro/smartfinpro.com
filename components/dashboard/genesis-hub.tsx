'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search,
  Wand2,
  Loader2,
  Sparkles,
  Target,
  DollarSign,
  FileText,
  Rocket,
  Check,
  ChevronRight,
  ChevronDown,
  Globe,
  RefreshCw,
  Copy,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  ArrowRight,
  Pencil,
  Trash2,
  ImageIcon,
  ExternalLink,
  BookOpen,
  ChevronUp,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { GenesisEditModal } from '@/components/dashboard/genesis-edit-modal';
import { GenesisStepper } from './genesis-stepper';
import { GenesisMediaDropzone } from './genesis-media-dropzone';
import { GenesisAffiliateMapper } from './genesis-affiliate-mapper';
import type { Market, Category } from '@/lib/i18n/config';

// ── Types (mirror server types) ──────────────────────────────

interface KeywordSuggestion {
  keyword: string;
  market: Market;
  category: string;
  competitorCount: number;
  estimatedCpaRevenue: number;
  topProviderCpa: number;
  topProviderName: string;
  gapType: 'missing' | 'behind' | 'weak';
  opportunityScore: number;
}

interface ResearchResult {
  suggestions: KeywordSuggestion[];
  query: string;
  market: Market;
  category: string;
  scannedAt: string;
  runId: string;
}

interface GenerationProgress {
  step: string;
  progress: number;
  message: string;
}

interface ImageUpload {
  filename: string;
  originalName: string;
  altText: string;
  width: number;
  height: number;
  sizeKb: number;
  position: 'hero' | 'mid-scroll' | 'comparison' | 'deep-content';
  previewUrl?: string;
}

interface AffiliateMappingEntry {
  partnerName: string;
  slug: string;
  cpaValue: number;
  currency: string;
  position: 'hero-cta' | 'comparison-table' | 'mid-article' | 'conclusion';
}

interface AvailablePartner {
  providerName: string;
  cpaValue: number;
  currency: string;
}

interface IndexingResult {
  success: boolean;
  url: string;
  notifyTime: string | null;
  responseTimeMs: number;
  error?: string;
}

interface RecentRun {
  id: string;
  keyword: string;
  market: string;
  category: string;
  status: string;
  slug: string | null;
  wordCount: number | null;
  imageCount: number;
  indexedAt: string | null;
  createdAt: string;
}

interface GenesisHubProps {
  recentRuns: RecentRun[];
}

// ── Constants ────────────────────────────────────────────────

const MARKETS: { code: Market; flag: string; name: string }[] = [
  { code: 'us', flag: '🇺🇸', name: 'United States' },
  { code: 'uk', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'ca', flag: '🇨🇦', name: 'Canada' },
  { code: 'au', flag: '🇦🇺', name: 'Australia' },
];

const CATEGORIES: { code: string; label: string }[] = [
  { code: 'trading', label: 'Trading' },
  { code: 'forex', label: 'Forex' },
  { code: 'personal-finance', label: 'Personal Finance' },
  { code: 'business-banking', label: 'Business Banking' },
  { code: 'ai-tools', label: 'AI Tools' },
  { code: 'cybersecurity', label: 'Cybersecurity' },
  { code: 'debt-relief', label: 'Debt Relief' },
  { code: 'credit-repair', label: 'Credit Repair' },
  { code: 'credit-score', label: 'Credit Score' },
  { code: 'savings', label: 'Savings' },
  { code: 'remortgaging', label: 'Remortgaging' },
  { code: 'cost-of-living', label: 'Cost of Living' },
  { code: 'superannuation', label: 'Superannuation' },
  { code: 'gold-investing', label: 'Gold Investing' },
  { code: 'tax-efficient-investing', label: 'Tax-Efficient Investing' },
  { code: 'housing', label: 'Housing' },
];

const MARKET_CATEGORIES: Record<Market, string[]> = {
  us: ['ai-tools', 'cybersecurity', 'personal-finance', 'trading', 'business-banking', 'credit-repair', 'debt-relief', 'credit-score'],
  uk: ['ai-tools', 'cybersecurity', 'trading', 'personal-finance', 'business-banking', 'remortgaging', 'cost-of-living', 'savings'],
  ca: ['ai-tools', 'cybersecurity', 'forex', 'personal-finance', 'business-banking', 'tax-efficient-investing', 'housing'],
  au: ['ai-tools', 'cybersecurity', 'trading', 'forex', 'personal-finance', 'business-banking', 'superannuation', 'gold-investing', 'savings'],
};

// ── Helper: Gap Badge ────────────────────────────────────────

function GapBadge({ type }: { type: string }) {
  const config = {
    missing: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Missing' },
    weak: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Weak' },
    behind: { bg: 'bg-cyan-50', text: 'text-cyan-600', label: 'Behind' },
  }[type] || { bg: 'bg-slate-100', text: 'text-slate-500', label: type };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

// ── Helper: Build page URL from run data ─────────────────────

function getPageUrl(run: RecentRun): string | null {
  if (!run.slug || run.status !== 'completed') return null;
  // slug from DB may or may not have a leading slash
  const s = run.slug.startsWith('/') ? run.slug : `/${run.slug}`;
  return s;
}

// ── Main Component ───────────────────────────────────────────

export function GenesisHub({ recentRuns: initialRuns }: GenesisHubProps) {
  const [recentRuns, setRecentRuns] = useState(initialRuns);
  const [editingRun, setEditingRun] = useState<RecentRun | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Step 1: Research
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState<Market>('us');
  const [category, setCategory] = useState('personal-finance');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);

  // Step 2: Generate
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordSuggestion | null>(null);
  const [runId, setRunId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [researchBrief, setResearchBrief] = useState('');
  const [showResearchPanel, setShowResearchPanel] = useState(false);
  const [detectedResearchFile, setDetectedResearchFile] = useState<string | null>(null);
  const [genProgress, setGenProgress] = useState<GenerationProgress>({ step: 'idle', progress: 0, message: '' });
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3: Media
  const [processedImages, setProcessedImages] = useState<ImageUpload[]>([]);

  // Step 4: Launch
  const [affiliatePartners, setAffiliatePartners] = useState<AvailablePartner[]>([]);
  const [affiliateMappings, setAffiliateMappings] = useState<AffiliateMappingEntry[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ deployed: boolean; indexed: boolean } | null>(null);
  const [indexingResult, setIndexingResult] = useState<IndexingResult | null>(null);
  const [isReindexing, setIsReindexing] = useState<string | null>(null);

  // Quick Template Creator
  const [templateMarket, setTemplateMarket] = useState<Market>('us');
  const [templateCategory, setTemplateCategory] = useState('debt-relief');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateSlug, setTemplateSlug] = useState('');
  const [templateReviewedBy, setTemplateReviewedBy] = useState('');
  const [templateAffiliateUrl, setTemplateAffiliateUrl] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templateAutoPartner, setTemplateAutoPartner] = useState(true);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templatePartnerPreview, setTemplatePartnerPreview] = useState<{ partnerName: string; affiliateUrl: string; source: 'market' | 'global' } | null>(null);
  const [isLoadingTemplatePartnerPreview, setIsLoadingTemplatePartnerPreview] = useState(false);
  const [templatePartnerPreviewError, setTemplatePartnerPreviewError] = useState<string | null>(null);
  const templateCategoryOptions = CATEGORIES.filter((c) => MARKET_CATEGORIES[templateMarket].includes(c.code));

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Keep template category valid when market changes
  useEffect(() => {
    if (!MARKET_CATEGORIES[templateMarket].includes(templateCategory)) {
      setTemplateCategory(MARKET_CATEGORIES[templateMarket][0]);
    }
  }, [templateMarket, templateCategory]);

  // Live preview of auto-selected CTA partner for template creator
  useEffect(() => {
    let cancelled = false;

    if (!templateAutoPartner) {
      setTemplatePartnerPreview(null);
      setTemplatePartnerPreviewError(null);
      return;
    }

    (async () => {
      setIsLoadingTemplatePartnerPreview(true);
      setTemplatePartnerPreviewError(null);
      try {
        const res = await fetch(`/api/genesis/auto-partner-preview?market=${templateMarket}&category=${templateCategory}`);
        const result = await res.json();
        if (cancelled) return;
        if (result.success && result.partnerName && result.affiliateUrl && result.source) {
          setTemplatePartnerPreview({
            partnerName: result.partnerName,
            affiliateUrl: result.affiliateUrl,
            source: result.source,
          });
          setTemplatePartnerPreviewError(null);
        } else {
          setTemplatePartnerPreview(null);
          setTemplatePartnerPreviewError(result.error || 'No partner configured');
        }
      } catch {
        if (!cancelled) {
          setTemplatePartnerPreview(null);
          setTemplatePartnerPreviewError('Failed to load auto partner preview');
        }
      } finally {
        if (!cancelled) setIsLoadingTemplatePartnerPreview(false);
      }
    })();

    return () => { cancelled = true; };
  }, [templateAutoPartner, templateMarket, templateCategory]);

  // ── Step 1: Magic Find ─────────────────────────────────────

  const handleMagicFind = useCallback(async () => {
    if (!query.trim() || isResearching) return;
    setIsResearching(true);

    try {
      const res = await fetch('/api/genesis/magic-find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, market, category }),
      });
      const result = await res.json();

      if (result.success && result.data) {
        setResearchResult(result.data);
        setRunId(result.data.runId);
        toast.success(`Found ${result.data.suggestions.length} keyword opportunities`);
      } else {
        toast.error(result.error || 'Research failed');
      }
    } catch (err) {
      toast.error('Research failed');
      console.error(err);
    } finally {
      setIsResearching(false);
    }
  }, [query, market, category, isResearching]);

  const selectKeyword = (suggestion: KeywordSuggestion) => {
    setSelectedKeyword(suggestion);
    setCompletedSteps(new Set([0]));
    setCurrentStep(1);
    // Check if a research file exists on disk for this keyword
    const slugBase = suggestion.keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
    fetch(`/api/genesis/check-research?market=${market}&category=${category}&slug=${slugBase}`)
      .then((r) => r.json())
      .then((data: { found: boolean; filename?: string; content?: string }) => {
        if (data.found && data.filename) {
          setDetectedResearchFile(data.filename);
          if (data.content && !researchBrief) {
            setResearchBrief(data.content);
          }
          setShowResearchPanel(true);
        }
      })
      .catch(() => { /* non-critical */ });
  };

  // ── Step 2: Generate ───────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!selectedKeyword || isGenerating) return;
    setIsGenerating(true);
    setGenProgress({ step: 'research', progress: 5, message: 'Starting generation...' });

    // Start polling for progress
    pollingRef.current = setInterval(async () => {
      try {
        const progressRes = await fetch(`/api/genesis/progress?runId=${encodeURIComponent(runId)}`);
        const result = await progressRes.json();
        if (result) {
          setGenProgress(result.progress);
          if (result.progress.step === 'done' || result.progress.step === 'error') {
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        }
      } catch { /* ignore polling errors */ }
    }, 2000);

    try {
      const genRes = await fetch('/api/genesis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          keyword: selectedKeyword.keyword,
          market,
          category,
          researchBrief: researchBrief.trim() || undefined,
        }),
      });
      const result = await genRes.json();

      if (pollingRef.current) clearInterval(pollingRef.current);

      if (result.success) {
        setGeneratedSlug(result.slug);
        setWordCount(result.wordCount);
        setGenProgress({ step: 'done', progress: 100, message: `Done! ${result.wordCount.toLocaleString('en-US')} words generated.` });
        setCompletedSteps(new Set([0, 1]));
        toast.success(`Asset generated: ${result.wordCount.toLocaleString('en-US')} words`);

        // Prefetch affiliate rates for step 4
        try {
          const ratesRes = await fetch(`/api/genesis/affiliate-rates?market=${market}`);
          const partners = await ratesRes.json();
          setAffiliatePartners(partners);
        } catch { /* ignore */ }

        // Auto-advance to step 2 after 1.5s
        setTimeout(() => setCurrentStep(2), 1500);
      } else {
        setGenProgress({ step: 'error', progress: 0, message: result.error || 'Generation failed' });
        toast.error(result.error || 'Generation failed');
      }
    } catch (err) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setGenProgress({ step: 'error', progress: 0, message: 'Generation failed' });
      toast.error('Generation failed');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedKeyword, runId, market, category, isGenerating, researchBrief]);

  // ── Step 3: Media ──────────────────────────────────────────

  const handleMediaDone = () => {
    // Save images to pipeline
    if (processedImages.length > 0) {
      (async () => {
        try {
          await fetch('/api/genesis/insert-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              runId,
              imageData: processedImages.map((img) => ({
                filename: img.filename,
                altText: img.altText,
                width: img.width,
                height: img.height,
                sizeKb: img.sizeKb,
                position: img.position,
              })),
            }),
          });
        } catch { /* non-critical */ }
      })();
    }
    setCompletedSteps(new Set([0, 1, 2]));
    setCurrentStep(3);
  };

  const skipMedia = () => {
    setCompletedSteps(new Set([0, 1, 2]));
    setCurrentStep(3);
  };

  // ── Step 4: Launch ─────────────────────────────────────────

  const handleLaunch = useCallback(async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    setIndexingResult(null);

    try {
      const distRes = await fetch('/api/genesis/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, affiliateMappings }),
      });
      const result = await distRes.json();

      if (result.success) {
        setPublishResult({ deployed: result.deployed, indexed: result.indexed });
        if (result.indexingResult) {
          setIndexingResult(result.indexingResult);
        }
        setCompletedSteps(new Set([0, 1, 2, 3]));
        toast.success(
          result.indexed
            ? `Page live & Indexing Request sent (~${result.indexingResult?.responseTimeMs || 0}ms)`
            : 'Asset published and deployed!',
        );
      } else {
        toast.error(result.error || 'Publishing failed');
      }
    } catch (err) {
      toast.error('Publishing failed');
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  }, [runId, affiliateMappings, isPublishing]);

  // Re-index an existing run from the recent runs list
  const handleReindex = useCallback(async (reindexRunId: string) => {
    if (isReindexing) return;
    setIsReindexing(reindexRunId);
    try {
      const idxRes = await fetch('/api/genesis/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: reindexRunId }),
      });
      const result = await idxRes.json();
      if (result.success) {
        toast.success(`Indexing request sent (~${result.responseTimeMs}ms)`);
      } else {
        toast.error(result.error || 'Indexing failed');
      }
    } catch {
      toast.error('Indexing request failed');
    } finally {
      setIsReindexing(null);
    }
  }, [isReindexing]);

  // Delete a genesis run
  const handleDelete = useCallback(async (deleteRunId: string) => {
    setDeletingId(deleteRunId);
    try {
      const res = await fetch('/api/genesis/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: deleteRunId }),
      });
      const result = await res.json();
      if (result.success) {
        setRecentRuns((prev) => prev.filter((r) => r.id !== deleteRunId));
        toast.success('Page deleted');
      } else {
        toast.error(result.error || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }, []);

  // ── Quick Create: Review from Master Template ─────────────

  const handleCreateFromTemplate = useCallback(async () => {
    if (isCreatingTemplate) return;
    if (!templateTitle.trim() || !templateBody.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsCreatingTemplate(true);
    try {
      const tplRes = await fetch('/api/genesis/create-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: templateMarket,
          category: templateCategory,
          title: templateTitle.trim(),
          bodyContent: templateBody.trim(),
          slug: templateSlug.trim() || undefined,
          reviewedBy: templateReviewedBy.trim() || undefined,
          affiliateUrl: templateAffiliateUrl.trim() || undefined,
          autoPartner: templateAutoPartner,
        }),
      });
      const result = await tplRes.json();

      if (result.success) {
        toast.success(
          result.partnerName
            ? `Review created: ${result.pageUrl} · CTA: ${result.partnerName}`
            : `Review created: ${result.pageUrl}`
        );
        setTemplateTitle('');
        setTemplateSlug('');
        setTemplateBody('');
      } else {
        toast.error(result.error || 'Failed to create review');
      }
    } catch (err) {
      toast.error('Failed to create review');
      console.error(err);
    } finally {
      setIsCreatingTemplate(false);
    }
  }, [
    isCreatingTemplate,
    templateMarket,
    templateCategory,
    templateTitle,
    templateSlug,
    templateReviewedBy,
    templateAffiliateUrl,
    templateBody,
  ]);

  // ── Render ─────────────────────────────────────────────────

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-8"
    >
      {/* Quick Template Creator */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Create Review from Master Template</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Paste your professional content and generate a ready-to-edit MDX review page.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={templateTitle}
            onChange={(e) => setTemplateTitle(e.target.value)}
            placeholder="Review title (required)"
            className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white focus:border-violet-500 focus:outline-none"
          />
          <input
            type="text"
            value={templateSlug}
            onChange={(e) => setTemplateSlug(e.target.value)}
            placeholder="Slug (optional, auto-generated if empty)"
            className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white focus:border-violet-500 focus:outline-none"
          />
          <select
            value={templateMarket}
            onChange={(e) => setTemplateMarket(e.target.value as Market)}
            className="px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white focus:border-violet-500 focus:outline-none"
          >
            {MARKETS.map((m) => (
              <option key={m.code} value={m.code}>{m.flag} {m.name}</option>
            ))}
          </select>
          <select
            value={templateCategory}
            onChange={(e) => setTemplateCategory(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white focus:border-violet-500 focus:outline-none"
          >
            {templateCategoryOptions.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={templateReviewedBy}
            onChange={(e) => setTemplateReviewedBy(e.target.value)}
            placeholder='Reviewed by (optional, e.g. "James Mitchell, Bankruptcy Attorney (NACTT)")'
            className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white focus:border-violet-500 focus:outline-none"
          />
          <input
            type="text"
            value={templateAffiliateUrl}
            onChange={(e) => setTemplateAffiliateUrl(e.target.value)}
            placeholder='Affiliate URL (optional, e.g. "/go/national-debt-relief")'
            className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white focus:border-violet-500 focus:outline-none"
          />
        </div>

        <textarea
          value={templateBody}
          onChange={(e) => setTemplateBody(e.target.value)}
          placeholder="Paste the full article body here (without frontmatter). This replaces the template body from 'Executive Summary' onward."
          rows={8}
          className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white focus:border-violet-500 focus:outline-none"
        />

        <label className="inline-flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={templateAutoPartner}
            onChange={(e) => setTemplateAutoPartner(e.target.checked)}
            className="rounded border-slate-300"
          />
          Auto-select best CTA partner from market/category
        </label>

        {templateAutoPartner && (
          <div className="text-xs">
            {isLoadingTemplatePartnerPreview ? (
              <span className="text-slate-500">Loading auto partner preview...</span>
            ) : templatePartnerPreview ? (
              <span className="text-emerald-700">
                Auto picks: <strong>{templatePartnerPreview.partnerName}</strong> ({templatePartnerPreview.affiliateUrl})
                {templatePartnerPreview.source === 'global' ? ' · global fallback' : ''}
              </span>
            ) : (
              <span className="text-rose-600">
                {templatePartnerPreviewError || 'No CTA partner configured for this market/category.'}
              </span>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleCreateFromTemplate}
            disabled={isCreatingTemplate || !templateTitle.trim() || !templateBody.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}
          >
            {isCreatingTemplate ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Create Review Draft
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stepper */}
      <GenesisStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={(step) => {
          if (completedSteps.has(step) || step === currentStep) setCurrentStep(step);
        }}
      />

      {/* ═══ Step 0: Research ═══ */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800">Competitor & Keyword Radar</h3>
            <p className="text-sm text-slate-500 mt-1">
              Enter a niche keyword — we'll analyze competitor depth and estimate CPA revenue
            </p>
          </div>

          {/* Search input */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMagicFind()}
                placeholder="e.g. Best Crypto Wallets UK, Top Robo Advisors..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-800 placeholder-slate-400 border border-slate-200 bg-white focus:border-violet-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as Market)}
                className="px-3 py-2 rounded-xl text-sm text-slate-800 border border-slate-200 bg-white focus:border-violet-500 focus:outline-none"
              >
                {MARKETS.map((m) => (
                  <option key={m.code} value={m.code}>{m.flag} {m.name}</option>
                ))}
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm text-slate-800 border border-slate-200 bg-white focus:border-violet-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Magic Find button */}
          <div className="text-center">
            <button
              onClick={handleMagicFind}
              disabled={!query.trim() || isResearching}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 btn-shimmer"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.25)',
              }}
            >
              {isResearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Competitors...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Magic Find
                </>
              )}
            </button>
          </div>

          {/* Results: 3 suggestion cards */}
          {researchResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {researchResult.suggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 hover:border-violet-300 transition-all cursor-pointer group shadow-sm"
                  onClick={() => selectKeyword(suggestion)}
                >
                  {/* Keyword */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-3.5 w-3.5 text-violet-400" />
                      <GapBadge type={suggestion.gapType} />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 leading-tight">
                      {suggestion.keyword}
                    </h4>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg px-3 py-2 bg-violet-50">
                      <p className="text-[10px] text-slate-500 uppercase">Opportunity</p>
                      <p className="text-lg font-bold text-violet-600 tabular-nums">{suggestion.opportunityScore}</p>
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-emerald-50">
                      <p className="text-[10px] text-slate-500 uppercase">Est. Revenue</p>
                      <p className="text-lg font-bold text-emerald-600 tabular-nums">
                        ${suggestion.estimatedCpaRevenue.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Provider */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <DollarSign className="h-3 w-3 text-emerald-500" />
                      <span>{suggestion.topProviderName}</span>
                    </div>
                    <span className="text-emerald-600 font-medium">CPA ${suggestion.topProviderCpa}</span>
                  </div>

                  {/* Select button */}
                  <button
                    className="w-full py-2 rounded-lg text-xs font-semibold text-violet-600 border border-violet-200 group-hover:bg-violet-50 transition-all flex items-center justify-center gap-2"
                  >
                    Select & Continue
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recent runs with Index Status */}
          {recentRuns.length > 0 && !researchResult && (
            <div
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Runs</h4>
              {/* Table header */}
              <div className="grid gap-x-3 text-[10px] text-slate-600 uppercase tracking-wider mb-2 px-1"
                style={{ gridTemplateColumns: 'minmax(120px, 1fr) 50px 65px 40px 75px 75px 100px' }}>
                <div>Keyword</div>
                <div>Market</div>
                <div className="text-right">Words</div>
                <div className="text-center">Imgs</div>
                <div className="text-center">Index</div>
                <div className="text-right">Date</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="space-y-1">
                {recentRuns.slice(0, 8).map((run) => (
                  <div
                    key={run.id}
                    className="grid gap-x-3 items-center text-xs rounded-lg px-1 py-1.5 hover:bg-slate-100 transition-colors"
                    style={{ gridTemplateColumns: 'minmax(120px, 1fr) 50px 65px 40px 75px 75px 100px' }}
                  >
                    {/* Keyword + status dot */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        run.status === 'completed' ? 'bg-emerald-400' :
                        run.status === 'failed' ? 'bg-red-400' :
                        'bg-amber-400 animate-pulse'
                      }`} />
                      <span className="text-slate-700 truncate">{run.keyword}</span>
                    </div>
                    {/* Market */}
                    <div>
                      <span className="text-slate-500">{run.market.toUpperCase()}</span>
                    </div>
                    {/* Word count */}
                    <div className="text-right">
                      {run.wordCount ? (
                        <span className="text-slate-500 tabular-nums">{run.wordCount.toLocaleString('en-US')}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                    {/* Image count */}
                    <div className="text-center">
                      {run.imageCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-600">
                          <ImageIcon className="h-2.5 w-2.5" />
                          {run.imageCount}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </div>
                    {/* Index Status */}
                    <div className="flex items-center justify-center">
                      {run.indexedAt ? (
                        <div className="flex items-center gap-1 group/idx relative">
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-cyan-600 bg-cyan-50"
                          >
                            <Globe className="h-2.5 w-2.5" />
                            Indexed
                          </span>
                          {/* Tooltip with timestamp */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/idx:block z-10">
                            <div className="px-2 py-1 rounded text-[9px] text-slate-600 whitespace-nowrap bg-white border border-slate-200 shadow-lg">
                              {new Date(run.indexedAt).toLocaleString('en-US')}
                            </div>
                          </div>
                        </div>
                      ) : run.status === 'completed' ? (
                        <button
                          onClick={() => handleReindex(run.id)}
                          disabled={isReindexing === run.id}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-slate-500 hover:text-cyan-600 bg-slate-100 transition-colors"
                          title="Send instant indexing request"
                        >
                          {isReindexing === run.id ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-2.5 w-2.5" />
                          )}
                          Index
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </div>
                    {/* Date */}
                    <div className="text-right">
                      <span className="text-slate-600 tabular-nums">
                        {new Date(run.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      {run.status === 'completed' && (
                        <>
                          {getPageUrl(run) && (
                            <a
                              href={getPageUrl(run)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
                              title="Seite testen"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <button
                            onClick={() => setEditingRun(run)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                            title="Bearbeiten"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          {confirmDeleteId === run.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(run.id)}
                                disabled={deletingId === run.id}
                                className="px-2 py-1 rounded text-[10px] font-semibold text-white bg-red-500 hover:bg-red-400 transition-all"
                              >
                                {deletingId === run.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Ja'
                                )}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded text-[10px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                              >
                                Nein
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(run.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                              title="Löschen"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Step 1: Generate ═══ */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800">1-Click Content Generator</h3>
            <p className="text-sm text-slate-500 mt-1">
              Generate a 4,000-7,000 word SEO asset with Schema, ToC, and compliance labels
            </p>
          </div>

          {/* Selected keyword card */}
          {selectedKeyword && (
            <div
              className="max-w-lg mx-auto rounded-xl border border-violet-200 bg-violet-50 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-100">
                  <FileText className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{selectedKeyword.keyword}</p>
                  <p className="text-xs text-slate-500">
                    {MARKETS.find((m) => m.code === market)?.flag} {market.toUpperCase()} · {category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-violet-400" />
                  Score: {selectedKeyword.opportunityScore}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-emerald-400" />
                  Est: ${selectedKeyword.estimatedCpaRevenue.toFixed(0)}/mo
                </span>
              </div>
            </div>
          )}

          {/* ── Research Brief Panel ── */}
          {!isGenerating && genProgress.step !== 'done' && (
            <div className="max-w-lg mx-auto">
              {/* Toggle button */}
              <button
                onClick={() => setShowResearchPanel((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-medium"
                style={{
                  borderColor: researchBrief.trim() ? 'rgba(16,185,129,0.4)' : 'rgba(203,213,225,0.8)',
                  background: researchBrief.trim() ? 'rgba(236,253,245,0.8)' : 'rgba(248,250,252,0.8)',
                  color: researchBrief.trim() ? '#059669' : '#64748b',
                }}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {researchBrief.trim()
                    ? `Research brief ready (${researchBrief.trim().split(/\s+/).length.toLocaleString()} words)`
                    : 'Add Perplexity research brief (optional)'}
                  {detectedResearchFile && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                      <FolderOpen className="h-2.5 w-2.5" />
                      File detected
                    </span>
                  )}
                </span>
                {showResearchPanel
                  ? <ChevronUp className="h-4 w-4 flex-shrink-0" />
                  : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
              </button>

              {/* Expanded panel */}
              {showResearchPanel && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  {detectedResearchFile && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <FolderOpen className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <p className="text-xs text-emerald-700">
                        Auto-loaded: <span className="font-mono font-semibold">{detectedResearchFile}</span>
                      </p>
                    </div>
                  )}
                  <textarea
                    value={researchBrief}
                    onChange={(e) => setResearchBrief(e.target.value)}
                    placeholder={`Paste your Perplexity research here…\n\nTip: Save files as:\ncontent/research/${market}/${category}/[keyword-slug].md\nGenesis Hub will auto-load them.`}
                    rows={10}
                    className="w-full px-3 py-2.5 rounded-lg text-xs text-slate-700 placeholder-slate-400 border border-slate-200 bg-slate-50 focus:border-violet-400 focus:bg-white focus:outline-none resize-y font-mono leading-relaxed transition-colors"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>When provided, Claude will generate factual, data-rich content using your research.</span>
                    {researchBrief.trim() && (
                      <button
                        onClick={() => { setResearchBrief(''); setDetectedResearchFile(null); }}
                        className="text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress bar */}
          {(isGenerating || genProgress.step === 'done') && (
            <div className="max-w-lg mx-auto space-y-3">
              <div className="h-2 rounded-full overflow-hidden bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${genProgress.progress}%`,
                    background: genProgress.step === 'error'
                      ? '#f43f5e'
                      : genProgress.step === 'done'
                        ? '#34d399'
                        : 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${
                  genProgress.step === 'error' ? 'text-rose-600' :
                  genProgress.step === 'done' ? 'text-emerald-600' : 'text-violet-600'
                }`}>
                  {genProgress.message || 'Preparing...'}
                </span>
                <span className="text-slate-500 tabular-nums">{genProgress.progress}%</span>
              </div>
            </div>
          )}

          {/* Word count on completion */}
          {genProgress.step === 'done' && (
            <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
              <div className="rounded-xl p-4 text-center bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">{wordCount.toLocaleString('en-US')}</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">Words</p>
              </div>
              <div className="rounded-xl p-4 text-center bg-violet-50">
                <p className="text-2xl font-bold text-violet-600">✓</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">Schema.org</p>
              </div>
              <div className="rounded-xl p-4 text-center bg-cyan-50">
                <p className="text-2xl font-bold text-cyan-600">✓</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">FAQPage</p>
              </div>
            </div>
          )}

          {/* Generate / Continue button */}
          <div className="text-center space-x-3">
            {!isGenerating && genProgress.step !== 'done' && (
              <button
                onClick={handleGenerate}
                disabled={!selectedKeyword}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)',
                }}
              >
                <Wand2 className="h-4 w-4" />
                Generate Asset
              </button>
            )}

            {genProgress.step === 'done' && (
              <button
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.25)',
                }}
              >
                Continue to Media
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ Step 2: Media ═══ */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800">Smart Media Handler</h3>
            <p className="text-sm text-slate-500 mt-1">
              Drop images — auto WebP conversion, AI alt-text, and psychological placement
            </p>
          </div>

          <GenesisMediaDropzone
            maxImages={4}
            market={market}
            category={category}
            slug={generatedSlug.split('/').pop() || ''}
            keyword={selectedKeyword?.keyword || query}
            onImagesProcessed={setProcessedImages}
          />

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={skipMedia}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all"
            >
              Skip — No Images
            </button>
            {processedImages.length > 0 && (
              <button
                onClick={handleMediaDone}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
                }}
              >
                Continue to Launch
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ Step 3: Launch ═══ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800">Distribution & Indexing</h3>
            <p className="text-sm text-slate-500 mt-1">
              Map affiliate partners, trigger deploy, and submit to Google
            </p>
          </div>

          {/* Affiliate mapper */}
          <GenesisAffiliateMapper
            availablePartners={affiliatePartners}
            onMappingsChange={setAffiliateMappings}
          />

          {/* Status checklist */}
          <div
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
          >
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Launch Checklist</h4>
            {[
              { label: 'MDX file written', done: !!generatedSlug, icon: FileText },
              { label: `${processedImages.length} images placed`, done: processedImages.length > 0, icon: Sparkles },
              { label: `${affiliateMappings.length} affiliates mapped`, done: affiliateMappings.length > 0, icon: DollarSign },
              { label: 'Deploy triggered', done: publishResult?.deployed || false, icon: Rocket },
              { label: 'Google indexed', done: publishResult?.indexed || false, icon: Globe },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  item.done
                    ? 'bg-emerald-100 border border-emerald-300'
                    : 'border border-slate-300 bg-white'
                }`}>
                  {item.done ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <item.icon className="h-3 w-3 text-slate-400" />
                  )}
                </div>
                <span className={item.done ? 'text-emerald-600' : 'text-slate-500'}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Launch & Instant Index button */}
          <div className="text-center">
            {!publishResult ? (
              <button
                onClick={handleLaunch}
                disabled={isPublishing}
                className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-bold text-white transition-all disabled:opacity-50 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669, #8b5cf6)',
                  boxShadow: isPublishing
                    ? '0 0 60px rgba(16, 185, 129, 0.5), inset 0 0 30px rgba(16, 185, 129, 0.2)'
                    : '0 0 40px rgba(16, 185, 129, 0.3)',
                }}
              >
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%)',
                    backgroundSize: '200% 100%',
                    animation: isPublishing ? 'none' : undefined,
                  }}
                />
                {isPublishing ? (
                  <>
                    <div className="relative flex items-center gap-3">
                      <div className="w-5 h-5 relative">
                        <Loader2 className="h-5 w-5 animate-spin absolute" />
                      </div>
                      <span className="animate-pulse">Indexing...</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5 relative" />
                    <span className="relative">Launch & Instant Index</span>
                    <ArrowRight className="h-4 w-4 relative group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            ) : (
              <div
                className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-base font-bold text-emerald-600">
                    {publishResult.indexed
                      ? 'Page live & Indexing Request gesendet'
                      : 'Asset Published Successfully!'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {generatedSlug} · {wordCount.toLocaleString('en-US')} words · {processedImages.length} images
                  </p>
                </div>

                {/* Indexing result details */}
                {indexingResult && (
                  <div
                    className={`w-full max-w-sm rounded-xl p-4 space-y-2 border ${
                      indexingResult.success
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-rose-50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Globe className={`h-3.5 w-3.5 ${indexingResult.success ? 'text-cyan-600' : 'text-rose-600'}`} />
                        <span className={indexingResult.success ? 'text-cyan-700 font-medium' : 'text-rose-700 font-medium'}>
                          {indexingResult.success ? 'Google Indexing API' : 'Indexing Not Configured'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 tabular-nums font-mono">
                        ~{indexingResult.responseTimeMs}ms
                      </span>
                    </div>
                    {indexingResult.success && indexingResult.notifyTime && (
                      <p className="text-[10px] text-slate-500">
                        Notify time: {new Date(indexingResult.notifyTime).toLocaleString()}
                      </p>
                    )}
                    {indexingResult.error && (
                      <p className="text-[10px] text-slate-500">{indexingResult.error}</p>
                    )}
                  </div>
                )}

                {/* View page button */}
                {generatedSlug && (
                  <a
                    href={`/${generatedSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                      boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Seite ansehen
                  </a>
                )}

                {publishResult.deployed && (
                  <p className="text-[10px] text-violet-600 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Freshness Boost + ISR Revalidation triggered
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editingRun && (
        <GenesisEditModal
          runId={editingRun.id}
          keyword={editingRun.keyword}
          category={editingRun.category}
          onClose={() => setEditingRun(null)}
          onSaved={() => {
            setEditingRun(null);
            // Trigger page refresh to reload data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
