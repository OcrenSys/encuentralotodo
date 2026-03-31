'use client';

import { Menu, Plus } from 'lucide-react';

import type { UserProfile } from 'types';
import { Button, GhostButton } from 'ui';

function getInitials(user?: UserProfile | null) {
  if (!user?.fullName) {
    return 'ET';
  }

  return user.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AdminTopbar({
  title,
  user,
  onOpenMenu,
}: {
  title: string;
  user?: UserProfile | null;
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-background)]/92 backdrop-blur-lg">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="inline-flex size-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white text-[var(--color-primary)] shadow-sm transition-colors hover:bg-[var(--color-primary)]/5 lg:hidden"
            onClick={onOpenMenu}
            type="button"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-secondary)]">
              Admin workspace
            </p>
            <h1 className="truncate font-display text-2xl font-semibold text-[var(--color-primary)]">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a className="hidden sm:block" href="/submit-business">
            <Button className="gap-2 px-4 py-2.5">
              <Plus className="size-4" />
              Nuevo negocio
            </Button>
          </a>

          <div className="flex items-center gap-3 rounded-[20px] border border-[var(--color-border)] bg-white px-3 py-2 shadow-sm">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[var(--color-primary)]">
                {user?.fullName ?? 'Usuario demo'}
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {user?.role ?? 'USER'}
              </p>
            </div>
            {user?.avatarUrl ? (
              <img
                alt={user.fullName}
                className="size-11 rounded-2xl object-cover"
                src={user.avatarUrl}
              />
            ) : (
              <GhostButton className="size-11 rounded-2xl border-none bg-[var(--color-primary)]/8 p-0 text-sm font-semibold hover:bg-[var(--color-primary)]/12">
                {getInitials(user)}
              </GhostButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
