import {
    createFileStorageProvider,
    FirebaseStorageProvider,
    UnsupportedFileStorageProviderError,
} from '../src/lib/file-storage';

describe('file storage factory and firebase provider', () => {
    it('selects the firebase provider from the factory', () => {
        const provider = createFileStorageProvider('firebase');

        expect(provider).toBeInstanceOf(FirebaseStorageProvider);
        expect(provider.name).toBe('firebase');
    });

    it('rejects providers that are not implemented yet', () => {
        expect(() => createFileStorageProvider('s3')).toThrow(
            UnsupportedFileStorageProviderError,
        );
    });

    it('uploads through the firebase abstraction with a deterministic business-aware path', async () => {
        const uploadFileImpl = jest.fn(async ({ file, storageKey }) => ({
            url: `https://cdn.example.com/${storageKey}`,
            storageKey,
            contentType: file.type,
            size: file.size,
        }));
        const provider = new FirebaseStorageProvider({
            now: () => new Date('2026-04-05T12:00:00.000Z'),
            randomId: () => 'seed1234',
            uploadFileImpl,
        });
        const file = new File(['image-bytes'], 'Hero Banner.PNG', {
            type: 'image/png',
        });

        const result = await provider.uploadFile({
            file,
            context: {
                module: 'product-images',
                businessId: 'business-1',
                entityId: 'product-7',
            },
        });

        expect(uploadFileImpl).toHaveBeenCalledWith(
            expect.objectContaining({
                file,
                storageKey:
                    'businesses/business-1/products/product-7/2026-04-05T12-00-00-000Z-seed1234-hero-banner.png',
            }),
        );
        expect(result).toEqual({
            url:
                'https://cdn.example.com/businesses/business-1/products/product-7/2026-04-05T12-00-00-000Z-seed1234-hero-banner.png',
            storageKey:
                'businesses/business-1/products/product-7/2026-04-05T12-00-00-000Z-seed1234-hero-banner.png',
            contentType: 'image/png',
            size: file.size,
        });
    });

    it('maps CORS-like upload failures to an actionable Firebase Storage message', async () => {
        const provider = new FirebaseStorageProvider({
            uploadFileImpl: jest.fn(async () => {
                throw new TypeError('Failed to fetch');
            }),
        });

        await expect(
            provider.uploadFile({
                file: new File(['image-bytes'], 'profile.png', {
                    type: 'image/png',
                }),
                context: {
                    module: 'business-branding',
                    businessId: 'business-1',
                    slot: 'profile',
                },
            }),
        ).rejects.toThrow(
            'Firebase Storage rechazo la subida desde este origen. Configura CORS en el bucket para permitir http://localhost:3000 y el dominio web desplegado.',
        );
    });
});