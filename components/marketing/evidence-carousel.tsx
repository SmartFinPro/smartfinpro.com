'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Camera,
  Beaker,
} from 'lucide-react';

/* ────────────────────────── Types ────────────────────────── */

export interface EvidenceSlide {
  src: string;
  alt: string;
  caption: string;
  testedOn: string; // e.g. "Jan 2026 · iPhone 15 Pro · iOS 18"
}

interface EvidenceCarouselProps {
  slides: EvidenceSlide[];
  title?: string;
  source?: string;
  /** Short paragraph shown under the carousel */
  methodNote?: string;
}

/* ────────────────────────── Tracking ────────────────────────── */

function trackEvent(event: string, data?: Record<string, string | number>) {
  try {
    fetch('/api/track-cta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...data }),
    }).catch(() => {});
  } catch {
    /* noop */
  }
}

/* ────────────────────────── Component ────────────────────────── */

export function EvidenceCarousel({
  slides,
  title = 'Live Testing Evidence',
  source = 'SmartFinPro hands-on testing',
  methodNote,
}: EvidenceCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    skipSnaps: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const hasTrackedView = useRef(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  /* Sync index */
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setSelectedIndex(idx);
    trackEvent('screenshot_next', { slide: idx, caption: slides[idx]?.caption ?? '' });
  }, [emblaApi, slides]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  /* Intersection Observer for view tracking */
  useEffect(() => {
    if (!carouselRef.current || hasTrackedView.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedView.current) {
          hasTrackedView.current = true;
          trackEvent('screenshot_view', { totalSlides: slides.length });
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(carouselRef.current);
    return () => obs.disconnect();
  }, [slides.length]);

  /* Keyboard nav for lightbox */
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setLightboxIndex((p) => (p + 1) % slides.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((p) => (p - 1 + slides.length) % slides.length);
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, slides.length]);

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
    trackEvent('screenshot_zoom', { slide: idx, caption: slides[idx]?.caption ?? '' });
  };

  if (!slides || slides.length === 0) return null;

  return (
    <>
      <div ref={carouselRef} className="my-10">
        {/* Split-panel header — matches TrustAuthority locked pattern */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div
            className="h-1"
            style={{
              background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)',
            }}
          />
          <div className="flex flex-col lg:flex-row">
            {/* Left panel */}
            <div
              className="shrink-0 px-6 py-5 lg:px-8 lg:py-0 flex flex-col justify-center lg:w-[260px] border-b lg:border-b-0 lg:border-r border-gray-100"
              style={{ background: 'var(--sfp-sky)' }}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(26,107,58,0.1)' }}
                >
                  <Camera className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
                </div>
                <span
                  className="text-sm font-bold uppercase tracking-wider leading-tight"
                  style={{ color: 'var(--sfp-navy)' }}
                >
                  {title}
                </span>
              </div>
              {source && (
                <p className="text-[11px] lg:pl-[38px]" style={{ color: 'var(--sfp-slate)' }}>
                  Source: {source}
                </p>
              )}
            </div>

            {/* Right panel: Stats */}
            <div
              className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-px"
              style={{ backgroundColor: '#E5E7EB' }}
            >
              <div className="bg-white flex flex-col items-center justify-center py-4 px-3">
                <div
                  className="font-bold whitespace-nowrap"
                  style={{
                    color: 'var(--sfp-slate)',
                    fontSize: '14px',
                    lineHeight: '1.3',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {slides.length}
                </div>
                <div
                  className="whitespace-nowrap text-center"
                  style={{ color: 'var(--sfp-slate)', fontSize: '12px', marginTop: '3px' }}
                >
                  Screenshots
                </div>
              </div>
              <div className="bg-white flex flex-col items-center justify-center py-4 px-3">
                <div
                  className="font-bold whitespace-nowrap"
                  style={{
                    color: 'var(--sfp-slate)',
                    fontSize: '14px',
                    lineHeight: '1.3',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Live Platform
                </div>
                <div
                  className="whitespace-nowrap text-center"
                  style={{ color: 'var(--sfp-slate)', fontSize: '12px', marginTop: '3px' }}
                >
                  Capture Source
                </div>
              </div>
              <div className="bg-white flex flex-col items-center justify-center py-4 px-3 col-span-2 lg:col-span-1">
                <div
                  className="font-bold whitespace-nowrap"
                  style={{
                    color: 'var(--sfp-slate)',
                    fontSize: '14px',
                    lineHeight: '1.3',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Click to Zoom
                </div>
                <div
                  className="whitespace-nowrap text-center"
                  style={{ color: 'var(--sfp-slate)', fontSize: '12px', marginTop: '3px' }}
                >
                  Full Resolution
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative mt-4">
          <div className="overflow-hidden rounded-xl" ref={emblaRef}>
            <div className="flex">
              {slides.map((slide, idx) => (
                <div
                  key={idx}
                  className="flex-[0_0_100%] min-w-0 relative"
                >
                  <button
                    type="button"
                    onClick={() => openLightbox(idx)}
                    className="w-full cursor-zoom-in group relative block"
                    aria-label={`Zoom: ${slide.caption}`}
                  >
                    <div className="relative w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      <Image
                        src={slide.src}
                        alt={slide.alt}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 800px"
                      />
                      {/* Zoom overlay on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(0,0,0,0.15)' }}
                      >
                        <div className="bg-white rounded-full p-3 shadow-lg">
                          <ZoomIn className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Caption */}
                  <div className="mt-3 px-1">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--sfp-ink)' }}
                    >
                      {slide.caption}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: 'var(--sfp-slate)' }}
                    >
                      Tested on: {slide.testedOn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arrows */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                className="absolute left-2 top-[40%] -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-shadow z-10"
                aria-label="Previous screenshot"
              >
                <ChevronLeft className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              </button>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                className="absolute right-2 top-[40%] -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-shadow z-10"
                aria-label="Next screenshot"
              >
                <ChevronRight className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {slides.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => emblaApi?.scrollTo(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === selectedIndex ? 'w-6' : ''
                }`}
                style={{
                  background:
                    idx === selectedIndex ? 'var(--sfp-navy)' : '#D1D5DB',
                }}
                aria-label={`Go to screenshot ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Methodology note */}
        {methodNote && (
          <div
            className="mt-4 flex items-start gap-3 rounded-xl p-4 border border-gray-200"
            style={{ background: 'var(--sfp-gray)' }}
          >
            <Beaker
              className="h-5 w-5 shrink-0 mt-0.5"
              style={{ color: 'var(--sfp-navy)' }}
            />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
              {methodNote}
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot zoom view"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          {/* Navigation */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((p) => (p - 1 + slides.length) % slides.length);
                }}
                className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((p) => (p + 1) % slides.length);
                }}
                className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="relative w-[90vw] h-[85vh] max-w-[1400px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={slides[lightboxIndex].src}
              alt={slides[lightboxIndex].alt}
              fill
              className="object-contain"
              sizes="90vw"
              quality={95}
              priority
            />
          </div>

          {/* Caption overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-10">
            <p className="text-white text-sm font-semibold">{slides[lightboxIndex].caption}</p>
            <p className="text-white/60 text-xs mt-1">
              {slides[lightboxIndex].testedOn} · {lightboxIndex + 1} / {slides.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
