import { TRPCError } from '@trpc/server';
import type { CurrentUser } from 'auth';
import type {
    AdminUserDetail,
    AdminUserProfileUpdateInput,
    AssignUserBusinessRoleInput,
    AuditLogEntry,
    BaseUserRole,
    ListPlatformUsersInput,
    ManagementListResult,
    PlatformUserSearchResult,
    PlatformUser,
    RemoveUserBusinessRoleInput,
    SearchPlatformUsersInput,
    SetPlatformUserActiveInput,
    SelfProfile,
    SelfProfileUpdateInput,
    TransferBusinessOwnershipInput,
    UpdateBaseUserRoleInput,
    UpdatePlatformUserRoleInput,
    UserBusinessAssignment,
} from 'types';

import {
    isSuperAdmin,
    platformAdminRoles,
    requirePlatformRole,
    requireSuperAdmin,
} from '../auth/authorization';
import type {
    RepositoryAuditLogRecord,
    RepositoryBusinessOptionRecord,
    RepositoryPlatformUserSearchRecord,
    RepositoryPlatformUserRecord,
    RepositoryUserBusinessRoleRecord,
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
        phone: record.phone ?? undefined,
        isActive: record.isActive,
        lastAccessAt: record.lastAccessAt?.toISOString(),
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

function mapUserBusinessAssignment(record: RepositoryUserBusinessRoleRecord): UserBusinessAssignment {
    return {
        id: record.id,
        userId: record.userId,
        businessId: record.businessId,
        role: record.role,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        businessName: record.business?.name,
        businessStatus: record.business?.status,
    };
}

function mergeBusinessAssignments(
    userId: string,
    assignments: RepositoryUserBusinessRoleRecord[],
    compatibilityOwnedBusinesses: RepositoryBusinessOptionRecord[],
): UserBusinessAssignment[] {
    const mappedAssignments = assignments.map(mapUserBusinessAssignment);
    const seenOwnerBusinessIds = new Set(
        assignments
            .filter((assignment) => assignment.role === 'OWNER')
            .map((assignment) => assignment.businessId),
    );

    const compatibilityAssignments = compatibilityOwnedBusinesses
        .filter((business) => !seenOwnerBusinessIds.has(business.id))
        .map((business) => ({
            id: `compat-owner:${userId}:${business.id}`,
            userId,
            businessId: business.id,
            role: 'OWNER' as const,
            createdAt: business.createdAt.toISOString(),
            updatedAt: business.lastUpdated.toISOString(),
            businessName: business.name,
            businessStatus: business.status,
        }));

    return [...mappedAssignments, ...compatibilityAssignments].sort((left, right) => {
        if (left.role !== right.role) {
            return left.role.localeCompare(right.role);
        }

        return left.businessName?.localeCompare(right.businessName ?? '') ?? 0;
    });
}

function mapAuditLogEntry(record: RepositoryAuditLogRecord): AuditLogEntry {
    return {
        id: record.id,
        actorUserId: record.actorUserId,
        targetUserId: record.targetUserId ?? undefined,
        businessId: record.businessId ?? undefined,
        action: record.action,
        metadata: record.metadata ?? undefined,
        createdAt: record.createdAt.toISOString(),
        actor: record.actorUser ? mapPlatformUser(record.actorUser) : undefined,
        targetUser: record.targetUser ? mapPlatformUser(record.targetUser) : undefined,
    };
}

function isBaseRole(role: string): role is BaseUserRole {
    return role === 'USER' || role === 'NO_ACCESS';
}

function supportsDirectUserFieldEditing(currentUser: RepositoryPlatformUserRecord | null) {
    if (!currentUser) {
        return false;
    }

    return currentUser.identities.every((identity) => identity.provider === 'mock');
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

    async getSelfProfile(): Promise<SelfProfile> {
        const currentUser = this.assertAuthenticatedSelf();
        const user = await this.getExistingUser(currentUser.id);
        const [assignments, compatibilityOwnedBusinesses, auditLogs] = await Promise.all([
            this.dependencies.repository.listUserBusinessRoles(user.id),
            this.dependencies.repository.listBusinessesOwnedByUser(user.id),
            this.dependencies.repository.listAuditLogsForUser(user.id),
        ]);

        return {
            user: mapPlatformUser(user),
            authProviders: mapPlatformUser(user).identities,
            businessAssignments: mergeBusinessAssignments(
                user.id,
                assignments,
                compatibilityOwnedBusinesses,
            ),
            verificationState: {
                hasVerifiedIdentity: user.identities.some((identity) => identity.emailVerified),
            },
            auditLogs: auditLogs.map(mapAuditLogEntry),
        };
    }

    async updateSelfProfile(input: SelfProfileUpdateInput): Promise<SelfProfile> {
        const currentUser = this.assertAuthenticatedSelf();
        const existingUser = await this.getExistingUser(currentUser.id);

        if (!supportsDirectUserFieldEditing(existingUser)) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'This account profile is managed by the active auth provider and cannot be edited here yet.',
            });
        }

        const updatedUser = await this.dependencies.repository.updateUserProfile(currentUser.id, {
            fullName: input.fullName,
            phone: input.phone?.trim() || null,
        });

        if (!updatedUser) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
        }

        await this.dependencies.repository.createAuditLog({
            actorUserId: currentUser.id,
            targetUserId: currentUser.id,
            action: 'USER_PROFILE_UPDATED',
            metadata: {
                scope: 'self',
            },
        });

        return this.getSelfProfile();
    }

    async getUserDetail(userId: string): Promise<AdminUserDetail> {
        this.assertSuperAdmin();
        const user = await this.getExistingUser(userId);
        const [assignments, compatibilityOwnedBusinesses, availableBusinesses, auditLogs] = await Promise.all([
            this.dependencies.repository.listUserBusinessRoles(userId),
            this.dependencies.repository.listBusinessesOwnedByUser(userId),
            this.dependencies.repository.listBusinessesForAssignment(),
            this.dependencies.repository.listAuditLogsForUser(userId),
        ]);

        return {
            user: mapPlatformUser(user),
            authProviders: mapPlatformUser(user).identities,
            businessAssignments: mergeBusinessAssignments(
                userId,
                assignments,
                compatibilityOwnedBusinesses,
            ),
            availableBusinesses: availableBusinesses.map((business) => ({
                id: business.id,
                name: business.name,
                status: business.status,
                ownerId: business.ownerId,
            })),
            auditLogs: auditLogs.map(mapAuditLogEntry),
            verificationState: {
                hasVerifiedIdentity: user.identities.some((identity) => identity.emailVerified),
            },
        };
    }

    async updateUserProfile(input: AdminUserProfileUpdateInput): Promise<AdminUserDetail> {
        const actor = this.assertSuperAdmin();
        const existingUser = await this.getExistingUser(input.userId);

        if (!supportsDirectUserFieldEditing(existingUser)) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'This account profile is managed by the active auth provider and only supports read-only details for now.',
            });
        }

        const updatedUser = await this.dependencies.repository.updateUserProfile(input.userId, {
            fullName: input.fullName,
            phone: input.phone?.trim() || null,
        });

        if (!updatedUser) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
        }

        await this.dependencies.repository.createAuditLog({
            actorUserId: actor.id,
            targetUserId: input.userId,
            action: 'USER_PROFILE_UPDATED',
            metadata: {
                scope: 'admin',
            },
        });

        return this.getUserDetail(input.userId);
    }

    async updateBaseUserRole(input: UpdateBaseUserRoleInput): Promise<AdminUserDetail> {
        const actor = this.assertSuperAdmin();
        const targetUser = await this.getExistingUser(input.userId);

        if (actor.id === targetUser.id && input.role === 'NO_ACCESS') {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'You cannot remove your own base access.',
            });
        }

        if (!isBaseRole(targetUser.role) && input.role === 'NO_ACCESS') {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Platform admins must first be downgraded from their platform role before setting NO_ACCESS.',
            });
        }

        const updatedUser = await this.dependencies.repository.updateBaseUserRole(input.userId, input.role);
        if (!updatedUser) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
        }

        await this.dependencies.repository.createAuditLog({
            actorUserId: actor.id,
            targetUserId: input.userId,
            action: 'USER_BASE_ROLE_UPDATED',
            metadata: {
                role: input.role,
            },
        });

        return this.getUserDetail(input.userId);
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

        await this.dependencies.repository.createAuditLog({
            actorUserId: actor.id,
            targetUserId: input.userId,
            action: 'USER_PLATFORM_ROLE_UPDATED',
            metadata: {
                role: input.role,
            },
        });

        return mapPlatformUser(updatedUser);
    }

    async assignUserBusinessRole(input: AssignUserBusinessRoleInput): Promise<AdminUserDetail> {
        const actor = this.assertSuperAdmin();
        await Promise.all([
            this.getExistingUser(input.userId),
            this.assertBusinessExists(input.businessId),
        ]);

        await this.dependencies.repository.assignUserBusinessRole(input);

        if (input.role === 'OWNER') {
            await this.syncCompatibilityOwner(input.businessId, input.userId);
        }

        await this.dependencies.repository.createAuditLog({
            actorUserId: actor.id,
            targetUserId: input.userId,
            businessId: input.businessId,
            action: 'USER_BUSINESS_ROLE_ASSIGNED',
            metadata: {
                role: input.role,
            },
        });

        return this.getUserDetail(input.userId);
    }

    async removeUserBusinessRole(input: RemoveUserBusinessRoleInput): Promise<AdminUserDetail> {
        const actor = this.assertSuperAdmin();
        await this.getExistingUser(input.userId);

        if (input.role === 'OWNER') {
            const ownerCount = await this.dependencies.repository.countBusinessOwners(input.businessId);
            if (ownerCount <= 1) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'A business must retain at least one owner.',
                });
            }
        }

        await this.dependencies.repository.removeUserBusinessRole(input);

        await this.dependencies.repository.createAuditLog({
            actorUserId: actor.id,
            targetUserId: input.userId,
            businessId: input.businessId,
            action: 'USER_BUSINESS_ROLE_REMOVED',
            metadata: {
                role: input.role,
            },
        });

        return this.getUserDetail(input.userId);
    }

    async transferBusinessOwnership(input: TransferBusinessOwnershipInput): Promise<AdminUserDetail> {
        const actor = this.assertSuperAdmin();
        await Promise.all([
            this.getExistingUser(input.fromUserId),
            this.getExistingUser(input.toUserId),
            this.assertBusinessExists(input.businessId),
        ]);

        const ownerCount = await this.dependencies.repository.countBusinessOwners(input.businessId);
        if (ownerCount <= 1 && input.fromUserId === input.toUserId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Ownership transfer requires a different target owner.',
            });
        }

        await this.dependencies.repository.transferBusinessOwnership({
            businessId: input.businessId,
            fromUserId: input.fromUserId,
            toUserId: input.toUserId,
        });

        await this.dependencies.repository.createAuditLog({
            actorUserId: actor.id,
            targetUserId: input.toUserId,
            businessId: input.businessId,
            action: 'BUSINESS_OWNERSHIP_TRANSFERRED',
            metadata: {
                fromUserId: input.fromUserId,
                toUserId: input.toUserId,
                reason: input.reason,
            },
        });

        return this.getUserDetail(input.toUserId);
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

        await this.dependencies.repository.createAuditLog({
            actorUserId: actor.id,
            targetUserId: input.userId,
            action: 'USER_STATUS_UPDATED',
            metadata: {
                isActive: input.isActive,
            },
        });

        return mapPlatformUser(updatedUser);
    }

    private assertSuperAdmin(): CurrentUser {
        return requireSuperAdmin(this.dependencies.currentUser);
    }

    private assertAuthenticatedSelf(): CurrentUser {
        const currentUser = this.dependencies.currentUser;
        if (!currentUser) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
        }

        return currentUser;
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

    private async assertBusinessExists(businessId: string): Promise<RepositoryBusinessOptionRecord> {
        const businesses = await this.dependencies.repository.listBusinessesForAssignment();
        const business = businesses.find((candidate) => candidate.id === businessId);

        if (!business) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        return business;
    }

    private async syncCompatibilityOwner(businessId: string, userId: string) {
        const businesses = await this.dependencies.repository.listBusinessesForAssignment();
        const business = businesses.find((candidate) => candidate.id === businessId);

        if (!business || business.ownerId === userId) {
            return;
        }

        await this.dependencies.repository.transferBusinessOwnership({
            businessId,
            fromUserId: business.ownerId,
            toUserId: userId,
        });
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