'use client';

import { getPublicFileStorageProvider } from '../public-runtime-env';
import { FirebaseStorageProvider } from './firebase-storage-provider';
import type { FileStorageProvider, FileStorageProviderName } from './types';
import { UnsupportedFileStorageProviderError } from './types';

let storageProvider: FileStorageProvider | null = null;

export function createFileStorageProvider(
    provider: FileStorageProviderName,
): FileStorageProvider {
    switch (provider) {
        case 'firebase':
            return new FirebaseStorageProvider();
        case 's3':
        default:
            throw new UnsupportedFileStorageProviderError(provider);
    }
}

export function getFileStorageProvider() {
    if (!storageProvider) {
        storageProvider = createFileStorageProvider(getPublicFileStorageProvider());
    }

    return storageProvider;
}

export function resetFileStorageProviderForTests() {
    storageProvider = null;
}