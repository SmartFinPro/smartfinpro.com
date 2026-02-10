'use client';

/**
 * Neural Finance Network SVG
 * Abstract visualization of AI-powered financial data flow
 * Premium, animated SVG for hero sections
 */

interface NeuralFinanceSVGProps {
  className?: string;
  variant?: 'hero' | 'inline' | 'icon';
}

export function NeuralFinanceSVG({ className = '', variant = 'hero' }: NeuralFinanceSVGProps) {
  if (variant === 'icon') {
    return <NeuralIcon className={className} />;
  }

  if (variant === 'inline') {
    return <NeuralInline className={className} />;
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="nfLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
            <stop offset="50%" stopColor="rgba(6, 182, 212, 0.3)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.2)" />
          </linearGradient>

          <linearGradient id="nfDataFlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0)">
              <animate attributeName="offset" values="-0.2;1" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="10%" stopColor="rgba(16, 185, 129, 0.8)">
              <animate attributeName="offset" values="-0.1;1.1" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="20%" stopColor="rgba(16, 185, 129, 0)">
              <animate attributeName="offset" values="0;1.2" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>

          <radialGradient id="nfNodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.8)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
          </radialGradient>

          {/* Filters */}
          <filter id="nfGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="nfSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Background Grid */}
        <pattern id="nfGrid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path
            d="M 80 0 L 0 0 0 80"
            fill="none"
            stroke="rgba(148, 163, 184, 0.03)"
            strokeWidth="1"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#nfGrid)" />

        {/* Central Brain/Network Structure */}
        <g className="central-network" transform="translate(700, 450)">
          {/* Outer Ring */}
          <circle
            cx="0"
            cy="0"
            r="280"
            fill="none"
            stroke="rgba(16, 185, 129, 0.1)"
            strokeWidth="1"
            strokeDasharray="8 8"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 0 0"
              to="360 0 0"
              dur="120s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Middle Ring */}
          <circle
            cx="0"
            cy="0"
            r="200"
            fill="none"
            stroke="rgba(6, 182, 212, 0.15)"
            strokeWidth="1"
            strokeDasharray="4 6"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 0 0"
              to="0 0 0"
              dur="90s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Inner Ring */}
          <circle
            cx="0"
            cy="0"
            r="120"
            fill="none"
            stroke="rgba(139, 92, 246, 0.2)"
            strokeWidth="1"
          >
            <animate
              attributeName="r"
              values="115;125;115"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Core Pulse */}
          <circle cx="0" cy="0" r="60" fill="url(#nfNodeGlow)" opacity="0.3">
            <animate attributeName="r" values="55;65;55" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Central Node */}
          <circle cx="0" cy="0" r="12" fill="rgba(16, 185, 129, 0.9)" filter="url(#nfGlow)">
            <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Neural Connection Paths */}
        <g className="connections" opacity="0.6">
          {/* Left Side - Input Data */}
          <path
            d="M100,200 Q300,300 500,350 T700,450"
            fill="none"
            stroke="url(#nfLineGradient)"
            strokeWidth="2"
            strokeDasharray="12 6"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-36"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>

          <path
            d="M50,450 Q250,400 450,420 T700,450"
            fill="none"
            stroke="url(#nfLineGradient)"
            strokeWidth="1.5"
            strokeDasharray="8 4"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-24"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </path>

          <path
            d="M120,700 Q320,600 520,550 T700,450"
            fill="none"
            stroke="url(#nfLineGradient)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-20"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>

          {/* Right Side - Output */}
          <path
            d="M700,450 Q900,400 1100,300 T1350,200"
            fill="none"
            stroke="url(#nfLineGradient)"
            strokeWidth="2"
            strokeDasharray="12 6"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="36"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>

          <path
            d="M700,450 Q900,480 1100,500 T1380,550"
            fill="none"
            stroke="url(#nfLineGradient)"
            strokeWidth="1.5"
            strokeDasharray="8 4"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="24"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </path>

          <path
            d="M700,450 Q900,550 1100,650 T1320,750"
            fill="none"
            stroke="url(#nfLineGradient)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="20"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Data Flow Particles */}
        <g className="particles">
          {/* Left to Center */}
          <circle r="3" fill="rgba(16, 185, 129, 0.9)" filter="url(#nfSoftGlow)">
            <animateMotion path="M100,200 Q300,300 500,350 T700,450" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle r="2.5" fill="rgba(6, 182, 212, 0.9)" filter="url(#nfSoftGlow)">
            <animateMotion path="M50,450 Q250,400 450,420 T700,450" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle r="2" fill="rgba(139, 92, 246, 0.8)" filter="url(#nfSoftGlow)">
            <animateMotion path="M120,700 Q320,600 520,550 T700,450" dur="3.5s" repeatCount="indefinite" />
          </circle>

          {/* Center to Right */}
          <circle r="3" fill="rgba(16, 185, 129, 0.9)" filter="url(#nfSoftGlow)">
            <animateMotion path="M700,450 Q900,400 1100,300 T1350,200" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle r="2.5" fill="rgba(6, 182, 212, 0.9)" filter="url(#nfSoftGlow)">
            <animateMotion path="M700,450 Q900,480 1100,500 T1380,550" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle r="2" fill="rgba(139, 92, 246, 0.8)" filter="url(#nfSoftGlow)">
            <animateMotion path="M700,450 Q900,550 1100,650 T1320,750" dur="3.5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Input Nodes (Left) */}
        <g className="input-nodes" filter="url(#nfGlow)">
          <circle cx="100" cy="200" r="8" fill="rgba(16, 185, 129, 0.7)">
            <animate attributeName="r" values="7;9;7" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="450" r="7" fill="rgba(6, 182, 212, 0.7)">
            <animate attributeName="r" values="6;8;6" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="120" cy="700" r="6" fill="rgba(139, 92, 246, 0.6)">
            <animate attributeName="r" values="5;7;5" dur="2.8s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Output Nodes (Right) */}
        <g className="output-nodes" filter="url(#nfGlow)">
          <circle cx="1350" cy="200" r="8" fill="rgba(16, 185, 129, 0.7)">
            <animate attributeName="r" values="7;9;7" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="1380" cy="550" r="7" fill="rgba(6, 182, 212, 0.7)">
            <animate attributeName="r" values="6;8;6" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="1320" cy="750" r="6" fill="rgba(139, 92, 246, 0.6)">
            <animate attributeName="r" values="5;7;5" dur="2.8s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Finance Icons - Abstracted */}
        <g className="finance-symbols" opacity="0.4">
          {/* Dollar/Currency symbol abstraction */}
          <text x="80" y="185" fill="rgba(16, 185, 129, 0.5)" fontSize="18" fontFamily="monospace">$</text>
          <text x="30" y="435" fill="rgba(6, 182, 212, 0.5)" fontSize="16" fontFamily="monospace">%</text>
          <text x="100" y="715" fill="rgba(139, 92, 246, 0.4)" fontSize="14" fontFamily="monospace">Σ</text>

          <text x="1365" y="185" fill="rgba(16, 185, 129, 0.5)" fontSize="18" fontFamily="monospace">↗</text>
          <text x="1395" y="535" fill="rgba(6, 182, 212, 0.5)" fontSize="16" fontFamily="monospace">◆</text>
          <text x="1335" y="765" fill="rgba(139, 92, 246, 0.4)" fontSize="14" fontFamily="monospace">∞</text>
        </g>

        {/* Subtle secondary nodes */}
        <g className="secondary-nodes" opacity="0.5">
          <circle cx="300" cy="320" r="4" fill="rgba(16, 185, 129, 0.5)" />
          <circle cx="450" cy="400" r="3" fill="rgba(6, 182, 212, 0.5)" />
          <circle cx="550" cy="480" r="4" fill="rgba(139, 92, 246, 0.4)" />
          <circle cx="850" cy="380" r="4" fill="rgba(16, 185, 129, 0.5)" />
          <circle cx="1000" cy="420" r="3" fill="rgba(6, 182, 212, 0.5)" />
          <circle cx="1150" cy="350" r="4" fill="rgba(139, 92, 246, 0.4)" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Inline version for smaller sections
 */
function NeuralInline({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-full h-32 ${className}`}
      viewBox="0 0 600 120"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="niGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
          <stop offset="50%" stopColor="rgba(6, 182, 212, 0.3)" />
          <stop offset="100%" stopColor="rgba(139, 92, 246, 0.2)" />
        </linearGradient>
      </defs>

      <path
        d="M0,60 Q150,20 300,60 T600,60"
        fill="none"
        stroke="url(#niGrad)"
        strokeWidth="2"
        strokeDasharray="8 4"
      >
        <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="2s" repeatCount="indefinite" />
      </path>

      <circle cx="50" cy="60" r="6" fill="rgba(16, 185, 129, 0.7)">
        <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="300" cy="60" r="8" fill="rgba(6, 182, 212, 0.8)">
        <animate attributeName="r" values="7;9;7" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="550" cy="60" r="6" fill="rgba(139, 92, 246, 0.7)">
        <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/**
 * Icon version for badges/cards
 */
function NeuralIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`w-8 h-8 ${className}`}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="4" fill="rgba(16, 185, 129, 0.8)">
        <animate attributeName="r" values="3.5;4.5;3.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="16" cy="16" r="10" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
      <circle cx="6" cy="10" r="2" fill="rgba(6, 182, 212, 0.6)" />
      <circle cx="26" cy="10" r="2" fill="rgba(6, 182, 212, 0.6)" />
      <circle cx="6" cy="22" r="2" fill="rgba(139, 92, 246, 0.5)" />
      <circle cx="26" cy="22" r="2" fill="rgba(139, 92, 246, 0.5)" />
      <line x1="8" y1="11" x2="13" y2="14" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />
      <line x1="24" y1="11" x2="19" y2="14" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />
      <line x1="8" y1="21" x2="13" y2="18" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1" />
      <line x1="24" y1="21" x2="19" y2="18" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1" />
    </svg>
  );
}
