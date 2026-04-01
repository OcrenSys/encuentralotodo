import { createCurrentUser, type CurrentUser, type VerifiedIdentity } from 'auth';

import { AuthIdentityService } from './auth-identity.service';
import type { AuthIdentityRepositoryPort, LocalUserRecord } from './auth-identity.repository';

class InMemoryAuthIdentityRepository implements AuthIdentityRepositoryPort {
    private readonly users = new Map<string, LocalUserRecord>();
    private readonly identities = new Map<string, CurrentUser>();
    private sequence = 1;

    seedUser(user: LocalUserRecord) {
        this.users.set(user.id, user);
    }

    async findCurrentUserByIdentity(provider: VerifiedIdentity['provider'], externalUserId: string) {
        return this.identities.get(`${provider}:${externalUserId}`) ?? null;
    }

    async findUserByEmail(email: string) {
        const normalizedEmail = email.toLowerCase();
        return Array.from(this.users.values()).find((user) => user.email.toLowerCase() === normalizedEmail) ?? null;
    }

    async createUserFromIdentity(identity: VerifiedIdentity) {
        const user: LocalUserRecord = {
            id: `user-${this.sequence++}`,
            fullName: identity.displayName ?? identity.email ?? identity.externalUserId,
            email: identity.email ?? `${identity.externalUserId}@auth.encuentralotodo.local`,
            role: 'UNASSIGNED',
            avatarUrl: identity.avatarUrl,
            isActive: true,
        };

        this.users.set(user.id, user);
        const currentUser = createCurrentUser({
            ...user,
            authProvider: identity.provider,
            externalAuthId: identity.externalUserId,
            emailVerified: identity.emailVerified,
        });
        this.identities.set(`${identity.provider}:${identity.externalUserId}`, currentUser);
        return currentUser;
    }

    async upsertIdentityForUser(userId: string, identity: VerifiedIdentity) {
        const existingUser = this.users.get(userId);
        if (!existingUser) {
            throw new Error(`Missing local user ${userId}`);
        }

        const updatedUser: LocalUserRecord = {
            ...existingUser,
            fullName: identity.displayName ?? existingUser.fullName,
            email: identity.email ?? existingUser.email,
            avatarUrl: identity.avatarUrl ?? existingUser.avatarUrl,
        };

        this.users.set(userId, updatedUser);
        const currentUser = createCurrentUser({
            ...updatedUser,
            authProvider: identity.provider,
            externalAuthId: identity.externalUserId,
            emailVerified: identity.emailVerified,
        });
        this.identities.set(`${identity.provider}:${identity.externalUserId}`, currentUser);
        return currentUser;
    }
}

const firebaseIdentity: VerifiedIdentity = {
    provider: 'firebase',
    externalUserId: 'firebase-user-1',
    email: 'ana@encuentralotodo.app',
    emailVerified: true,
    displayName: 'Ana Mercado',
    avatarUrl: 'https://cdn.encuentralotodo.app/avatars/ana.png',
};

describe('AuthIdentityService', () => {
    it('creates a local user on the first authenticated request', async () => {
        const repository = new InMemoryAuthIdentityRepository();
        const service = new AuthIdentityService({ repository });

        const currentUser = await service.resolveCurrentUser(firebaseIdentity);

        expect(currentUser).toMatchObject({
            id: 'user-1',
            fullName: 'Ana Mercado',
            email: 'ana@encuentralotodo.app',
            role: 'UNASSIGNED',
            authProvider: 'firebase',
            externalAuthId: 'firebase-user-1',
            emailVerified: true,
        });
    });

    it('reuses and refreshes an existing local user on subsequent requests', async () => {
        const repository = new InMemoryAuthIdentityRepository();
        const service = new AuthIdentityService({ repository });

        const firstUser = await service.resolveCurrentUser(firebaseIdentity);
        const secondUser = await service.resolveCurrentUser({
            ...firebaseIdentity,
            displayName: 'Ana Mercado Actualizada',
            avatarUrl: 'https://cdn.encuentralotodo.app/avatars/ana-v2.png',
        });

        expect(secondUser.id).toBe(firstUser.id);
        expect(secondUser.fullName).toBe('Ana Mercado Actualizada');
        expect(secondUser.avatarUrl).toBe('https://cdn.encuentralotodo.app/avatars/ana-v2.png');
        expect(secondUser.authProvider).toBe('firebase');
        expect(secondUser.externalAuthId).toBe('firebase-user-1');
    });

    it('reuses an existing local user by email without overwriting the assigned role', async () => {
        const repository = new InMemoryAuthIdentityRepository();
        repository.seedUser({
            id: 'user-existing-admin',
            fullName: 'Ana Mercado',
            email: 'ana@encuentralotodo.app',
            role: 'ADMIN',
            avatarUrl: null,
            isActive: true,
        });
        const service = new AuthIdentityService({ repository });

        const currentUser = await service.resolveCurrentUser(firebaseIdentity);

        expect(currentUser).toMatchObject({
            id: 'user-existing-admin',
            role: 'ADMIN',
            authProvider: 'firebase',
            externalAuthId: 'firebase-user-1',
        });
    });
});