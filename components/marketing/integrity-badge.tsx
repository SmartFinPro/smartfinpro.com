// components/marketing/integrity-badge.tsx
// "Certified by SmartFinPro Integrity Engine" SVG badge.
// Server Component — zero client-side dependencies.
//
// Uses CSS variables with hardcoded hex fallbacks for SVG compatibility.
// Gradient bar matches the navy→gold pattern from TrustAuthority/ExpertBox.

interface IntegrityBadgeProps {
  width?: number;
  height?: number;
  className?: string;
}

export function IntegrityBadge({ width = 280, height = 56, className }: IntegrityBadgeProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 280 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Certified by SmartFinPro Integrity Engine"
    >
      {/* Rounded rectangle background */}
      <rect x="0.5" y="0.5" width="279" height="55" rx="12" fill="white" stroke="#E5E7EB" />

      {/* Top accent gradient bar (navy → gold) */}
      <rect x="1" y="1" width="278" height="3" rx="1" fill="url(#sfp-badge-gradient)" />

      {/* Shield icon circle */}
      <circle cx="32" cy="28" r="14" fill="#E8F0FB" />

      {/* Shield icon (ShieldCheck simplified) */}
      <path
        d="M32 18l-8 4v6c0 5.5 3.4 10.6 8 12 4.6-1.4 8-6.5 8-12v-6l-8-4z"
        fill="#1A6B3A"
        opacity="0.15"
      />
      <path
        d="M32 18l-8 4v6c0 5.5 3.4 10.6 8 12 4.6-1.4 8-6.5 8-12v-6l-8-4z"
        stroke="#1A6B3A"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M28 28l3 3 5-5"
        stroke="#1A6B3A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Text: "CERTIFIED BY" */}
      <text
        x="56"
        y="24"
        fontFamily="system-ui, sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="0.08em"
        fill="#1A6B3A"
      >
        CERTIFIED BY
      </text>

      {/* Text: "SmartFinPro Integrity Engine" */}
      <text
        x="56"
        y="40"
        fontFamily="system-ui, sans-serif"
        fontSize="12"
        fontWeight="600"
        fill="#1B4F8C"
      >
        SmartFinPro Integrity Engine
      </text>

      {/* Gradient definition */}
      <defs>
        <linearGradient id="sfp-badge-gradient" x1="0" y1="0" x2="280" y2="0">
          <stop offset="0%" stopColor="#1B4F8C" />
          <stop offset="100%" stopColor="#F5A623" />
        </linearGradient>
      </defs>
    </svg>
  );
}
