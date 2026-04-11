'use client';

interface NetworkAnimationProps {
  className?: string;
}

/**
 * Abstract SVG network animation symbolizing AI/data flow.
 * Uses CSS keyframes (compositor-threaded) instead of SMIL <animate> on
 * geometry attributes — avoids per-frame layout recalculation that was
 * causing INP violations.
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
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
            <stop offset="50%" stopColor="rgba(6, 182, 212, 0.2)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
          </linearGradient>

          <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
          </radialGradient>

          {/* CSS animations — compositor-accelerated (opacity + transform only) */}
          <style>{`
            .sfp-na-pulse-2s  { animation: sfpNaPulse 2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
            .sfp-na-pulse-25s { animation: sfpNaPulse 2.5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
            .sfp-na-pulse-3s  { animation: sfpNaPulse 3s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
            .sfp-na-pulse-32s { animation: sfpNaPulse 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
            .sfp-na-pulse-28s { animation: sfpNaPulse 2.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
            .sfp-na-pulse-22s { animation: sfpNaPulse 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
            .sfp-na-fade-3s   { animation: sfpNaFade 3s ease-in-out infinite; }
            .sfp-na-fade-25s  { animation: sfpNaFade 2.5s ease-in-out infinite; }
            .sfp-na-burst     { animation: sfpNaBurst 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
            .sfp-na-dash-3s   { animation: sfpNaDash3 3s linear infinite; }
            .sfp-na-dash-4s   { animation: sfpNaDash4 4s linear infinite; }
            .sfp-na-dash-5s   { animation: sfpNaDash5 5s linear infinite; }
            @keyframes sfpNaPulse {
              0%, 100% { transform: scale(1);    opacity: 0.8; }
              50%       { transform: scale(1.35); opacity: 1;   }
            }
            @keyframes sfpNaFade {
              0%, 100% { opacity: 0.5; }
              50%       { opacity: 0.9; }
            }
            @keyframes sfpNaBurst {
              0%, 100% { transform: scale(0.8); opacity: 0.2; }
              50%       { transform: scale(1.2); opacity: 0.4; }
            }
            @keyframes sfpNaDash3 { to { stroke-dashoffset: -24; } }
            @keyframes sfpNaDash4 { to { stroke-dashoffset: -18; } }
            @keyframes sfpNaDash5 { to { stroke-dashoffset: -16; } }
          `}</style>
        </defs>

        {/* Background grid */}
        <pattern id="sfpGrid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(148, 163, 184, 0.03)" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#sfpGrid)" />

        {/* Network connections */}
        <g opacity="0.6">
          <path
            d="M100,400 Q300,200 500,350 T900,300"
            fill="none" stroke="url(#lineGradient)" strokeWidth="1.5"
            strokeDasharray="8,4" className="sfp-na-dash-3s"
          />
          <path
            d="M200,600 Q400,400 600,500 T1000,400"
            fill="none" stroke="url(#lineGradient)" strokeWidth="1"
            strokeDasharray="6,3" className="sfp-na-dash-4s"
          />
          <path
            d="M50,200 Q250,350 450,250 T850,350"
            fill="none" stroke="url(#lineGradient)" strokeWidth="1"
            strokeDasharray="4,4" className="sfp-na-dash-5s"
          />
          <line x1="300" y1="300" x2="500" y2="350" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" />
          <line x1="500" y1="350" x2="700" y2="280" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" />
          <line x1="700" y1="280" x2="900" y2="350" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="1" />
          <line x1="400" y1="500" x2="600" y2="450" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
          <line x1="600" y1="450" x2="800" y2="500" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" />
        </g>

        {/* Animated nodes — CSS scale/opacity (compositor) instead of SMIL r-changes (layout) */}
        <g>
          <circle cx="300" cy="300" r="6"   fill="rgba(16, 185, 129, 0.8)"  className="sfp-na-pulse-2s" />
          <circle cx="500" cy="350" r="8"   fill="rgba(6, 182, 212, 0.9)"   className="sfp-na-pulse-25s" />
          <circle cx="700" cy="280" r="5"   fill="rgba(16, 185, 129, 0.7)"  className="sfp-na-pulse-3s" />
          <circle cx="900" cy="350" r="7"   fill="rgba(139, 92, 246, 0.8)"  className="sfp-na-pulse-22s" />
          <circle cx="150" cy="450" r="4"   fill="rgba(16, 185, 129, 0.5)"  className="sfp-na-fade-3s" />
          <circle cx="400" cy="500" r="5"   fill="rgba(6, 182, 212, 0.6)"   className="sfp-na-pulse-28s" />
          <circle cx="600" cy="450" r="4"   fill="rgba(16, 185, 129, 0.6)"  className="sfp-na-fade-25s" />
          <circle cx="800" cy="500" r="6"   fill="rgba(6, 182, 212, 0.7)"   className="sfp-na-pulse-32s" />
          {/* Static tertiary nodes */}
          <circle cx="200" cy="200" r="3" fill="rgba(16, 185, 129, 0.4)" />
          <circle cx="450" cy="220" r="2" fill="rgba(6, 182, 212, 0.3)" />
          <circle cx="650" cy="180" r="3" fill="rgba(139, 92, 246, 0.4)" />
          <circle cx="850" cy="220" r="2" fill="rgba(16, 185, 129, 0.3)" />
          <circle cx="1000" cy="450" r="3" fill="rgba(6, 182, 212, 0.4)" />
          <circle cx="100" cy="550" r="2" fill="rgba(139, 92, 246, 0.3)" />
        </g>

        {/* Central highlight burst — CSS scale (compositor) */}
        <circle cx="500" cy="350" r="100" fill="url(#pulseGradient)" className="sfp-na-burst" />
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
          <style>{`
            .sfp-mini-dash { animation: sfpMiniDash 3s linear infinite; }
            .sfp-mini-p2s  { animation: sfpNaPulse 2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
            .sfp-mini-p25s { animation: sfpNaPulse 2.5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
            .sfp-mini-fade { animation: sfpNaFade 3s ease-in-out infinite; }
            @keyframes sfpMiniDash { to { stroke-dashoffset: -12; } }
            @keyframes sfpNaPulse  { 0%,100%{transform:scale(1);opacity:.8} 50%{transform:scale(1.35);opacity:1} }
            @keyframes sfpNaFade   { 0%,100%{opacity:.6} 50%{opacity:.9} }
          `}</style>
        </defs>
        <path
          d="M50,150 Q150,50 250,150 T350,100"
          fill="none" stroke="url(#miniLineGradient)" strokeWidth="1"
          strokeDasharray="4,2" className="sfp-mini-dash"
        />
        <circle cx="100" cy="120" r="4" fill="rgba(16, 185, 129, 0.7)"  className="sfp-mini-p2s" />
        <circle cx="200" cy="150" r="5" fill="rgba(6, 182, 212, 0.8)"   className="sfp-mini-p25s" />
        <circle cx="300" cy="100" r="3" fill="rgba(139, 92, 246, 0.6)"  className="sfp-mini-fade" />
      </svg>
    </div>
  );
}
