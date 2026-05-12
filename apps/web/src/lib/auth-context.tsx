'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  type FrontendAuthUser,
  getCurrentFirebaseIdToken,
  getPublicAuthProvider,
  hasFirebasePublicConfig,
  isFirebaseAuthEnabled,
  registerWithFirebaseEmail,
  signInWithFirebaseEmail,
  signInWithFirebaseGoogle,
  signOutFromFirebase,
  subscribeToAuthTokenChanges,
} from './firebase-auth';

export type CurrentAuthUser = FrontendAuthUser;

type AuthContextValue = {
  provider: 'mock' | 'firebase' | 'cognito';
  isLoading: boolean;
  isAuthenticated: boolean;
  user: CurrentAuthUser | null;
  signInWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<void>;
  registerWithPassword: (input: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function createAuthProviderError(provider: AuthContextValue['provider']) {
  if (provider === 'firebase' && !hasFirebasePublicConfig()) {
    return new Error(
      'Firebase is selected as the public auth provider, but the web runtime is missing one or more NEXT_PUBLIC_FIREBASE_* variables.',
    );
  }

  return new Error(
    `Real authentication is not enabled for provider \"${provider}\" in this web runtime.`,
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const provider = getPublicAuthProvider();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<CurrentAuthUser | null>(null);

  useEffect(() => {
    if (!isFirebaseAuthEnabled()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToAuthTokenChanges((nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [provider]);

  const value = useMemo<AuthContextValue>(
    () => ({
      provider,
      isLoading,
      isAuthenticated: Boolean(user),
      user,
      async signInWithPassword(input) {
        if (!isFirebaseAuthEnabled()) {
          throw createAuthProviderError(provider);
        }

        await signInWithFirebaseEmail(input);
      },
      async registerWithPassword(input) {
        if (!isFirebaseAuthEnabled()) {
          throw createAuthProviderError(provider);
        }

        await registerWithFirebaseEmail(input);
      },
      async signInWithGoogle() {
        if (!isFirebaseAuthEnabled()) {
          throw createAuthProviderError(provider);
        }

        await signInWithFirebaseGoogle();
      },
      async signOut() {
        if (!isFirebaseAuthEnabled()) {
          setUser(null);
          return;
        }

        await signOutFromFirebase();
      },
      async getIdToken(forceRefresh = false) {
        if (!isFirebaseAuthEnabled()) {
          return null;
        }

        return getCurrentFirebaseIdToken(forceRefresh);
      },
    }),
    [isLoading, provider, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCurrentAuthUser() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useCurrentAuthUser must be used within AuthProvider.');
  }

  return context;
}
