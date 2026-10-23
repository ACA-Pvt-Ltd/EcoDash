'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Truck,
  Building2,
  ClipboardList,
  Settings,
  HelpCircle,
  UserCog,
  ShieldCheck,
  LogOut,
  Leaf,
  type LucideIcon,
} from 'lucide-react';
import { AccessProvider, useAccess } from '@/lib/access';
import { NoAccessCard } from '@/components/admin-ui';
import { GlassBackdrop } from '@/components/glass-backdrop';
import { ThemeToggle } from '@/lib/theme';

// `permission` must match a key in backend/config/adminPermissions.js
const NAV_ITEMS: { label: string; href: string; Icon: LucideIcon; permission: string }[] = [
  { label: 'Dashboard',       href: '/dashboard',    Icon: LayoutDashboard, permission: 'dashboard.view'    },
  { label: 'Users',           href: '/users',        Icon: Users,           permission: 'users.view'        },
  { label: 'Collectors',      href: '/collectors',   Icon: Truck,           permission: 'collectors.view'   },
  { label: 'Vendors',         href: '/vendors',      Icon: Building2,       permission: 'vendors.view'      },
  { label: 'Transactions',    href: '/transactions', Icon: ClipboardList,   permission: 'transactions.view' },
  { label: 'Configuration',   href: '/config',       Icon: Settings,        permission: 'config.view'       },
  { label: 'Help Content',    href: '/content',      Icon: HelpCircle,      permission: 'content.view'      },
  { label: 'Admin Accounts',  href: '/admins',       Icon: UserCog,         permission: 'admins.manage'     },
  { label: 'Roles & Access',  href: '/roles',        Icon: ShieldCheck,     permission: 'roles.manage'      },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccessProvider>
      <AdminShell>{children}</AdminShell>
    </AccessProvider>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { me, loading, error, can } = useAccess();

  const navItems    = NAV_ITEMS.filter(n => can(n.permission));
  const currentItem = NAV_ITEMS.find(n => pathname.startsWith(n.href));
  const allowed     = !currentItem || can(currentItem.permission);
  const pageTitle   = currentItem?.label ?? 'EcoDash Admin';
  const adminName   = me?.name || 'Administrator';
  const initial     = adminName.charAt(0).toUpperCase();

  // Login always lands on /dashboard; send admins without dashboard access to their first page
  useEffect(() => {
    if (!loading && me && !allowed && pathname.startsWith('/dashboard') && navItems.length > 0) {
      router.replace(navItems[0].href);
    }
  }, [loading, me, allowed, pathname, navItems, router]);

  function handleLogout() {
    document.cookie = 'ecodash_admin_token=; path=/; max-age=0';
    localStorage.removeItem('ecodash_admin_token');
    localStorage.removeItem('ecodash_admin_name');
    router.replace('/login');
  }

  return (
    <div className="relative flex h-screen gap-4 overflow-hidden p-4">
      <GlassBackdrop />

      {/* Sidebar */}
      <aside className="glass-strong flex w-[248px] shrink-0 flex-col overflow-hidden">

        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/30 to-teal-500/10 ring-1 ring-emerald-300/30 shadow-[0_0_24px_-4px_rgba(52,211,153,0.6)]">
            <Leaf size={16} className="text-emerald-300" />
          </div>
          <div>
            <div className="text-[16px] font-semibold tracking-tight text-white">EcoDash</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Admin Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ label, href, Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.10] text-white ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                )}
                <Icon size={19} className={isActive ? 'text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.7)]' : ''} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Admin info + logout */}
        <div className="space-y-1 border-t border-white/[0.08] px-3 pb-4 pt-3">
          {me && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-slate-100">{adminName}</div>
                <div className="text-[10px] text-slate-400">{me.role?.name ?? 'No role'}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-all hover:bg-white/[0.05] hover:text-slate-100"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <header className="glass-strong flex h-[60px] shrink-0 items-center justify-between px-6">
          <h1 className="text-[16px] font-semibold tracking-tight text-slate-100">{pageTitle}</h1>
          <div className="flex items-center gap-2.5">
            <ThemeToggle className="mr-1" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/15 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
              {initial}
            </div>
            <span className="text-[13px] font-medium text-slate-200">{adminName}</span>
            {me?.role && (
              <span className="chip-green rounded-full px-2 py-0.5 text-[11px] font-semibold">
                {me.role.name}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto rounded-2xl pb-2 pr-1">
          {loading ? (
            <div className="flex justify-center py-24"><div className="spinner" /></div>
          ) : error ? (
            <div className="notice-error px-5 py-4 text-sm">{error}</div>
          ) : allowed ? (
            children
          ) : (
            <NoAccessCard
              pageName={pageTitle}
              fallback={navItems[0] ? { label: navItems[0].label, href: navItems[0].href } : null}
            />
          )}
        </main>
      </div>
    </div>
  );
}
