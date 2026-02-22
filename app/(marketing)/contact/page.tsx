import { Metadata } from 'next';

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
  { name: 'LinkedIn', href: 'https://linkedin.com/company/smartfinpro' },
  { name: 'YouTube', href: 'https://youtube.com/@smartfinpro' },
  { name: 'Instagram', href: 'https://instagram.com/smartfinpro' },
  { name: 'X', href: 'https://twitter.com/smartfinpro' },
  { name: 'Facebook', href: 'https://facebook.com/smartfinpro' },
];

export default function ContactPage() {
  return (
    <section className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Header */}
      <div className="relative py-20 md:py-28 overflow-hidden">
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
              Contact SmartFinPro
            </h1>
            <p className="text-xl" style={{ color: 'var(--sfp-slate)' }}>
              Have a question or want to work with us? Here is how to get in
              touch.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Email Contacts */}
            <div
              className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12 mb-8"
            >
              <div className="space-y-6">
                {[
                  {
                    label: 'General Inquiries',
                    email: 'support@smartfinpro.com',
                    desc: 'Questions about our content, tools, or anything else.',
                  },
                  {
                    label: 'Editorial',
                    email: 'editorial@smartfinpro.com',
                    desc: 'Corrections, content suggestions, or review requests.',
                  },
                  {
                    label: 'Partnerships & Advertising',
                    email: 'partnerships@smartfinpro.com',
                    desc: 'Business partnerships, sponsorship, or advertising opportunities.',
                  },
                ].map((contact) => (
                  <div
                    key={contact.email}
                    className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white shadow-sm p-6"
                  >
                    <span
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                    >
                      {contact.label.charAt(0)}
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>
                        {contact.label}
                      </h2>
                      <a
                        href={`mailto:${contact.email}`}
                        className="hover:opacity-80 transition-opacity font-medium"
                        style={{ color: 'var(--sfp-navy)' }}
                      >
                        {contact.email}
                      </a>
                      <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                        {contact.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Response Time */}
              <div
                className="rounded-xl border border-green-200 p-5 mt-8"
                style={{ background: 'rgba(26,107,58,0.04)' }}
              >
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                  <strong style={{ color: 'var(--sfp-green)' }}>Response time:</strong>{' '}
                  We typically respond within 1-2 business days. For urgent
                  matters, please include &quot;Urgent&quot; in your subject
                  line.
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div
              className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 md:p-12"
            >
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
                Follow Us
              </h2>
              <p className="mb-6 leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                Stay up to date with the latest reviews, market analysis, and
                financial product updates.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white shadow-sm p-4 hover:border-gray-300 hover:shadow-md transition-all"
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
