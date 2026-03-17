'use client';

import { useEffect, useRef } from 'react';

interface NetworkAnimationProps {
  className?: string;
}

/**
 * Abstract SVG network animation symbolizing AI/data flow
 * Pulsating nodes with connecting lines for a premium tech feel
 */
export default function NetworkAnimation({ className = '' }: NetworkAnimationProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for lines */}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
            <stop offset="50%" stopColor="rgba(6, 182, 212, 0.2)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
          </linearGradient>

          {/* Glow filter for nodes */}
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pulse animation gradient */}
          <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)">
              <animate
                attributeName="stop-color"
                values="rgba(16, 185, 129, 0.6);rgba(6, 182, 212, 0.6);rgba(16, 185, 129, 0.6)"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
          </radialGradient>
        </defs>

        {/* Background grid pattern */}
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke="rgba(148, 163, 184, 0.03)"
            strokeWidth="1"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Network connections */}
        <g className="network-lines" opacity="0.6">
          {/* Main connection paths with animation */}
          <path
            d="M100,400 Q300,200 500,350 T900,300"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1.5"
            strokeDasharray="8,4"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="24"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>

          <path
            d="M200,600 Q400,400 600,500 T1000,400"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            strokeDasharray="6,3"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="18"
              dur="4s"
              repeatCount="indefinite"
            />
          </path>

          <path
            d="M50,200 Q250,350 450,250 T850,350"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            strokeDasharray="4,4"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="16"
              dur="5s"
              repeatCount="indefinite"
            />
          </path>

          {/* Secondary connections */}
          <line x1="300" y1="300" x2="500" y2="350" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" />
          <line x1="500" y1="350" x2="700" y2="280" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" />
          <line x1="700" y1="280" x2="900" y2="350" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="1" />
          <line x1="400" y1="500" x2="600" y2="450" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
          <line x1="600" y1="450" x2="800" y2="500" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" />
        </g>

        {/* Animated nodes */}
        <g className="network-nodes" filter="url(#nodeGlow)">
          {/* Primary nodes with pulse */}
          <circle cx="300" cy="300" r="6" fill="rgba(16, 185, 129, 0.8)">
            <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
          </circle>

          <circle cx="500" cy="350" r="8" fill="rgba(6, 182, 212, 0.9)">
            <animate attributeName="r" values="8;10;8" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;1;0.9" dur="2.5s" repeatCount="indefinite" />
          </circle>

          <circle cx="700" cy="280" r="5" fill="rgba(16, 185, 129, 0.7)">
            <animate attributeName="r" values="5;7;5" dur="3s" repeatCount="indefinite" />
          </circle>

          <circle cx="900" cy="350" r="7" fill="rgba(139, 92, 246, 0.8)">
            <animate attributeName="r" values="7;9;7" dur="2.2s" repeatCount="indefinite" />
          </circle>

          {/* Secondary nodes */}
          <circle cx="150" cy="450" r="4" fill="rgba(16, 185, 129, 0.5)">
            <animate attributeName="opacity" values="0.5;0.8;0.5" dur="3s" repeatCount="indefinite" />
          </circle>

          <circle cx="400" cy="500" r="5" fill="rgba(6, 182, 212, 0.6)">
            <animate attributeName="r" values="5;6;5" dur="2.8s" repeatCount="indefinite" />
          </circle>

          <circle cx="600" cy="450" r="4" fill="rgba(16, 185, 129, 0.6)">
            <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2.5s" repeatCount="indefinite" />
          </circle>

          <circle cx="800" cy="500" r="6" fill="rgba(6, 182, 212, 0.7)">
            <animate attributeName="r" values="6;8;6" dur="3.2s" repeatCount="indefinite" />
          </circle>

          {/* Tertiary nodes (smaller, more subtle) */}
          <circle cx="200" cy="200" r="3" fill="rgba(16, 185, 129, 0.4)" />
          <circle cx="450" cy="220" r="2" fill="rgba(6, 182, 212, 0.3)" />
          <circle cx="650" cy="180" r="3" fill="rgba(139, 92, 246, 0.4)" />
          <circle cx="850" cy="220" r="2" fill="rgba(16, 185, 129, 0.3)" />
          <circle cx="1000" cy="450" r="3" fill="rgba(6, 182, 212, 0.4)" />
          <circle cx="100" cy="550" r="2" fill="rgba(139, 92, 246, 0.3)" />
        </g>

        {/* Data flow particles */}
        <g className="data-particles">
          <circle r="2" fill="rgba(16, 185, 129, 0.9)">
            <animateMotion
              path="M100,400 Q300,200 500,350 T900,300"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>

          <circle r="2" fill="rgba(6, 182, 212, 0.9)">
            <animateMotion
              path="M200,600 Q400,400 600,500 T1000,400"
              dur="8s"
              repeatCount="indefinite"
            />
          </circle>

          <circle r="1.5" fill="rgba(139, 92, 246, 0.8)">
            <animateMotion
              path="M50,200 Q250,350 450,250 T850,350"
              dur="7s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Central highlight burst */}
        <circle cx="500" cy="350" r="100" fill="url(#pulseGradient)" opacity="0.3">
          <animate attributeName="r" values="80;120;80" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

/**
 * Simplified version for smaller spaces or sidebars
 */
export function NetworkAnimationMini({ className = '' }: NetworkAnimationProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="miniLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0.2)" />
          </linearGradient>
        </defs>

        <path
          d="M50,150 Q150,50 250,150 T350,100"
          fill="none"
          stroke="url(#miniLineGradient)"
          strokeWidth="1"
          strokeDasharray="4,2"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="12"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>

        <circle cx="100" cy="120" r="4" fill="rgba(16, 185, 129, 0.7)">
          <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="150" r="5" fill="rgba(6, 182, 212, 0.8)">
          <animate attributeName="r" values="5;6;5" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="100" r="3" fill="rgba(139, 92, 246, 0.6)">
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
