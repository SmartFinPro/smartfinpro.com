// components/ui/author-profile.tsx
'use client';

import Image from 'next/image';
import { Linkedin, Award, FileText, CheckCircle } from 'lucide-react';
import type { Author } from '@/lib/authors';

interface AuthorProfileProps {
  author: Author;
  compact?: boolean;
  showBio?: boolean;
}

export function AuthorProfile({ author, compact = false, showBio = true }: AuthorProfileProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--sfp-navy)' }}>
          <Image
            src={author.photo}
            alt={author.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--sfp-ink)' }}>
            {author.name}
          </div>
          <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
            {author.title}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      itemScope
      itemType="https://schema.org/Person"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Photo */}
        <div className="shrink-0">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden border-3"
            style={{ borderColor: 'var(--sfp-navy)', borderWidth: '3px' }}
          >
            <Image
              src={author.photo}
              alt={author.name}
              fill
              className="object-cover"
              itemProp="image"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--sfp-navy)' }} itemProp="name">
            {author.name}
          </h3>

          <p className="text-sm mb-3" style={{ color: 'var(--sfp-slate)' }} itemProp="jobTitle">
            {author.title}
          </p>

          {/* Credentials */}
          <div className="flex flex-wrap gap-2 mb-4">
            {author.certifications.map((cert) => (
              <span
                key={cert}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
              >
                <Award className="h-3 w-3" />
                {cert}
              </span>
            ))}
          </div>

          {/* Bio */}
          {showBio && author.bio && (
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-ink)' }} itemProp="description">
              {author.bio}
            </p>
          )}

          {/* Stats & Links */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
              <FileText className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
              <span>{author.reviewCount}+ reviews</span>
            </div>

            <div className="flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
              <CheckCircle className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
              <span>{author.yearsExperience} years experience</span>
            </div>

            {author.linkedin && (
              <a
                href={author.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                style={{ color: 'var(--sfp-navy)' }}
                itemProp="sameAs"
              >
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn</span>
              </a>
            )}

            {author.registrationNumber && (
              <div className="flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                <span className="text-xs">
                  {author.regulatorType}: {author.registrationNumber}
                </span>
              </div>
            )}
          </div>

          {/* Schema.org sameAs links */}
          <meta itemProp="url" content={`https://smartfinpro.com/authors/${author.slug}`} />
          {author.linkedin && <link itemProp="sameAs" href={author.linkedin} />}
        </div>
      </div>
    </div>
  );
}
