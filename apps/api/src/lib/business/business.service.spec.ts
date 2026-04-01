import type { CreateBusinessInput, UserProfile } from 'types';

import type {
    BusinessRepositoryPort,
    RepositoryBusinessRecord,
    RepositoryUserRecord,
} from './business.repository';
import { BusinessService } from './business.service';

const baseUser: RepositoryUserRecord = {
    id: 'owner-sofia',
    fullName: 'Sofia Rivas',
    email: 'sofia@encuentralotodo.app',
    role: 'USER',
    avatarUrl: null,
};

const managerUser: RepositoryUserRecord = {
    id: 'manager-carlos',
    fullName: 'Carlos Mena',
    email: 'carlos@encuentralotodo.app',
    role: 'USER',
    avatarUrl: null,
};

function createBusinessRecord(overrides: Partial<RepositoryBusinessRecord> = {}): RepositoryBusinessRecord {
    return {
        id: 'biz-casa-norte',
        name: 'Casa Norte Market',
        description: 'Tienda general con abarrotes, snacks, productos de limpieza y entregas rápidas dentro de la zona norte.',
        category: 'GENERAL_STORE',
        lat: 18.4861,
        lng: -69.9312,
        zone: 'Zona Norte',
        address: 'Av. Charles Summer 42, Santo Domingo',
        profileImage: 'https://example.com/profile.jpg',
        bannerImage: 'https://example.com/banner.jpg',
        subscriptionType: 'PREMIUM_PLUS',
        status: 'APPROVED',
        whatsappNumber: '18095550101',
        ownerId: baseUser.id,
        lastUpdated: new Date('2026-03-29T10:00:00.000Z'),
        createdAt: new Date('2026-03-29T09:00:00.000Z'),
        owner: baseUser,
        managers: [
            {
                userId: managerUser.id,
                user: managerUser,
            },
        ],
        products: [
            {
                id: 'prod-1',
                name: 'Pack familiar',
                description: 'Selección semanal.',
                images: ['https://example.com/product.jpg'],
                price: 1250,
                isFeatured: true,
                businessId: 'biz-casa-norte',
                lastUpdated: new Date('2026-03-29T10:00:00.000Z'),
            },
        ],
        promotions: [
            {
                id: 'promo-1',
                title: '2x1 snacks',
                description: 'Promo activa',
                promoPrice: 100,
                originalPrice: 200,
                validUntil: new Date('2026-04-10T10:00:00.000Z'),
                businessId: 'biz-casa-norte',
                image: 'https://example.com/promo.jpg',
                lastUpdated: new Date('2026-03-29T10:00:00.000Z'),
            },
        ],
        reviews: [
            {
                id: 'review-1',
                rating: 5,
                comment: 'Excelente.',
                userId: 'user-ana',
                businessId: 'biz-casa-norte',
                createdAt: new Date('2026-03-29T10:00:00.000Z'),
                user: {
                    id: 'user-ana',
                    fullName: 'Ana Mercado',
                    email: 'ana@encuentralotodo.app',
                    role: 'USER',
                    avatarUrl: null,
                },
            },
        ],
        ...overrides,
    };
}

function createRepositoryMock(): jest.Mocked<BusinessRepositoryPort> {
    return {
        listBusinesses: jest.fn(),
        findBusinessById: jest.fn(),
        listPendingBusinesses: jest.fn(),
        createBusiness: jest.fn(),
        approveBusiness: jest.fn(),
        findUserById: jest.fn(),
        findUsersByIds: jest.fn(),
    };
}

function createService(currentUser: UserProfile | null, repository = createRepositoryMock()) {
    return {
        repository,
        service: new BusinessService({
            repository,
            currentUser,
            emailService: {
                sendBusinessApprovedEmail: jest.fn(async () => undefined),
            },
        }),
    };
}

describe('BusinessService', () => {
    it('list returns mapped business summaries from repository data', async () => {
        const { service, repository } = createService(baseUser as UserProfile);
        repository.listBusinesses.mockResolvedValue([createBusinessRecord()]);

        const results = await service.listBusinesses();

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
            id: 'biz-casa-norte',
            ownerId: 'owner-sofia',
            managers: ['manager-carlos'],
            reviewCount: 1,
            featuredProducts: [expect.objectContaining({ id: 'prod-1' })],
            activePromotions: [expect.objectContaining({ id: 'promo-1' })],
        });
    });

    it('byId returns aggregated mapped business details', async () => {
        const { service, repository } = createService(baseUser as UserProfile);
        repository.findBusinessById.mockResolvedValue(createBusinessRecord());

        const result = await service.getBusinessById('biz-casa-norte');

        expect(result).toMatchObject({
            id: 'biz-casa-norte',
            owner: expect.objectContaining({ id: 'owner-sofia' }),
            managersDetailed: [expect.objectContaining({ id: 'manager-carlos' })],
            products: [expect.objectContaining({ id: 'prod-1' })],
            promotions: [expect.objectContaining({ id: 'promo-1' })],
            reviews: [expect.objectContaining({ id: 'review-1', user: expect.objectContaining({ id: 'user-ana' }) })],
        });
    });

    it('create persists business correctly', async () => {
        const actor = {
            id: 'owner-sofia',
            fullName: 'Sofia Rivas',
            email: 'sofia@encuentralotodo.app',
            role: 'USER',
        } as UserProfile;
        const { service, repository } = createService(actor);
        const input: CreateBusinessInput = {
            name: 'Nuevo negocio',
            description: 'Descripción suficientemente larga para pasar la validación.',
            category: 'GENERAL_STORE',
            location: {
                lat: 18.47,
                lng: -69.9,
                zone: 'Naco',
                address: 'Calle 1',
            },
            images: {
                profile: 'https://example.com/profile.jpg',
                banner: 'https://example.com/banner.jpg',
            },
            subscriptionType: 'FREE_TRIAL',
            ownerId: 'user-ana',
            managers: ['manager-carlos'],
            whatsappNumber: '18095550199',
        };

        repository.findUserById.mockResolvedValue(baseUser);
        repository.findUsersByIds.mockResolvedValue([managerUser]);
        repository.createBusiness.mockResolvedValue(
            createBusinessRecord({
                id: 'biz-new',
                name: input.name,
                description: input.description,
                subscriptionType: input.subscriptionType,
                status: 'PENDING',
                ownerId: actor.id,
                managers: [{ userId: managerUser.id, user: managerUser }],
                products: [],
                promotions: [],
                reviews: [],
            }),
        );

        const result = await service.createBusiness(input);

        expect(repository.createBusiness).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Nuevo negocio',
                ownerId: 'owner-sofia',
                managers: ['manager-carlos'],
                status: 'PENDING',
            }),
        );
        expect(result).toMatchObject({ id: 'biz-new', status: 'PENDING' });
    });

    it('pending list only returns pending businesses', async () => {
        const admin = {
            id: 'admin-luis',
            fullName: 'Luis Admin',
            email: 'luis@encuentralotodo.app',
            role: 'ADMIN',
        } as UserProfile;
        const { service, repository } = createService(admin);
        repository.listPendingBusinesses.mockResolvedValue([
            createBusinessRecord({ id: 'biz-pending', status: 'PENDING', products: [], promotions: [], reviews: [] }),
        ]);

        const result = await service.listPendingBusinesses();

        expect(result).toEqual([expect.objectContaining({ id: 'biz-pending', status: 'PENDING' })]);
    });

    it('approve updates business status correctly', async () => {
        const admin = {
            id: 'admin-luis',
            fullName: 'Luis Admin',
            email: 'luis@encuentralotodo.app',
            role: 'ADMIN',
        } as UserProfile;
        const repository = createRepositoryMock();
        const sendBusinessApprovedEmail = jest.fn(async () => undefined);
        const service = new BusinessService({
            repository,
            currentUser: admin,
            emailService: { sendBusinessApprovedEmail },
        });

        repository.approveBusiness.mockResolvedValue(createBusinessRecord({ status: 'APPROVED' }));

        const result = await service.approveBusiness({ businessId: 'biz-casa-norte', approvedBy: 'admin-luis' });

        expect(repository.approveBusiness).toHaveBeenCalledWith('biz-casa-norte');
        expect(result.business.status).toBe('APPROVED');
        expect(sendBusinessApprovedEmail).toHaveBeenCalled();
    });

    it('create does not rely on client supplied owner identity as authoritative truth', async () => {
        const actor = {
            id: 'owner-sofia',
            fullName: 'Sofia Rivas',
            email: 'sofia@encuentralotodo.app',
            role: 'USER',
        } as UserProfile;
        const { service, repository } = createService(actor);
        const input: CreateBusinessInput = {
            name: 'Otro negocio',
            description: 'Descripción suficientemente larga para probar la creación.',
            category: 'SERVICE',
            location: {
                lat: 18.47,
                lng: -69.9,
                zone: 'Piantini',
                address: 'Av. 2',
            },
            images: {
                profile: 'https://example.com/profile.jpg',
                banner: 'https://example.com/banner.jpg',
            },
            subscriptionType: 'PREMIUM',
            ownerId: 'user-ana',
            managers: [],
            whatsappNumber: '18095550200',
        };

        repository.findUserById.mockResolvedValue(baseUser);
        repository.createBusiness.mockResolvedValue(
            createBusinessRecord({
                id: 'biz-safe-owner',
                ownerId: actor.id,
                products: [],
                promotions: [],
                reviews: [],
                managers: [],
            }),
        );

        await service.createBusiness(input);

        expect(repository.createBusiness).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-sofia' }));
        expect(repository.createBusiness).not.toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'user-ana' }));
    });
});