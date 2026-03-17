'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  X,
  Loader2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────

interface ProcessedImage {
  filename: string;
  originalName: string;
  altText: string;
  width: number;
  height: number;
  sizeKb: number;
  position: 'hero' | 'mid-scroll' | 'comparison' | 'deep-content';
  previewUrl: string;
}

interface GenesisMediaDropzoneProps {
  maxImages?: number;
  market: string;
  category: string;
  slug: string;
  keyword: string;
  onImagesProcessed: (images: ProcessedImage[]) => void;
}

const POSITIONS: { id: ProcessedImage['position']; label: string; depth: string }[] = [
  { id: 'hero', label: 'Hero', depth: 'Top of page' },
  { id: 'comparison', label: 'Comparison', depth: '~30% scroll' },
  { id: 'mid-scroll', label: 'Mid-Article', depth: '~55% scroll' },
  { id: 'deep-content', label: 'Deep Content', depth: '~75% scroll' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ── Component ────────────────────────────────────────────────

export function GenesisMediaDropzone({
  maxImages = 4,
  market,
  category,
  slug,
  keyword,
  onImagesProcessed,
}: GenesisMediaDropzoneProps) {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (isProcessing) return;
      const remainingSlots = maxImages - images.length;
      const filesToProcess = files.slice(0, remainingSlots);

      if (filesToProcess.length === 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Validate
      for (const file of filesToProcess) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`${file.name}: Only JPEG, PNG, and WebP accepted`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: Max file size is 5MB`);
          return;
        }
      }

      setIsProcessing(true);

      try {
        // Step 1: WebP conversion via Sharp API
        setProcessingStep('Converting to WebP...');
        const formData = new FormData();
        filesToProcess.forEach((f) => formData.append('files', f));
        formData.append('market', market);
        formData.append('category', category);
        formData.append('slug', slug);

        const cronSecret = ''; // Client-side — API auth handled differently in dev
        const processRes = await fetch('/api/genesis/process-images', {
          method: 'POST',
          headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
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
          // Fallback: use files as-is without Sharp processing
          processedData = filesToProcess.map((f, i) => ({
            filename: POSITIONS[images.length + i]?.id + '.webp' || `image-${i}.webp`,
            width: 1200,
            height: 600,
            sizeKb: Math.round(f.size / 1024),
            position: POSITIONS[images.length + i]?.id || 'deep-content',
          }));
        }

        // Step 2: AI alt-text generation
        setProcessingStep('Generating AI alt-text...');
        const newImages: ProcessedImage[] = [];

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
            originalName: file.name,
            altText,
            width: processed.width,
            height: processed.height,
            sizeKb: processed.sizeKb,
            position: processed.position as ProcessedImage['position'],
            previewUrl: URL.createObjectURL(file),
          });
        }

        const allImages = [...images, ...newImages];
        setImages(allImages);
        onImagesProcessed(allImages);
        toast.success(`${newImages.length} image(s) processed successfully`);
      } catch (err) {
        toast.error('Image processing failed');
        console.error('[dropzone] Error:', err);
      } finally {
        setIsProcessing(false);
        setProcessingStep('');
      }
    },
    [images, maxImages, isProcessing, market, category, slug, keyword, onImagesProcessed],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    // Revoke old preview URL
    URL.revokeObjectURL(images[index].previewUrl);
    setImages(updated);
    onImagesProcessed(updated);
  };

  const updateAltText = (index: number, altText: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], altText };
    setImages(updated);
    onImagesProcessed(updated);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`
          relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-violet-400 bg-violet-50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
        `}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            <p className="text-sm font-medium text-violet-600">{processingStep}</p>
            <p className="text-xs text-slate-500">Sharp WebP + Anthropic Vision AI</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Upload className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Drag & drop images or{' '}
                <span className="text-violet-600 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                JPEG, PNG, WebP — max 5MB each — {maxImages - images.length} slot(s) remaining
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

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              {/* Preview */}
              <div className="relative aspect-video bg-slate-100">
                <img
                  src={img.previewUrl}
                  alt={img.altText}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
                {/* Position badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm">
                  <MapPin className="h-3 w-3 text-violet-500" />
                  <span className="text-violet-700">{POSITIONS.find((p) => p.id === img.position)?.label}</span>
                  <span className="text-slate-400">({POSITIONS.find((p) => p.id === img.position)?.depth})</span>
                </div>
              </div>

              {/* Info + Alt text */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{img.filename}</span>
                  <span>{img.width}×{img.height} · {img.sizeKb}KB</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500 mt-1.5 shrink-0" />
                  <textarea
                    value={img.altText}
                    onChange={(e) => updateAltText(i, e.target.value)}
                    rows={2}
                    className="flex-1 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:border-violet-400"
                    placeholder="AI-generated alt text..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
