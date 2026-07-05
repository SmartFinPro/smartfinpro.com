// components/marketing/check-icon.tsx
// Flat filled-circle checkmark for comparison/cockpit pages — a single compound
// SVG path (circle + check cut out via fill-rule="evenodd") instead of a plain
// stroke glyph, so it reads as a clean, designed icon rather than a raw lucide tick.

interface CheckCircleIconProps {
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

export function CheckCircleIcon({ size = 16, className, color = 'var(--sfp-green)', style, 'aria-label': ariaLabel }: CheckCircleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      style={style}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      role={ariaLabel ? 'img' : undefined}
    >
      <path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0m4.442 3.95a.5.5 0 0 0-.706.017L6.264 9.698 4.396 7.741l-.017-.016a.5.5 0 0 0-.707.016l-.338.354a.5.5 0 0 0 0 .69l2.416 2.53.153.161.016.017a.5.5 0 0 0 .707-.017l6.171-6.464a.5.5 0 0 0 0-.69l-.338-.355z"
      />
    </svg>
  );
}
