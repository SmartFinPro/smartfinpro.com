'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Building2,
  Users,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  Hash,
  BarChart3,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { OverviewContentItem } from '@/lib/data/overview-content';

interface OverviewTabsProps {
  content: OverviewContentItem;
  categoryName: string;
  categoryHref: string;
}

function parseBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--sfp-ink)">$1</strong>');
}

function MetadataBar({ content }: { content: OverviewContentItem }) {
  const sectionCount = content.sections.length;
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 mb-6 flex flex-wrap items-center gap-4 md:gap-6 text-sm" style={{ color: 'var(--sfp-slate)' }}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
        <span>Published: Feb. 2026</span>
      </div>
      <div className="hidden md:block w-px h-5 bg-gray-200" />
      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
        <span>Report ID: SFP-2026</span>
      </div>
      <div className="hidden md:block w-px h-5 bg-gray-200" />
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
        <span>Sections: {sectionCount + 3}</span>
      </div>
      <div className="hidden md:block w-px h-5 bg-gray-200" />
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
        <span>Format: Report</span>
      </div>
    </div>
  );
}

function QuickNavigation({ content }: { content: OverviewContentItem }) {
  const [open, setOpen] = useState(true);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const navItems = [
    { id: 'key-highlights', label: 'Key Highlights' },
    ...content.sections.map((s, i) => ({ id: `section-${i}`, label: s.title })),
    { id: 'market-segments', label: 'Market Segments' },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-semibold"
        style={{ color: 'var(--sfp-ink)' }}
      >
        <span className="uppercase tracking-wider text-xs" style={{ color: 'var(--sfp-slate)' }}>Quick Navigation</span>
        {open ? (
          <ChevronUp className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
        ) : (
          <ChevronDown className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
        )}
      </button>
      {open && (
        <nav className="mt-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="block w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors hover:bg-gray-50"
              style={{ color: 'var(--sfp-slate)' }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function OverviewTabContent({ content }: { content: OverviewContentItem }) {
  return (
    <div className="space-y-10">
      <QuickNavigation content={content} />

      {/* Key Highlights */}
      <div id="key-highlights" className="scroll-mt-24">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 md:p-8 border-l-4" style={{ borderLeftColor: 'var(--sfp-navy)' }}>
          <h3 className="text-xl font-bold mb-5 flex items-center gap-3" style={{ color: 'var(--sfp-ink)' }}>
            <CheckCircle className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
            Key Market Highlights
          </h3>
          <ul className="space-y-3">
            {content.keyHighlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 text-white" style={{ background: 'var(--sfp-navy)' }}>
                  {idx + 1}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sections */}
      {content.sections.map((section, idx) => (
        <div key={idx} id={`section-${idx}`} className="scroll-mt-24">
          <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>{section.title}</h3>
          <div className="prose prose-sm max-w-none">
            {section.content.split('\n\n').map((paragraph, pIdx) => (
              <p key={pIdx} className="leading-relaxed" style={{ color: 'var(--sfp-slate)' }} dangerouslySetInnerHTML={{ __html: parseBold(paragraph) }} />
            ))}
          </div>
          {section.bullets && (
            <ul className="mt-5 space-y-2.5">
              {section.bullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex items-start gap-3 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                  <span dangerouslySetInnerHTML={{ __html: parseBold(bullet) }} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {/* Market Segments */}
      <div id="market-segments" className="scroll-mt-24">
        <h3 className="text-xl md:text-2xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>Market Segments</h3>
        <div className="space-y-3">
          {content.segments.map((segment, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm" style={{ color: 'var(--sfp-ink)' }}>{segment.name}</h4>
                <span className="text-lg font-bold" style={{ color: 'var(--sfp-navy)' }}>{segment.share}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${segment.share}%`, background: 'linear-gradient(90deg, var(--sfp-navy), var(--sfp-gold))' }}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{segment.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BenefitsTabContent({ content }: { content: OverviewContentItem }) {
  return (
    <div className="space-y-10">
      {/* Business Benefits */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200" style={{ background: 'var(--sfp-sky)' }}>
            <Building2 className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>{content.businessBenefits.title}</h3>
          </div>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--sfp-slate)' }}>{content.businessBenefits.intro}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {content.businessBenefits.items.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h4 className="font-semibold mb-2 text-sm" style={{ color: 'var(--sfp-ink)' }}>{item.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Benefits */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200" style={{ background: 'var(--sfp-sky)' }}>
            <Users className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>{content.personalBenefits.title}</h3>
          </div>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--sfp-slate)' }}>{content.personalBenefits.intro}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {content.personalBenefits.items.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h4 className="font-semibold mb-2 text-sm" style={{ color: 'var(--sfp-ink)' }}>{item.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpertTabContent({ content, categoryName, categoryHref }: { content: OverviewContentItem; categoryName: string; categoryHref: string }) {
  return (
    <div className="space-y-8">
      {/* SmartFinPro Role */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 md:p-8" style={{ background: 'var(--sfp-sky)' }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>{content.smartfinproRole.title}</h3>
        <div className="prose prose-sm max-w-none">
          {content.smartfinproRole.content.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Closing CTA */}
      <div className="text-center py-6">
        <p className="mb-6" style={{ color: 'var(--sfp-slate)' }}>{content.closingCta}</p>
        <Button asChild size="lg" className="border-0 text-white shadow-lg" style={{ background: 'var(--sfp-gold)', color: '#ffffff', borderRadius: '1rem' }}>
          <Link href={categoryHref}>
            Explore {categoryName} Tools
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ReportTabContent({ categoryName, categoryHref }: { categoryName: string; categoryHref: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12 text-center" style={{ background: 'var(--sfp-sky)' }}>
      <div className="max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white" style={{ background: 'var(--sfp-navy)' }}>
          <BarChart3 className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--sfp-ink)' }}>Get the Full Analysis</h3>
        <p className="mb-8" style={{ color: 'var(--sfp-slate)' }}>
          Access our comprehensive {categoryName.toLowerCase()} reviews, comparisons, and expert recommendations. Find the best tools for your specific needs.
        </p>
        <Button asChild size="lg" className="border-0 shadow-lg text-white" style={{ background: 'var(--sfp-gold)', color: '#ffffff', borderRadius: '1rem' }}>
          <Link href={categoryHref}>
            Browse All {categoryName}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function OverviewTabs({ content, categoryName, categoryHref }: OverviewTabsProps) {
  return (
    <div>
      <MetadataBar content={content} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList
          variant="line"
          className="w-full justify-start border-b border-gray-200 bg-transparent gap-0 overflow-x-auto flex-nowrap"
        >
          <TabsTrigger
            value="overview"
            className="px-4 py-2.5 whitespace-nowrap"
            style={{ color: 'var(--sfp-slate)' }}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="benefits"
            className="px-4 py-2.5 whitespace-nowrap"
            style={{ color: 'var(--sfp-slate)' }}
          >
            Benefits & Analysis
          </TabsTrigger>
          <TabsTrigger
            value="expert"
            className="px-4 py-2.5 whitespace-nowrap"
            style={{ color: 'var(--sfp-slate)' }}
          >
            Expert Analysis
          </TabsTrigger>
          <TabsTrigger
            value="report"
            className="rounded-2xl border border-gray-200 px-4 py-2 ml-2 whitespace-nowrap text-white"
            style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
          >
            Get Full Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-8 data-[state=inactive]:hidden" forceMount>
          <OverviewTabContent content={content} />
        </TabsContent>

        <TabsContent value="benefits" className="mt-8 data-[state=inactive]:hidden" forceMount>
          <BenefitsTabContent content={content} />
        </TabsContent>

        <TabsContent value="expert" className="mt-8 data-[state=inactive]:hidden" forceMount>
          <ExpertTabContent content={content} categoryName={categoryName} categoryHref={categoryHref} />
        </TabsContent>

        <TabsContent value="report" className="mt-8 data-[state=inactive]:hidden" forceMount>
          <ReportTabContent categoryName={categoryName} categoryHref={categoryHref} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
