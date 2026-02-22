// components/ui/last-reviewed.tsx
'use client';

import { Calendar, User } from 'lucide-react';
import type { Author } from '@/lib/authors';

interface LastReviewedProps {
  date: string; // ISO 8601 format: "2026-02-21"
  author: Author;
  showAuthorPhoto?: boolean;
}

export function LastReviewed({ date, author, showAuthorPhoto = false }: LastReviewedProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="flex items-center gap-3 py-3 px-4 rounded-lg border"
      style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
    >
      {showAuthorPhoto && author.photo && (
        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
          <img
            src={author.photo}
            alt={author.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <div className="flex items-center gap-2" style={{ color: 'var(--sfp-navy)' }}>
          <Calendar className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
          <span className="font-medium">Last reviewed:</span>
          <time dateTime={date} itemProp="dateModified">
            {formattedDate}
          </time>
        </div>

        <div className="flex items-center gap-2" style={{ color: 'var(--sfp-navy)' }}>
          <User className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
          <span className="font-medium">by</span>
          <span className="font-semibold">{author.name}</span>
          {author.certifications[0] && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--sfp-gold)', color: 'white' }}
            >
              {author.certifications[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
