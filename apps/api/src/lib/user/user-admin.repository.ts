import type { ListPlatformUsersInput, UserRole } from 'types';

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
    isActive: boolean;
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

export interface RepositoryPlatformUserListResult {
    items: RepositoryPlatformUserRecord[];
    total: number;
}

export interface UserAdminRepositoryPort {
    listUsers(): Promise<RepositoryPlatformUserRecord[]>;
    listUsersPage(input: ListPlatformUsersInput): Promise<RepositoryPlatformUserListResult>;
    searchUsers(input: { search: string; limit: number }): Promise<RepositoryPlatformUserSearchRecord[]>;
    findUserById(userId: string): Promise<RepositoryPlatformUserRecord | null>;
    updateUserRole(userId: string, role: UserRole): Promise<RepositoryPlatformUserRecord | null>;
    setUserActive(userId: string, isActive: boolean): Promise<RepositoryPlatformUserRecord | null>;
    countUsersByRole(role: UserRole, isActive?: boolean): Promise<number>;
}

const userSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    avatarUrl: true,
    isActive: true,
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
        isActive: Boolean(record.isActive),
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
}