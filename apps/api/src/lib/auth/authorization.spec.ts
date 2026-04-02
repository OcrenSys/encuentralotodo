import { createCurrentUser } from 'auth';

import {
    hasPlatformRole,
    isSuperAdmin,
    platformAdminRoles,
    requireActiveUser,
    requireAuthenticatedUser,
    requirePlatformRole,
    requireSuperAdmin,
} from './authorization';

function createUser(overrides?: Partial<ReturnType<typeof createCurrentUser>>) {
    return createCurrentUser({
        id: 'user-1',
        fullName: 'Ana Mercado',
        email: 'ana@encuentralotodo.app',
        role: 'USER',
        isActive: true,
        authProvider: 'firebase',
        externalAuthId: 'firebase-user-1',
        emailVerified: true,
        ...overrides,
    });
}

describe('authorization helpers', () => {
    it('requireAuthenticatedUser rejects missing users', () => {
        expect(() => requireAuthenticatedUser(null)).toThrow(expect.objectContaining({
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
        }));
    });

    it('requireActiveUser rejects inactive users', () => {
        expect(() => requireActiveUser(createUser({ isActive: false }))).toThrow(expect.objectContaining({
            code: 'FORBIDDEN',
            message: 'User account is disabled.',
        }));
    });

    it('requirePlatformRole allows valid platform roles', () => {
        const currentUser = createUser({ role: 'ADMIN' });

        expect(requirePlatformRole(currentUser, platformAdminRoles, 'Admin access required.')).toBe(currentUser);
    });

    it('requirePlatformRole rejects invalid platform roles', () => {
        expect(() => requirePlatformRole(createUser({ role: 'USER' }), platformAdminRoles, 'Admin access required.')).toThrow(
            expect.objectContaining({
                code: 'FORBIDDEN',
                message: 'Admin access required.',
            }),
        );
    });

    it('requireSuperAdmin allows superadmins', () => {
        const currentUser = createUser({ role: 'SUPERADMIN' });

        expect(requireSuperAdmin(currentUser)).toBe(currentUser);
        expect(isSuperAdmin(currentUser)).toBe(true);
    });

    it('boolean role helpers reflect the provided platform role', () => {
        expect(hasPlatformRole(createUser({ role: 'GLOBALADMIN' }), platformAdminRoles)).toBe(true);
        expect(isSuperAdmin(createUser({ role: 'ADMIN' }))).toBe(false);
    });
});