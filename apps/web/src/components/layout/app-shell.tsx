'use client';

import { EmptyState, LoadingSkeleton } from 'ui';

import {
  getDefaultPathForRole,
  getMobileNavigationForRole,
  getNavigationForRole,
  getNavigationItemByPath,
  isPathAllowedForRole,
  routeEyebrows,
} from '../../lib/management-navigation';
import { useRoleView } from '../../lib/role-view';
import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppShell({
  activePath,
  children,
}: {
  activePath: string;
  children: React.ReactNode;
}) {
  const { roleView, isReady } = useRoleView();
  const route = getNavigationItemByPath(activePath);
  const sidebarItems = getNavigationForRole(roleView);
  const mobileItems = getMobileNavigationForRole(roleView);
  const isAllowed = isPathAllowedForRole(activePath, roleView);
  const fallbackPath = getDefaultPathForRole(roleView);

  if (!isReady) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <LoadingSkeleton className="h-32" />
        <LoadingSkeleton className="h-40" />
        <LoadingSkeleton className="h-64" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <Sidebar activePath={activePath} items={sidebarItems} />

      <div className="min-w-0 pb-24 lg:pb-0">
        <Topbar
          activePath={activePath}
          description={route?.description ?? 'Ruta de gestión.'}
          eyebrow={routeEyebrows[activePath] ?? 'Workspace'}
          title={route?.label ?? 'Management'}
        />

        <main className="px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          {isAllowed ? (
            children
          ) : (
            <EmptyState
              title="Esta vista no está disponible para el rol actual"
              description={`Cambia el role switcher o vuelve a ${fallbackPath} para continuar en una ruta válida.`}
            />
          )}
        </main>

        <BottomNav activePath={activePath} items={mobileItems} />
      </div>
    </div>
  );
}
