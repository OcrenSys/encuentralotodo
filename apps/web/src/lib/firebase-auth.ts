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

import { parsePublicEnv } from 'config';

const publicEnv = parsePublicEnv(process.env);

let persistencePromise: Promise<void> | null = null;

export type AuthMethodProvider = 'firebase' | 'password' | 'google.com' | 'github.com' | 'unknown';

export type FrontendAuthUser = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    provider: AuthMethodProvider;
};

export function getPublicAuthProvider() {
    return publicEnv.NEXT_PUBLIC_AUTH_PROVIDER;
}

export function isFirebaseAuthEnabled() {
    return publicEnv.NEXT_PUBLIC_AUTH_PROVIDER === 'firebase';
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