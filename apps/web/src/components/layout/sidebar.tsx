'use client';

import { quickLinks } from '../../lib/management-navigation';
import { cn } from 'utils';

import type { NavigationItem } from '../../lib/management-navigation';

export function Sidebar({
  items,
  activePath,
}: {
  items: NavigationItem[];
  activePath: string;
}) {
  return (
    <aside className="relative hidden border-r border-[rgba(131,149,173,0.18)] bg-[linear-gradient(180deg,rgba(244,248,252,0.95),rgba(236,242,248,0.88))] shadow-[inset_-1px_0_0_rgba(255,255,255,0.4)] backdrop-blur lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-5 py-6">
        <div className="mb-8 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-secondary)]">
              EncuentraloTodo
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-[var(--color-primary)]">
              Consola de gestión
            </h1>
          </div>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Centro operativo para administrar el negocio, las campañas y los
            procesos internos.
          </p>
        </div>

        <nav className="space-y-2.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activePath === item.href;

            return (
              <a
                className={cn(
                  'group relative flex items-start gap-3 overflow-hidden rounded-[24px] border px-4 py-3 transition-all duration-200',
                  active
                    ? 'border-[rgba(31,60,90,0.08)] bg-[linear-gradient(180deg,#234565_0%,#1c3957_100%)] text-white shadow-[0_18px_34px_rgba(17,39,60,0.16)]'
                    : 'border-transparent bg-[rgba(255,255,255,0.38)] text-[var(--color-text-muted)] hover:border-[rgba(140,156,177,0.18)] hover:bg-[rgba(255,255,255,0.72)] hover:text-[var(--color-primary)] hover:shadow-[0_12px_24px_rgba(17,39,60,0.06)]',
                )}
                href={item.href}
                key={item.key}
              >
                <span
                  className={cn(
                    'absolute inset-y-2 left-2 w-1 rounded-full transition-opacity duration-200',
                    active
                      ? 'bg-[rgba(255,255,255,0.72)] opacity-100'
                      : 'bg-[var(--color-secondary)] opacity-0 group-hover:opacity-60',
                  )}
                />
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

        <div className="surface-panel-soft mt-auto space-y-3 rounded-[28px] p-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Accesos rápidos
            </p>
            {quickLinks.map((item) => (
              <a
                className="block rounded-2xl px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-white/90 hover:shadow-[0_8px_18px_rgba(17,39,60,0.06)]"
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
