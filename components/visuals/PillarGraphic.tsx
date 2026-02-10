'use client';

interface PillarGraphicProps {
  className?: string;
  variant: 'trading' | 'ai-tools' | 'cybersecurity' | 'business-banking' | 'personal-finance';
}

// Color schemes for each pillar
const colorSchemes = {
  'trading': {
    primary: '#06b6d4',    // cyan
    secondary: '#8b5cf6',  // violet
    tertiary: '#22d3ee',   // lighter cyan
    accent: '#a855f7',     // purple
  },
  'ai-tools': {
    primary: '#8b5cf6',    // violet
    secondary: '#06b6d4',  // cyan
    tertiary: '#c084fc',   // lighter violet
    accent: '#f59e0b',     // amber
  },
  'cybersecurity': {
    primary: '#06b6d4',    // cyan
    secondary: '#10b981',  // emerald (security green)
    tertiary: '#8b5cf6',   // violet
    accent: '#14b8a6',     // teal
  },
  'business-banking': {
    primary: '#8b5cf6',    // violet
    secondary: '#3b82f6',  // blue
    tertiary: '#a855f7',   // purple
    accent: '#06b6d4',     // cyan
  },
  'personal-finance': {
    primary: '#a855f7',    // purple
    secondary: '#8b5cf6',  // violet
    tertiary: '#06b6d4',   // cyan
    accent: '#f59e0b',     // amber
  },
};

export function PillarGraphic({ className = '', variant }: PillarGraphicProps) {
  const colors = colorSchemes[variant];

  return (
    <div className={`relative w-full h-full ${className}`}>
      <svg
        viewBox="0 0 600 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Dynamic Mesh Gradients */}
          <radialGradient id={`mesh1-${variant}`} cx="25%" cy="25%" r="50%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.35" />
            <stop offset="70%" stopColor={colors.primary} stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0f0a1a" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`mesh2-${variant}`} cx="75%" cy="65%" r="45%">
            <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.3" />
            <stop offset="60%" stopColor={colors.secondary} stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0f0a1a" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`mesh3-${variant}`} cx="50%" cy="85%" r="35%">
            <stop offset="0%" stopColor={colors.tertiary} stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0f0a1a" stopOpacity="0" />
          </radialGradient>

          {/* Flow Line Gradient */}
          <linearGradient id={`flowLine-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0" />
            <stop offset="20%" stopColor={colors.primary} stopOpacity="0.7" />
            <stop offset="80%" stopColor={colors.secondary} stopOpacity="0.7" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </linearGradient>

          {/* Glow Effects */}
          <filter id={`glow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dot Pattern */}
          <pattern id={`dots-${variant}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="white" fillOpacity="0.06" />
          </pattern>
        </defs>

        {/* Background Pattern */}
        <rect width="100%" height="100%" fill={`url(#dots-${variant})`} />

        {/* Animated Mesh Blobs */}
        <ellipse cx="150" cy="100" rx="180" ry="140" fill={`url(#mesh1-${variant})`}>
          <animate attributeName="cx" values="150;180;150" dur="10s" repeatCount="indefinite" />
          <animate attributeName="cy" values="100;130;100" dur="13s" repeatCount="indefinite" />
        </ellipse>

        <ellipse cx="450" cy="260" rx="160" ry="130" fill={`url(#mesh2-${variant})`}>
          <animate attributeName="cx" values="450;420;450" dur="12s" repeatCount="indefinite" />
          <animate attributeName="cy" values="260;230;260" dur="9s" repeatCount="indefinite" />
        </ellipse>

        <ellipse cx="300" cy="340" rx="140" ry="100" fill={`url(#mesh3-${variant})`}>
          <animate attributeName="rx" values="140;170;140" dur="8s" repeatCount="indefinite" />
        </ellipse>

        {/* Variant-Specific Graphics */}
        {variant === 'trading' && <TradingElements colors={colors} />}
        {variant === 'ai-tools' && <AIElements colors={colors} />}
        {variant === 'cybersecurity' && <SecurityElements colors={colors} />}
        {variant === 'business-banking' && <BankingElements colors={colors} />}
        {variant === 'personal-finance' && <FinanceElements colors={colors} />}

        {/* Common Flow Lines */}
        <g filter={`url(#glow-${variant})`}>
          <path
            d="M 0 200 Q 100 150 200 180 T 400 160 T 600 200"
            stroke={`url(#flowLine-${variant})`}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 50 280 Q 150 250 250 270 T 450 240 T 550 280"
            stroke={`url(#flowLine-${variant})`}
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
        </g>

        {/* Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <circle
            key={`p-${i}`}
            cx={50 + (i * 75) % 550}
            cy={40 + (i * 53) % 320}
            r={1 + (i % 2)}
            fill={i % 2 === 0 ? colors.primary : colors.secondary}
            opacity={0.4}
          >
            <animate
              attributeName="cy"
              values={`${40 + (i * 53) % 320};${25 + (i * 53) % 320};${40 + (i * 53) % 320}`}
              dur={`${2.5 + i % 2}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    </div>
  );
}

// Trading-specific elements: Chart lines, candlesticks
function TradingElements({ colors }: { colors: typeof colorSchemes['trading'] }) {
  return (
    <g opacity="0.6">
      {/* Candlestick chart abstraction */}
      <g transform="translate(280, 120)">
        {/* Candles */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const height = 20 + Math.sin(i * 1.2) * 15;
          const y = 50 - height / 2 + Math.cos(i * 0.8) * 10;
          const isUp = i % 2 === 0;
          return (
            <g key={`candle-${i}`} transform={`translate(${i * 18}, 0)`}>
              {/* Wick */}
              <line
                x1="4"
                y1={y - 8}
                x2="4"
                y2={y + height + 8}
                stroke={isUp ? colors.primary : colors.secondary}
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              {/* Body */}
              <rect
                x="0"
                y={y}
                width="8"
                height={height}
                fill={isUp ? colors.primary : colors.secondary}
                fillOpacity={isUp ? 0.7 : 0.4}
                rx="1"
              />
            </g>
          );
        })}

        {/* Trend line */}
        <path
          d="M 0 60 Q 30 40 60 45 T 120 35"
          stroke={colors.primary}
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4 2"
          opacity="0.5"
        />
      </g>

      {/* Arrow up indicator */}
      <g transform="translate(450, 180)" opacity="0.4">
        <polygon points="0,-20 15,10 8,10 8,25 -8,25 -8,10 -15,10" fill={colors.primary} />
      </g>
    </g>
  );
}

// AI-specific elements: Neural network nodes
function AIElements({ colors }: { colors: typeof colorSchemes['ai-tools'] }) {
  const nodes = [
    { x: 150, y: 120 }, { x: 200, y: 80 }, { x: 200, y: 160 },
    { x: 280, y: 100 }, { x: 280, y: 140 }, { x: 280, y: 180 },
    { x: 360, y: 80 }, { x: 360, y: 160 },
    { x: 420, y: 120 },
  ];

  const connections = [
    [0, 3], [0, 4], [0, 5], [1, 3], [1, 4], [2, 4], [2, 5],
    [3, 6], [3, 7], [4, 6], [4, 7], [5, 6], [5, 7],
    [6, 8], [7, 8],
  ];

  return (
    <g opacity="0.5">
      {/* Connections */}
      {connections.map(([from, to], i) => (
        <line
          key={`conn-${i}`}
          x1={nodes[from].x}
          y1={nodes[from].y}
          x2={nodes[to].x}
          y2={nodes[to].y}
          stroke={colors.secondary}
          strokeWidth="1"
          strokeOpacity="0.3"
        />
      ))}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <g key={`node-${i}`}>
          <circle cx={node.x} cy={node.y} r="8" fill={colors.primary} fillOpacity="0.6">
            <animate
              attributeName="r"
              values="8;10;8"
              dur={`${2 + i * 0.2}s`}
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={node.x} cy={node.y} r="4" fill="white" fillOpacity="0.3" />
        </g>
      ))}

      {/* Sparkle/Magic indicator */}
      <g transform="translate(480, 100)">
        <path
          d="M 0 -15 L 3 -3 L 15 0 L 3 3 L 0 15 L -3 3 L -15 0 L -3 -3 Z"
          fill={colors.accent}
          fillOpacity="0.6"
        >
          <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite" />
        </path>
      </g>
    </g>
  );
}

// Security-specific elements: Shield, lock, encrypted data
function SecurityElements({ colors }: { colors: typeof colorSchemes['cybersecurity'] }) {
  return (
    <g opacity="0.5">
      {/* Central Shield */}
      <g transform="translate(300, 140)">
        <path
          d="M 0 -50 L 40 -30 L 40 20 Q 40 50 0 70 Q -40 50 -40 20 L -40 -30 Z"
          fill="none"
          stroke={colors.primary}
          strokeWidth="2"
          strokeOpacity="0.6"
        />
        <path
          d="M 0 -35 L 28 -20 L 28 15 Q 28 38 0 52 Q -28 38 -28 15 L -28 -20 Z"
          fill={colors.primary}
          fillOpacity="0.15"
        />
        {/* Checkmark */}
        <path
          d="M -12 5 L -4 13 L 15 -8"
          fill="none"
          stroke={colors.secondary}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Lock icon */}
      <g transform="translate(180, 200)" opacity="0.4">
        <rect x="-12" y="0" width="24" height="18" rx="3" fill={colors.tertiary} />
        <path
          d="M -8 0 L -8 -8 Q -8 -16 0 -16 Q 8 -16 8 -8 L 8 0"
          fill="none"
          stroke={colors.tertiary}
          strokeWidth="2.5"
        />
      </g>

      {/* Encrypted data streams */}
      <g opacity="0.25">
        {[0, 1, 2].map((i) => (
          <text
            key={`bin-${i}`}
            x={420 + i * 25}
            y={100 + i * 40}
            fill={colors.primary}
            fontSize="10"
            fontFamily="monospace"
          >
            {i % 2 === 0 ? '10110' : '01001'}
            <animate
              attributeName="opacity"
              values="0.25;0.1;0.25"
              dur={`${1.5 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </text>
        ))}
      </g>

      {/* Hexagon pattern (blockchain reference) */}
      <g transform="translate(450, 200)" opacity="0.3">
        <polygon
          points="0,-18 16,-9 16,9 0,18 -16,9 -16,-9"
          fill="none"
          stroke={colors.accent}
          strokeWidth="1.5"
        />
        <polygon
          points="0,-10 9,-5 9,5 0,10 -9,5 -9,-5"
          fill={colors.accent}
          fillOpacity="0.3"
        />
      </g>
    </g>
  );
}

// Business Banking elements: Building, charts, currency
function BankingElements({ colors }: { colors: typeof colorSchemes['business-banking'] }) {
  return (
    <g opacity="0.5">
      {/* Abstract building/institution */}
      <g transform="translate(280, 130)">
        {/* Pillars */}
        {[-30, -10, 10, 30].map((x, i) => (
          <rect
            key={`pillar-${i}`}
            x={x - 4}
            y={-20}
            width="8"
            height="60"
            fill={colors.primary}
            fillOpacity={0.4 + i * 0.1}
            rx="1"
          />
        ))}
        {/* Roof */}
        <polygon points="-45,-25 0,-50 45,-25" fill={colors.primary} fillOpacity="0.3" />
        {/* Base */}
        <rect x="-45" y="40" width="90" height="8" fill={colors.primary} fillOpacity="0.2" rx="2" />
      </g>

      {/* Growth chart */}
      <g transform="translate(420, 160)">
        <path
          d="M 0 40 L 20 30 L 40 35 L 60 15 L 80 5"
          stroke={colors.secondary}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="80" cy="5" r="4" fill={colors.secondary}>
          <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Currency symbols */}
      <g opacity="0.25" fontFamily="system-ui" fontWeight="bold">
        <text x="150" y="100" fill={colors.tertiary} fontSize="20">$</text>
        <text x="460" y="250" fill={colors.accent} fontSize="18">€</text>
        <text x="180" y="280" fill={colors.secondary} fontSize="16">£</text>
      </g>
    </g>
  );
}

// Personal Finance elements: Wallet, savings, goals
function FinanceElements({ colors }: { colors: typeof colorSchemes['personal-finance'] }) {
  return (
    <g opacity="0.5">
      {/* Piggy bank / savings abstract */}
      <g transform="translate(300, 140)">
        <ellipse cx="0" cy="0" rx="35" ry="25" fill={colors.primary} fillOpacity="0.3" />
        <ellipse cx="0" cy="0" rx="25" ry="18" fill={colors.primary} fillOpacity="0.2" />
        {/* Coin slot */}
        <rect x="-8" y="-30" width="16" height="4" rx="2" fill={colors.secondary} fillOpacity="0.5" />
        {/* Coin dropping animation */}
        <circle cx="0" cy="-40" r="6" fill={colors.accent} fillOpacity="0.6">
          <animate attributeName="cy" values="-50;-30;-50" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.6;0" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Progress/Goals bars */}
      <g transform="translate(420, 120)">
        {[0, 1, 2].map((i) => (
          <g key={`bar-${i}`} transform={`translate(0, ${i * 25})`}>
            <rect x="0" y="0" width="80" height="12" rx="6" fill="white" fillOpacity="0.1" />
            <rect
              x="0"
              y="0"
              width={30 + i * 20}
              height="12"
              rx="6"
              fill={i === 0 ? colors.primary : i === 1 ? colors.secondary : colors.tertiary}
              fillOpacity="0.5"
            >
              <animate
                attributeName="width"
                values={`${30 + i * 20};${35 + i * 20};${30 + i * 20}`}
                dur="2s"
                repeatCount="indefinite"
              />
            </rect>
          </g>
        ))}
      </g>

      {/* Wallet icon */}
      <g transform="translate(170, 180)" opacity="0.4">
        <rect x="-20" y="-12" width="40" height="24" rx="4" fill={colors.tertiary} />
        <rect x="10" y="-6" width="14" height="12" rx="2" fill="white" fillOpacity="0.3" />
        <circle cx="15" cy="0" r="2" fill={colors.primary} />
      </g>

      {/* Target/goal icon */}
      <g transform="translate(480, 200)" opacity="0.35">
        <circle cx="0" cy="0" r="20" fill="none" stroke={colors.accent} strokeWidth="2" />
        <circle cx="0" cy="0" r="12" fill="none" stroke={colors.accent} strokeWidth="1.5" />
        <circle cx="0" cy="0" r="4" fill={colors.accent} />
      </g>
    </g>
  );
}
