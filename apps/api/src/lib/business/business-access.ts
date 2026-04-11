import type { UserProfile } from 'types';

import { hasPlatformRole, platformAdminRoles } from '../auth/authorization';

export interface BusinessAccessIdentity {
    ownerId?: string;
    managers?: string[];
    memberships?: Array<{
        userId: string;
        role: 'OWNER' | 'MANAGER';
    }>;
}

export function isAdminUser(user: UserProfile | null | undefined) {
    return hasPlatformRole(user, platformAdminRoles);
}

export function getBusinessMembershipRole(user: UserProfile | null | undefined, business: BusinessAccessIdentity) {
    if (!user) {
        return null;
    }

    const canonicalMembership = business.memberships?.find((membership) => membership.userId === user.id);
    if (canonicalMembership) {
        return canonicalMembership.role;
    }

    if (business.ownerId === user.id) {
        return 'OWNER';
    }

    if (business.managers?.includes(user.id)) {
        return 'MANAGER';
    }

    return null;
}

export function isBusinessOwner(user: UserProfile | null | undefined, business: BusinessAccessIdentity) {
    return getBusinessMembershipRole(user, business) === 'OWNER';
}

export function isBusinessManager(user: UserProfile | null | undefined, business: BusinessAccessIdentity) {
    return getBusinessMembershipRole(user, business) === 'MANAGER';
}

export function canEditBusiness(user: UserProfile | null | undefined, business: BusinessAccessIdentity) {
    if (!user) {
        return false;
    }

    return isAdminUser(user) || isBusinessOwner(user, business);
}

export function canEditBusinessOperationally(user: UserProfile | null | undefined, business: BusinessAccessIdentity) {
    if (!user) {
        return false;
    }

    return isAdminUser(user) || isBusinessOwner(user, business) || isBusinessManager(user, business);
}

export function canManageBusiness(user: UserProfile | null | undefined, business: BusinessAccessIdentity) {
    return canEditBusinessOperationally(user, business);
}