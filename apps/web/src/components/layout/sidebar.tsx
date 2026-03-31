'use client';

import { quickLinks } from '../../lib/management-navigation';
import { roleProfiles, useRoleView } from '../../lib/role-view';
import { cn } from 'utils';

import type { NavigationItem } from '../../lib/management-navigation';

export function Sidebar({
  items,
  activePath,
}: {
  items: NavigationItem[];
  activePath: string;
}) {
  const { roleView } = useRoleView();
  const currentProfile = roleProfiles[roleView];

  return (
    <aside className="hidden border-r border-[var(--color-border)] bg-white/88 backdrop-blur lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-5 py-6">
        <div className="mb-8 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-secondary)]">
              EncuentraloTodo
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-[var(--color-primary)]">
              Management Console
            </h1>
          </div>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Workspace operativo para administrar negocio, campañas y procesos
            internos.
          </p>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activePath === item.href;

            return (
              <a
                className={cn(
                  'flex items-start gap-3 rounded-[22px] px-4 py-3 transition-colors',
                  active
                    ? 'bg-[var(--color-primary)] text-white shadow-[0_18px_34px_rgba(17,39,60,0.16)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]',
                )}
                href={item.href}
                key={item.key}
              >
                <Icon className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      'mt-1 block text-xs leading-5',
                      active
                        ? 'text-white/70'
                        : 'text-[var(--color-text-muted)]',
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              </a>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-background)]/88 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Active simulation
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-primary)]">
              {currentProfile.fullName}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {currentProfile.label}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Quick links
            </p>
            {quickLinks.map((item) => (
              <a
                className="block rounded-2xl px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-white"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
