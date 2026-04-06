import { createCurrentUser } from 'auth';
import type { CreateBusinessInput, UpdateBusinessInput } from 'types';

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
                type: 'simple',
                configurationSummary: null,
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

function createCurrentPlatformUser(overrides: Partial<ReturnType<typeof createCurrentUser>> = {}) {
    return createCurrentUser({
        id: overrides.id ?? 'owner-sofia',
        fullName: overrides.fullName ?? 'Sofia Rivas',
        email: overrides.email ?? 'sofia@encuentralotodo.app',
        role: overrides.role ?? 'USER',
        isActive: overrides.isActive ?? true,
        authProvider: overrides.authProvider ?? 'firebase',
        externalAuthId: overrides.externalAuthId ?? 'firebase-owner-sofia',
        emailVerified: overrides.emailVerified ?? true,
        avatarUrl: overrides.avatarUrl,
    });
}

function createService(currentUser: ReturnType<typeof createCurrentPlatformUser> | null, repository = createRepositoryMock()) {
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
        const { service, repository } = createService(createCurrentPlatformUser());
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
        const { service, repository } = createService(createCurrentPlatformUser());
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

    it('listManagedBusinesses returns only businesses the authenticated owner can manage', async () => {
        const actor = createCurrentPlatformUser();
        const { service, repository } = createService(actor);
        repository.listBusinessesByUserAccess.mockResolvedValue([createBusinessRecord()]);

        const result = await service.listManagedBusinesses();

        expect(repository.listBusinessesByUserAccess).toHaveBeenCalledWith('owner-sofia', { includePending: true });
        expect(result).toEqual([
            expect.objectContaining({
                id: 'biz-casa-norte',
                owner: expect.objectContaining({ id: 'owner-sofia' }),
                managersDetailed: [expect.objectContaining({ id: 'manager-carlos' })],
                products: [expect.objectContaining({ id: 'prod-1' })],
            }),
        ]);
    });

    it('listManagedBusinesses returns the full management view for platform admins', async () => {
        const actor = createCurrentPlatformUser({
            id: 'admin-luis',
            fullName: 'Luis Admin',
            email: 'luis@encuentralotodo.app',
            role: 'ADMIN',
            externalAuthId: 'firebase-admin-luis',
        });
        const { service, repository } = createService(actor);
        repository.listBusinessesForManagement.mockResolvedValue([createBusinessRecord()]);

        const result = await service.listManagedBusinesses({ search: 'Casa' });

        expect(repository.listBusinessesForManagement).toHaveBeenCalledWith({
            search: 'Casa',
            includePending: true,
        });
        expect(result).toHaveLength(1);
    });

    it('create persists business correctly', async () => {
        const actor = createCurrentPlatformUser();
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
        const admin = createCurrentPlatformUser({
            id: 'admin-luis',
            fullName: 'Luis Admin',
            email: 'luis@encuentralotodo.app',
            role: 'ADMIN',
            externalAuthId: 'firebase-admin-luis',
        });
        const { service, repository } = createService(admin);
        repository.listPendingBusinesses.mockResolvedValue([
            createBusinessRecord({ id: 'biz-pending', status: 'PENDING', products: [], promotions: [], reviews: [] }),
        ]);

        const result = await service.listPendingBusinesses();

        expect(result).toEqual([expect.objectContaining({ id: 'biz-pending', status: 'PENDING' })]);
    });

    it('allows the owner to update general business information', async () => {
        const actor = createCurrentPlatformUser();
        const { service, repository } = createService(actor);
        const input: UpdateBusinessInput = {
            businessId: 'biz-casa-norte',
            name: 'Casa Norte Plus',
            description: 'Descripción suficientemente larga para actualizar el negocio con datos revisados por el owner.',
            category: 'GENERAL_STORE',
            location: {
                lat: 18.49,
                lng: -69.93,
                zone: 'Zona Norte',
                address: 'Av. Charles Summer 55, Santo Domingo',
            },
            images: {
                profile: 'https://example.com/profile-updated.jpg',
                banner: 'https://example.com/banner-updated.jpg',
            },
            whatsappNumber: '18095550155',
            managers: ['manager-carlos'],
        };

        repository.findBusinessAccessById.mockResolvedValue({
            id: 'biz-casa-norte',
            ownerId: 'owner-sofia',
            managers: ['manager-carlos'],
            subscriptionType: 'PREMIUM_PLUS',
            status: 'APPROVED',
        });
        repository.findUsersByIds.mockResolvedValue([managerUser]);
        repository.updateBusiness.mockResolvedValue(
            createBusinessRecord({
                name: input.name,
                description: input.description,
                zone: input.location.zone,
                address: input.location.address,
                whatsappNumber: input.whatsappNumber,
                profileImage: input.images.profile,
                bannerImage: input.images.banner,
            }),
        );

        const result = await service.updateBusiness(input);

        expect(repository.updateBusiness).toHaveBeenCalledWith(
            expect.objectContaining({
                businessId: 'biz-casa-norte',
                name: 'Casa Norte Plus',
                subscriptionType: 'PREMIUM_PLUS',
                managers: ['manager-carlos'],
            }),
        );
        expect(result).toMatchObject({ name: 'Casa Norte Plus', whatsappNumber: '18095550155' });
    });

    it('prevents an owner from changing the membership plan', async () => {
        const actor = createCurrentPlatformUser();
        const { service, repository } = createService(actor);
        const input: UpdateBusinessInput = {
            businessId: 'biz-casa-norte',
            name: 'Casa Norte Market',
            description: 'Descripción suficientemente larga para intentar cambiar el plan sin permisos válidos.',
            category: 'GENERAL_STORE',
            location: {
                lat: 18.4861,
                lng: -69.9312,
                zone: 'Zona Norte',
                address: 'Av. Charles Summer 42, Santo Domingo',
            },
            images: {
                profile: 'https://example.com/profile.jpg',
                banner: 'https://example.com/banner.jpg',
            },
            whatsappNumber: '18095550101',
            managers: ['manager-carlos'],
            subscriptionType: 'FREE_TRIAL',
        };

        repository.findBusinessAccessById.mockResolvedValue({
            id: 'biz-casa-norte',
            ownerId: 'owner-sofia',
            managers: ['manager-carlos'],
            subscriptionType: 'PREMIUM_PLUS',
            status: 'APPROVED',
        });

        await expect(service.updateBusiness(input)).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Only a SuperAdmin can change the membership plan.',
        });
        expect(repository.updateBusiness).not.toHaveBeenCalled();
    });

    it('allows a SuperAdmin to change the membership plan', async () => {
        const actor = createCurrentPlatformUser({
            id: 'superadmin-luis',
            fullName: 'Luis SuperAdmin',
            email: 'luis@encuentralotodo.app',
            role: 'SUPERADMIN',
            externalAuthId: 'firebase-superadmin-luis',
        });
        const { service, repository } = createService(actor);
        const input: UpdateBusinessInput = {
            businessId: 'biz-casa-norte',
            name: 'Casa Norte Market',
            description: 'Descripción suficientemente larga para actualizar el plan desde un SuperAdmin.',
            category: 'GENERAL_STORE',
            location: {
                lat: 18.4861,
                lng: -69.9312,
                zone: 'Zona Norte',
                address: 'Av. Charles Summer 42, Santo Domingo',
            },
            images: {
                profile: 'https://example.com/profile.jpg',
                banner: 'https://example.com/banner.jpg',
            },
            whatsappNumber: '18095550101',
            managers: ['manager-carlos'],
            subscriptionType: 'FREE_TRIAL',
        };

        repository.findBusinessAccessById.mockResolvedValue({
            id: 'biz-casa-norte',
            ownerId: 'owner-sofia',
            managers: ['manager-carlos'],
            subscriptionType: 'PREMIUM_PLUS',
            status: 'APPROVED',
        });
        repository.findUsersByIds.mockResolvedValue([managerUser]);
        repository.updateBusiness.mockResolvedValue(createBusinessRecord({ subscriptionType: 'FREE_TRIAL' }));

        const result = await service.updateBusiness(input);

        expect(repository.updateBusiness).toHaveBeenCalledWith(expect.objectContaining({ subscriptionType: 'FREE_TRIAL' }));
        expect(result).toMatchObject({ subscriptionType: 'FREE_TRIAL' });
    });

    it('prevents managers from updating the business', async () => {
        const actor = createCurrentPlatformUser({
            id: 'manager-carlos',
            fullName: 'Carlos Mena',
            email: 'carlos@encuentralotodo.app',
            role: 'USER',
            externalAuthId: 'firebase-manager-carlos',
        });
        const { service, repository } = createService(actor);
        const input: UpdateBusinessInput = {
            businessId: 'biz-casa-norte',
            name: 'Casa Norte Market',
            description: 'Descripción suficientemente larga para un intento de edición desde manager.',
            category: 'GENERAL_STORE',
            location: {
                lat: 18.4861,
                lng: -69.9312,
                zone: 'Zona Norte',
                address: 'Av. Charles Summer 42, Santo Domingo',
            },
            images: {
                profile: 'https://example.com/profile.jpg',
                banner: 'https://example.com/banner.jpg',
            },
            whatsappNumber: '18095550101',
            managers: ['manager-carlos'],
        };

        repository.findBusinessAccessById.mockResolvedValue({
            id: 'biz-casa-norte',
            ownerId: 'owner-sofia',
            managers: ['manager-carlos'],
            subscriptionType: 'PREMIUM_PLUS',
            status: 'APPROVED',
        });

        await expect(service.updateBusiness(input)).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Only the owner or a SuperAdmin can update this business.',
        });
        expect(repository.updateBusiness).not.toHaveBeenCalled();
    });

    it('approve updates business status correctly', async () => {
        const admin = createCurrentPlatformUser({
            id: 'admin-luis',
            fullName: 'Luis Admin',
            email: 'luis@encuentralotodo.app',
            role: 'ADMIN',
            externalAuthId: 'firebase-admin-luis',
        });
        const repository = createRepositoryMock();
        const sendBusinessApprovedEmail = jest.fn(async () => undefined);
        const service = new BusinessService({
            repository,
            currentUser: admin,
            emailService: { sendBusinessApprovedEmail },
        });

        repository.approveBusiness.mockResolvedValue(createBusinessRecord({ status: 'APPROVED' }));

        const result = await service.approveBusiness({ businessId: 'biz-casa-norte' });

        expect(repository.approveBusiness).toHaveBeenCalledWith('biz-casa-norte');
        expect(result.business.status).toBe('APPROVED');
        expect(sendBusinessApprovedEmail).toHaveBeenCalled();
    });

    it('create does not rely on client supplied owner identity as authoritative truth', async () => {
        const actor = createCurrentPlatformUser();
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