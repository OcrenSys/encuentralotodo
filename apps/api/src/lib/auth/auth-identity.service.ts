import type { CurrentUser, VerifiedIdentity } from 'auth';

import type { AuthIdentityRepositoryPort } from './auth-identity.repository';

interface AuthIdentityServiceDependencies {
    repository: AuthIdentityRepositoryPort;
}

export class AuthIdentityService {
    constructor(private readonly dependencies: AuthIdentityServiceDependencies) { }

    async resolveCurrentUser(identity: VerifiedIdentity): Promise<CurrentUser> {
        const currentUser = await this.dependencies.repository.findCurrentUserByIdentity(
            identity.provider,
            identity.externalUserId,
        );

        if (currentUser) {
            return this.dependencies.repository.upsertIdentityForUser(currentUser.id, identity);
        }

        if (identity.email) {
            const existingUser = await this.dependencies.repository.findUserByEmail(identity.email);
            if (existingUser) {
                return this.dependencies.repository.upsertIdentityForUser(existingUser.id, identity);
            }
        }

        return this.dependencies.repository.createUserFromIdentity(identity);
    }
}