import { TRPCError } from '@trpc/server';
import type { CurrentUser } from 'auth';
import type {
    ListPlatformUsersInput,
    ManagementListResult,
    PlatformUserSearchResult,
    PlatformUser,
    SearchPlatformUsersInput,
    SetPlatformUserActiveInput,
    UpdatePlatformUserRoleInput,
} from 'types';

import {
    isSuperAdmin,
    platformAdminRoles,
    requirePlatformRole,
    requireSuperAdmin,
} from '../auth/authorization';
import type {
    RepositoryPlatformUserSearchRecord,
    RepositoryPlatformUserRecord,
    UserAdminRepositoryPort,
} from './user-admin.repository';

interface UserAdminServiceDependencies {
    repository: UserAdminRepositoryPort;
    currentUser: CurrentUser | null;
}

function hasSuperAdminAccess(currentUser: CurrentUser | null) {
    return isSuperAdmin(currentUser);
}

function mapPlatformUser(record: RepositoryPlatformUserRecord): PlatformUser {
    return {
        id: record.id,
        fullName: record.fullName,
        email: record.email,
        role: record.role,
        avatarUrl: record.avatarUrl ?? undefined,
        isActive: record.isActive,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        identities: record.identities.map((identity) => ({
            provider: identity.provider,
            externalUserId: identity.externalUserId,
            email: identity.email ?? undefined,
            emailVerified: identity.emailVerified,
        })),
    };
}

function mapPlatformUserSearchResult(
    record: RepositoryPlatformUserSearchRecord,
): PlatformUserSearchResult {
    return {
        id: record.id,
        fullName: record.fullName,
        email: record.email,
        role: record.role,
        avatarUrl: record.avatarUrl ?? undefined,
        isActive: record.isActive,
    };
}

export class UserAdminService {
    constructor(private readonly dependencies: UserAdminServiceDependencies) { }

    async listUsers(): Promise<PlatformUser[]> {
        this.assertSuperAdmin();
        const users = await this.dependencies.repository.listUsers();

        return users.map(mapPlatformUser);
    }

    async listUsersPage(input: ListPlatformUsersInput): Promise<ManagementListResult<PlatformUser>> {
        this.assertSuperAdmin();
        const result = await this.dependencies.repository.listUsersPage(input);

        return {
            items: result.items.map(mapPlatformUser),
            page: input.page,
            pageSize: input.pageSize,
            total: result.total,
            totalPages: Math.max(1, Math.ceil(result.total / input.pageSize)),
        };
    }

    async searchUsers(input: SearchPlatformUsersInput): Promise<PlatformUserSearchResult[]> {
        this.assertPlatformAdmin();
        const users = await this.dependencies.repository.searchUsers({
            search: input.search,
            limit: Math.min(input.limit, 10),
        });

        return users.map(mapPlatformUserSearchResult);
    }

    async updateUserRole(input: UpdatePlatformUserRoleInput): Promise<PlatformUser> {
        const actor = this.assertSuperAdmin();
        const targetUser = await this.getExistingUser(input.userId);

        if (actor.id === targetUser.id) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'You cannot change your own platform role.',
            });
        }

        if (targetUser.role === 'SUPERADMIN' && input.role !== 'SUPERADMIN') {
            await this.assertAnotherActiveSuperAdminExists();
        }

        const updatedUser = await this.dependencies.repository.updateUserRole(input.userId, input.role);

        if (!updatedUser) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
        }

        return mapPlatformUser(updatedUser);
    }

    async setUserActive(input: SetPlatformUserActiveInput): Promise<PlatformUser> {
        const actor = this.assertSuperAdmin();
        const targetUser = await this.getExistingUser(input.userId);

        if (actor.id === targetUser.id && input.isActive === false) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'You cannot disable your own account.',
            });
        }

        if (targetUser.role === 'SUPERADMIN' && targetUser.isActive && input.isActive === false) {
            await this.assertAnotherActiveSuperAdminExists();
        }

        const updatedUser = await this.dependencies.repository.setUserActive(input.userId, input.isActive);

        if (!updatedUser) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
        }

        return mapPlatformUser(updatedUser);
    }

    private assertSuperAdmin(): CurrentUser {
        return requireSuperAdmin(this.dependencies.currentUser);
    }

    private assertPlatformAdmin(): CurrentUser {
        return requirePlatformRole(
            this.dependencies.currentUser,
            platformAdminRoles,
            'Admin access required.',
        );
    }

    private async getExistingUser(userId: string) {
        const user = await this.dependencies.repository.findUserById(userId);

        if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
        }

        return user;
    }

    private async assertAnotherActiveSuperAdminExists() {
        const superAdminCount = await this.dependencies.repository.countUsersByRole('SUPERADMIN', true);

        if (superAdminCount <= 1) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'At least one active SuperAdmin must remain on the platform.',
            });
        }
    }
}