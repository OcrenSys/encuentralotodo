import type { UserProfile } from 'types';

import { canEditBusiness, canManageBusiness, isBusinessManager, isBusinessOwner } from './business-access';

const ownerUser = {
    id: 'owner-sofia',
    fullName: 'Sofia Rivas',
    email: 'sofia@encuentralotodo.app',
    role: 'USER',
} as UserProfile;

const managerUser = {
    id: 'manager-carlos',
    fullName: 'Carlos Mena',
    email: 'carlos@encuentralotodo.app',
    role: 'USER',
} as UserProfile;

const adminUser = {
    id: 'admin-luis',
    fullName: 'Luis Admin',
    email: 'luis@encuentralotodo.app',
    role: 'ADMIN',
} as UserProfile;

const business = {
    ownerId: 'owner-sofia',
    managers: ['manager-carlos'],
};

describe('business-access', () => {
    it('recognizes owners as editors and managers as non-editing operators', () => {
        expect(isBusinessOwner(ownerUser, business)).toBe(true);
        expect(canEditBusiness(ownerUser, business)).toBe(true);
        expect(isBusinessManager(managerUser, business)).toBe(true);
        expect(canEditBusiness(managerUser, business)).toBe(false);
    });

    it('allows admins to edit and manage any business', () => {
        expect(canEditBusiness(adminUser, business)).toBe(true);
        expect(canManageBusiness(adminUser, business)).toBe(true);
    });

    it('allows managers to manage but not edit business records', () => {
        expect(canManageBusiness(managerUser, business)).toBe(true);
        expect(canEditBusiness(managerUser, business)).toBe(false);
    });
});