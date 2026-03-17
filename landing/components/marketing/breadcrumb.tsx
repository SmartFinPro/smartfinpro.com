import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  // Build Schema.org BreadcrumbList
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `https://smartfinpro.com${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <nav className="flex items-center gap-2 text-sm mb-8" style={{ color: 'var(--sfp-slate)' }} aria-label="Breadcrumb">
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:opacity-70" style={{ color: 'var(--sfp-navy)' }}>
                {item.label}
              </Link>
            ) : (
              <span style={{ color: 'var(--sfp-ink)' }}>{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
