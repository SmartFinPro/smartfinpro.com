// components/marketing/home-newsletter-form.tsx
// Landing page "Get Notified at Launch" section with email form.
// Uses client-safe subscribeWithEmail (via /api/subscribe proxy).
'use client';

import { useState } from 'react';
import { subscribeWithEmail } from '@/lib/newsletter-client';

export default function HomeNewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');
    const result = await subscribeWithEmail(email, undefined, 'homepage-cta');

    if (result.success) {
      setStatus('success');
      setMessage(result.message || 'You\'re on the list!');
      setEmail('');
    } else {
      setStatus('error');
      setMessage(result.message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <section
      style={{
        background: 'var(--sfp-gray)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '96px 40px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 'clamp(24px, 3vw, 32px)',
            fontWeight: 800,
            color: 'var(--sfp-ink)',
            letterSpacing: '-0.5px',
            marginBottom: '12px',
            lineHeight: 1.2,
          }}
        >
          Get Notified at Launch
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--sfp-slate)',
            marginBottom: '36px',
            lineHeight: 1.7,
          }}
        >
          Join 2,400+ finance professionals. Be the first to access our research reports and tools.
        </p>

        {status === 'success' ? (
          <div
            style={{
              background: 'rgba(26, 107, 58, 0.08)',
              border: '1px solid rgba(26, 107, 58, 0.2)',
              borderRadius: '8px',
              padding: '16px 20px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--sfp-green)',
            }}
          >
            {message}
          </div>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                gap: '8px',
                maxWidth: '420px',
                margin: '0 auto',
              }}
              className="newsletter-form-responsive"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                required
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--sfp-ink)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--sfp-navy)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  padding: '14px 28px',
                  background: status === 'loading' ? 'var(--sfp-gold-dark)' : 'var(--sfp-gold)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  transition: 'all 0.25s',
                }}
              >
                {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>

            {status === 'error' && (
              <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--sfp-red)' }}>
                {message}
              </p>
            )}

            <p style={{ marginTop: '14px', fontSize: '12px', color: 'var(--sfp-slate)' }}>
              No spam. Unsubscribe anytime. Free forever.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
