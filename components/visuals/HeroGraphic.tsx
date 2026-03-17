'use client';

import { useEffect, useRef } from 'react';

interface HeroGraphicProps {
  className?: string;
  variant?: 'default' | 'trading' | 'security' | 'ai';
}

export function HeroGraphic({ className = '', variant = 'default' }: HeroGraphicProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    // Animate the data flow path
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      pathRef.current.style.strokeDasharray = `${length}`;
      pathRef.current.style.strokeDashoffset = `${length}`;
    }
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <svg
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Mesh Gradient Definitions */}
          <radialGradient id="meshGradient1" cx="30%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="meshGradient2" cx="70%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#0891b2" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="meshGradient3" cx="50%" cy="80%" r="40%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          {/* Line Gradient */}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="20%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="80%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="lineGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
            <stop offset="30%" stopColor="#a855f7" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>

          {/* Glow Filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dot Pattern */}
          <pattern id="dotPattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="white" fillOpacity="0.08" />
          </pattern>

          {/* Grid Pattern */}
          <pattern id="gridPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeOpacity="0.03" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Background Patterns */}
        <rect width="100%" height="100%" fill="url(#dotPattern)" />
        <rect width="100%" height="100%" fill="url(#gridPattern)" />

        {/* Mesh Gradient Blobs */}
        <ellipse cx="240" cy="180" rx="280" ry="220" fill="url(#meshGradient1)">
          <animate
            attributeName="cx"
            values="240;280;240"
            dur="12s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="180;220;180"
            dur="15s"
            repeatCount="indefinite"
          />
        </ellipse>

        <ellipse cx="560" cy="360" rx="240" ry="200" fill="url(#meshGradient2)">
          <animate
            attributeName="cx"
            values="560;520;560"
            dur="14s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="360;320;360"
            dur="11s"
            repeatCount="indefinite"
          />
        </ellipse>

        <ellipse cx="400" cy="480" rx="200" ry="160" fill="url(#meshGradient3)">
          <animate
            attributeName="rx"
            values="200;240;200"
            dur="10s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* Geometric Data Flow Lines */}
        <g filter="url(#glow)">
          {/* Primary flow path */}
          <path
            ref={pathRef}
            d="M 50 300 Q 150 200 250 280 T 450 220 T 650 300 T 750 250"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className="animate-[drawLine_3s_ease-out_forwards]"
          />

          {/* Secondary flow paths */}
          <path
            d="M 100 400 Q 200 350 300 380 T 500 320 T 700 380"
            stroke="url(#lineGradient2)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />

          <path
            d="M 0 200 Q 100 150 200 180 T 400 120 T 600 180 T 800 140"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
        </g>

        {/* Animated Data Nodes */}
        <g filter="url(#softGlow)">
          {/* Node 1 */}
          <circle cx="250" cy="280" r="6" fill="#06b6d4">
            <animate
              attributeName="r"
              values="6;8;6"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="1;0.7;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="250" cy="280" r="12" fill="none" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.4">
            <animate
              attributeName="r"
              values="12;20;12"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;0;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Node 2 */}
          <circle cx="450" cy="220" r="8" fill="#8b5cf6">
            <animate
              attributeName="r"
              values="8;10;8"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="450" cy="220" r="16" fill="none" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.3">
            <animate
              attributeName="r"
              values="16;28;16"
              dur="2.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.3;0;0.3"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Node 3 */}
          <circle cx="650" cy="300" r="5" fill="#a855f7">
            <animate
              attributeName="r"
              values="5;7;5"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Security Shield Symbol (subtle) */}
        <g transform="translate(380, 280)" opacity="0.15">
          <path
            d="M 0 -40 L 30 -25 L 30 15 Q 30 35 0 50 Q -30 35 -30 15 L -30 -25 Z"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="1.5"
          />
          <path
            d="M -10 5 L -3 12 L 12 -5"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Hexagon Grid (represents blockchain/security) */}
        <g opacity="0.08">
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3, 4, 5].map((col) => (
              <polygon
                key={`hex-${row}-${col}`}
                points="0,-15 13,-7.5 13,7.5 0,15 -13,7.5 -13,-7.5"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
                transform={`translate(${100 + col * 45 + (row % 2) * 22.5}, ${80 + row * 40})`}
              />
            ))
          )}
        </g>

        {/* Floating Particles */}
        {[...Array(12)].map((_, i) => (
          <circle
            key={`particle-${i}`}
            cx={100 + (i * 60) % 700}
            cy={50 + (i * 47) % 500}
            r={1 + (i % 3)}
            fill={i % 2 === 0 ? '#06b6d4' : '#8b5cf6'}
            opacity={0.3 + (i % 4) * 0.1}
          >
            <animate
              attributeName="cy"
              values={`${50 + (i * 47) % 500};${30 + (i * 47) % 500};${50 + (i * 47) % 500}`}
              dur={`${3 + i % 3}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values={`${0.3 + (i % 4) * 0.1};${0.1};${0.3 + (i % 4) * 0.1}`}
              dur={`${3 + i % 3}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Circuit-like connectors */}
        <g stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.12" fill="none">
          <path d="M 600 100 L 650 100 L 650 150 L 700 150" />
          <path d="M 100 450 L 100 500 L 150 500 L 150 520" />
          <path d="M 700 400 L 750 400 L 750 450" />
          <circle cx="700" cy="150" r="3" fill="#8b5cf6" fillOpacity="0.3" />
          <circle cx="150" cy="520" r="3" fill="#06b6d4" fillOpacity="0.3" />
        </g>
      </svg>

      {/* CSS Animation for line drawing */}
      <style jsx>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
