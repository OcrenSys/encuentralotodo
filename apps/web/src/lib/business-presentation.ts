import type { UserProfile } from 'types';

export function getResponsibleLabel(business: {
    owner?: Pick<UserProfile, 'fullName' | 'email'>;
    ownerId: string;
}) {
    return business.owner?.fullName || business.owner?.email || business.ownerId;
}

export function getResponsibleSubLabel(business: {
    owner?: Pick<UserProfile, 'fullName' | 'email'>;
}) {
    if (business.owner?.fullName && business.owner?.email) {
        return business.owner.email;
    }

    return null;
}