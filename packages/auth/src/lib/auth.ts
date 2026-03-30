import type { AuthSession, UserProfile } from 'types';

export interface AuthProvider {
  signIn(input?: { email: string; fullName?: string }): Promise<UserProfile | null>;
  signOut(): Promise<void>;
  getUser(): Promise<UserProfile | null>;
}

export type AuthProviderName = AuthSession['provider'];

export interface AuthAdapterConfig {
  provider: AuthProviderName;
  currentUser: UserProfile | null;
}
