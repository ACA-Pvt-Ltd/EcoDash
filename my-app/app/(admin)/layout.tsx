'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Users', href: '/users', icon: '👥' },
  { label: 'Collectors', href: '/collectors', icon: '🚛' },
  { label: 'Vendors', href: '/vendors', icon: '🏭' },
  { label: 'Transactions', href: '/transactions', icon: '📋' },
  { label: 'Configuration', href: '/config', icon: '⚙️' },
];

function getPageTitle(pathname: string): string {
  const item = NAV_ITEMS.find(n => pathname.startsWith(n.href));
  return item ? item.label : 'EcoDash Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    document.cookie = 'ecodash_admin_token=; path=/; max-age=0';
    localStorage.removeItem('ecodash_admin_token');
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className="flex w-60 flex-shrink-0 flex-col"
        style={{ backgroundColor: '#064e3b' }}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-green-800">
          <div className="text-2xl font-bold text-white">🌿 EcoDash</div>
          <div className="text-xs text-green-300 mt-0.5 tracking-wide uppercase">Admin Panel</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-green-100 hover:bg-green-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-green-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-green-200 hover:bg-green-800 hover:text-white transition-colors"
          >
            <span className="text-lg">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 flex-shrink-0 items-center border-b border-gray-200 bg-white px-6">
          <h1 className="text-lg font-semibold text-gray-800">
            {getPageTitle(pathname)}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
