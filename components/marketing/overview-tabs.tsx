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
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
}

function MetadataBar({ content }: { content: OverviewContentItem }) {
  const sectionCount = content.sections.length;
  return (
    <div className="glass-card rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4 md:gap-6 text-sm text-slate-400">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-cyan-400" />
        <span>Published: Feb. 2026</span>
      </div>
      <div className="hidden md:block w-px h-5 bg-slate-700" />
      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4 text-cyan-400" />
        <span>Report ID: SFP-2026</span>
      </div>
      <div className="hidden md:block w-px h-5 bg-slate-700" />
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-cyan-400" />
        <span>Sections: {sectionCount + 3}</span>
      </div>
      <div className="hidden md:block w-px h-5 bg-slate-700" />
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-cyan-400" />
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
    <div className="glass-card rounded-xl p-5 mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-semibold text-slate-300"
      >
        <span className="uppercase tracking-wider text-xs text-slate-500">Quick Navigation</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>
      {open && (
        <nav className="mt-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="block w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors"
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
        <div className="glass-card rounded-2xl p-6 md:p-8 border-l-4 border-cyan-400">
          <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-cyan-400" />
            Key Market Highlights
          </h3>
          <ul className="space-y-3">
            {content.keyHighlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-sm text-slate-300 leading-relaxed">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sections */}
      {content.sections.map((section, idx) => (
        <div key={idx} id={`section-${idx}`} className="scroll-mt-24">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-4">{section.title}</h3>
          <div className="prose prose-sm prose-invert max-w-none prose-p:text-slate-300 prose-strong:text-white prose-headings:text-white">
            {section.content.split('\n\n').map((paragraph, pIdx) => (
              <p key={pIdx} dangerouslySetInnerHTML={{ __html: parseBold(paragraph) }} />
            ))}
          </div>
          {section.bullets && (
            <ul className="mt-5 space-y-2.5">
              {section.bullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: parseBold(bullet) }} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {/* Market Segments */}
      <div id="market-segments" className="scroll-mt-24">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-6">Market Segments</h3>
        <div className="space-y-3">
          {content.segments.map((segment, idx) => (
            <div key={idx} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white text-sm">{segment.name}</h4>
                <span className="text-lg font-bold text-cyan-400">{segment.share}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${segment.share}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">{segment.description}</p>
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
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{content.businessBenefits.title}</h3>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-5">{content.businessBenefits.intro}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {content.businessBenefits.items.map((item, idx) => (
            <div key={idx} className="glass-card rounded-xl p-5">
              <h4 className="font-semibold text-white mb-2 text-sm">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Benefits */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{content.personalBenefits.title}</h3>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-5">{content.personalBenefits.intro}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {content.personalBenefits.items.map((item, idx) => (
            <div key={idx} className="glass-card rounded-xl p-5">
              <h4 className="font-semibold text-white mb-2 text-sm">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
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
      <div className="glass-card rounded-2xl p-6 md:p-8 border border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-violet-500/5">
        <h3 className="text-xl font-bold text-white mb-4">{content.smartfinproRole.title}</h3>
        <div className="prose prose-sm prose-invert max-w-none prose-p:text-slate-300">
          {content.smartfinproRole.content.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Closing CTA */}
      <div className="text-center py-6">
        <p className="text-slate-300 mb-6">{content.closingCta}</p>
        <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 border-0">
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
    <div className="glass-card rounded-2xl p-8 md:p-12 text-center border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-cyan-500/10">
      <div className="max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Get the Full Analysis</h3>
        <p className="text-slate-400 mb-8">
          Access our comprehensive {categoryName.toLowerCase()} reviews, comparisons, and expert recommendations. Find the best tools for your specific needs.
        </p>
        <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 border-0 shadow-lg shadow-violet-500/25">
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
          className="w-full justify-start border-b border-slate-700/50 bg-transparent gap-0 overflow-x-auto flex-nowrap"
        >
          <TabsTrigger
            value="overview"
            className="text-slate-400 data-[state=active]:text-cyan-400 after:bg-cyan-400 px-4 py-2.5 whitespace-nowrap"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="benefits"
            className="text-slate-400 data-[state=active]:text-cyan-400 after:bg-cyan-400 px-4 py-2.5 whitespace-nowrap"
          >
            Benefits & Analysis
          </TabsTrigger>
          <TabsTrigger
            value="expert"
            className="text-slate-400 data-[state=active]:text-cyan-400 after:bg-cyan-400 px-4 py-2.5 whitespace-nowrap"
          >
            Expert Analysis
          </TabsTrigger>
          <TabsTrigger
            value="report"
            className="bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-violet-500 rounded-lg border-0 after:hidden px-4 py-2 ml-2 whitespace-nowrap"
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
