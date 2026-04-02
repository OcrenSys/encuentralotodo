import type { UserProfile } from 'types';

import { hasPlatformRole, platformAdminRoles } from '../auth/authorization';

export interface BusinessAccessIdentity {
    ownerId: string;
    managers: string[];
}

export function isAdminUser(user: UserProfile | null | undefined) {
    return hasPlatformRole(user, platformAdminRoles);
}

export function canManageBusiness(user: UserProfile | null | undefined, business: BusinessAccessIdentity) {
    if (!user) {
        return false;
    }

    if (isAdminUser(user)) {
        return true;
    }

    return business.ownerId === user.id || business.managers.includes(user.id);
}