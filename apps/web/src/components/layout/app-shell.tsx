'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  ContentSectionLoadingShell,
  EmptyState,
  LoadingSkeleton,
  PageHeaderSkeleton,
} from 'ui';

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
import { hasConsoleAccess, isSuperAdminRole } from '../../lib/platform-roles';
import { useRoleView } from '../../lib/role-view';
import { trpc } from '../../lib/trpc';
import { ActiveSimulationFloating } from './active-simulation-floating';
import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

function isRoleAssignmentPending(role: string | undefined) {
  return role === 'UNASSIGNED' || role === 'NO_ACCESS';
}

export function AppShell({
  activePath,
  children,
}: {
  activePath?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const resolvedActivePath = activePath ?? pathname ?? '/settings';
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
    hasConsoleAccess(backendUser?.role);

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

  const route = getNavigationItemByPath(resolvedActivePath);
  const sidebarItems = getNavigationForAccess(accessContext);
  const mobileItems = getMobileNavigationForAccess(accessContext);
  const isAllowed = isPathAllowedForAccess(resolvedActivePath, accessContext);
  const fallbackPath = getDefaultPathForAccess(accessContext);

  const isBackendSessionLoading =
    requiresAuth && isAuthenticated && isSessionLoading;
  const isManagedBusinessAccessLoading =
    requiresAuth && isAuthenticated && managedBusinessesQuery.isLoading;
  const isAuthenticationStateLoading =
    requiresAuth && (isAuthLoading || !isAuthenticated);
  const isShellAccessLoading =
    !isReady ||
    isAuthenticationStateLoading ||
    isBackendSessionLoading ||
    isManagedBusinessAccessLoading;
  const isAccountDisabled = backendUser?.isActive === false;
  const isPendingRoleAssignment = isRoleAssignmentPending(backendUser?.role);
  const requiresPlatformUserManagementAccess =
    resolvedActivePath === '/admin/users' ||
    resolvedActivePath.startsWith('/admin/users/');
  const hasPlatformUserAccess = isSuperAdminRole(backendUser?.role);
  const accessDeniedDescription =
    provider === 'mock'
      ? `Cambia la vista de rol o vuelve a ${fallbackPath} para continuar en una ruta válida.`
      : managedBusinesses.length === 0
        ? `Tu sesión no tiene negocios asignados ni permisos de plataforma para esta ruta. Vuelve a ${fallbackPath} para continuar.`
        : `Tu sesión no tiene permisos para esta ruta. Vuelve a ${fallbackPath} para continuar en una vista permitida.`;

  useEffect(() => {
    if (!requiresAuth || isAuthLoading || isAuthenticated) {
      return;
    }

    router.replace(`/login?next=${encodeURIComponent(resolvedActivePath)}`);
  }, [
    isAuthenticated,
    isAuthLoading,
    requiresAuth,
    resolvedActivePath,
    router,
  ]);

  useEffect(() => {
    const scrollContainer = contentScrollRef.current;

    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
      return;
    }

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [resolvedActivePath]);

  if (isShellAccessLoading) {
    return (
      <div className="management-shell min-h-[100dvh] lg:grid lg:h-[100dvh] lg:grid-cols-[300px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="relative hidden h-[100dvh] min-h-0 border-r border-border-subtle bg-[var(--shell-gradient)] shadow-[inset_-1px_0_0_rgba(255,255,255,0.4)] backdrop-blur lg:block">
          <div className="flex h-full min-h-0 flex-col gap-6 px-5 py-6">
            <div className="space-y-3">
              <LoadingSkeleton className="h-4 w-32 rounded-full" />
              <LoadingSkeleton className="h-9 w-48" />
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-5/6" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <LoadingSkeleton className="h-20" key={`nav-${index}`} />
              ))}
            </div>
            <LoadingSkeleton className="mt-auto h-36 rounded-2xl" />
          </div>
        </aside>

        <div className="min-w-0 lg:min-h-0">
          <div className="flex min-h-[100dvh] flex-col overflow-y-auto overscroll-y-contain pb-24 lg:h-[100dvh] lg:min-h-0 lg:pb-0">
            <header className="sticky top-0 z-30 border-b border-border-subtle bg-[rgba(244,248,252,0.74)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
                <PageHeaderSkeleton />
                <div className="shell-chrome hidden items-center justify-between gap-4 rounded-lg px-4 py-3 lg:flex">
                  <LoadingSkeleton className="h-10 w-48 rounded-full" />
                  <LoadingSkeleton className="h-10 w-64 rounded-full" />
                </div>
              </div>
            </header>

            <main className="flex-1 px-4 py-4 sm:px-6 lg:min-h-0 lg:px-8 lg:py-5 xl:px-10">
              <div className="surface-soft space-y-6 rounded-xl p-1 sm:p-1.5">
                <div className="p-4 sm:p-5 lg:p-6">
                  <ContentSectionLoadingShell variant="table" />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="management-shell min-h-[100dvh] lg:grid lg:h-[100dvh] lg:grid-cols-[300px_minmax(0,1fr)] lg:overflow-hidden">
      <Sidebar activePath={resolvedActivePath} items={sidebarItems} />
      {provider === 'mock' ? <ActiveSimulationFloating /> : null}

      <div className="min-w-0 lg:min-h-0">
        <div
          className="flex min-h-[100dvh] flex-col overflow-y-auto overscroll-y-contain pb-24 lg:h-[100dvh] lg:min-h-0 lg:pb-0"
          ref={contentScrollRef}
        >
          <Topbar
            activePath={resolvedActivePath}
            description={route?.description ?? 'Ruta de gestión.'}
            eyebrow={routeEyebrows[resolvedActivePath] ?? 'Gestión'}
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
                description="Tu acceso ya fue autenticado, pero un administrador todavía debe asignarte acceso base antes de usar la consola."
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
        <BottomNav activePath={resolvedActivePath} items={mobileItems} />
      </div>
    </div>
  );
}
