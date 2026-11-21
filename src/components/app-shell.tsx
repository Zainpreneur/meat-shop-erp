'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icons';
import type { IconName } from '@/components/icons';
import { Button, LoadingState } from '@/components/ui';
import type { User } from '@/lib/types';

type NavItem = { href: string; label: string; icon: IconName; adminOnly?: boolean };

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/pos', label: 'New Sale', icon: 'pos' },
  { href: '/sales', label: 'Sales History', icon: 'sales' },
  { href: '/products', label: 'Products', icon: 'products' },
  { href: '/purchases', label: 'Purchases', icon: 'purchases' },
  { href: '/suppliers', label: 'Suppliers', icon: 'suppliers' },
  { href: '/customers', label: 'Customers', icon: 'customers' },
  { href: '/expenses', label: 'Expenses', icon: 'expenses' },
  { href: '/users', label: 'Users', icon: 'users', adminOnly: true },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <Icon name="meat" size={22} />
      </span>
      <div className="min-w-0">
        <div className="truncate font-display text-sm font-bold leading-tight text-ink">Meat Shop</div>
        {!compact ? (
          <div className="truncate text-xs uppercase tracking-wider text-slate-400">Business Manager</div>
        ) : null}
      </div>
    </div>
  );
}

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
            }`}
          >
            <Icon name={item.icon} size={19} className="shrink-0" />
            <span className="truncate">{item.label}</span>
            {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function UserPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="shrink-0 border-t border-line p-4">
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
          <p className="truncate text-xs uppercase tracking-wide text-slate-400">{user.role}</p>
        </div>
      </div>
      <Button variant="secondary" className="w-full justify-start" leftIcon="logout" onClick={onLogout}>
        Sign out
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = pathname || '/';

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  if (loading || !user) {
    return (
      <div className="min-h-dvh bg-canvas p-6">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  const links = navItems.filter((item) => !item.adminOnly || isAdmin);
  const handleLogout = () => {
    void logout().catch(() => undefined);
  };

  return (
    <div className="min-h-dvh bg-canvas lg:pl-72">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Icon name="menu" size={22} />
        </button>
        <Brand compact />
        <span className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-[73px] shrink-0 items-center border-b border-line px-6">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks items={links} pathname={currentPath} />
        </div>
        <UserPanel user={user} onLogout={handleLogout} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 h-full w-full bg-slate-900/50"
          />
          <aside id="mobile-navigation" className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-surface shadow-xl">
            <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-line px-4">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavLinks items={links} pathname={currentPath} onNavigate={() => setMobileOpen(false)} />
            </div>
            <UserPanel user={user} onLogout={handleLogout} />
          </aside>
        </div>
      ) : null}

      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
