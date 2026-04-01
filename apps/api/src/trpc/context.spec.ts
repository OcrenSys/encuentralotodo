import type { Request } from 'express';

import { AuthTokenVerificationError, createCurrentUser, type AuthProvider, type VerifiedIdentity } from 'auth';

import { resolveRequestAuthContext } from './context';

const baseEnv = {
    NODE_ENV: 'development' as const,
    PORT: 4000,
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://example',
    DATA_MODE: 'prisma' as const,
    AUTH_PROVIDER: 'firebase' as const,
};

function createRequest(headers: Record<string, string | undefined>) {
    return {
        headers,
    } as unknown as Request;
}

describe('resolveRequestAuthContext', () => {
    it('attaches a normalized current user for a verified bearer token', async () => {
        const verifiedIdentity: VerifiedIdentity = {
            provider: 'firebase',
            externalUserId: 'firebase-user-1',
            email: 'ana@encuentralotodo.app',
            emailVerified: true,
            displayName: 'Ana Mercado',
            avatarUrl: 'https://cdn.encuentralotodo.app/avatars/ana.png',
        };
        const authProvider: AuthProvider = {
            name: 'firebase',
            verifyIdToken: jest.fn(async () => verifiedIdentity),
        };
        const authIdentityService = {
            resolveCurrentUser: jest.fn(async () =>
                createCurrentUser({
                    id: 'user-1',
                    fullName: 'Ana Mercado',
                    email: 'ana@encuentralotodo.app',
                    role: 'USER',
                    avatarUrl: 'https://cdn.encuentralotodo.app/avatars/ana.png',
                    authProvider: 'firebase',
                    externalAuthId: 'firebase-user-1',
                    emailVerified: true,
                }),
            ),
        };

        const result = await resolveRequestAuthContext({
            req: createRequest({ authorization: 'Bearer valid-token' }),
            env: baseEnv,
            authProvider,
            authIdentityService,
        });

        expect(result.verifiedIdentity).toEqual(verifiedIdentity);
        expect(result.currentUser).toMatchObject({
            id: 'user-1',
            authProvider: 'firebase',
            externalAuthId: 'firebase-user-1',
            emailVerified: true,
        });
        expect(authIdentityService.resolveCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('rejects invalid bearer tokens', async () => {
        const authProvider: AuthProvider = {
            name: 'firebase',
            verifyIdToken: jest.fn(async () => {
                throw new AuthTokenVerificationError();
            }),
        };

        await expect(
            resolveRequestAuthContext({
                req: createRequest({ authorization: 'Bearer invalid-token' }),
                env: baseEnv,
                authProvider,
                authIdentityService: {
                    resolveCurrentUser: jest.fn(),
                },
            }),
        ).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            message: 'Invalid authentication token.',
        });
    });

    it('maps mock auth headers into normalized CurrentUser values without provider leakage', async () => {
        const verifiedIdentity: VerifiedIdentity = {
            provider: 'mock',
            externalUserId: 'admin-luis',
            email: 'luis@encuentralotodo.app',
            emailVerified: true,
            displayName: 'Luis Admin',
            avatarUrl: null,
        };
        const authProvider: AuthProvider = {
            name: 'mock',
            verifyIdToken: jest.fn(async () => verifiedIdentity),
        };

        const result = await resolveRequestAuthContext({
            req: createRequest({ 'x-demo-user': 'luis@encuentralotodo.app' }),
            env: {
                ...baseEnv,
                AUTH_PROVIDER: 'mock',
            },
            authProvider,
            authIdentityService: {
                resolveCurrentUser: jest.fn(),
            },
        });

        expect(result.currentUser).toMatchObject({
            id: 'admin-luis',
            fullName: 'Luis Admin',
            email: 'luis@encuentralotodo.app',
            role: 'ADMIN',
            authProvider: 'mock',
            externalAuthId: 'admin-luis',
            emailVerified: true,
        });
        expect(result.currentUser).not.toHaveProperty('uid');
    });
});