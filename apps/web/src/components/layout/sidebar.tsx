'use client';

import type { NavigationGroup } from '../../lib/management-navigation';

import { ManagementNavigationList } from './management-navigation-list';

export function Sidebar({
  groups,
  activePath,
}: {
  groups: NavigationGroup[];
  activePath: string;
}) {
  return (
    <aside className="relative hidden h-full min-h-0 border-r border-border-subtle bg-[var(--shell-gradient)] shadow-[inset_-1px_0_0_rgba(255,255,255,0.4)] backdrop-blur lg:block">
      <div className="flex h-full min-h-0 flex-col px-4 py-5 xl:px-5 xl:py-6">
        <div className="mb-6 space-y-2.5 xl:mb-7 xl:space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
              EncuentraloTodo
            </p>
            <h1 className="mt-1.5 font-display text-[1.7rem] font-semibold leading-tight text-text-secondary xl:text-2xl">
              Consola de gestión
            </h1>
          </div>
          <p className="max-w-[18rem] text-[13px] leading-5 text-text-muted xl:text-sm xl:leading-6">
            Centro operativo para administrar el negocio, campañas y procesos
            internos.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain pr-1.5 xl:pr-2">
          <ManagementNavigationList
            activePath={activePath}
            groups={groups}
            showQuickLinks
            variant="compact"
          />
        </div>
      </div>
    </aside>
  );
}
