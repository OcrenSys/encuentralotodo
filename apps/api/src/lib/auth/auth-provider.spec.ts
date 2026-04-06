import {
    AuthTokenVerificationError,
    FirebaseAuthProvider,
    createAuthProvider,
} from 'auth';

describe('auth provider factory and firebase provider', () => {
    it('selects the firebase provider from the factory', () => {
        const provider = createAuthProvider('firebase', {
            firebase: {
                tokenVerifier: async () => ({
                    uid: 'firebase-user-1',
                }),
            },
        });

        expect(provider).toBeInstanceOf(FirebaseAuthProvider);
        expect(provider.name).toBe('firebase');
    });

    it('verifies a firebase token and maps it into a normalized identity', async () => {
        const provider = new FirebaseAuthProvider({
            tokenVerifier: async () => ({
                uid: 'firebase-user-1',
                email: 'ana@encuentralotodo.app',
                email_verified: true,
                name: 'Ana Mercado',
                picture: 'https://cdn.encuentralotodo.app/avatars/ana.png',
            }),
        });

        const identity = await provider.verifyIdToken('firebase-id-token');

        expect(identity).toEqual({
            provider: 'firebase',
            externalUserId: 'firebase-user-1',
            email: 'ana@encuentralotodo.app',
            emailVerified: true,
            displayName: 'Ana Mercado',
            avatarUrl: 'https://cdn.encuentralotodo.app/avatars/ana.png',
        });
        expect(Object.keys(identity).sort()).toEqual([
            'avatarUrl',
            'displayName',
            'email',
            'emailVerified',
            'externalUserId',
            'provider',
        ]);
        expect(identity).not.toHaveProperty('uid');
    });

    it('rejects invalid firebase tokens with a normalized auth error', async () => {
        const provider = new FirebaseAuthProvider({
            tokenVerifier: async () => {
                throw new Error('token expired');
            },
        });

        await expect(provider.verifyIdToken('bad-token')).rejects.toBeInstanceOf(AuthTokenVerificationError);
    });
});