import type { UserRole } from 'types';

export const platformAdminRoles = ['ADMIN', 'SUPERADMIN', 'GLOBALADMIN'] as const satisfies readonly UserRole[];
export const superAdminRoles = ['SUPERADMIN', 'GLOBALADMIN'] as const satisfies readonly UserRole[];
export const assignedPlatformRoles = ['USER', 'ADMIN', 'SUPERADMIN', 'GLOBALADMIN'] as const satisfies readonly UserRole[];
export const baseAccessRoles = ['USER'] as const satisfies readonly UserRole[];

export function hasPlatformRole(role: UserRole | null | undefined, allowedRoles: readonly UserRole[]) {
  return Boolean(role && allowedRoles.includes(role));
}

export function isSuperAdminRole(role: UserRole | null | undefined) {
  return hasPlatformRole(role, superAdminRoles);
}

export function hasConsoleAccess(role: UserRole | null | undefined) {
  return Boolean(role && role !== 'UNASSIGNED' && role !== 'NO_ACCESS');
}