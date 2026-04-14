'use client';

type RuntimeAuthProvider = 'mock' | 'firebase' | 'cognito';
type RuntimeFileStorageProvider = 'firebase' | 's3';

export type PublicRuntimeEnv = {
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_AUTH_PROVIDER?: RuntimeAuthProvider;
  NEXT_PUBLIC_FILE_STORAGE_PROVIDER?: RuntimeFileStorageProvider;
  NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  NEXT_PUBLIC_FIREBASE_APP_ID?: string;
};

declare global {
  interface Window {
    __ET_PUBLIC_ENV__?: PublicRuntimeEnv;
  }
}

function isRuntimeAuthProvider(
  value: string | undefined,
): value is RuntimeAuthProvider {
  return value === 'mock' || value === 'firebase' || value === 'cognito';
}

function isRuntimeFileStorageProvider(
  value: string | undefined,
): value is RuntimeFileStorageProvider {
  return value === 'firebase' || value === 's3';
}

export function getPublicRuntimeEnv(): PublicRuntimeEnv {
  const browserEnv =
    typeof window !== 'undefined' ? window.__ET_PUBLIC_ENV__ ?? {} : {};
  const authProviderCandidate =
    browserEnv.NEXT_PUBLIC_AUTH_PROVIDER ?? process.env.NEXT_PUBLIC_AUTH_PROVIDER;
  const fileStorageProviderCandidate =
    browserEnv.NEXT_PUBLIC_FILE_STORAGE_PROVIDER ??
    process.env.NEXT_PUBLIC_FILE_STORAGE_PROVIDER;

  return {
    NEXT_PUBLIC_API_URL:
      browserEnv.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_AUTH_PROVIDER: isRuntimeAuthProvider(authProviderCandidate)
      ? authProviderCandidate
      : undefined,
    NEXT_PUBLIC_FILE_STORAGE_PROVIDER: isRuntimeFileStorageProvider(
      fileStorageProviderCandidate,
    )
      ? fileStorageProviderCandidate
      : undefined,
    NEXT_PUBLIC_FIREBASE_API_KEY:
      browserEnv.NEXT_PUBLIC_FIREBASE_API_KEY ??
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      browserEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      browserEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      browserEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      browserEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID:
      browserEnv.NEXT_PUBLIC_FIREBASE_APP_ID ?? process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function getPublicApiBaseUrl() {
  return getPublicRuntimeEnv().NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export function getPublicFileStorageProvider() {
  return getPublicRuntimeEnv().NEXT_PUBLIC_FILE_STORAGE_PROVIDER ?? 'firebase';
}

export function hasFirebaseStoragePublicConfig() {
  const env = getPublicRuntimeEnv();

  return Boolean(
    env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
    env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}