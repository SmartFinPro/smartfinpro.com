'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  X,
  Loader2,
  Save,
  Sparkles,
  FileText,
  ImageIcon,
  Upload,
  Wand2,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
// Server action proxies — direct 'use server' imports crash Webpack client bundles
async function fetchRunDetail(runId: string) {
  const res = await fetch(`/api/genesis/detail?runId=${encodeURIComponent(runId)}`);
  return res.json();
}
async function fetchUpdateContent(runId: string, fullMdx: string) {
  const res = await fetch('/api/genesis/update-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId, fullMdx }),
  });
  return res.json();
}
async function fetchInsertImages(runId: string, imageData: Array<{ filename: string; altText: string; width: number; height: number; sizeKb: number; position: string }>) {
  const res = await fetch('/api/genesis/insert-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId, imageData }),
  });
  return res.json();
}

// ── Types ────────────────────────────────────────────────────

interface GenesisEditModalProps {
  runId: string;
  keyword: string;
  category: string;
  onClose: () => void;
  onSaved: () => void;
}

interface SectionBlock {
  id: string;
  heading: string;
  content: string;
}

interface ImageEntry {
  filename: string;
  position: string;
  altText: string;
  previewUrl?: string;
}

const POSITIONS = [
  { id: 'hero', label: 'Hero', depth: 'Top of page' },
  { id: 'comparison', label: 'Comparison', depth: '~30% scroll' },
  { id: 'mid-scroll', label: 'Mid-Article', depth: '~55% scroll' },
  { id: 'deep-content', label: 'Deep Content', depth: '~75% scroll' },
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ── Component ────────────────────────────────────────────────

export function GenesisEditModal({
  runId,
  keyword,
  category,
  onClose,
  onSaved,
}: GenesisEditModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'images'>('text');
  const [mdxContent, setMdxContent] = useState('');
  const [sections, setSections] = useState<SectionBlock[]>([]);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [slug, setSlug] = useState('');
  const [market, setMarket] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load run data on mount
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchRunDetail(runId);
      if (result.success && result.run && result.mdxContent) {
        setMdxContent(result.mdxContent);
        setImages(result.run.images.map((img: { filename: string; position: string; altText: string }) => ({
          filename: img.filename,
          position: img.position,
          altText: img.altText,
        })));
        setSlug(result.run.slug || '');
        setMarket(result.run.market);

        // Parse sections from MDX
        const parsed = parseSections(result.mdxContent);
        setSections(parsed);
      } else {
        toast.error(result.error || 'Failed to load content');
      }
    } catch {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [runId]);

  // Load on first render
  useEffect(() => { loadData(); }, [loadData]);

  // Parse MDX into heading-based sections
  function parseSections(mdx: string): SectionBlock[] {
    // Split by ## headings (keep frontmatter as first block)
    const parts = mdx.split(/^(## .+)$/m);
    const blocks: SectionBlock[] = [];

    // First block is frontmatter + intro
    if (parts[0].trim()) {
      blocks.push({
        id: 'frontmatter',
        heading: 'Frontmatter & Intro',
        content: parts[0].trim(),
      });
    }

    // Remaining pairs: heading + content
    for (let i = 1; i < parts.length; i += 2) {
      const heading = parts[i]?.replace('## ', '').trim() || `Section ${blocks.length + 1}`;
      const content = (parts[i] + (parts[i + 1] || '')).trim();
      blocks.push({
        id: `section-${blocks.length}`,
        heading,
        content,
      });
    }

    return blocks;
  }

  // Rebuild full MDX from sections
  function rebuildMdx(secs: SectionBlock[]): string {
    return secs.map((s) => s.content).join('\n\n');
  }

  // Save content
  const handleSave = async () => {
    setSaving(true);
    try {
      const fullMdx = rebuildMdx(sections);
      const result = await fetchUpdateContent(runId, fullMdx);
      if (result.success) {
        toast.success(`Saved — ${result.wordCount?.toLocaleString('en-US')} words`);
        onSaved();
      } else {
        toast.error(result.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // AI rewrite section
  const handleAiEdit = async (sectionId: string) => {
    if (!aiPrompt.trim()) {
      toast.error('Bitte gib eine Anweisung ein');
      return;
    }

    setAiLoading(true);
    try {
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;

      const res = await fetch('/api/genesis/edit-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionContent: section.content,
          userPrompt: aiPrompt,
          context: `${category} — ${keyword}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.editedContent) {
          const updated = sections.map((s) =>
            s.id === sectionId ? { ...s, content: data.editedContent } : s,
          );
          setSections(updated);
          setAiPrompt('');
          setEditingSection(null);
          toast.success('Section updated by AI');
        }
      } else {
        toast.error('AI edit failed');
      }
    } catch {
      toast.error('AI edit failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Update section content manually
  const updateSection = (sectionId: string, newContent: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, content: newContent } : s)),
    );
  };

  // Image path helper
  const getImageSrc = (filename: string) => {
    const prefix = market + '/';
    return `/images/content/${prefix}${category}/${slug}/${filename}`;
  };

  const POSITION_LABELS: Record<string, string> = {
    hero: 'Hero',
    comparison: 'Comparison',
    'mid-scroll': 'Mid-Article',
    'deep-content': 'Deep Content',
  };

  // ── Image upload handling ────────────────────────────────
  const processUploadFiles = useCallback(
    async (files: File[]) => {
      if (isUploading) return;
      const maxImages = 4;
      const remainingSlots = maxImages - images.length;
      const filesToProcess = files.slice(0, remainingSlots);

      if (filesToProcess.length === 0) {
        toast.error(`Maximum ${maxImages} Bilder erlaubt`);
        return;
      }

      for (const file of filesToProcess) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`${file.name}: Nur JPEG, PNG und WebP erlaubt`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: Max. 5MB pro Datei`);
          return;
        }
      }

      setIsUploading(true);

      try {
        // Step 1: WebP conversion via Sharp API
        setUploadStep('Konvertiere zu WebP...');
        const formData = new FormData();
        filesToProcess.forEach((f) => formData.append('files', f));
        formData.append('market', market);
        formData.append('category', category);
        formData.append('slug', slug);

        const processRes = await fetch('/api/genesis/process-images', {
          method: 'POST',
          body: formData,
        });

        let processedData: Array<{
          filename: string;
          width: number;
          height: number;
          sizeKb: number;
          position: string;
        }> = [];

        if (processRes.ok) {
          const result = await processRes.json();
          processedData = result.images || [];
        } else {
          processedData = filesToProcess.map((f, i) => ({
            filename: POSITIONS[images.length + i]?.id + '.webp' || `image-${i}.webp`,
            width: 1200,
            height: 600,
            sizeKb: Math.round(f.size / 1024),
            position: POSITIONS[images.length + i]?.id || 'deep-content',
          }));
        }

        // Step 2: AI alt-text generation
        setUploadStep('Generiere Alt-Text per KI...');
        const newImages: ImageEntry[] = [];

        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          const processed = processedData[i];
          if (!processed) continue;

          let altText = `${keyword} — ${POSITIONS[images.length + i]?.label || 'illustration'}`;

          try {
            const altFormData = new FormData();
            altFormData.append('file', file);
            altFormData.append('context', `${category} review — ${keyword}`);

            const altRes = await fetch('/api/genesis/alt-text', {
              method: 'POST',
              body: altFormData,
            });

            if (altRes.ok) {
              const altResult = await altRes.json();
              if (altResult.altText) altText = altResult.altText;
            }
          } catch {
            // Keep default alt text
          }

          newImages.push({
            filename: processed.filename,
            position: processed.position,
            altText,
            previewUrl: URL.createObjectURL(file),
          });
        }

        // Step 3: Save to DB
        setUploadStep('Speichere Bilder...');
        const allImages = [...images, ...newImages];
        await fetchInsertImages(
          runId,
          allImages.map((img) => ({
            filename: img.filename,
            altText: img.altText,
            width: 1200,
            height: 600,
            sizeKb: 0,
            position: img.position,
          })),
        );
        setImages(allImages);
        toast.success(`${newImages.length} Bild(er) hochgeladen`);
      } catch (err) {
        toast.error('Upload fehlgeschlagen');
        console.error('[edit-modal] Upload error:', err);
      } finally {
        setIsUploading(false);
        setUploadStep('');
      }
    },
    [images, isUploading, market, category, slug, keyword, runId],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      processUploadFiles(files);
    },
    [processUploadFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processUploadFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const img = images[index];
    if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <FileText className="h-4.5 w-4.5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Edit: {keyword}</h3>
              <p className="text-[11px] text-slate-500">{category} · {market.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-0 shrink-0">
          {(['text', 'images'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-t-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-slate-100 text-violet-700 border border-slate-200 border-b-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'text' ? <FileText className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
              {tab === 'text' ? 'Text' : `Bilder (${images.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 border-t border-slate-200">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            </div>
          ) : activeTab === 'text' ? (
            /* ── Text Tab ── */
            <div className="space-y-4">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                >
                  {/* Section header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-600 truncate">{section.heading}</span>
                    <button
                      onClick={() => {
                        setEditingSection(editingSection === section.id ? null : section.id);
                        setAiPrompt('');
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-violet-600 hover:bg-violet-50 transition-all"
                    >
                      <Wand2 className="h-3 w-3" />
                      KI bearbeiten
                    </button>
                  </div>

                  {/* AI prompt input */}
                  {editingSection === section.id && (
                    <div className="px-4 py-3 bg-violet-50/50 border-b border-violet-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAiEdit(section.id)}
                          placeholder="z.B. 'Kürzer und knackiger' oder 'Mehr Daten hinzufügen'"
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-violet-200 bg-white focus:outline-none focus:border-violet-400"
                          disabled={aiLoading}
                        />
                        <button
                          onClick={() => handleAiEdit(section.id)}
                          disabled={aiLoading || !aiPrompt.trim()}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50 transition-all"
                        >
                          {aiLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          Go
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Section content textarea */}
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(section.id, e.target.value)}
                    className="w-full px-4 py-3 text-xs font-mono text-slate-700 bg-white resize-none focus:outline-none min-h-[120px]"
                    rows={Math.min(section.content.split('\n').length + 2, 20)}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* ── Images Tab ── */
            <div className="space-y-4">
              {/* Upload Dropzone */}
              {images.length < 4 && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`
                    relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-slate-300 hover:border-violet-300 bg-white'}
                  `}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                      <p className="text-xs font-medium text-violet-600">{uploadStep}</p>
                      <p className="text-[10px] text-slate-400">Sharp WebP + Anthropic Vision AI</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                        <Upload className="h-5 w-5 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          Bilder hierher ziehen oder{' '}
                          <span className="text-violet-600 underline">durchsuchen</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          JPEG, PNG, WebP — max 5MB — {4 - images.length} Platz/Plätze frei
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
              )}

              {/* Image Grid */}
              {images.length === 0 && !isUploading ? (
                <div className="text-center py-6">
                  <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Noch keine Bilder vorhanden</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {images.map((img, i) => {
                    const imgSrc = img.previewUrl || getImageSrc(img.filename);
                    return (
                      <div
                        key={`${img.filename}-${i}`}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm group"
                      >
                        <div className="relative aspect-video bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgSrc}
                            alt={img.altText}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const el = e.target as HTMLImageElement;
                              el.style.display = 'none';
                              // Show fallback gradient
                              const fallback = el.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          {/* Gradient fallback (hidden by default) */}
                          <div
                            className="absolute inset-0 items-center justify-center"
                            style={{
                              display: 'none',
                              background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)',
                            }}
                          >
                            <ImageIcon className="h-8 w-8 text-white/60" />
                          </div>
                          {/* Position badge */}
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm">
                            <MapPin className="h-2.5 w-2.5 text-violet-500" />
                            <span className="text-violet-700">
                              {POSITION_LABELS[img.position] || img.position}
                            </span>
                          </div>
                          {/* Delete button */}
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                        <div className="p-3 space-y-1">
                          <p className="text-[11px] text-slate-500 truncate">{img.filename}</p>
                          <p className="text-xs text-slate-700">{img.altText}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
