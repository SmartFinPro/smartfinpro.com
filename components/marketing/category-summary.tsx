// components/marketing/category-summary.tsx
// Collapsible category overview section for category listing pages

interface CategorySummaryProps {
  categoryName: string;
  summary: string;
  details?: string;
}

export function CategorySummary({ categoryName, summary, details }: CategorySummaryProps) {
  return (
    <div
      className="enterprise-card-hover overflow-hidden mb-6"
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* 1px Navy accent top */}
      <div style={{ height: '1px', background: 'var(--sfp-navy)' }} />

      <div style={{ padding: '20px 24px' }}>
        {/* Category badge */}
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'var(--sfp-sky)',
            color: 'var(--sfp-navy)',
          }}
        >
          {categoryName}
        </span>

        {/* Summary text (always visible) */}
        <p
          style={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: 1.7,
            color: 'var(--sfp-slate)',
            marginTop: '12px',
            marginBottom: details ? '0' : '0',
          }}
        >
          {summary}
        </p>

        {/* Collapsible details */}
        {details && (
          <details className="category-summary-details" style={{ marginTop: '8px' }}>
            <summary
              className="category-summary-toggle"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--sfp-navy)',
                cursor: 'pointer',
                listStyle: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                userSelect: 'none',
              }}
            >
              <span className="category-summary-more">Read More ▾</span>
              <span className="category-summary-less">Read Less ▴</span>
            </summary>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: 1.7,
                color: 'var(--sfp-slate)',
                marginTop: '8px',
                marginBottom: 0,
              }}
            >
              {details}
            </p>
          </details>
        )}
      </div>
    </div>
  );
}
