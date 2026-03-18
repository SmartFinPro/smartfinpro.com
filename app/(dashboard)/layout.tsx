'use client';

import './dashboard.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Link2,
  BarChart3,
  DollarSign,
  Settings,
  LogOut,
  Sparkles,
  Shield,
  Search,
  Bell,
  ChevronDown,
  Radar,
  Crosshair,
  FileText,
  Rocket,
  Flame,
  ClipboardCheck,
  Brain,
  Telescope,
  Activity,
  FlaskConical,
  TrendingUp,
  Globe,
  Menu,
  X,
  HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
// Server action imports removed — loaded dynamically in useEffect to prevent
// Turbopack from bundling 'use server' modules into the [app-client] chunk.

// ── Grouped Sidebar Navigation ──────────────────────────────

interface NavLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Use exact matching only (no startsWith) */
  exact?: boolean;
  /** Show a dynamic badge (e.g., queue count) */
  badgeKey?: string;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

const DEV_BUILD_MARKER =
  process.env.NEXT_PUBLIC_BUILD_ID ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  'local-dev';

// ── Static sidebar data (module scope — never changes) ──────

const SIDEBAR_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    links: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, exact: true },
      { name: 'CTA Heatmap', href: '/dashboard/analytics/heatmap', icon: Flame },
      { name: 'AI-Optimizer', href: '/dashboard/analytics/optimize', icon: Brain, badgeKey: 'optimize' },
      { name: 'Revenue', href: '/dashboard/revenue', icon: DollarSign },
    ],
  },
  {
    label: 'Content & SEO',
    links: [
      { name: 'Content Hub', href: '/dashboard/content/hub', icon: FileText },
      { name: 'Auto-Genesis', href: '/dashboard/content/genesis', icon: Rocket },
      { name: 'Approval Queue', href: '/dashboard/content/planning', icon: ClipboardCheck, badgeKey: 'planning' },
      { name: 'Ranking Tracker', href: '/dashboard/ranking', icon: Search },
      { name: 'Competitor Radar', href: '/dashboard/competitors', icon: Radar, exact: true },
      { name: 'Keyword Gaps', href: '/dashboard/competitors/gaps', icon: Crosshair },
      { name: 'Backlink Automation', href: '/dashboard/backlinks', icon: Globe },
    ],
  },
  {
    label: 'Monetization',
    links: [
      { name: 'Affiliate Links', href: '/dashboard/links', icon: Link2 },
      { name: 'Funnel', href: '/dashboard/funnel', icon: TrendingUp },
      { name: 'Opportunities', href: '/dashboard/opportunities', icon: Telescope, badgeKey: 'opportunities' },
      { name: 'A/B Testing', href: '/dashboard/ab-testing', icon: FlaskConical },
      { name: 'Quiz Analytics', href: '/dashboard/quiz', icon: Sparkles },
    ],
  },
  {
    label: 'Operations',
    links: [
      { name: 'Compliance Audit', href: '/dashboard/compliance', icon: Shield },
      { name: 'Web Vitals', href: '/dashboard/web-vitals', icon: Activity },
      { name: 'Cron Health', href: '/dashboard/cron-health', icon: HeartPulse },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

function isLinkActive(pathname: string, link: NavLink): boolean {
  if (link.exact) return pathname === link.href;
  // Exact match or starts with href + "/" (prevents /competitors matching /competitors/gaps)
  return pathname === link.href || pathname.startsWith(link.href + '/');
}

// ── SidebarContent — module-scope component ─────────────────
// IMPORTANT: Must live outside DashboardLayout to keep a stable function
// reference across renders. Inline component definitions create a new
// reference on every render, causing React to unmount/remount and
// producing SSR/client hydration mismatches (href diff in nav links).

interface SidebarContentProps {
  pathname: string;
  badges: Record<string, number>;
  onNavigate: () => void;
}

function SidebarContent({ pathname, badges, onNavigate }: SidebarContentProps) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 pt-6 pb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">SF</span>
        </div>
        <Link href="/dashboard" className="text-xl font-bold text-slate-800" onClick={onNavigate}>
          SmartFinPro
        </Link>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const active = isLinkActive(pathname, link);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      'nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all',
                      active
                        ? 'bg-violet-50 text-violet-700 font-semibold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium',
                    )}
                  >
                    <link.icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-violet-500' : 'text-slate-400',
                      )}
                    />
                    <span className="truncate flex-1">{link.name}</span>
                    {link.badgeKey && badges[link.badgeKey] > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                        {badges[link.badgeKey]}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Links */}
      <div className="px-4 py-4 border-t border-slate-200 flex flex-col gap-1">
        <Link
          href="/"
          className="nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium transition-all"
          onClick={onNavigate}
        >
          <LogOut className="h-4 w-4 text-slate-400" />
          <span>Back to Site</span>
        </Link>
        <Link
          href="/api/dashboard/logout"
          className="nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-50 hover:text-red-700 font-medium transition-all"
        >
          <LogOut className="h-4 w-4 text-red-400" />
          <span>Sign Out</span>
        </Link>
        {process.env.NODE_ENV === 'development' && (
          <div className="px-3 pt-3 text-[10px] text-slate-400">
            Build: <span className="font-mono text-slate-500">{DEV_BUILD_MARKER}</span>
          </div>
        )}
      </div>
    </>
  );
}

// ── DashboardLayout ──────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  // Hydration guard: render mobile drawer only on client to avoid SSR mismatch.
  // The server never renders the mobile drawer (it's hidden on desktop anyway).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Fetch queue counts for badge display via API route (avoids 'use server' dynamic imports)
  useEffect(() => {
    let cancelled = false;
    async function fetchBadges() {
      try {
        const res = await fetch('/api/dashboard/badges');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setBadges(data);
        }
      } catch {
        // Silently ignore — badge is non-critical
      }
    }
    fetchBadges();
    return () => { cancelled = true; };
  }, [pathname]); // Refetch when navigating

  // Close mobile drawer when route changes
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="dashboard flex min-h-screen dashboard-layout">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Drawer — client-only to prevent SSR/hydration mismatch */}
      {mounted && (
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-72 dashboard-sidebar flex flex-col transition-transform duration-300 md:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {/* Close button */}
          <button
            onClick={closeMobile}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent pathname={pathname} badges={badges} onNavigate={closeMobile} />
        </aside>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 dashboard-sidebar hidden md:flex md:flex-col">
        <SidebarContent pathname={pathname} badges={badges} onNavigate={closeMobile} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 dashboard-header px-4 md:px-6 flex items-center justify-between shrink-0">
          {/* Mobile: Hamburger + Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard" className="text-base font-bold text-slate-800">
              Smart<span className="text-violet-600">Fin</span>Pro
            </Link>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Account Selector */}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-slate-700">SmartFinPro Analytics</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="h-4.5 w-4.5 text-slate-500" />
            </button>

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-medium text-xs">CB</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
