'use client';

// components/marketing/contact-form.tsx
// Contact form — submits to /api/contact, never exposes internal email addresses

import { useState, useRef } from 'react';

type Department = 'general' | 'editorial' | 'partnerships';

const DEPARTMENTS: { value: Department; label: string; desc: string }[] = [
  {
    value: 'general',
    label: 'General Inquiries',
    desc: 'Questions about our content, tools, or anything else.',
  },
  {
    value: 'editorial',
    label: 'Editorial',
    desc: 'Corrections, content suggestions, or review requests.',
  },
  {
    value: 'partnerships',
    label: 'Partnerships & Advertising',
    desc: 'Business partnerships, sponsorship, or advertising opportunities.',
  },
];

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export function ContactForm() {
  const [department, setDepartment] = useState<Department>('general');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState('submitting');
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const payload = {
      name:       formData.get('name') as string,
      email:      formData.get('email') as string,
      department,
      message:    formData.get('message') as string,
    };

    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setFormState('error');
        return;
      }

      setFormState('success');
      formRef.current?.reset();
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setFormState('error');
    }
  }

  if (formState === 'success') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12">
        <div className="text-center py-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(26,107,58,0.08)' }}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--sfp-green)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--sfp-ink)' }}>
            Message Sent!
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--sfp-slate)' }}>
            Thank you for reaching out. We&apos;ve received your message and will respond within <strong>1–2 business days</strong>.
            A confirmation has been sent to your email.
          </p>
          <button
            onClick={() => setFormState('idle')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors"
            style={{ color: 'var(--sfp-ink)' }}
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Gradient top bar */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

      <div className="p-8 md:p-12">
        {/* Department selector */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--sfp-slate)' }}>
            Select Topic
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {DEPARTMENTS.map((dept) => {
              const isActive = department === dept.value;
              return (
                <button
                  key={dept.value}
                  type="button"
                  onClick={() => setDepartment(dept.value)}
                  className="text-left rounded-xl border p-4 transition-all"
                  style={{
                    borderColor: isActive ? 'var(--sfp-navy)' : '#E5E7EB',
                    backgroundColor: isActive ? 'var(--sfp-sky)' : '#fff',
                  }}
                >
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs mb-2"
                    style={{
                      backgroundColor: isActive ? 'var(--sfp-navy)' : '#F2F4F8',
                      color: isActive ? '#fff' : 'var(--sfp-slate)',
                    }}
                  >
                    {dept.label.charAt(0)}
                  </span>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>
                    {dept.label}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                    {dept.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--sfp-ink)' }}>
                Your Name <span style={{ color: 'var(--sfp-red)' }}>*</span>
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Jane Smith"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--sfp-navy)] focus:ring-2 focus:ring-[var(--sfp-navy)]/10"
                style={{ color: 'var(--sfp-ink)' }}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--sfp-ink)' }}>
                Your Email <span style={{ color: 'var(--sfp-red)' }}>*</span>
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="jane@company.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--sfp-navy)] focus:ring-2 focus:ring-[var(--sfp-navy)]/10"
                style={{ color: 'var(--sfp-ink)' }}
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--sfp-ink)' }}>
              Message <span style={{ color: 'var(--sfp-red)' }}>*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={6}
              placeholder="Tell us how we can help..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--sfp-navy)] focus:ring-2 focus:ring-[var(--sfp-navy)]/10 resize-none"
              style={{ color: 'var(--sfp-ink)' }}
            />
          </div>

          {/* Error message */}
          {formState === 'error' && (
            <div className="rounded-xl border border-red-200 px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(214,64,69,0.05)', color: 'var(--sfp-red)' }}>
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
              We respond within 1–2 business days. Your email is never shared.
            </p>
            <button
              type="submit"
              disabled={formState === 'submitting'}
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--sfp-navy)' }}
            >
              {formState === 'submitting' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  Send Message
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
