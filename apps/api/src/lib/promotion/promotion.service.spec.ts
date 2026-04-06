import type {
    CreatePromotionInput,
    DeletePromotionInput,
    GetPromotionByIdInput,
    UpdatePromotionInput,
    UserProfile,
} from 'types';

import type {
    BusinessRepositoryPort,
    RepositoryBusinessAccessRecord,
} from '../business/business.repository';
import type {
    PromotionRepositoryPort,
    RepositoryPromotionRecord,
    RepositoryPromotionWithBusinessRecord,
} from './promotion.repository';
import { PromotionService } from './promotion.service';

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

function createPromotionRecord(overrides: Partial<RepositoryPromotionRecord> = {}): RepositoryPromotionRecord {
    return {
        id: 'promo-1',
        title: 'Oferta del día',
        description: 'Precio especial para clientes frecuentes.',
        promoPrice: 199,
        originalPrice: 299,
        validUntil: new Date('2026-04-15T10:00:00.000Z'),
        businessId: 'biz-casa-norte',
        image: 'https://example.com/promo.jpg',
        lastUpdated: new Date('2026-04-01T08:30:00.000Z'),
        createdAt: new Date('2026-04-01T08:00:00.000Z'),
        ...overrides,
    };
}

function createPromotionWithBusinessRecord(overrides: Partial<RepositoryPromotionWithBusinessRecord> = {}): RepositoryPromotionWithBusinessRecord {
    const base = createPromotionRecord();

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

function createPromotionRepositoryMock(): jest.Mocked<PromotionRepositoryPort> {
    return {
        listByBusiness: jest.fn(),
        listActive: jest.fn(),
        findById: jest.fn(),
        findByIdWithBusiness: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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
        findUserById: jest.fn(),
        findUsersByIds: jest.fn(),
    };
}

function createService(currentUser: UserProfile | null) {
    const repository = createPromotionRepositoryMock();
    const businessRepository = createBusinessRepositoryMock();

    return {
        repository,
        businessRepository,
        service: new PromotionService({
            repository,
            businessRepository,
            currentUser,
        }),
    };
}

describe('PromotionService', () => {
    const ownerUser = {
        id: 'owner-sofia',
        fullName: 'Sofia Rivas',
        email: 'sofia@encuentralotodo.app',
        role: 'USER',
    } as UserProfile;

    it('listByBusiness returns mapped Prisma-backed promotions', async () => {
        const { service, repository, businessRepository } = createService(ownerUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.listByBusiness.mockResolvedValue([createPromotionRecord()]);

        const result = await service.listByBusiness('biz-casa-norte');

        expect(result).toEqual([
            expect.objectContaining({
                id: 'promo-1',
                title: 'Oferta del día',
                businessId: 'biz-casa-norte',
                lastUpdated: '2026-04-01T08:30:00.000Z',
            }),
        ]);
    });

    it('byId returns the correct mapped promotion', async () => {
        const { service, repository } = createService(ownerUser);
        const input: GetPromotionByIdInput = { promotionId: 'promo-1' };
        repository.findById.mockResolvedValue(createPromotionRecord());

        const result = await service.getById(input);

        expect(result).toMatchObject({
            id: 'promo-1',
            promoPrice: 199,
            originalPrice: 299,
            image: 'https://example.com/promo.jpg',
        });
    });

    it('create persists promotion correctly for an authorized business user', async () => {
        const { service, repository, businessRepository } = createService(ownerUser);
        const input: CreatePromotionInput = {
            businessId: 'biz-casa-norte',
            title: 'Promo nueva',
            description: 'Beneficio válido durante la semana de lanzamiento.',
            promoPrice: 149,
            originalPrice: 199,
            validUntil: '2026-04-20T12:00:00.000Z',
            image: 'https://example.com/new-promo.jpg',
        };
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.create.mockResolvedValue(createPromotionRecord({
            id: 'promo-new',
            title: 'Promo nueva',
            description: 'Beneficio válido durante la semana de lanzamiento.',
            promoPrice: 149,
            originalPrice: 199,
            validUntil: new Date('2026-04-20T12:00:00.000Z'),
            image: 'https://example.com/new-promo.jpg',
        }));

        const result = await service.create(input);

        expect(repository.create).toHaveBeenCalledWith(input);
        expect(result).toMatchObject({ id: 'promo-new', title: 'Promo nueva', promoPrice: 149 });
    });

    it('update persists promotion correctly for an authorized business user', async () => {
        const { service, repository } = createService(ownerUser);
        const input: UpdatePromotionInput = {
            promotionId: 'promo-1',
            title: 'Oferta extendida',
            validUntil: '2026-04-30T12:00:00.000Z',
        };
        repository.findByIdWithBusiness.mockResolvedValue(createPromotionWithBusinessRecord());
        repository.update.mockResolvedValue(createPromotionRecord({
            title: 'Oferta extendida',
            validUntil: new Date('2026-04-30T12:00:00.000Z'),
        }));

        const result = await service.update(input);

        expect(repository.update).toHaveBeenCalledWith('promo-1', expect.objectContaining({ title: 'Oferta extendida' }));
        expect(result).toMatchObject({ id: 'promo-1', title: 'Oferta extendida', validUntil: '2026-04-30T12:00:00.000Z' });
    });

    it('delete removes the promotion according to the current hard-delete behavior', async () => {
        const { service, repository } = createService(ownerUser);
        const input: DeletePromotionInput = { promotionId: 'promo-1' };
        repository.findByIdWithBusiness.mockResolvedValue(createPromotionWithBusinessRecord());
        repository.delete.mockResolvedValue(createPromotionRecord());

        const result = await service.delete(input);

        expect(repository.delete).toHaveBeenCalledWith('promo-1');
        expect(result).toMatchObject({ id: 'promo-1', title: 'Oferta del día' });
    });

    it('unauthorized users cannot create promotions for another business', async () => {
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
            title: 'Promo privada',
            description: 'Descuento temporal para clientes existentes.',
            promoPrice: 99,
            originalPrice: 149,
            validUntil: '2026-04-20T12:00:00.000Z',
            image: 'https://example.com/promo.jpg',
        })).rejects.toMatchObject({ code: 'FORBIDDEN', message: 'Business access required.' });
    });

    it('listActive preserves public active-promotion compatibility', async () => {
        const { service, repository } = createService(null);
        repository.listActive.mockResolvedValue([createPromotionRecord()]);

        const result = await service.listActive();

        expect(repository.listActive).toHaveBeenCalledWith(expect.any(Date));
        expect(result).toEqual([
            expect.objectContaining({
                id: 'promo-1',
                validUntil: '2026-04-15T10:00:00.000Z',
            }),
        ]);
    });

    it('preserves the key contract shape for promotion responses', async () => {
        const { service, repository } = createService(null);
        repository.listActive.mockResolvedValue([createPromotionRecord()]);

        const result = await service.listActive();

        expect(result[0]).toEqual({
            id: 'promo-1',
            title: 'Oferta del día',
            description: 'Precio especial para clientes frecuentes.',
            promoPrice: 199,
            originalPrice: 299,
            validUntil: '2026-04-15T10:00:00.000Z',
            businessId: 'biz-casa-norte',
            image: 'https://example.com/promo.jpg',
            lastUpdated: '2026-04-01T08:30:00.000Z',
        });
    });
});