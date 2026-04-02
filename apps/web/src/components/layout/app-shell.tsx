'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { EmptyState, LoadingSkeleton } from 'ui';

import {
  getDefaultPathForAccess,
  getMobileNavigationForAccess,
  getNavigationForAccess,
  getNavigationItemByPath,
  isPathAllowedForAccess,
  routeEyebrows,
} from '../../lib/management-navigation';
import { useCurrentAuthUser } from '../../lib/auth-context';
import { useCurrentPlatformUser } from '../../lib/platform-authorization';
import { isSuperAdminRole } from '../../lib/platform-roles';
import { useRoleView } from '../../lib/role-view';
import { trpc } from '../../lib/trpc';
import { ActiveSimulationFloating } from './active-simulation-floating';
import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

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
  const { currentUser: backendUser, isLoading: isSessionLoading } =
    useCurrentPlatformUser();
  const requiresAuth = provider !== 'mock';
  const shouldResolveManagedBusinesses =
    requiresAuth &&
    isAuthenticated &&
    Boolean(backendUser) &&
    backendUser?.isActive !== false &&
    backendUser?.role !== 'UNASSIGNED';
  const managedBusinessesQuery = trpc.business.managed.useQuery(undefined, {
    enabled: shouldResolveManagedBusinesses,
    retry: false,
  });
  const managedBusinesses = managedBusinessesQuery.data ?? [];
  const accessContext =
    provider === 'mock'
      ? { mode: 'mock' as const, role: roleView }
      : {
          mode: 'real' as const,
          role: backendUser?.role,
          hasManagedBusinesses: managedBusinesses.length > 0,
          ownsManagedBusinesses: managedBusinesses.some(
            (business) => business.owner?.id === backendUser?.id,
          ),
        };
  const route = getNavigationItemByPath(activePath);
  const sidebarItems = getNavigationForAccess(accessContext);
  const mobileItems = getMobileNavigationForAccess(accessContext);
  const isAllowed = isPathAllowedForAccess(activePath, accessContext);
  const fallbackPath = getDefaultPathForAccess(accessContext);
  const isBackendSessionLoading =
    requiresAuth && isAuthenticated && isSessionLoading;
  const isManagedBusinessAccessLoading =
    requiresAuth && isAuthenticated && managedBusinessesQuery.isLoading;
  const isAccountDisabled = backendUser?.isActive === false;
  const isPendingRoleAssignment = isRoleAssignmentPending(backendUser?.role);
  const requiresPlatformUserManagementAccess = activePath === '/admin/users';
  const hasPlatformUserAccess = isSuperAdminRole(backendUser?.role);
  const accessDeniedDescription =
    provider === 'mock'
      ? `Cambia la vista de rol o vuelve a ${fallbackPath} para continuar en una ruta válida.`
      : managedBusinesses.length === 0
        ? `Tu sesión real no tiene negocios asignados ni permisos de plataforma para esta ruta. Vuelve a ${fallbackPath} para continuar.`
        : `Tu sesión real no tiene permisos para esta ruta. Vuelve a ${fallbackPath} para continuar en una vista permitida.`;

  useEffect(() => {
    if (!requiresAuth || isAuthLoading || isAuthenticated) {
      return;
    }

    router.replace(`/login?next=${encodeURIComponent(activePath)}`);
  }, [activePath, isAuthenticated, isAuthLoading, requiresAuth, router]);

  if (
    !isReady ||
    (requiresAuth &&
      (isAuthLoading ||
        !isAuthenticated ||
        isBackendSessionLoading ||
        isManagedBusinessAccessLoading))
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
      {provider === 'mock' ? <ActiveSimulationFloating /> : null}

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
                description={accessDeniedDescription}
              />
            )}
          </main>
        </div>
        <BottomNav activePath={activePath} items={mobileItems} />
      </div>
    </div>
  );
}
