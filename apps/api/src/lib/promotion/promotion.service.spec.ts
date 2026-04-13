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
        memberships: [
            { userId: 'owner-sofia', role: 'OWNER' },
            { userId: 'manager-carlos', role: 'MANAGER' },
        ],
        subscriptionType: 'PREMIUM_PLUS',
        status: 'APPROVED',
        ...overrides,
    };
}

function createPromotionRecord(overrides: Partial<RepositoryPromotionRecord> = {}): RepositoryPromotionRecord {
    return {
        id: 'promo-1',
        businessId: 'biz-casa-norte',
        title: 'Oferta del día',
        description: 'Precio especial para clientes frecuentes.',
        type: 'DISCOUNT',
        startDate: new Date('2026-04-10T08:00:00.000Z'),
        endDate: new Date('2026-04-15T10:00:00.000Z'),
        status: 'ACTIVE',
        createdAt: new Date('2026-04-01T08:00:00.000Z'),
        updatedAt: new Date('2026-04-01T08:30:00.000Z'),
        promoPrice: 199,
        originalPrice: 299,
        image: 'https://example.com/promo.jpg',
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
            memberships: [
                { userId: 'owner-sofia', role: 'OWNER' },
                { userId: 'manager-carlos', role: 'MANAGER' },
            ],
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
        listBusinessMembershipSources: jest.fn(),
        upsertCanonicalMemberships: jest.fn(),
        searchUsers: jest.fn(),
        findUserById: jest.fn(),
        findUsersByIds: jest.fn(),
    } as unknown as jest.Mocked<BusinessRepositoryPort>;
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

    const adminUser = {
        id: 'admin-luis',
        fullName: 'Luis Admin',
        email: 'luis@encuentralotodo.app',
        role: 'ADMIN',
    } as UserProfile;

    const managerUser = {
        id: 'manager-carlos',
        fullName: 'Carlos Mena',
        email: 'carlos@encuentralotodo.app',
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
                status: 'ACTIVE',
                endDate: '2026-04-15T10:00:00.000Z',
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
            type: 'DISCOUNT',
            validUntil: '2026-04-15T10:00:00.000Z',
            image: 'https://example.com/promo.jpg',
        });
    });

    it('create persists promotion correctly for an owner', async () => {
        const { service, repository, businessRepository } = createService(ownerUser);
        const input: CreatePromotionInput = {
            businessId: 'biz-casa-norte',
            title: 'Promo nueva',
            description: 'Beneficio válido durante la semana de lanzamiento.',
            type: 'EVENT',
            startDate: '2026-04-11T12:00:00.000Z',
            endDate: '2026-04-20T12:00:00.000Z',
            status: 'ACTIVE',
            promoPrice: 149,
            originalPrice: 199,
            image: 'https://example.com/new-promo.jpg',
        };
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.create.mockResolvedValue(createPromotionRecord({
            id: 'promo-new',
            title: 'Promo nueva',
            type: 'EVENT',
            startDate: new Date('2026-04-11T12:00:00.000Z'),
            endDate: new Date('2026-04-20T12:00:00.000Z'),
            status: 'ACTIVE',
            promoPrice: 149,
            originalPrice: 199,
            image: 'https://example.com/new-promo.jpg',
        }));

        const result = await service.create(input);

        expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
            type: 'EVENT',
            status: 'ACTIVE',
            startDate: '2026-04-11T12:00:00.000Z',
            endDate: '2026-04-20T12:00:00.000Z',
        }));
        expect(result).toMatchObject({ id: 'promo-new', title: 'Promo nueva', type: 'EVENT' });
    });

    it('create allows platform admins to manage promotions', async () => {
        const { service, repository, businessRepository } = createService(adminUser);
        const input: CreatePromotionInput = {
            businessId: 'biz-casa-norte',
            title: 'Admin promo',
            description: 'Campaña gestionada desde consola administrativa.',
            type: 'ANNOUNCEMENT',
            startDate: '2026-04-12T12:00:00.000Z',
            endDate: '2026-04-22T12:00:00.000Z',
            status: 'ACTIVE',
            promoPrice: 0,
            originalPrice: 0,
            image: 'https://example.com/admin-promo.jpg',
        };
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.create.mockResolvedValue(createPromotionRecord({
            id: 'promo-admin',
            title: 'Admin promo',
            type: 'ANNOUNCEMENT',
            promoPrice: 0,
            originalPrice: 0,
        }));

        const result = await service.create(input);

        expect(result).toMatchObject({ id: 'promo-admin', title: 'Admin promo' });
    });

    it('rejects create without owner-admin access', async () => {
        const { service, businessRepository, repository } = createService(managerUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());

        await expect(service.create({
            businessId: 'biz-casa-norte',
            title: 'Promo privada',
            description: 'Descuento temporal para clientes existentes.',
            type: 'DISCOUNT',
            startDate: '2026-04-12T12:00:00.000Z',
            endDate: '2026-04-20T12:00:00.000Z',
            status: 'ACTIVE',
            promoPrice: 99,
            originalPrice: 149,
            image: 'https://example.com/promo.jpg',
        })).rejects.toMatchObject({ code: 'FORBIDDEN', message: 'Only the owner or a platform admin can manage promotions.' });

        expect(repository.create).not.toHaveBeenCalled();
    });

    it('update persists promotion correctly for an owner', async () => {
        const { service, repository } = createService(ownerUser);
        const input: UpdatePromotionInput = {
            promotionId: 'promo-1',
            title: 'Oferta extendida',
            endDate: '2026-04-30T12:00:00.000Z',
        };
        repository.findByIdWithBusiness.mockResolvedValue(createPromotionWithBusinessRecord());
        repository.update.mockResolvedValue(createPromotionRecord({
            title: 'Oferta extendida',
            endDate: new Date('2026-04-30T12:00:00.000Z'),
            updatedAt: new Date('2026-04-05T09:00:00.000Z'),
        }));

        const result = await service.update(input);

        expect(repository.update).toHaveBeenCalledWith('promo-1', expect.objectContaining({ endDate: '2026-04-30T12:00:00.000Z' }));
        expect(result).toMatchObject({ id: 'promo-1', title: 'Oferta extendida', validUntil: '2026-04-30T12:00:00.000Z' });
    });

    it('rejects update without owner-admin access', async () => {
        const { service, repository } = createService(managerUser);
        repository.findByIdWithBusiness.mockResolvedValue(createPromotionWithBusinessRecord());

        await expect(service.update({
            promotionId: 'promo-1',
            title: 'Oferta restringida',
        })).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Only the owner or a platform admin can manage promotions.',
        });

        expect(repository.update).not.toHaveBeenCalled();
    });

    it('delete removes the promotion for an owner', async () => {
        const { service, repository } = createService(ownerUser);
        const input: DeletePromotionInput = { promotionId: 'promo-1' };
        repository.findByIdWithBusiness.mockResolvedValue(createPromotionWithBusinessRecord());
        repository.delete.mockResolvedValue(createPromotionRecord());

        const result = await service.delete(input);

        expect(repository.delete).toHaveBeenCalledWith('promo-1');
        expect(result).toMatchObject({ id: 'promo-1', title: 'Oferta del día' });
    });

    it('rejects delete without owner-admin access', async () => {
        const { service, repository } = createService(managerUser);
        repository.findByIdWithBusiness.mockResolvedValue(createPromotionWithBusinessRecord());

        await expect(service.delete({ promotionId: 'promo-1' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Only the owner or a platform admin can manage promotions.',
        });

        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('rejects invalid date ranges on create', async () => {
        const { service, businessRepository, repository } = createService(ownerUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());

        await expect(service.create({
            businessId: 'biz-casa-norte',
            title: 'Fecha inválida',
            description: 'La campaña no debe permitir una fecha final anterior a la inicial.',
            type: 'DISCOUNT',
            startDate: '2026-04-20T12:00:00.000Z',
            endDate: '2026-04-10T12:00:00.000Z',
            status: 'ACTIVE',
            promoPrice: 99,
            originalPrice: 149,
            image: 'https://example.com/promo.jpg',
        })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'Promotion start date must be before the end date.',
        });

        expect(repository.create).not.toHaveBeenCalled();
    });

    it('returns not found when updating a missing promotion', async () => {
        const { service, repository } = createService(ownerUser);
        repository.findByIdWithBusiness.mockResolvedValue(null);

        await expect(service.update({ promotionId: 'missing-promo', title: 'Nada' })).rejects.toMatchObject({
            code: 'NOT_FOUND',
            message: 'Promotion not found.',
        });
    });

    it('returns not found when deleting a missing promotion', async () => {
        const { service, repository } = createService(ownerUser);
        repository.findByIdWithBusiness.mockResolvedValue(null);

        await expect(service.delete({ promotionId: 'missing-promo' })).rejects.toMatchObject({
            code: 'NOT_FOUND',
            message: 'Promotion not found.',
        });
    });

    it('listActive preserves public promotion compatibility while exposing operational fields', async () => {
        const { service, repository } = createService(null);
        repository.listActive.mockResolvedValue([createPromotionRecord()]);

        const result = await service.listActive();

        expect(repository.listActive).toHaveBeenCalledWith(expect.any(Date));
        expect(result).toEqual([
            expect.objectContaining({
                id: 'promo-1',
                type: 'DISCOUNT',
                status: 'ACTIVE',
                startDate: '2026-04-10T08:00:00.000Z',
                validUntil: '2026-04-15T10:00:00.000Z',
            }),
        ]);
    });
});
