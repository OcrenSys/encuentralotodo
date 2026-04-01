import type { UserProfile, UserRole } from 'types';

export const authProviderNames = ['mock', 'firebase', 'cognito'] as const;
export type AuthProviderName = (typeof authProviderNames)[number];

export interface VerifiedIdentity {
  provider: AuthProviderName;
  externalUserId: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CurrentUser extends UserProfile {
  authProvider: AuthProviderName;
  externalAuthId: string;
  emailVerified: boolean;
}

export interface MockAuthUser extends UserProfile {
  authProvider?: Extract<AuthProviderName, 'mock'>;
}

export interface FirebaseAuthProviderConfig {
  appName?: string;
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
  serviceAccountJson?: string;
  tokenVerifier?: (idToken: string) => Promise<{
    uid: string;
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  }>;
}

export interface CreateAuthProviderOptions {
  firebase?: FirebaseAuthProviderConfig;
  mockUsers?: Record<string, MockAuthUser>;
}

export interface AuthProvider {
  readonly name: AuthProviderName;
  verifyIdToken(idToken: string): Promise<VerifiedIdentity>;
}

export class AuthTokenVerificationError extends Error {
  readonly code: 'INVALID_TOKEN';

  constructor(message = 'The provided auth token is invalid.', options?: { cause?: unknown }) {
    super(message);
    this.name = 'AuthTokenVerificationError';
    this.code = 'INVALID_TOKEN';
    if (options?.cause !== undefined) {
      Object.defineProperty(this, 'cause', {
        value: options.cause,
        enumerable: false,
        configurable: true,
      });
    }
  }
}

export class UnsupportedAuthProviderError extends Error {
  constructor(provider: AuthProviderName) {
    super(`Auth provider \"${provider}\" is not implemented.`);
    this.name = 'UnsupportedAuthProviderError';
  }
}

export function createCurrentUser(input: {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  authProvider: AuthProviderName;
  externalAuthId: string;
  emailVerified: boolean;
}): CurrentUser {
  return {
    id: input.id,
    fullName: input.fullName,
    email: input.email,
    role: input.role,
    avatarUrl: input.avatarUrl ?? undefined,
    authProvider: input.authProvider,
    externalAuthId: input.externalAuthId,
    emailVerified: input.emailVerified,
  };
}
