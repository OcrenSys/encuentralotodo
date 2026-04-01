import { createCurrentUser, type AuthProviderName, type CurrentUser, type VerifiedIdentity } from 'auth';
import type { UserRole } from 'types';

import type { getPrismaClient } from '../prisma';

export interface LocalUserRecord {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    isActive: boolean;
}

export interface AuthIdentityRepositoryPort {
    findCurrentUserByIdentity(provider: AuthProviderName, externalUserId: string): Promise<CurrentUser | null>;
    findUserByEmail(email: string): Promise<LocalUserRecord | null>;
    createUserFromIdentity(identity: VerifiedIdentity): Promise<CurrentUser>;
    upsertIdentityForUser(userId: string, identity: VerifiedIdentity): Promise<CurrentUser>;
}

const userSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    avatarUrl: true,
    isActive: true,
} as const;

function toPrismaProvider(provider: AuthProviderName) {
    switch (provider) {
        case 'firebase':
            return 'FIREBASE';
        case 'cognito':
            return 'COGNITO';
        case 'mock':
        default:
            return 'MOCK';
    }
}

function fromPrismaProvider(provider: string): AuthProviderName {
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

function buildFallbackEmail(identity: VerifiedIdentity) {
    const normalizedExternalId = identity.externalUserId.replace(/[^a-zA-Z0-9._-]+/g, '-').toLowerCase();
    return `${identity.provider}.${normalizedExternalId}@auth.encuentralotodo.local`;
}

function buildDisplayName(identity: VerifiedIdentity) {
    if (identity.displayName) {
        return identity.displayName;
    }

    if (identity.email) {
        return identity.email.split('@')[0];
    }

    return identity.externalUserId;
}

function mapLocalUserRecord(record: any): LocalUserRecord {
    return {
        id: record.id,
        fullName: record.fullName,
        email: record.email,
        role: record.role,
        avatarUrl: record.avatarUrl,
        isActive: Boolean(record.isActive),
    };
}

function mapCurrentUserFromIdentityRecord(record: any): CurrentUser {
    return createCurrentUser({
        id: record.user.id,
        fullName: record.user.fullName,
        email: record.user.email,
        role: record.user.role,
        avatarUrl: record.user.avatarUrl,
        isActive: Boolean(record.user.isActive),
        authProvider: fromPrismaProvider(record.provider),
        externalAuthId: record.externalUserId,
        emailVerified: Boolean(record.emailVerified),
    });
}

export class PrismaAuthIdentityRepository implements AuthIdentityRepositoryPort {
    constructor(private readonly prisma: ReturnType<typeof getPrismaClient>) { }

    async findCurrentUserByIdentity(provider: AuthProviderName, externalUserId: string) {
        const identity = await this.prisma.userIdentity.findUnique({
            where: {
                provider_externalUserId: {
                    provider: toPrismaProvider(provider),
                    externalUserId,
                },
            },
            include: {
                user: {
                    select: userSelect,
                },
            },
        });

        return identity ? mapCurrentUserFromIdentityRecord(identity) : null;
    }

    async findUserByEmail(email: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive',
                },
            },
            select: userSelect,
        });

        return user ? mapLocalUserRecord(user) : null;
    }

    async createUserFromIdentity(identity: VerifiedIdentity) {
        const createdIdentity = await this.prisma.userIdentity.create({
            data: {
                provider: toPrismaProvider(identity.provider),
                externalUserId: identity.externalUserId,
                email: identity.email,
                emailVerified: identity.emailVerified,
                displayName: identity.displayName ?? buildDisplayName(identity),
                avatarUrl: identity.avatarUrl,
                user: {
                    create: {
                        fullName: buildDisplayName(identity),
                        email: identity.email ?? buildFallbackEmail(identity),
                        role: 'USER',
                        avatarUrl: identity.avatarUrl,
                        isActive: true,
                    },
                },
            },
            include: {
                user: {
                    select: userSelect,
                },
            },
        });

        return mapCurrentUserFromIdentityRecord(createdIdentity);
    }

    async upsertIdentityForUser(userId: string, identity: VerifiedIdentity) {
        const existingUser = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: userSelect,
        });

        if (!existingUser) {
            throw new Error(`User ${userId} was not found while linking auth identity.`);
        }

        const nextFullName = identity.displayName ?? existingUser.fullName;
        const nextEmail = identity.email ?? existingUser.email;
        const nextAvatarUrl = identity.avatarUrl ?? existingUser.avatarUrl;

        const linkedIdentity = await this.prisma.userIdentity.upsert({
            where: {
                provider_externalUserId: {
                    provider: toPrismaProvider(identity.provider),
                    externalUserId: identity.externalUserId,
                },
            },
            update: {
                userId,
                email: identity.email,
                emailVerified: identity.emailVerified,
                displayName: identity.displayName ?? nextFullName,
                avatarUrl: identity.avatarUrl ?? nextAvatarUrl,
                user: {
                    update: {
                        fullName: nextFullName,
                        email: nextEmail,
                        avatarUrl: nextAvatarUrl,
                    },
                },
            },
            create: {
                provider: toPrismaProvider(identity.provider),
                externalUserId: identity.externalUserId,
                email: identity.email,
                emailVerified: identity.emailVerified,
                displayName: identity.displayName ?? nextFullName,
                avatarUrl: identity.avatarUrl ?? nextAvatarUrl,
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
            include: {
                user: {
                    select: userSelect,
                },
            },
        });

        return mapCurrentUserFromIdentityRecord(linkedIdentity);
    }
}