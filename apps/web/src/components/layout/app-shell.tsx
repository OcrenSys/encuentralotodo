'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { EmptyState, LoadingSkeleton } from 'ui';

import {
  getDefaultPathForRole,
  getMobileNavigationForRole,
  getNavigationForRole,
  getNavigationItemByPath,
  isPathAllowedForRole,
  routeEyebrows,
} from '../../lib/management-navigation';
import { useCurrentAuthUser } from '../../lib/auth-context';
import { useRoleView } from '../../lib/role-view';
import { trpc } from '../../lib/trpc';
import { ActiveSimulationFloating } from './active-simulation-floating';
import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

function resolveEffectiveRoleView(
  roleView: ReturnType<typeof useRoleView>['roleView'],
  backendRole: string | undefined,
) {
  if (backendRole === 'SUPERADMIN' || backendRole === 'GLOBALADMIN') {
    return 'SUPERADMIN';
  }

  return roleView;
}

function hasPlatformUserManagementAccess(role: string | undefined) {
  return role === 'SUPERADMIN' || role === 'GLOBALADMIN';
}

function isRoleAssignmentPending(role: string | undefined) {
  return role === 'UNASSIGNED';
}

export function AppShell({
  activePath,
  children,
}: {
  activePath: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const { roleView, isReady } = useRoleView();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    provider,
  } = useCurrentAuthUser();
  const requiresAuth = provider !== 'mock';
  const sessionQuery = trpc.auth.me.useQuery(undefined, {
    enabled: requiresAuth && isAuthenticated,
    retry: false,
  });
  const backendUser = sessionQuery.data?.user;
  const effectiveRoleView = resolveEffectiveRoleView(
    roleView,
    backendUser?.role,
  );
  const route = getNavigationItemByPath(activePath);
  const sidebarItems = getNavigationForRole(effectiveRoleView);
  const mobileItems = getMobileNavigationForRole(effectiveRoleView);
  const isAllowed = isPathAllowedForRole(activePath, effectiveRoleView);
  const fallbackPath = getDefaultPathForRole(effectiveRoleView);
  const isBackendSessionLoading =
    requiresAuth && isAuthenticated && sessionQuery.isLoading;
  const isAccountDisabled = backendUser?.isActive === false;
  const isPendingRoleAssignment = isRoleAssignmentPending(backendUser?.role);
  const requiresPlatformUserManagementAccess = activePath === '/admin/users';
  const hasPlatformUserAccess = hasPlatformUserManagementAccess(
    backendUser?.role,
  );

  useEffect(() => {
    if (!requiresAuth || isAuthLoading || isAuthenticated) {
      return;
    }

    router.replace(`/login?next=${encodeURIComponent(activePath)}`);
  }, [activePath, isAuthenticated, isAuthLoading, requiresAuth, router]);

  if (
    !isReady ||
    (requiresAuth &&
      (isAuthLoading || !isAuthenticated || isBackendSessionLoading))
  ) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <LoadingSkeleton className="h-32" />
        <LoadingSkeleton className="h-40" />
        <LoadingSkeleton className="h-64" />
      </main>
    );
  }

  return (
    <div className="management-shell min-h-[100dvh] lg:grid lg:h-[100dvh] lg:grid-cols-[300px_minmax(0,1fr)] lg:overflow-hidden">
      <Sidebar activePath={activePath} items={sidebarItems} />
      <ActiveSimulationFloating />

      <div className="min-w-0 lg:min-h-0">
        <div
          className="flex min-h-[100dvh] flex-col overflow-y-auto overscroll-y-contain pb-24 lg:h-[100dvh] lg:min-h-0 lg:pb-0"
          ref={contentScrollRef}
        >
          <Topbar
            activePath={activePath}
            description={route?.description ?? 'Ruta de gestión.'}
            eyebrow={routeEyebrows[activePath] ?? 'Gestión'}
            scrollContainerRef={contentScrollRef}
            title={route?.label ?? 'Gestión'}
          />

          <main className="flex-1 px-4 py-4 sm:px-6 lg:min-h-0 lg:px-8 lg:py-5 xl:px-10">
            {isAccountDisabled ? (
              <EmptyState
                title="Tu cuenta está deshabilitada"
                description="Un SuperAdmin debe reactivar tu acceso antes de que puedas continuar usando la consola."
              />
            ) : isPendingRoleAssignment ? (
              <EmptyState
                title="Tu cuenta aún no tiene permisos asignados"
                description="Tu acceso ya fue autenticado, pero un administrador todavía debe asignarte un rol desde la gestión global de usuarios antes de usar la consola."
              />
            ) : isAllowed &&
              (!requiresPlatformUserManagementAccess ||
                hasPlatformUserAccess) ? (
              <div className="surface-soft space-y-6 rounded-xl p-1 sm:p-1.5">
                {children}
              </div>
            ) : requiresPlatformUserManagementAccess ? (
              <EmptyState
                title="Esta vista requiere permisos de SuperAdmin"
                description="La gestión global de usuarios solo está disponible para cuentas con acceso de plataforma elevado en el backend."
              />
            ) : (
              <EmptyState
                title="Esta vista no está disponible para el rol actual"
                description={`Cambia la vista de rol o vuelve a ${fallbackPath} para continuar en una ruta válida.`}
              />
            )}
          </main>
        </div>
        <BottomNav activePath={activePath} items={mobileItems} />
      </div>
    </div>
  );
}
