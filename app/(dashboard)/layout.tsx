'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Link2,
  BarChart3,
  DollarSign,
  Settings,
  LogOut,
  Sparkles,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Affiliate Links', href: '/dashboard/links', icon: Link2 },
  { name: 'Quiz Analytics', href: '/dashboard/quiz', icon: Sparkles },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Revenue', href: '/dashboard/revenue', icon: DollarSign },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="dashboard flex min-h-screen dashboard-layout">
      {/* Sidebar */}
      <aside className="w-64 dashboard-sidebar p-6 hidden md:flex md:flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SF</span>
          </div>
          <Link href="/dashboard" className="text-xl font-bold text-slate-800">
            SmartFinPro
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                  isActive
                    ? 'bg-emerald-50 text-emerald-600 border-l-3 border-emerald-500'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                )}
              >
                <link.icon className={cn(
                  'h-5 w-5',
                  isActive ? 'text-emerald-500' : 'text-slate-400'
                )} />
                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Links */}
        <div className="pt-6 border-t border-slate-200">
          <Link
            href="/"
            className="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
          >
            <LogOut className="h-5 w-5 text-slate-400" />
            <span className="font-medium">Back to Site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 dashboard-header px-6 flex items-center justify-between">
          <div className="md:hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Account Selector */}
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-slate-700">SmartFinPro Analytics</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="h-5 w-5 text-slate-500" />
            </button>

            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-white font-medium text-sm">AD</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
