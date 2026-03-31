'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Store,
  Tag,
  X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

import { cn } from 'utils';
import { Card } from 'ui';

import { trpc } from '../../lib/trpc';
import { AdminTopbar } from './admin-topbar';

type NavItem = {
  label: string;
  href?: string;
  icon: typeof LayoutDashboard;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Businesses', icon: Building2 },
  { label: 'Products', icon: Store },
  { label: 'Promotions', icon: Tag },
  { label: 'Messages', icon: MessageSquareText },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
];

function AdminNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const renderedItems = useMemo(
    () =>
      navItems.map((item) => {
        const active = item.href
          ? pathname === item.href || pathname.startsWith(`${item.href}/`)
          : false;
        const Icon = item.icon;

        if (!item.href) {
          return (
            <div
              className="flex items-center justify-between rounded-[20px] px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]"
              key={item.label}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4" />
                {item.label}
              </span>
              <span className="rounded-full bg-[var(--color-background)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                Soon
              </span>
            </div>
          );
        }

        return (
          <a
            className={cn(
              'flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-medium transition-colors',
              active
                ? 'bg-[var(--color-primary)] text-white shadow-[0_12px_24px_rgba(17,39,60,0.14)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]',
            )}
            href={item.href}
            key={item.label}
            onClick={onNavigate}
          >
            <Icon className="size-4" />
            {item.label}
          </a>
        );
      }),
    [onNavigate, pathname],
  );

  return <nav className="space-y-2">{renderedItems}</nav>;
}

export function AdminShell({
  children,
  title = 'Dashboard',
}: {
  children: ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sessionQuery = trpc.auth.me.useQuery();

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[var(--color-border)] bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col px-5 py-6">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-secondary)]">
              EncuentraloTodo
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--color-primary)]">
              Admin Desk
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Opera el negocio con una vista pensada para escritorio.
            </p>
          </div>

          <AdminNav pathname={pathname} />

          <Card className="mt-auto space-y-3 p-4 hover:translate-y-0 hover:shadow-[0_12px_36px_rgba(17,39,60,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              Demo session
            </p>
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">
                {sessionQuery.data?.user?.fullName ?? 'Usuario demo'}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {sessionQuery.data?.user?.email ?? 'sin email'}
              </p>
            </div>
          </Card>
        </div>
      </aside>

      <div className="min-w-0">
        <AdminTopbar
          onOpenMenu={() => setDrawerOpen(true)}
          title={title}
          user={sessionQuery.data?.user ?? null}
        />
        <main className="px-4 py-4 sm:px-6 lg:px-8 xl:px-10">{children}</main>
      </div>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(19,39,59,0.42)] backdrop-blur-sm lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(88vw,320px)] bg-white px-5 pb-6 pt-5 shadow-2xl focus:outline-none lg:hidden">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="font-display text-2xl font-semibold text-[var(--color-primary)]">
                  Admin menu
                </Dialog.Title>
                <Dialog.Description className="text-sm text-[var(--color-text-muted)]">
                  Navegación principal del dashboard.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-primary)]"
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <AdminNav
              onNavigate={() => setDrawerOpen(false)}
              pathname={pathname}
            />

            <Card className="mt-6 space-y-3 p-4 hover:translate-y-0 hover:shadow-[0_12px_36px_rgba(17,39,60,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                Current user
              </p>
              <div>
                <p className="text-sm font-semibold text-[var(--color-primary)]">
                  {sessionQuery.data?.user?.fullName ?? 'Usuario demo'}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {sessionQuery.data?.user?.role ?? 'USER'}
                </p>
              </div>
            </Card>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
