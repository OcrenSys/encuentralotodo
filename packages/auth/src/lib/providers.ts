import type { AuthProvider, AuthProviderName } from './auth';
import type { UserProfile } from 'types';

const defaultUsers: Record<string, UserProfile> = {
    'ana@encuentralotodo.app': {
        id: 'user-ana',
        fullName: 'Ana Mercado',
        email: 'ana@encuentralotodo.app',
        role: 'USER',
    },
    'luis@encuentralotodo.app': {
        id: 'admin-luis',
        fullName: 'Luis Admin',
        email: 'luis@encuentralotodo.app',
        role: 'ADMIN',
    },
};

class BaseConfiguredAuthProvider implements AuthProvider {
    protected currentUser: UserProfile | null;

    constructor(seedUser: UserProfile | null = null) {
        this.currentUser = seedUser;
    }

    async signIn(input?: { email: string; fullName?: string }) {
        if (!input) {
            return this.currentUser;
        }

        const existing = defaultUsers[input.email.toLowerCase()];
        this.currentUser =
            existing ?? {
                id: `user-${input.email.split('@')[0]}`,
                fullName: input.fullName ?? input.email.split('@')[0],
                email: input.email,
                role: 'USER',
            };

        return this.currentUser;
    }

    async signOut() {
        this.currentUser = null;
    }

    async getUser() {
        return this.currentUser;
    }
}

export class MockAuthProvider extends BaseConfiguredAuthProvider { }

export class FirebaseAuthProvider extends BaseConfiguredAuthProvider { }

export class CognitoAuthProvider extends BaseConfiguredAuthProvider { }

export function createAuthProvider(provider: AuthProviderName, seedUser: UserProfile | null = defaultUsers['ana@encuentralotodo.app']) {
    switch (provider) {
        case 'firebase':
            return new FirebaseAuthProvider(seedUser);
        case 'cognito':
            return new CognitoAuthProvider(seedUser);
        case 'mock':
        default:
            return new MockAuthProvider(seedUser);
    }
}