import { TRPCError } from '@trpc/server';
import type { CurrentUser } from 'auth';
import type { UserRole, UserProfile } from 'types';

type RoleSubject = Pick<UserProfile, 'role'> | null | undefined;
type ActiveSubject = Pick<CurrentUser, 'isActive'> | null | undefined;

export const platformAdminRoles = ['ADMIN', 'SUPERADMIN', 'GLOBALADMIN'] as const satisfies readonly UserRole[];
export const superAdminRoles = ['SUPERADMIN', 'GLOBALADMIN'] as const satisfies readonly UserRole[];

export interface FutureBusinessAuthorizationContext {
    userId: string;
    businessId: string;
    membershipRoles?: readonly string[];
}

export interface FutureBusinessPlanAuthorizationContext {
    businessId: string;
    featureKey?: string;
    limitKey?: string;
}

export function hasPlatformRole(subject: RoleSubject, allowedRoles: readonly UserRole[]) {
    return Boolean(subject && allowedRoles.includes(subject.role));
}

export function isSuperAdmin(subject: RoleSubject) {
    return hasPlatformRole(subject, superAdminRoles);
}

export function requireAuthenticatedUser(currentUser: CurrentUser | null | undefined): CurrentUser {
    if (!currentUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    return currentUser;
}

export function requireActiveUser<TCurrentUser extends CurrentUser | null | undefined>(currentUser: TCurrentUser) {
    const authenticatedUser = requireAuthenticatedUser(currentUser);

    if (isInactiveSubject(authenticatedUser)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'User account is disabled.' });
    }

    return authenticatedUser;
}

export function requirePlatformRole(
    currentUser: CurrentUser | null | undefined,
    allowedRoles: readonly UserRole[],
    message = 'Platform role access required.',
) {
    const activeUser = requireActiveUser(currentUser);

    if (!hasPlatformRole(activeUser, allowedRoles)) {
        throw new TRPCError({ code: 'FORBIDDEN', message });
    }

    return activeUser;
}

export function requireSuperAdmin(currentUser: CurrentUser | null | undefined) {
    return requirePlatformRole(currentUser, superAdminRoles, 'SuperAdmin access required.');
}

function isInactiveSubject(subject: ActiveSubject) {
    return subject?.isActive === false;
}