'use client';

import { Calendar, Shield, CheckCircle, ExternalLink } from 'lucide-react';

interface ExpertVerifierProps {
  name: string;
  title: string;
  credentials?: string[] | string;
  image?: string;
  bio?: string;
  lastFactChecked?: string;
  factCheckNote?: string;
  linkedInUrl?: string;
  variant?: 'default' | 'compact';
  quote?: string; // MDX-friendly — displayed as factCheckNote
  expertName?: string; // MDX alias for name
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function ExpertVerifier({
  name: nameProp,
  title,
  credentials: credentialsProp,
  image,
  bio,
  lastFactChecked = new Date().toISOString(),
  factCheckNote = 'All data points verified against primary sources',
  linkedInUrl,
  variant = 'default',
  quote,
  expertName,
}: ExpertVerifierProps) {
  const name = nameProp || expertName || 'Expert Reviewer';
  const formattedDate = formatDate(lastFactChecked);
  // MDX-friendly: use quote as factCheckNote if provided
  const displayNote = quote || factCheckNote;
  // Normalize credentials: string → array, undefined → empty array
  const credentials: string[] = Array.isArray(credentialsProp)
    ? credentialsProp
    : credentialsProp
      ? credentialsProp.split(',').map((c) => c.trim())
      : [];

  if (variant === 'compact') {
    return (
      <div className="not-prose my-8">
        <div
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4"
        >
          {/* Avatar */}
          <div className="shrink-0">
            {image ? (
              <img
                src={image}
                alt={name}
                width={40}
                height={40}
                className="rounded-full"
                style={{ border: '2px solid var(--sfp-navy)' }}
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'var(--sfp-sky)', border: '2px solid var(--sfp-navy)' }}
              >
                <Shield className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{name}</span>
              <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{title}</span>
            </div>
          </div>

          {/* Fact-Check Date — Green freshness signal */}
          <div
            className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: 'rgba(26,107,58,0.08)', border: '1px solid rgba(26,107,58,0.2)' }}
          >
            <Calendar className="h-3 w-3" style={{ color: 'var(--sfp-green)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--sfp-green)' }}>Verified {formattedDate}</span>
          </div>
        </div>

        {/* Schema.org Person */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name,
              jobTitle: title,
              ...(linkedInUrl && { sameAs: linkedInUrl }),
            }),
          }}
        />
      </div>
    );
  }

  // Default full variant
  return (
    <div className="not-prose my-10">
      <div
        className="rounded-xl border border-gray-200 bg-white shadow-sm p-8"
      >
        {/* Header Row */}
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            {image ? (
              <img
                src={image}
                alt={name}
                width={72}
                height={72}
                className="rounded-full"
                style={{ border: '3px solid var(--sfp-navy)' }}
              />
            ) : (
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full"
                style={{ background: 'var(--sfp-sky)', border: '3px solid var(--sfp-navy)' }}
              >
                <Shield className="h-9 w-9" style={{ color: 'var(--sfp-navy)' }} />
              </div>
            )}
          </div>

          {/* Expert Info */}
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h4 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>{name}</h4>
              {/* Navy verified badge */}
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)', border: '1px solid rgba(27,79,140,0.2)' }}
              >
                <Shield className="h-3 w-3" />
                Verified Expert
              </span>
              {linkedInUrl && (
                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs transition-colors hover:opacity-70"
                  style={{ color: 'var(--sfp-navy)' }}
                >
                  <ExternalLink className="h-3 w-3" />
                  LinkedIn
                </a>
              )}
            </div>
            <p className="mb-1" style={{ color: 'var(--sfp-slate)' }}>{title}</p>
            {bio && <p className="mb-4 text-sm" style={{ color: 'var(--sfp-slate)' }}>{bio}</p>}
            {!bio && <div className="mb-4" />}

            {/* Credentials */}
            <div className="flex flex-wrap gap-2">
              {credentials.map((cred) => (
                <span
                  key={cred}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs"
                  style={{ color: 'var(--sfp-ink)', background: 'var(--sfp-gray)' }}
                >
                  <CheckCircle className="h-3 w-3" style={{ color: 'var(--sfp-navy)' }} />
                  {cred}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Fact-Check Banner — Green freshness signal */}
        <div
          className="mt-6 flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: 'rgba(26,107,58,0.06)', border: '1px solid rgba(26,107,58,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'rgba(26,107,58,0.12)' }}
            >
              <Calendar className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>Last Fact-Checked</p>
              <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{displayNote}</p>
            </div>
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--sfp-green)' }}>{formattedDate}</div>
        </div>
      </div>

      {/* Schema.org Person */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name,
            jobTitle: title,
            ...(linkedInUrl && { sameAs: linkedInUrl }),
          }),
        }}
      />
    </div>
  );
}
