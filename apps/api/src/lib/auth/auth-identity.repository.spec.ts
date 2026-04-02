import type { VerifiedIdentity } from 'auth';

import { PrismaAuthIdentityRepository } from './auth-identity.repository';

const firebaseIdentity: VerifiedIdentity = {
    provider: 'firebase',
    externalUserId: 'firebase-superadmin-validation',
    email: 'ocrensys@gmail.com',
    emailVerified: true,
    displayName: 'Jairo Martinez',
    avatarUrl: null,
};

describe('PrismaAuthIdentityRepository', () => {
    it('links an existing user identity without overwriting the persisted superadmin role', async () => {
        const prisma = {
            user: {
                findUnique: jest.fn(async () => ({
                    id: 'user-superadmin',
                    fullName: 'Jairo Martinez',
                    email: 'ocrensys@gmail.com',
                    role: 'SUPERADMIN',
                    avatarUrl: null,
                    isActive: true,
                })),
            },
            userIdentity: {
                upsert: jest.fn(async ({ update }: any) => ({
                    provider: 'FIREBASE',
                    externalUserId: 'firebase-superadmin-validation',
                    emailVerified: true,
                    user: {
                        id: 'user-superadmin',
                        fullName: update.user.update.fullName,
                        email: update.user.update.email,
                        role: 'SUPERADMIN',
                        avatarUrl: update.user.update.avatarUrl,
                        isActive: true,
                    },
                })),
            },
        } as any;

        const repository = new PrismaAuthIdentityRepository(prisma);

        const currentUser = await repository.upsertIdentityForUser('user-superadmin', firebaseIdentity);

        expect(prisma.userIdentity.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                update: expect.objectContaining({
                    user: expect.objectContaining({
                        connect: { id: 'user-superadmin' },
                        update: expect.objectContaining({
                            fullName: 'Jairo Martinez',
                            email: 'ocrensys@gmail.com',
                        }),
                    }),
                }),
            }),
        );

        expect(currentUser).toMatchObject({
            id: 'user-superadmin',
            email: 'ocrensys@gmail.com',
            role: 'SUPERADMIN',
            authProvider: 'firebase',
            externalAuthId: 'firebase-superadmin-validation',
            isActive: true,
        });
    });
});