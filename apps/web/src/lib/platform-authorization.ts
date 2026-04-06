'use client';

import type { UserRole } from 'types';

import { useCurrentAuthUser } from './auth-context';
import { hasPlatformRole, isSuperAdminRole } from './platform-roles';
import { trpc } from './trpc';

export function useCurrentPlatformUser() {
  const { provider, isAuthenticated } = useCurrentAuthUser();
  const sessionQuery = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  return {
    ...sessionQuery,
    provider,
    isMockMode: provider === 'mock',
    currentUser: sessionQuery.data?.user ?? null,
  };
}

export function useCurrentUserRole() {
  const { currentUser, ...session } = useCurrentPlatformUser();

  return {
    ...session,
    role: currentUser?.role ?? null,
    currentUser,
  };
}

export function useHasPlatformRole(allowedRoles: readonly UserRole[]) {
  const { role } = useCurrentUserRole();
  return hasPlatformRole(role, allowedRoles);
}

export function useIsSuperAdmin() {
  const { role } = useCurrentUserRole();
  return isSuperAdminRole(role);
}