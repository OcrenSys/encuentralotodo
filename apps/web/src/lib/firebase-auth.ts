'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import {
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    onIdTokenChanged,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    type User,
} from 'firebase/auth';

import { getPublicRuntimeEnv } from './public-runtime-env';

let persistencePromise: Promise<void> | null = null;

export type AuthMethodProvider = 'firebase' | 'password' | 'google.com' | 'github.com' | 'unknown';
export type PublicAuthProvider = 'mock' | 'firebase' | 'cognito';

export type FrontendAuthUser = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    provider: AuthMethodProvider;
};

type PublicRuntimeEnv = {
    NEXT_PUBLIC_AUTH_PROVIDER?: PublicAuthProvider;
    NEXT_PUBLIC_FIREBASE_API_KEY?: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
    NEXT_PUBLIC_FIREBASE_APP_ID?: string;
};

function hasCompleteFirebasePublicConfig(rawEnv: Record<string, string | undefined>) {
    return Boolean(
        rawEnv.NEXT_PUBLIC_FIREBASE_API_KEY &&
            rawEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
            rawEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
            rawEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
    );
}

function resolvePublicRuntimeEnv(): PublicRuntimeEnv {
    const rawEnv = getPublicRuntimeEnv();
    const explicitAuthProvider = rawEnv.NEXT_PUBLIC_AUTH_PROVIDER;

    return {
        NEXT_PUBLIC_AUTH_PROVIDER:
            explicitAuthProvider ??
            (hasCompleteFirebasePublicConfig(rawEnv) ? 'firebase' : 'mock'),
        NEXT_PUBLIC_FIREBASE_API_KEY: rawEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: rawEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: rawEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: rawEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: rawEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: rawEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
}

export function getPublicAuthProvider() {
    return resolvePublicRuntimeEnv().NEXT_PUBLIC_AUTH_PROVIDER as PublicAuthProvider;
}

export function hasFirebasePublicConfig() {
    return hasCompleteFirebasePublicConfig(getPublicRuntimeEnv());
}

export function isFirebaseAuthEnabled() {
    return getPublicAuthProvider() === 'firebase' && hasFirebasePublicConfig();
}

export function normalizeFirebaseUser(user: User): FrontendAuthUser {
    const primaryProvider = user.providerData[0]?.providerId;

    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider:
            primaryProvider === 'password' ||
                primaryProvider === 'google.com' ||
                primaryProvider === 'github.com'
                ? primaryProvider
                : 'unknown',
    };
}

function getFirebaseConfig() {
    const publicEnv = resolvePublicRuntimeEnv();

    if (!hasFirebasePublicConfig()) {
        throw new Error(
            'Firebase auth is configured as the public provider, but one or more NEXT_PUBLIC_FIREBASE_* variables are missing in the web runtime.',
        );
    }

    return {
        apiKey: publicEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: publicEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: publicEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: publicEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: publicEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
}

function getFirebaseApp() {
    if (!isFirebaseAuthEnabled()) {
        throw new Error('Firebase auth is not enabled for this web runtime.');
    }

    return getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
}

async function ensurePersistence() {
    if (!isFirebaseAuthEnabled() || typeof window === 'undefined') {
        return;
    }

    if (!persistencePromise) {
        const auth = getAuth(getFirebaseApp());
        persistencePromise = setPersistence(auth, browserLocalPersistence);
    }

    await persistencePromise;
}

export async function getCurrentAuthorizationHeader(forceRefresh = false) {
    if (!isFirebaseAuthEnabled()) {
        return null;
    }

    await ensurePersistence();
    const auth = getAuth(getFirebaseApp());
    const token = auth.currentUser ? await auth.currentUser.getIdToken(forceRefresh) : null;

    return token ? `Bearer ${token}` : null;
}

export async function getCurrentFirebaseIdToken(forceRefresh = false) {
    if (!isFirebaseAuthEnabled()) {
        return null;
    }

    await ensurePersistence();
    const auth = getAuth(getFirebaseApp());
    return auth.currentUser ? auth.currentUser.getIdToken(forceRefresh) : null;
}

export function subscribeToAuthTokenChanges(listener: (user: FrontendAuthUser | null) => void) {
    if (!isFirebaseAuthEnabled()) {
        listener(null);
        return () => undefined;
    }

    void ensurePersistence();
    return onIdTokenChanged(getAuth(getFirebaseApp()), (user) => {
        listener(user ? normalizeFirebaseUser(user) : null);
    });
}

export async function signInWithFirebaseEmail(input: { email: string; password: string }) {
    await ensurePersistence();
    const auth = getAuth(getFirebaseApp());
    return signInWithEmailAndPassword(auth, input.email, input.password);
}

export async function registerWithFirebaseEmail(input: { email: string; password: string; displayName?: string }) {
    await ensurePersistence();
    const auth = getAuth(getFirebaseApp());
    const credentials = await createUserWithEmailAndPassword(auth, input.email, input.password);

    if (input.displayName) {
        await updateProfile(credentials.user, { displayName: input.displayName });
    }

    return credentials;
}

export async function signInWithFirebaseGoogle() {
    await ensurePersistence();
    const auth = getAuth(getFirebaseApp());
    return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOutFromFirebase() {
    if (!isFirebaseAuthEnabled()) {
        return;
    }

    await ensurePersistence();
    await signOut(getAuth(getFirebaseApp()));
}