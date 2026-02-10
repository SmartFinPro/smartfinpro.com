'use client';

interface MeshBackgroundProps {
  className?: string;
  variant?: 'default' | 'intense' | 'subtle';
  animated?: boolean;
}

export function MeshBackground({
  className = '',
  variant = 'default',
  animated = true,
}: MeshBackgroundProps) {
  const opacityScale = {
    subtle: 0.5,
    default: 1,
    intense: 1.5,
  };

  const scale = opacityScale[variant];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Mesh Gradient 1 - Violet */}
          <radialGradient id="meshBg1" cx="20%" cy="20%" r="50%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3 * scale} />
            <stop offset="50%" stopColor="#6366f1" stopOpacity={0.15 * scale} />
            <stop offset="100%" stopColor="#0f0a1a" stopOpacity="0" />
          </radialGradient>

          {/* Mesh Gradient 2 - Cyan */}
          <radialGradient id="meshBg2" cx="80%" cy="50%" r="45%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25 * scale} />
            <stop offset="50%" stopColor="#0891b2" stopOpacity={0.1 * scale} />
            <stop offset="100%" stopColor="#0f0a1a" stopOpacity="0" />
          </radialGradient>

          {/* Mesh Gradient 3 - Purple */}
          <radialGradient id="meshBg3" cx="50%" cy="80%" r="40%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.2 * scale} />
            <stop offset="100%" stopColor="#0f0a1a" stopOpacity="0" />
          </radialGradient>

          {/* Mesh Gradient 4 - Blue accent */}
          <radialGradient id="meshBg4" cx="10%" cy="70%" r="35%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15 * scale} />
            <stop offset="100%" stopColor="#0f0a1a" stopOpacity="0" />
          </radialGradient>

          {/* Dot Pattern */}
          <pattern id="meshDots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="white" fillOpacity="0.04" />
          </pattern>

          {/* Fine Grid */}
          <pattern id="meshGrid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeOpacity="0.02" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Pattern layers */}
        <rect width="100%" height="100%" fill="url(#meshDots)" />
        <rect width="100%" height="100%" fill="url(#meshGrid)" />

        {/* Animated mesh blobs */}
        <ellipse cx="240" cy="160" rx="400" ry="320" fill="url(#meshBg1)">
          {animated && (
            <>
              <animate attributeName="cx" values="240;300;240" dur="20s" repeatCount="indefinite" />
              <animate attributeName="cy" values="160;200;160" dur="25s" repeatCount="indefinite" />
            </>
          )}
        </ellipse>

        <ellipse cx="960" cy="400" rx="350" ry="280" fill="url(#meshBg2)">
          {animated && (
            <>
              <animate attributeName="cx" values="960;900;960" dur="22s" repeatCount="indefinite" />
              <animate attributeName="cy" values="400;350;400" dur="18s" repeatCount="indefinite" />
            </>
          )}
        </ellipse>

        <ellipse cx="600" cy="640" rx="300" ry="240" fill="url(#meshBg3)">
          {animated && (
            <animate attributeName="rx" values="300;360;300" dur="15s" repeatCount="indefinite" />
          )}
        </ellipse>

        <ellipse cx="120" cy="560" rx="250" ry="200" fill="url(#meshBg4)">
          {animated && (
            <>
              <animate attributeName="cx" values="120;160;120" dur="18s" repeatCount="indefinite" />
              <animate attributeName="ry" values="200;240;200" dur="12s" repeatCount="indefinite" />
            </>
          )}
        </ellipse>

        {/* Subtle horizontal lines */}
        <g stroke="white" strokeOpacity="0.015" strokeWidth="1">
          <line x1="0" y1="200" x2="1200" y2="200" />
          <line x1="0" y1="400" x2="1200" y2="400" />
          <line x1="0" y1="600" x2="1200" y2="600" />
        </g>
      </svg>
    </div>
  );
}
