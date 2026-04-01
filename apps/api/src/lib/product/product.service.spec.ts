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
        id: 'biz-casa-norte',
        ownerId: 'owner-sofia',
        managers: ['manager-carlos'],
        subscriptionType: 'PREMIUM_PLUS',
        status: 'APPROVED',
        ...overrides,
    };
}

function createProductRecord(overrides: Partial<RepositoryProductRecord> = {}): RepositoryProductRecord {
    return {
        id: 'prod-1',
        name: 'Pack familiar',
        description: 'Selección semanal.',
        images: ['https://example.com/product.jpg'],
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

    return {
        ...base,
        business: {
            id: base.businessId,
            ownerId: 'owner-sofia',
            subscriptionType: 'PREMIUM_PLUS',
            status: 'APPROVED',
            managers: [{ userId: 'manager-carlos' }],
        },
        ...overrides,
    };
}

function createProductRepositoryMock(): jest.Mocked<ProductRepositoryPort> {
    return {
        listByBusiness: jest.fn(),
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
        findBusinessById: jest.fn(),
        findBusinessAccessById: jest.fn(),
        listPendingBusinesses: jest.fn(),
        createBusiness: jest.fn(),
        approveBusiness: jest.fn(),
        findUserById: jest.fn(),
        findUsersByIds: jest.fn(),
    };
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
            price: 200,
            isFeatured: false,
        };
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess({ subscriptionType: 'PREMIUM_PLUS' }));
        repository.create.mockResolvedValue(createProductRecord({ id: 'prod-new', name: 'Nuevo producto', price: 200, isFeatured: false }));

        const result = await service.create(input);

        expect(repository.create).toHaveBeenCalledWith(input);
        expect(result).toMatchObject({ id: 'prod-new', name: 'Nuevo producto', price: 200, isFeatured: false });
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
            price: 100,
            isFeatured: true,
        })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Business not found.' });

        await expect(service.update({ productId: 'missing-product', name: 'Nada' })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Product not found.' });
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
            price: undefined,
            isFeatured: true,
            businessId: 'biz-casa-norte',
            lastUpdated: '2026-03-29T10:00:00.000Z',
        });
    });
});