'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Truck,
  Building2,
  ClipboardList,
  Settings,
  LogOut,
  Leaf,
  type LucideIcon,
} from 'lucide-react';

const NAV_ITEMS: { label: string; href: string; Icon: LucideIcon }[] = [
  { label: 'Dashboard',     href: '/dashboard',   Icon: LayoutDashboard },
  { label: 'Users',         href: '/users',        Icon: Users           },
  { label: 'Collectors',    href: '/collectors',   Icon: Truck           },
  { label: 'Vendors',       href: '/vendors',      Icon: Building2       },
  { label: 'Transactions',  href: '/transactions', Icon: ClipboardList   },
  { label: 'Configuration', href: '/config',       Icon: Settings        },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [adminName] = useState<string>(() =>
    (typeof window !== 'undefined' && localStorage.getItem('ecodash_admin_name')) || 'Administrator'
  );

  const pageTitle  = NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label ?? 'EcoDash Admin';
  const initial    = adminName.charAt(0).toUpperCase();

  function handleLogout() {
    document.cookie = 'ecodash_admin_token=; path=/; max-age=0';
    localStorage.removeItem('ecodash_admin_token');
    localStorage.removeItem('ecodash_admin_name');
    router.replace('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f5]">

      {/* Sidebar */}
      <aside className="flex w-[240px] shrink-0 flex-col" style={{ backgroundColor: '#0d2218' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.07]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#1a4a2a' }}>
            <Leaf size={15} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-white">EcoDash</div>
            <div className="text-[10px] font-medium tracking-widest text-white/40 uppercase">Admin Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.09] text-white'
                    : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-400" />
                )}
                <Icon size={15} className={isActive ? 'text-emerald-400' : ''} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Admin info + logout */}
        <div className="px-3 pb-4 pt-3 border-t border-white/[0.07] space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ backgroundColor: '#1e5c34', color: '#6ee7a0' }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold text-white/80">{adminName}</div>
              <div className="text-[10px] text-white/35">Super Admin</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.05] hover:text-white/80"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-gray-200/70 bg-white px-6">
          <h1 className="text-[15px] font-semibold text-gray-800">{pageTitle}</h1>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ backgroundColor: '#e6f4ea', color: '#166534' }}
            >
              {initial}
            </div>
            <span className="text-[13px] font-medium text-gray-700">{adminName}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
