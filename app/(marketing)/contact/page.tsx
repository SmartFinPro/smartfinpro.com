// app/(marketing)/contact/page.tsx
// Contact page — NO email addresses in frontend HTML
// Form submissions are handled server-side via /api/contact

import { Metadata } from 'next';
import { ContactForm } from '@/components/marketing/contact-form';

export const metadata: Metadata = {
  title: 'Contact SmartFinPro | Get in Touch',
  description:
    'Reach the SmartFinPro team for general inquiries, editorial questions, or partnership opportunities. We typically respond within 1-2 business days.',
  openGraph: {
    title: 'Contact SmartFinPro | Get in Touch',
    description:
      'Reach the SmartFinPro team for inquiries, editorial questions, or partnerships.',
  },
};

const socialLinks = [
  { name: 'LinkedIn',  href: 'https://linkedin.com/company/smartfinpro' },
  { name: 'YouTube',   href: 'https://youtube.com/@smartfinpro' },
  { name: 'Instagram', href: 'https://instagram.com/smartfinpro' },
  { name: 'X',         href: 'https://twitter.com/smartfinpro' },
  { name: 'Facebook',  href: 'https://facebook.com/smartfinpro' },
];

export default function ContactPage() {
  return (
    <section className="min-h-screen" style={{ backgroundColor: 'var(--sfp-gray)' }}>
      {/* Header */}
      <div className="relative py-20 md:py-28 overflow-hidden">
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Contact SmartFinPro
            </h1>
            <p className="text-xl" style={{ color: 'var(--sfp-slate)' }}>
              Have a question or want to work with us? Send us a message and we&apos;ll get back to you.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Contact Form — email addresses hidden server-side */}
            <ContactForm />

            {/* Social Links */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12">
              <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--sfp-ink)' }}>
                Follow Us
              </h2>
              <p className="mb-6 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                Stay up to date with the latest reviews, market analysis, and financial product updates.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-md transition-all"
                    style={{ color: 'var(--sfp-ink)' }}
                  >
                    <span className="font-medium text-sm">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
