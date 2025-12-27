'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ScanFace,
  CreditCard,
  Settings,
  LogOut,
  MessageSquare,
  Upload,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/members', icon: Users, label: 'Members' },
  { href: '/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/kiosk', icon: ScanFace, label: 'Kiosk Mode' },
  { href: '/billing', icon: CreditCard, label: 'Billing' },
  { href: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
  { href: '/automations', icon: Zap, label: 'Automations' },
  { href: '/migration', icon: Upload, label: 'Migration' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-lg rounded-xl p-3"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-slate-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold">Flow State BJJ</h1>
          <p className="text-slate-400 text-sm mt-1">Member Management</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center px-6 py-3 text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {user.name?.[0] || user.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
