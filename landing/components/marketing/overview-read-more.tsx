'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface OverviewReadMoreProps {
  text: string;
  previewLength?: number;
}

function parseBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--sfp-ink)">$1</strong>');
}

export function OverviewReadMore({ text, previewLength = 300 }: OverviewReadMoreProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > previewLength;
  const displayText = expanded || !needsTruncation ? text : text.slice(0, previewLength);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 md:p-8">
      <div className="relative">
        <p
          className="text-lg leading-relaxed"
          style={{ color: 'var(--sfp-slate)' }}
          dangerouslySetInnerHTML={{ __html: parseBold(displayText) + (!expanded && needsTruncation ? '...' : '') }}
        />
        {/* Gradient fade when collapsed */}
        {!expanded && needsTruncation && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--sfp-navy)' }}
        >
          {expanded ? (
            <>
              Read Less <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Read More <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
