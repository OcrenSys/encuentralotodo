export type FileStorageProviderName = 'firebase' | 's3';

export interface UploadFileContext {
    module: 'product-images' | 'business-branding' | 'promotion-images' | 'general';
    businessId?: string;
    entityId?: string;
    slot?: string;
}

export interface UploadFileInput {
    file: File;
    context: UploadFileContext;
}

export interface UploadFileResult {
    url: string;
    storageKey: string;
    contentType: string;
    size: number;
}

export interface FileStorageProvider {
    readonly name: FileStorageProviderName;
    uploadFile(input: UploadFileInput): Promise<UploadFileResult>;
}

export class UnsupportedFileStorageProviderError extends Error {
    constructor(provider: FileStorageProviderName) {
        super(`File storage provider "${provider}" is not implemented.`);
        this.name = 'UnsupportedFileStorageProviderError';
    }
}