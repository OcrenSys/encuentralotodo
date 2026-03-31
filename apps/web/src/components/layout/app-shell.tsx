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
import { ActiveSimulationFloating } from './active-simulation-floating';
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
    <div className="management-shell min-h-screen lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <Sidebar activePath={activePath} items={sidebarItems} />
      <ActiveSimulationFloating />

      <div className="min-w-0 pb-24 lg:pb-0">
        <Topbar
          activePath={activePath}
          description={route?.description ?? 'Ruta de gestión.'}
          eyebrow={routeEyebrows[activePath] ?? 'Workspace'}
          title={route?.label ?? 'Management'}
        />

        <main className="px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          {isAllowed ? (
            <div className="space-y-6 rounded-[32px] border border-[rgba(140,156,177,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.36),rgba(248,251,255,0.18))] p-1 sm:p-1.5">
              {children}
            </div>
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
