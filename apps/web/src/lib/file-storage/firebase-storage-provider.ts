'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

import {
    getPublicRuntimeEnv,
    hasFirebaseStoragePublicConfig,
} from '../public-runtime-env';
import type {
    FileStorageProvider,
    UploadFileInput,
    UploadFileResult,
} from './types';

interface FirebaseStorageProviderOptions {
    now?: () => Date;
    randomId?: () => string;
    uploadFileImpl?: (input: {
        file: File;
        storageKey: string;
    }) => Promise<UploadFileResult>;
}

function normalizeFirebaseStorageUploadError(error: unknown) {
    if (!(error instanceof Error)) {
        return new Error('No fue posible subir la imagen a Firebase Storage.');
    }

    const message = error.message.toLowerCase();

    if (
        message.includes('failed to fetch') ||
        message.includes('network request failed') ||
        message.includes('cors')
    ) {
        return new Error(
            'Firebase Storage rechazo la subida desde este origen. Configura CORS en el bucket para permitir http://localhost:3000 y el dominio web desplegado.',
        );
    }

    return error;
}

function getFirebaseStorageApp() {
    if (!hasFirebaseStoragePublicConfig()) {
        throw new Error(
            'Firebase Storage is selected as the public file storage provider, but one or more NEXT_PUBLIC_FIREBASE_* variables are missing in the web runtime.',
        );
    }

    const publicEnv = getPublicRuntimeEnv();
    const config = {
        apiKey: publicEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: publicEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: publicEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: publicEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: publicEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    return getApps().length > 0 ? getApp() : initializeApp(config);
}

function sanitizePathSegment(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');
}

function buildStorageKey(input: UploadFileInput, now: Date, randomId: string) {
    const safeFileName = sanitizePathSegment(input.file.name) || 'image';
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const objectName = `${timestamp}-${randomId}-${safeFileName}`;
    const entityId = input.context.entityId
        ? sanitizePathSegment(input.context.entityId)
        : 'draft';
    const slot = input.context.slot ? sanitizePathSegment(input.context.slot) : '';

    if (input.context.module === 'business-branding' && input.context.businessId) {
        const slotSegment = slot ? `/${slot}` : '';

        return `businesses/${input.context.businessId}/branding${slotSegment}/${objectName}`;
    }

    if (input.context.module === 'product-images' && input.context.businessId) {
        return `businesses/${input.context.businessId}/products/${entityId}/${objectName}`;
    }

    if (input.context.module === 'promotion-images' && input.context.businessId) {
        return `businesses/${input.context.businessId}/promotions/${entityId}/${objectName}`;
    }

    return `general/${input.context.module}/${objectName}`;
}

export class FirebaseStorageProvider implements FileStorageProvider {
    readonly name = 'firebase' as const;

    constructor(
        private readonly options: FirebaseStorageProviderOptions = {},
    ) { }

    async uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
        const now = this.options.now?.() ?? new Date();
        const randomId =
            this.options.randomId?.() ??
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID().slice(0, 8)
                : Math.random().toString(36).slice(2, 10));
        const storageKey = buildStorageKey(input, now, randomId);

        try {
            if (this.options.uploadFileImpl) {
                return await this.options.uploadFileImpl({
                    file: input.file,
                    storageKey,
                });
            }

            const storage = getStorage(getFirebaseStorageApp());
            const storageRef = ref(storage, storageKey);
            await uploadBytes(storageRef, input.file, {
                contentType: input.file.type || undefined,
            });
            const url = await getDownloadURL(storageRef);

            return {
                url,
                storageKey,
                contentType: input.file.type || 'application/octet-stream',
                size: input.file.size,
            };
        } catch (error) {
            throw normalizeFirebaseStorageUploadError(error);
        }
    }
}