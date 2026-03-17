/**
 * Inline SVG icons for the Header component.
 * These 5 icons render on EVERY page load, so we inline them
 * to avoid pulling in the full lucide-react icon library
 * during the critical render path.
 *
 * Each icon matches the lucide-react API: className prop + default 24×24 viewBox.
 */

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Hamburger menu icon (≡) */
export function MenuIcon({ className, style }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

/** Close (×) icon */
export function XIcon({ className, style }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/** Chevron down (˅) icon */
export function ChevronDownIcon({ className, style }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Arrow right (→) icon */
export function ArrowRightIcon({ className, style }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/** Star (★) icon */
export function StarIcon({ className, style }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a.53.53 0 0 0 .399.29l5.164.752a.53.53 0 0 1 .294.904l-3.736 3.642a.53.53 0 0 0-.153.469l.882 5.14a.53.53 0 0 1-.77.56l-4.618-2.428a.53.53 0 0 0-.494 0l-4.618 2.428a.53.53 0 0 1-.77-.56l.882-5.14a.53.53 0 0 0-.153-.47L3.358 8.92a.53.53 0 0 1 .294-.905l5.164-.752a.53.53 0 0 0 .399-.29z" />
    </svg>
  );
}
