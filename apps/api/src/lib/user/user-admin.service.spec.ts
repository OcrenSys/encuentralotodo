import { createCurrentUser } from 'auth';
import type { UserRole } from 'types';

import type { RepositoryPlatformUserRecord, UserAdminRepositoryPort } from './user-admin.repository';
import { UserAdminService } from './user-admin.service';

function createPlatformUser(overrides: Partial<RepositoryPlatformUserRecord> = {}): RepositoryPlatformUserRecord {
    return {
        id: 'user-ana',
        fullName: 'Ana Mercado',
        email: 'ana@encuentralotodo.app',
        role: 'USER',
        avatarUrl: null,
        isActive: true,
        createdAt: new Date('2026-04-01T10:00:00.000Z'),
        updatedAt: new Date('2026-04-01T10:00:00.000Z'),
        identities: [
            {
                provider: 'firebase',
                externalUserId: 'firebase-user-ana',
                email: 'ana@encuentralotodo.app',
                emailVerified: true,
            },
        ],
        ...overrides,
    };
}

function createRepositoryMock(): jest.Mocked<UserAdminRepositoryPort> {
    return {
        listUsers: jest.fn(),
        findUserById: jest.fn(),
        updateUserRole: jest.fn(),
        setUserActive: jest.fn(),
        countUsersByRole: jest.fn(),
    };
}

function createService(options?: {
    currentUserRole?: UserRole;
    currentUserId?: string;
    currentUserActive?: boolean;
    repository?: jest.Mocked<UserAdminRepositoryPort>;
}) {
    const repository = options?.repository ?? createRepositoryMock();

    return {
        repository,
        service: new UserAdminService({
            repository,
            currentUser: createCurrentUser({
                id: options?.currentUserId ?? 'superadmin-1',
                fullName: 'Super Admin',
                email: 'superadmin@encuentralotodo.app',
                role: options?.currentUserRole ?? 'SUPERADMIN',
                isActive: options?.currentUserActive ?? true,
                authProvider: 'firebase',
                externalAuthId: 'firebase-superadmin-1',
                emailVerified: true,
            }),
        }),
    };
}

describe('UserAdminService', () => {
    it('lists platform users for superadmins', async () => {
        const { service, repository } = createService();
        repository.listUsers.mockResolvedValue([createPlatformUser()]);

        const result = await service.listUsers();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            id: 'user-ana',
            email: 'ana@encuentralotodo.app',
            isActive: true,
            identities: [expect.objectContaining({ provider: 'firebase' })],
        });
    });

    it('rejects non-superadmin callers', async () => {
        const { service } = createService({ currentUserRole: 'ADMIN' });

        await expect(service.listUsers()).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'SuperAdmin access required.',
        });
    });

    it('updates another user role', async () => {
        const { service, repository } = createService();
        repository.findUserById.mockResolvedValue(createPlatformUser());
        repository.updateUserRole.mockResolvedValue(createPlatformUser({ role: 'ADMIN' }));

        const result = await service.updateUserRole({ userId: 'user-ana', role: 'ADMIN' });

        expect(repository.updateUserRole).toHaveBeenCalledWith('user-ana', 'ADMIN');
        expect(result).toMatchObject({ id: 'user-ana', role: 'ADMIN' });
    });

    it('rejects self role changes', async () => {
        const { service, repository } = createService({ currentUserId: 'user-ana' });
        repository.findUserById.mockResolvedValue(createPlatformUser());

        await expect(service.updateUserRole({ userId: 'user-ana', role: 'ADMIN' })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'You cannot change your own platform role.',
        });
    });

    it('prevents removing the last active superadmin role', async () => {
        const { service, repository } = createService();
        repository.findUserById.mockResolvedValue(createPlatformUser({ id: 'superadmin-2', role: 'SUPERADMIN' }));
        repository.countUsersByRole.mockResolvedValue(1);

        await expect(service.updateUserRole({ userId: 'superadmin-2', role: 'ADMIN' })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'At least one active SuperAdmin must remain on the platform.',
        });
    });

    it('disables another account', async () => {
        const { service, repository } = createService();
        repository.findUserById.mockResolvedValue(createPlatformUser({ id: 'user-ana', role: 'USER' }));
        repository.setUserActive.mockResolvedValue(createPlatformUser({ id: 'user-ana', isActive: false }));

        const result = await service.setUserActive({ userId: 'user-ana', isActive: false });

        expect(repository.setUserActive).toHaveBeenCalledWith('user-ana', false);
        expect(result).toMatchObject({ id: 'user-ana', isActive: false });
    });

    it('rejects disabling the caller account', async () => {
        const { service, repository } = createService({ currentUserId: 'superadmin-1' });
        repository.findUserById.mockResolvedValue(createPlatformUser({ id: 'superadmin-1', role: 'SUPERADMIN' }));

        await expect(service.setUserActive({ userId: 'superadmin-1', isActive: false })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'You cannot disable your own account.',
        });
    });
});