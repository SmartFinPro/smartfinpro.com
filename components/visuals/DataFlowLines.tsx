'use client';

interface DataFlowLinesProps {
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'diagonal';
  color?: 'cyan' | 'violet' | 'mixed';
  intensity?: 'subtle' | 'medium' | 'strong';
}

export function DataFlowLines({
  className = '',
  variant = 'horizontal',
  color = 'mixed',
  intensity = 'medium',
}: DataFlowLinesProps) {
  const opacityMap = {
    subtle: { line: 0.15, glow: 0.1, node: 0.2 },
    medium: { line: 0.3, glow: 0.2, node: 0.4 },
    strong: { line: 0.5, glow: 0.35, node: 0.6 },
  };

  const colorMap = {
    cyan: { primary: '#06b6d4', secondary: '#22d3ee' },
    violet: { primary: '#8b5cf6', secondary: '#a855f7' },
    mixed: { primary: '#06b6d4', secondary: '#8b5cf6' },
  };

  const opacity = opacityMap[intensity];
  const colors = colorMap[color];

  const getPath = () => {
    switch (variant) {
      case 'vertical':
        return 'M 50 0 Q 50 50 60 100 T 50 200 T 55 300 T 50 400';
      case 'diagonal':
        return 'M 0 0 Q 50 50 100 80 T 200 160 T 300 200 T 400 280';
      default:
        return 'M 0 50 Q 50 30 100 50 T 200 40 T 300 55 T 400 45';
    }
  };

  const viewBox = variant === 'vertical' ? '0 0 100 400' : '0 0 400 100';

  return (
    <div className={`pointer-events-none ${className}`}>
      <svg
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id={`flowGrad-${variant}-${color}`}
            x1={variant === 'vertical' ? '0%' : '0%'}
            y1={variant === 'vertical' ? '0%' : '50%'}
            x2={variant === 'vertical' ? '0%' : '100%'}
            y2={variant === 'vertical' ? '100%' : '50%'}
          >
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0" />
            <stop offset="30%" stopColor={colors.primary} stopOpacity={opacity.line} />
            <stop offset="70%" stopColor={colors.secondary} stopOpacity={opacity.line} />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </linearGradient>

          <filter id={`flowGlow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main flow line */}
        <path
          d={getPath()}
          stroke={`url(#flowGrad-${variant}-${color})`}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          filter={`url(#flowGlow-${variant})`}
        />

        {/* Secondary flow line */}
        <path
          d={getPath()}
          stroke={`url(#flowGrad-${variant}-${color})`}
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          strokeOpacity="0.5"
          transform={variant === 'vertical' ? 'translate(15, 20)' : 'translate(0, 15)'}
        />

        {/* Animated nodes */}
        {variant === 'horizontal' && (
          <>
            <circle cx="100" cy="50" r="3" fill={colors.primary} opacity={opacity.node}>
              <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="250" cy="45" r="2.5" fill={colors.secondary} opacity={opacity.node}>
              <animate attributeName="r" values="2.5;3.5;2.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {variant === 'vertical' && (
          <>
            <circle cx="55" cy="100" r="3" fill={colors.primary} opacity={opacity.node}>
              <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="52" cy="250" r="2.5" fill={colors.secondary} opacity={opacity.node}>
              <animate attributeName="r" values="2.5;3.5;2.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {variant === 'diagonal' && (
          <>
            <circle cx="100" cy="80" r="3" fill={colors.primary} opacity={opacity.node}>
              <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="280" cy="190" r="2.5" fill={colors.secondary} opacity={opacity.node}>
              <animate attributeName="r" values="2.5;3.5;2.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>
    </div>
  );
}
