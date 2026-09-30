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
    <div className="flex h-screen overflow-hidden bg-[#f4f6f5]">

      {/* Sidebar */}
      <aside className="flex w-[240px] shrink-0 flex-col" style={{ backgroundColor: '#0d2218' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.07]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#1a4a2a' }}>
            <Leaf size={15} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-[16px] font-semibold tracking-tight text-white">EcoDash</div>
            <div className="text-[10px] font-medium tracking-widest text-white/40 uppercase">Admin Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, href, Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[16px] font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.09] text-white'
                    : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-400" />
                )}
                <Icon size={20} className={isActive ? 'text-emerald-400' : ''} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Admin info + logout */}
        <div className="px-3 pb-4 pt-3 border-t border-white/[0.07] space-y-1">
          {me && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ backgroundColor: '#1e5c34', color: '#6ee7a0' }}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-white/80">{adminName}</div>
                <div className="text-[10px] text-white/40">{me.role?.name ?? 'No role'}</div>
              </div>
            </div>
          )}
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
            {me?.role && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {me.role.name}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" /></div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>
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
