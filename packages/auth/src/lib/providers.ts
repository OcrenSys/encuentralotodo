import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import type {
    AuthProvider,
    AuthProviderName,
    CreateAuthProviderOptions,
    FirebaseAuthProviderConfig,
    MockAuthUser,
    VerifiedIdentity,
} from './auth';
import { AuthTokenVerificationError, UnsupportedAuthProviderError } from './auth';

const defaultMockUsers: Record<string, MockAuthUser> = {
    'ana@encuentralotodo.app': {
        id: 'user-ana',
        fullName: 'Ana Mercado',
        email: 'ana@encuentralotodo.app',
        role: 'USER',
        authProvider: 'mock',
    },
    'luis@encuentralotodo.app': {
        id: 'admin-luis',
        fullName: 'Luis Admin',
        email: 'luis@encuentralotodo.app',
        role: 'ADMIN',
        authProvider: 'mock',
    },
};

function normalizePrivateKey(privateKey?: string) {
    return privateKey?.replace(/\\n/g, '\n');
}

function normalizeServiceAccount(serviceAccountJson: string, fallbackProjectId?: string) {
    const serviceAccount = JSON.parse(serviceAccountJson) as {
        projectId?: string;
        project_id?: string;
        clientEmail?: string;
        client_email?: string;
        privateKey?: string;
        private_key?: string;
    };

    return {
        projectId: serviceAccount.projectId ?? serviceAccount.project_id ?? fallbackProjectId,
        clientEmail: serviceAccount.clientEmail ?? serviceAccount.client_email,
        privateKey: normalizePrivateKey(serviceAccount.privateKey ?? serviceAccount.private_key),
    };
}

function resolveFirebaseTokenVerifier(config: FirebaseAuthProviderConfig = {}) {
    if (config.tokenVerifier) {
        return config.tokenVerifier;
    }

    const projectId = config.projectId;
    const appName = config.appName ?? `encuentralotodo-auth-${projectId ?? 'default'}`;
    const existingApp = getApps().find((app) => app.name === appName);

    if (existingApp) {
        return getAuth(existingApp).verifyIdToken.bind(getAuth(existingApp));
    }

    let firebaseApp;
    if (config.serviceAccountJson) {
        const serviceAccount = normalizeServiceAccount(config.serviceAccountJson, projectId);
        firebaseApp = initializeApp(
            {
                credential: cert({
                    projectId: serviceAccount.projectId,
                    clientEmail: serviceAccount.clientEmail,
                    privateKey: serviceAccount.privateKey,
                }),
                projectId: serviceAccount.projectId,
            },
            appName,
        );
    } else if (config.clientEmail && config.privateKey) {
        firebaseApp = initializeApp(
            {
                credential: cert({
                    projectId,
                    clientEmail: config.clientEmail,
                    privateKey: normalizePrivateKey(config.privateKey),
                }),
                projectId,
            },
            appName,
        );
    } else {
        firebaseApp = initializeApp(
            {
                credential: applicationDefault(),
                projectId,
            },
            appName,
        );
    }

    return getAuth(firebaseApp).verifyIdToken.bind(getAuth(firebaseApp));
}

function mapMockUserToIdentity(user: MockAuthUser): VerifiedIdentity {
    return {
        provider: 'mock',
        externalUserId: user.id,
        email: user.email,
        emailVerified: true,
        displayName: user.fullName,
        avatarUrl: user.avatarUrl ?? null,
    };
}

export class MockAuthProvider implements AuthProvider {
    readonly name = 'mock' as const;

    constructor(private readonly users: Record<string, MockAuthUser> = defaultMockUsers) { }

    async verifyIdToken(idToken: string) {
        const normalizedToken = idToken.trim().toLowerCase();
        const user =
            this.users[normalizedToken] ??
            Object.values(this.users).find(
                (candidate) => candidate.id.toLowerCase() === normalizedToken || candidate.email.toLowerCase() === normalizedToken,
            );

        if (!user) {
            throw new AuthTokenVerificationError('Mock auth token was not recognized.');
        }

        return mapMockUserToIdentity(user);
    }
}

export class FirebaseAuthProvider implements AuthProvider {
    readonly name = 'firebase' as const;

    private readonly tokenVerifier: ReturnType<typeof resolveFirebaseTokenVerifier>;

    constructor(config: FirebaseAuthProviderConfig = {}) {
        this.tokenVerifier = resolveFirebaseTokenVerifier(config);
    }

    async verifyIdToken(idToken: string) {
        try {
            const decodedToken = await this.tokenVerifier(idToken);

            return {
                provider: 'firebase',
                externalUserId: decodedToken.uid ?? decodedToken.sub ?? '',
                email: decodedToken.email ?? null,
                emailVerified: Boolean(decodedToken.email_verified),
                displayName: decodedToken.name ?? null,
                avatarUrl: decodedToken.picture ?? null,
            } satisfies VerifiedIdentity;
        } catch (error) {
            throw new AuthTokenVerificationError('Firebase token verification failed.', { cause: error });
        }
    }
}

export class CognitoAuthProvider implements AuthProvider {
    readonly name = 'cognito' as const;

    async verifyIdToken(_idToken: string): Promise<VerifiedIdentity> {
        throw new UnsupportedAuthProviderError('cognito');
    }
}

export function createAuthProvider(
    provider: AuthProviderName,
    options: CreateAuthProviderOptions = {},
): AuthProvider {
    switch (provider) {
        case 'firebase':
            return new FirebaseAuthProvider(options.firebase);
        case 'cognito':
            return new CognitoAuthProvider();
        case 'mock':
        default:
            return new MockAuthProvider(options.mockUsers);
    }
}

export { defaultMockUsers };