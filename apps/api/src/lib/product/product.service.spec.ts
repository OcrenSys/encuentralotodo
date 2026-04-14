import type {
    CreateProductInput,
    DeleteProductInput,
    GetProductByIdInput,
    UpdateProductInput,
    UserProfile,
} from 'types';

import type {
    BusinessRepositoryPort,
    RepositoryBusinessAccessRecord,
} from '../business/business.repository';
import type {
    ProductRepositoryPort,
    RepositoryProductRecord,
    RepositoryProductWithBusinessRecord,
} from './product.repository';
import { ProductService } from './product.service';

function createBusinessAccess(overrides: Partial<RepositoryBusinessAccessRecord> = {}): RepositoryBusinessAccessRecord {
    return {
        id: overrides.id ?? 'biz-casa-norte',
        ownerId: overrides.ownerId ?? 'owner-sofia',
        managers: overrides.managers ?? ['manager-carlos'],
        memberships: overrides.memberships ?? [
            { userId: 'owner-sofia', role: 'OWNER' },
            { userId: 'manager-carlos', role: 'MANAGER' },
        ],
        subscriptionType: overrides.subscriptionType ?? 'PREMIUM_PLUS',
        status: overrides.status ?? 'APPROVED',
    };
}

function createProductRecord(overrides: Partial<RepositoryProductRecord> = {}): RepositoryProductRecord {
    return {
        id: 'prod-1',
        name: 'Pack familiar',
        description: 'Selección semanal.',
        images: ['https://example.com/product.jpg'],
        type: 'simple',
        configurationSummary: null,
        price: 1250,
        isFeatured: true,
        businessId: 'biz-casa-norte',
        lastUpdated: new Date('2026-03-29T10:00:00.000Z'),
        createdAt: new Date('2026-03-29T09:00:00.000Z'),
        ...overrides,
    };
}

function createProductWithBusinessRecord(overrides: Partial<RepositoryProductWithBusinessRecord> = {}): RepositoryProductWithBusinessRecord {
    const base = createProductRecord();
    const businessOverrides = overrides.business;

    return {
        ...base,
        ...overrides,
        business: {
            id: businessOverrides?.id ?? base.businessId,
            name: businessOverrides?.name ?? 'Casa Norte',
            ownerId: businessOverrides?.ownerId ?? 'owner-sofia',
            subscriptionType: businessOverrides?.subscriptionType ?? 'PREMIUM_PLUS',
            status: businessOverrides?.status ?? 'APPROVED',
            managers: businessOverrides?.managers ?? [{ userId: 'manager-carlos' }],
            memberships: businessOverrides?.memberships ?? [
                { userId: 'owner-sofia', role: 'OWNER' },
                { userId: 'manager-carlos', role: 'MANAGER' },
            ],
        },
    };
}

function createProductRepositoryMock(): jest.Mocked<ProductRepositoryPort> {
    return {
        listByBusiness: jest.fn(),
        listManaged: jest.fn(),
        listManagedForExport: jest.fn(),
        createMany: jest.fn(),
        findById: jest.fn(),
        findByIdWithBusiness: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        countFeaturedByBusiness: jest.fn(),
    };
}

function createBusinessRepositoryMock(): jest.Mocked<BusinessRepositoryPort> {
    return {
        listBusinesses: jest.fn(),
        listBusinessesForManagement: jest.fn(),
        listBusinessesByUserAccess: jest.fn(),
        listBusinessesForManagementPage: jest.fn(),
        listBusinessesByUserAccessPage: jest.fn(),
        findBusinessById: jest.fn(),
        findBusinessAccessById: jest.fn(),
        listPendingBusinesses: jest.fn(),
        createBusiness: jest.fn(),
        updateBusiness: jest.fn(),
        approveBusiness: jest.fn(),
        listBusinessMembershipSources: jest.fn(),
        upsertCanonicalMemberships: jest.fn(),
        searchUsers: jest.fn(),
        findUserById: jest.fn(),
        findUsersByIds: jest.fn(),
    } as unknown as jest.Mocked<BusinessRepositoryPort>;
}

function createService(currentUser: UserProfile | null) {
    const repository = createProductRepositoryMock();
    const businessRepository = createBusinessRepositoryMock();

    return {
        repository,
        businessRepository,
        service: new ProductService({
            repository,
            businessRepository,
            currentUser,
        }),
    };
}

describe('ProductService', () => {
    const ownerUser = {
        id: 'owner-sofia',
        fullName: 'Sofia Rivas',
        email: 'sofia@encuentralotodo.app',
        role: 'USER',
    } as UserProfile;

    it('listByBusiness returns mapped Prisma-backed products', async () => {
        const { service, repository, businessRepository } = createService(ownerUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess({ subscriptionType: 'PREMIUM_PLUS' }));
        repository.listByBusiness.mockResolvedValue([createProductRecord()]);

        const result = await service.listByBusiness('biz-casa-norte');

        expect(result).toEqual([
            expect.objectContaining({
                id: 'prod-1',
                name: 'Pack familiar',
                businessId: 'biz-casa-norte',
                lastUpdated: '2026-03-29T10:00:00.000Z',
            }),
        ]);
    });

    it('byId returns the correct mapped product', async () => {
        const { service, repository } = createService(ownerUser);
        const input: GetProductByIdInput = { productId: 'prod-1' };
        repository.findById.mockResolvedValue(createProductRecord());

        const result = await service.getById(input);

        expect(result).toMatchObject({
            id: 'prod-1',
            price: 1250,
            images: ['https://example.com/product.jpg'],
        });
    });

    it('create persists product correctly for an authorized business user', async () => {
        const { service, repository, businessRepository } = createService(ownerUser);
        const input: CreateProductInput = {
            businessId: 'biz-casa-norte',
            name: 'Nuevo producto',
            description: 'Descripción suficientemente larga.',
            images: ['https://example.com/new-product.jpg'],
            type: 'simple',
            price: 200,
            isFeatured: false,
        };
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess({ subscriptionType: 'PREMIUM_PLUS' }));
        repository.create.mockResolvedValue(createProductRecord({ id: 'prod-new', name: 'Nuevo producto', price: 200, isFeatured: false }));

        const result = await service.create(input);

        expect(repository.create).toHaveBeenCalledWith(input);
        expect(result).toMatchObject({ id: 'prod-new', name: 'Nuevo producto', price: 200, isFeatured: false });
    });

    it('prevents business managers from creating products for their assigned business', async () => {
        const managerUser = {
            id: 'manager-carlos',
            fullName: 'Carlos Mena',
            email: 'carlos@encuentralotodo.app',
            role: 'USER',
        } as UserProfile;
        const { service, repository, businessRepository } = createService(managerUser);

        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());

        await expect(service.create({
            businessId: 'biz-casa-norte',
            name: 'Producto manager',
            description: 'Descripción suficientemente larga para creación por manager.',
            images: ['https://example.com/manager-product.jpg'],
            type: 'simple',
            price: 180,
            isFeatured: false,
        })).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Business access required.',
        });

        expect(repository.create).not.toHaveBeenCalled();
    });

    it('create supports configurable products with a lightweight summary', async () => {
        const { service, repository, businessRepository } = createService(ownerUser);
        const input: CreateProductInput = {
            businessId: 'biz-casa-norte',
            name: 'Pizza por mitades',
            description: 'Producto configurable con combinaciones de sabor.',
            images: ['https://example.com/pizza.jpg'],
            type: 'configurable',
            configurationSummary: 'Elige tamaño y combinación al pedirlo.',
            isFeatured: true,
        };
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess({ subscriptionType: 'PREMIUM_PLUS' }));
        repository.create.mockResolvedValue(createProductRecord({
            id: 'prod-configurable',
            name: 'Pizza por mitades',
            type: 'configurable',
            configurationSummary: 'Elige tamaño y combinación al pedirlo.',
            price: null,
        }));

        const result = await service.create(input);

        expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
            type: 'configurable',
            configurationSummary: 'Elige tamaño y combinación al pedirlo.',
            price: undefined,
        }));
        expect(result).toMatchObject({
            id: 'prod-configurable',
            type: 'configurable',
            configurationSummary: 'Elige tamaño y combinación al pedirlo.',
        });
    });

    it('update persists product correctly for an authorized business user', async () => {
        const { service, repository } = createService(ownerUser);
        const input: UpdateProductInput = {
            productId: 'prod-1',
            name: 'Producto ajustado',
            price: 350,
        };
        repository.findByIdWithBusiness.mockResolvedValue(createProductWithBusinessRecord());
        repository.update.mockResolvedValue(createProductRecord({ name: 'Producto ajustado', price: 350 }));

        const result = await service.update(input);

        expect(repository.update).toHaveBeenCalledWith('prod-1', expect.objectContaining({ name: 'Producto ajustado', price: 350 }));
        expect(result).toMatchObject({ id: 'prod-1', name: 'Producto ajustado', price: 350 });
    });

    it('delete removes the product according to the current hard-delete behavior', async () => {
        const { service, repository } = createService(ownerUser);
        const input: DeleteProductInput = { productId: 'prod-1' };
        repository.findByIdWithBusiness.mockResolvedValue(createProductWithBusinessRecord());
        repository.delete.mockResolvedValue(createProductRecord());

        const result = await service.delete(input);

        expect(repository.delete).toHaveBeenCalledWith('prod-1');
        expect(result).toMatchObject({ id: 'prod-1', name: 'Pack familiar' });
    });

    it('denies delete when the user lacks business access', async () => {
        const outsider = {
            id: 'user-ana',
            fullName: 'Ana Mercado',
            email: 'ana@encuentralotodo.app',
            role: 'USER',
        } as UserProfile;
        const { service, repository } = createService(outsider);
        repository.findByIdWithBusiness.mockResolvedValue(createProductWithBusinessRecord());

        await expect(service.delete({ productId: 'prod-1' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Business access required.',
        });

        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('unauthorized users cannot create products for another business', async () => {
        const outsider = {
            id: 'user-ana',
            fullName: 'Ana Mercado',
            email: 'ana@encuentralotodo.app',
            role: 'USER',
        } as UserProfile;
        const { service, businessRepository } = createService(outsider);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());

        await expect(service.create({
            businessId: 'biz-casa-norte',
            name: 'Producto',
            description: 'Descripción suficientemente larga.',
            images: ['https://example.com/product.jpg'],
            type: 'simple',
            price: 100,
            isFeatured: true,
        })).rejects.toMatchObject({ code: 'FORBIDDEN', message: 'Business access required.' });
    });

    it('handles non-existent business and product cases correctly', async () => {
        const { service, businessRepository, repository } = createService(ownerUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(null);
        repository.findByIdWithBusiness.mockResolvedValue(null);

        await expect(service.create({
            businessId: 'missing-business',
            name: 'Producto',
            description: 'Descripción suficientemente larga.',
            images: ['https://example.com/product.jpg'],
            type: 'simple',
            price: 100,
            isFeatured: true,
        })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Business not found.' });

        await expect(service.update({ productId: 'missing-product', name: 'Nada' })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Product not found.' });
    });

    it('enforces FREE_TRIAL featured-product limits on create', async () => {
        const { service, businessRepository, repository } = createService(ownerUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess({ subscriptionType: 'FREE_TRIAL' }));
        repository.countFeaturedByBusiness.mockResolvedValue(5);

        await expect(service.create({
            businessId: 'biz-casa-norte',
            name: 'Producto destacado',
            description: 'Descripción suficientemente larga para el límite FREE_TRIAL.',
            images: ['https://example.com/product.jpg'],
            type: 'simple',
            price: 100,
            isFeatured: true,
        })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'FREE_TRIAL permite un máximo de 5 productos destacados.',
        });
    });

    it('previewManagedImport denies managers under the owner-admin management policy', async () => {
        const managerUser = {
            id: 'manager-carlos',
            fullName: 'Carlos Mena',
            email: 'carlos@encuentralotodo.app',
            role: 'USER',
        } as UserProfile;
        const { service, businessRepository } = createService(managerUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess({ subscriptionType: 'FREE_TRIAL' }));

        const result = await service.previewManagedImport({
            businessId: 'biz-casa-norte',
            items: [
                {
                    rowNumber: 2,
                    product: {
                        name: 'Producto importado',
                        description: 'Descripción suficientemente larga para importación.',
                        images: ['https://example.com/imported.jpg'],
                        type: 'simple',
                        isFeatured: true,
                        price: 120,
                    },
                },
            ],
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toEqual([
            'Fila 2: No tienes acceso para importar productos en este negocio.',
        ]);
    });

    it('importManaged enforces FREE_TRIAL featured-only rules before persisting', async () => {
        const { service, businessRepository, repository } = createService(ownerUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess({ subscriptionType: 'FREE_TRIAL' }));
        repository.countFeaturedByBusiness.mockResolvedValue(0);

        await expect(service.importManaged({
            businessId: 'biz-casa-norte',
            items: [
                {
                    rowNumber: 3,
                    product: {
                        name: 'No destacado',
                        description: 'Descripción suficientemente larga para validación de importación.',
                        images: ['https://example.com/plain.jpg'],
                        type: 'simple',
                        isFeatured: false,
                        price: 80,
                    },
                },
            ],
        })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'Fila 3: FREE_TRIAL solo permite productos destacados.',
        });

        expect(repository.createMany).not.toHaveBeenCalled();
    });

    it('exportManagedCsv preserves admin export access across businesses', async () => {
        const adminUser = {
            id: 'admin-luis',
            fullName: 'Luis Admin',
            email: 'luis@encuentralotodo.app',
            role: 'ADMIN',
        } as UserProfile;
        const { service, repository } = createService(adminUser);
        repository.listManagedForExport.mockResolvedValue([
            createProductWithBusinessRecord({
                businessId: 'biz-casa-norte',
                name: 'Pack exportado',
                price: 1250,
            }),
        ]);

        const result = await service.exportManagedCsv({
            page: 1,
            pageSize: 25,
            search: '',
            featured: 'ALL',
            businessId: undefined,
        });

        expect(repository.listManagedForExport).toHaveBeenCalledWith(expect.anything(), 'admin-luis', true);
        expect(result.content).toContain('Pack exportado');
    });

    it('preserves the key contract shape for product responses', async () => {
        const { service, repository, businessRepository } = createService(ownerUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess({ subscriptionType: 'PREMIUM_PLUS' }));
        repository.listByBusiness.mockResolvedValue([createProductRecord({ price: null })]);

        const result = await service.listByBusiness('biz-casa-norte');

        expect(result[0]).toEqual({
            id: 'prod-1',
            name: 'Pack familiar',
            description: 'Selección semanal.',
            images: ['https://example.com/product.jpg'],
            type: 'simple',
            price: undefined,
            isFeatured: true,
            businessId: 'biz-casa-norte',
            lastUpdated: '2026-03-29T10:00:00.000Z',
        });
    });
});