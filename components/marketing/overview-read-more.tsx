'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface OverviewReadMoreProps {
  text: string;
  previewLength?: number;
}

function parseBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
}

export function OverviewReadMore({ text, previewLength = 300 }: OverviewReadMoreProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > previewLength;
  const displayText = expanded || !needsTruncation ? text : text.slice(0, previewLength);

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="relative">
        <p
          className="text-lg text-slate-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: parseBold(displayText) + (!expanded && needsTruncation ? '...' : '') }}
        />
        {/* Gradient fade when collapsed */}
        {!expanded && needsTruncation && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[rgba(255,255,255,0.03)] to-transparent pointer-events-none" />
        )}
      </div>
      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
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
