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
    <aside className="relative hidden h-[100dvh] min-h-0 border-r border-border-subtle bg-[var(--shell-gradient)] shadow-[inset_-1px_0_0_rgba(255,255,255,0.4)] backdrop-blur lg:block">
      <div className="flex h-full min-h-0 flex-col px-5 py-6">
        <div className="mb-8 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
              EncuentraloTodo
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-text-secondary">
              Consola de gestión
            </h1>
          </div>
          <p className="text-sm leading-6 text-text-muted">
            Centro operativo para administrar el negocio, las campañas y los
            procesos internos.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain pr-2">
          <nav className="space-y-2.5">
            {items.map((item) => {
              const Icon = item.icon;
              const active = activePath === item.href;

              return (
                <a
                  className={cn(
                    'group relative flex items-start gap-3 overflow-hidden rounded-lg border px-4 py-3 transition-all duration-normal',
                    active
                      ? 'action-primary border-primary/10 text-white shadow-md'
                      : 'border-transparent bg-white/40 text-text-muted hover:border-border-default hover:bg-white/72 hover:text-text-secondary hover:shadow-sm',
                  )}
                  href={item.href}
                  key={item.key}
                >
                  <span
                    className={cn(
                      'absolute inset-y-2 left-2 w-1 rounded-full transition-opacity duration-200',
                      active
                        ? 'bg-[rgba(255,255,255,0.72)] opacity-100'
                        : 'bg-secondary opacity-0 group-hover:opacity-60',
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
                        active ? 'text-white/70' : 'text-text-muted',
                      )}
                    >
                      {item.description}
                    </span>
                  </span>
                </a>
              );
            })}
          </nav>

          <div className="surface-soft space-y-3 rounded-lg p-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                Accesos rápidos
              </p>
              {quickLinks.map((item) => (
                <a
                  className="block rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-white/90 hover:shadow-sm"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
