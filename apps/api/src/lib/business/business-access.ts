import type { UserProfile } from 'types';

import { hasPlatformRole, platformAdminRoles } from '../auth/authorization';

export interface BusinessAccessIdentity {
    ownerId: string;
    managers: string[];
}

export function isAdminUser(user: UserProfile | null | undefined) {
    return hasPlatformRole(user, platformAdminRoles);
}

export function isBusinessOwner(user: UserProfile | null | undefined, business: BusinessAccessIdentity) {
    return user != null && business.ownerId === user.id;
}

export function isBusinessManager(user: UserProfile | null | undefined, business: BusinessAccessIdentity) {
    return user != null && business.managers.includes(user.id);
}

export function canEditBusiness(user: UserProfile | null | undefined, business: BusinessAccessIdentity) {
    if (!user) {
        return false;
    }

    return isAdminUser(user) || isBusinessOwner(user, business);
}

export function canManageBusiness(user: UserProfile | null | undefined, business: BusinessAccessIdentity) {
    if (!user) {
        return false;
    }

    return canEditBusiness(user, business) || isBusinessManager(user, business);
}