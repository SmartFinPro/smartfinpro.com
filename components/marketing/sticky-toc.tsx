'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  label: string;
}

interface StickyTableOfContentsProps {
  items: TocItem[];
  offset?: number;
}

export function StickyTableOfContents({
  items,
  offset = 80,
}: StickyTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Track which section is currently visible
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible section (topmost in viewport)
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: `-${offset + 60}px 0px -60% 0px`,
        threshold: 0,
      },
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items, offset]);

  // Detect when the TOC should become sticky
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - offset - 20;
      window.scrollTo({ top: y, behavior: 'smooth' });
    },
    [offset],
  );

  if (items.length === 0) return null;

  return (
    <>
      {/* Sentinel element to detect sticky trigger point */}
      <div ref={sentinelRef} className="h-0" />

      <div
        ref={containerRef}
        className={`not-prose z-30 transition-all duration-300 ${
          isSticky
            ? 'sticky top-[64px] border-b border-gray-200 shadow-sm'
            : 'border-b border-gray-200'
        }`}
        style={{
          background: isSticky ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.8)',
        }}
      >
        <nav className="container mx-auto flex items-center gap-1 overflow-x-auto px-4 py-0 scrollbar-hide">
          {/* Icon */}
          <div className="mr-2 flex shrink-0 items-center">
            <List className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
          </div>

          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`relative shrink-0 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? ''
                    : 'hover:opacity-70'
                }`}
                style={{ color: isActive ? 'var(--sfp-navy)' : 'var(--sfp-slate)' }}
              >
                {item.label}
                {/* Active indicator line */}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ background: 'var(--sfp-navy)' }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
