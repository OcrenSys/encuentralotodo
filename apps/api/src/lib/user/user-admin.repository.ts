import type {
    BaseUserRole,
    BusinessAssignmentRole,
    ListPlatformUsersInput,
    UserRole,
} from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryPlatformUserIdentityRecord {
    provider: 'mock' | 'firebase' | 'cognito';
    externalUserId: string;
    email: string | null;
    emailVerified: boolean;
}

export interface RepositoryPlatformUserRecord {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    phone: string | null;
    isActive: boolean;
    lastAccessAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    identities: RepositoryPlatformUserIdentityRecord[];
}

export interface RepositoryPlatformUserSearchRecord {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    isActive: boolean;
}

export interface RepositoryUserBusinessRoleRecord {
    id: string;
    userId: string;
    businessId: string;
    role: BusinessAssignmentRole;
    createdAt: Date;
    updatedAt: Date;
    business?: {
        id: string;
        name: string;
        status: 'PENDING' | 'APPROVED';
        ownerId: string;
    };
}

export interface RepositoryAuditLogRecord {
    id: string;
    actorUserId: string;
    targetUserId: string | null;
    businessId: string | null;
    action:
    | 'USER_PROFILE_UPDATED'
    | 'USER_BASE_ROLE_UPDATED'
    | 'USER_PLATFORM_ROLE_UPDATED'
    | 'USER_STATUS_UPDATED'
    | 'USER_BUSINESS_ROLE_ASSIGNED'
    | 'USER_BUSINESS_ROLE_REMOVED'
    | 'BUSINESS_OWNERSHIP_TRANSFERRED';
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    actorUser?: RepositoryPlatformUserRecord | null;
    targetUser?: RepositoryPlatformUserRecord | null;
}

export interface RepositoryBusinessOptionRecord {
    id: string;
    name: string;
    status: 'PENDING' | 'APPROVED';
    ownerId: string;
    createdAt: Date;
    lastUpdated: Date;
}

export interface RepositoryPlatformUserListResult {
    items: RepositoryPlatformUserRecord[];
    total: number;
}

export interface UserAdminRepositoryPort {
    listUsers(): Promise<RepositoryPlatformUserRecord[]>;
    listUsersPage(input: ListPlatformUsersInput): Promise<RepositoryPlatformUserListResult>;
    searchUsers(input: { search: string; limit: number }): Promise<RepositoryPlatformUserSearchRecord[]>;
    findUserById(userId: string): Promise<RepositoryPlatformUserRecord | null>;
    listUserBusinessRoles(userId: string): Promise<RepositoryUserBusinessRoleRecord[]>;
    listBusinessesForAssignment(): Promise<RepositoryBusinessOptionRecord[]>;
    listBusinessesOwnedByUser(userId: string): Promise<RepositoryBusinessOptionRecord[]>;
    updateUserProfile(userId: string, input: { fullName: string; phone?: string | null }): Promise<RepositoryPlatformUserRecord | null>;
    updateBaseUserRole(userId: string, role: BaseUserRole): Promise<RepositoryPlatformUserRecord | null>;
    updateUserRole(userId: string, role: UserRole): Promise<RepositoryPlatformUserRecord | null>;
    setUserActive(userId: string, isActive: boolean): Promise<RepositoryPlatformUserRecord | null>;
    countUsersByRole(role: UserRole, isActive?: boolean): Promise<number>;
    assignUserBusinessRole(input: { userId: string; businessId: string; role: BusinessAssignmentRole }): Promise<RepositoryUserBusinessRoleRecord>;
    removeUserBusinessRole(input: { userId: string; businessId: string; role: BusinessAssignmentRole }): Promise<void>;
    countBusinessOwners(businessId: string): Promise<number>;
    transferBusinessOwnership(input: { businessId: string; fromUserId: string; toUserId: string }): Promise<void>;
    createAuditLog(input: {
        actorUserId: string;
        targetUserId?: string;
        businessId?: string;
        action: RepositoryAuditLogRecord['action'];
        metadata?: Record<string, unknown>;
    }): Promise<RepositoryAuditLogRecord>;
    listAuditLogsForUser(userId: string): Promise<RepositoryAuditLogRecord[]>;
}

const userSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    avatarUrl: true,
    phone: true,
    isActive: true,
    lastAccessAt: true,
    createdAt: true,
    updatedAt: true,
    identities: {
        select: {
            provider: true,
            externalUserId: true,
            email: true,
            emailVerified: true,
        },
        orderBy: {
            createdAt: 'asc',
        },
    },
} as const;

function fromPrismaProvider(provider: string): 'mock' | 'firebase' | 'cognito' {
    switch (provider) {
        case 'FIREBASE':
            return 'firebase';
        case 'COGNITO':
            return 'cognito';
        case 'MOCK':
        default:
            return 'mock';
    }
}

function mapPlatformUserRecord(record: any): RepositoryPlatformUserRecord {
    return {
        id: record.id,
        fullName: record.fullName,
        email: record.email,
        role: record.role,
        avatarUrl: record.avatarUrl,
        phone: record.phone ?? null,
        isActive: Boolean(record.isActive),
        lastAccessAt: record.lastAccessAt ?? null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        identities: (record.identities ?? []).map((identity: any) => ({
            provider: fromPrismaProvider(identity.provider),
            externalUserId: identity.externalUserId,
            email: identity.email,
            emailVerified: Boolean(identity.emailVerified),
        })),
    };
}

function mapPlatformUserSearchRecord(record: any): RepositoryPlatformUserSearchRecord {
    return {
        id: record.id,
        fullName: record.fullName,
        email: record.email,
        role: record.role,
        avatarUrl: record.avatarUrl,
        isActive: Boolean(record.isActive),
    };
}

function mapUserBusinessRoleRecord(record: any): RepositoryUserBusinessRoleRecord {
    return {
        id: record.id,
        userId: record.userId,
        businessId: record.businessId,
        role: record.role,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        business: record.business
            ? {
                id: record.business.id,
                name: record.business.name,
                status: record.business.status,
                ownerId: record.business.ownerId,
            }
            : undefined,
    };
}

function mapAuditLogRecord(record: any): RepositoryAuditLogRecord {
    return {
        id: record.id,
        actorUserId: record.actorUserId,
        targetUserId: record.targetUserId,
        businessId: record.businessId,
        action: record.action,
        metadata: record.metadata ?? null,
        createdAt: record.createdAt,
        actorUser: record.actorUser ? mapPlatformUserRecord(record.actorUser) : null,
        targetUser: record.targetUser ? mapPlatformUserRecord(record.targetUser) : null,
    };
}

const userBusinessRoleBusinessSelect = {
    id: true,
    name: true,
    status: true,
    ownerId: true,
} as const;

export class UserAdminRepository implements UserAdminRepositoryPort {
    constructor(private readonly prisma: ReturnType<typeof getPrismaClient>) { }

    async listUsers() {
        const users = await this.prisma.user.findMany({
            orderBy: [
                { createdAt: 'desc' },
                { fullName: 'asc' },
            ],
            select: userSelect,
        });

        return users.map(mapPlatformUserRecord);
    }

    async listUsersPage(input: ListPlatformUsersInput) {
        const normalizedSearch = input.search.trim();
        const where = {
            AND: [
                ...(normalizedSearch ? [{
                    OR: [
                        { fullName: { contains: normalizedSearch, mode: 'insensitive' as const } },
                        { email: { contains: normalizedSearch, mode: 'insensitive' as const } },
                    ],
                }] : []),
                ...(input.role !== 'ALL' ? [{ role: input.role }] : []),
                ...(input.status === 'ACTIVE' ? [{ isActive: true }] : []),
                ...(input.status === 'INACTIVE' ? [{ isActive: false }] : []),
            ],
        };
        const skip = (input.page - 1) * input.pageSize;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: [
                    { createdAt: 'desc' },
                    { fullName: 'asc' },
                ],
                skip,
                take: input.pageSize,
                select: userSelect,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            items: users.map(mapPlatformUserRecord),
            total,
        };
    }

    async searchUsers(input: { search: string; limit: number }) {
        const normalizedSearch = input.search.trim();
        const users = await this.prisma.user.findMany({
            where: normalizedSearch
                ? {
                    OR: [
                        {
                            fullName: {
                                contains: normalizedSearch,
                                mode: 'insensitive',
                            },
                        },
                        {
                            email: {
                                contains: normalizedSearch,
                                mode: 'insensitive',
                            },
                        },
                        {
                            identities: {
                                some: {
                                    OR: [
                                        {
                                            email: {
                                                contains: normalizedSearch,
                                                mode: 'insensitive',
                                            },
                                        },
                                        {
                                            externalUserId: {
                                                contains: normalizedSearch,
                                                mode: 'insensitive',
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                }
                : undefined,
            orderBy: [
                { createdAt: 'desc' },
                { fullName: 'asc' },
            ],
            take: input.limit,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatarUrl: true,
                isActive: true,
            },
        });

        return users.map(mapPlatformUserSearchRecord);
    }

    async findUserById(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: userSelect,
        });

        return user ? mapPlatformUserRecord(user) : null;
    }

    async listUserBusinessRoles(userId: string) {
        const roles = await this.prisma.userBusinessRole.findMany({
            where: { userId },
            orderBy: [
                { role: 'asc' },
                { createdAt: 'asc' },
            ],
            include: {
                business: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        ownerId: true,
                    },
                },
            },
        });

        return roles.map(mapUserBusinessRoleRecord);
    }

    async listBusinessesForAssignment() {
        return this.prisma.business.findMany({
            orderBy: [{ name: 'asc' }],
            select: {
                id: true,
                name: true,
                status: true,
                ownerId: true,
                createdAt: true,
                lastUpdated: true,
            },
        });
    }

    async listBusinessesOwnedByUser(userId: string) {
        return this.prisma.business.findMany({
            where: {
                userRoles: {
                    some: {
                        userId,
                        role: 'OWNER',
                    },
                },
            },
            orderBy: [{ name: 'asc' }],
            select: {
                id: true,
                name: true,
                status: true,
                ownerId: true,
                createdAt: true,
                lastUpdated: true,
            },
        });
    }

    async updateUserProfile(userId: string, input: { fullName: string; phone?: string | null }) {
        const user = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                fullName: input.fullName,
                phone: input.phone ?? null,
            },
            select: userSelect,
        }).catch((error: { code?: string }) => {
            if (error.code === 'P2025') {
                return null;
            }

            throw error;
        });

        return user ? mapPlatformUserRecord(user) : null;
    }

    async updateBaseUserRole(userId: string, role: BaseUserRole) {
        const user = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                role,
            },
            select: userSelect,
        }).catch((error: { code?: string }) => {
            if (error.code === 'P2025') {
                return null;
            }

            throw error;
        });

        return user ? mapPlatformUserRecord(user) : null;
    }

    async updateUserRole(userId: string, role: UserRole) {
        const user = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                role,
            },
            select: userSelect,
        }).catch((error: { code?: string }) => {
            if (error.code === 'P2025') {
                return null;
            }

            throw error;
        });

        return user ? mapPlatformUserRecord(user) : null;
    }

    async setUserActive(userId: string, isActive: boolean) {
        const user = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                isActive,
            },
            select: userSelect,
        }).catch((error: { code?: string }) => {
            if (error.code === 'P2025') {
                return null;
            }

            throw error;
        });

        return user ? mapPlatformUserRecord(user) : null;
    }

    async countUsersByRole(role: UserRole, isActive?: boolean) {
        return this.prisma.user.count({
            where: {
                role,
                ...(typeof isActive === 'boolean' ? { isActive } : {}),
            },
        });
    }

    async assignUserBusinessRole(input: { userId: string; businessId: string; role: BusinessAssignmentRole }) {
        const record = await this.setCanonicalBusinessRole(input);

        return mapUserBusinessRoleRecord(record);
    }

    async removeUserBusinessRole(input: { userId: string; businessId: string; role: BusinessAssignmentRole }) {
        await this.prisma.userBusinessRole.deleteMany({
            where: input,
        });
    }

    async countBusinessOwners(businessId: string) {
        return this.prisma.userBusinessRole.count({
            where: {
                businessId,
                role: 'OWNER',
            },
        });
    }

    async transferBusinessOwnership(input: { businessId: string; fromUserId: string; toUserId: string }) {
        await this.prisma.$transaction(async (tx: ReturnType<typeof getPrismaClient>) => {
            await tx.userBusinessRole.deleteMany({
                where: {
                    businessId: input.businessId,
                    userId: input.fromUserId,
                    role: 'OWNER',
                },
            });

            await this.setCanonicalBusinessRole(
                {
                    userId: input.toUserId,
                    businessId: input.businessId,
                    role: 'OWNER',
                },
                tx,
            );

            await tx.business.update({
                where: {
                    id: input.businessId,
                },
                data: {
                    ownerId: input.toUserId,
                },
            });
        });
    }

    async createAuditLog(input: {
        actorUserId: string;
        targetUserId?: string;
        businessId?: string;
        action: RepositoryAuditLogRecord['action'];
        metadata?: Record<string, unknown>;
    }) {
        const record = await this.prisma.auditLog.create({
            data: {
                actorUserId: input.actorUserId,
                targetUserId: input.targetUserId,
                businessId: input.businessId,
                action: input.action,
                metadata: input.metadata,
            },
            include: {
                actorUser: {
                    select: userSelect,
                },
                targetUser: {
                    select: userSelect,
                },
            },
        });

        return mapAuditLogRecord(record);
    }

    async listAuditLogsForUser(userId: string) {
        const logs = await this.prisma.auditLog.findMany({
            where: {
                OR: [
                    { targetUserId: userId },
                    { actorUserId: userId },
                ],
            },
            orderBy: [{ createdAt: 'desc' }],
            take: 25,
            include: {
                actorUser: {
                    select: userSelect,
                },
                targetUser: {
                    select: userSelect,
                },
            },
        });

        return logs.map(mapAuditLogRecord);
    }

    private async setCanonicalBusinessRole(
        input: { userId: string; businessId: string; role: BusinessAssignmentRole },
        tx: typeof this.prisma = this.prisma,
    ) {
        const existingRecords = await tx.userBusinessRole.findMany({
            where: {
                userId: input.userId,
                businessId: input.businessId,
            },
            select: {
                id: true,
                role: true,
                createdAt: true,
            },
            orderBy: [{ createdAt: 'asc' }],
        });

        const recordToKeep = existingRecords.find(
            (existingRecord: (typeof existingRecords)[number]) => existingRecord.role === input.role,
        )
            ?? existingRecords[0];
        const duplicateIds = existingRecords
            .filter((existingRecord: (typeof existingRecords)[number]) => existingRecord.id !== recordToKeep?.id)
            .map((existingRecord: (typeof existingRecords)[number]) => existingRecord.id);

        if (duplicateIds.length > 0) {
            await tx.userBusinessRole.deleteMany({
                where: {
                    id: {
                        in: duplicateIds,
                    },
                },
            });
        }

        if (!recordToKeep) {
            return tx.userBusinessRole.create({
                data: input,
                include: {
                    business: {
                        select: userBusinessRoleBusinessSelect,
                    },
                },
            });
        }

        if (recordToKeep.role !== input.role) {
            return tx.userBusinessRole.update({
                where: {
                    id: recordToKeep.id,
                },
                data: {
                    role: input.role,
                },
                include: {
                    business: {
                        select: userBusinessRoleBusinessSelect,
                    },
                },
            });
        }

        return tx.userBusinessRole.findUniqueOrThrow({
            where: {
                id: recordToKeep.id,
            },
            include: {
                business: {
                    select: userBusinessRoleBusinessSelect,
                },
            },
        });
    }
}