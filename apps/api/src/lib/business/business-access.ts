import type { UserProfile } from 'types';

export interface BusinessAccessIdentity {
    ownerId: string;
    managers: string[];
}

export function isAdminUser(user: UserProfile | null | undefined) {
    return Boolean(user && ['ADMIN', 'SUPERADMIN', 'GLOBALADMIN'].includes(user.role));
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