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
    isActive: true,
};

const managerUser: RepositoryUserRecord = {
    id: 'manager-carlos',
    fullName: 'Carlos Mena',
    email: 'carlos@encuentralotodo.app',
    role: 'USER',
    avatarUrl: null,
    isActive: true,
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
        memberships: [
            {
                userId: baseUser.id,
                role: 'OWNER',
                user: baseUser,
            },
            {
                userId: managerUser.id,
                role: 'MANAGER',
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
                validUntil: new Date('2026-05-10T10:00:00.000Z'),
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
                    isActive: true,
                },
            },
        ],
        ...overrides,
    };
}

function createBusinessAccessRecord(overrides: Record<string, unknown> = {}) {
    return {
        id: 'biz-casa-norte',
        ownerId: 'owner-sofia',
        managers: ['manager-carlos'],
        memberships: [
            { userId: 'owner-sofia', role: 'OWNER' as const },
            { userId: 'manager-carlos', role: 'MANAGER' as const },
        ],
        subscriptionType: 'PREMIUM_PLUS' as const,
        status: 'APPROVED' as const,
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
        synchronizeCanonicalMemberships: jest.fn(),
        findBusinessById: jest.fn(),
        findBusinessAccessById: jest.fn(),
        listPendingBusinesses: jest.fn(),
        createBusiness: jest.fn(),
        updateBusiness: jest.fn(),
        approveBusiness: jest.fn(),
        searchUsers: jest.fn(),
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

    it('rejects create when no authenticated owner is available', async () => {
        const { service, repository } = createService(null);

        await expect(service.createBusiness({
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
            managers: [],
            whatsappNumber: '18095550199',
        })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

        expect(repository.createBusiness).not.toHaveBeenCalled();
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

        expect(result).toEqual([
            expect.objectContaining({
                id: 'biz-pending',
                owner: expect.objectContaining({
                    email: 'sofia@encuentralotodo.app',
                    fullName: 'Sofia Rivas',
                }),
                status: 'PENDING',
            }),
        ]);
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

        repository.findBusinessAccessById.mockResolvedValue(createBusinessAccessRecord());
        repository.findBusinessById.mockResolvedValue(createBusinessRecord());
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

    it('allows an owner to change managers', async () => {
        const actor = createCurrentPlatformUser();
        const { service, repository } = createService(actor);

        repository.findBusinessAccessById.mockResolvedValue(createBusinessAccessRecord());
        repository.findBusinessById.mockResolvedValue(createBusinessRecord());
        repository.findUsersByIds.mockResolvedValue([
            managerUser,
            {
                id: 'manager-new',
                fullName: 'Laura Vega',
                email: 'laura@encuentralotodo.app',
                role: 'USER',
                avatarUrl: null,
                isActive: true,
            },
        ]);
        repository.updateBusiness.mockResolvedValue(
            createBusinessRecord({
                managers: [
                    { userId: 'manager-carlos', user: managerUser },
                    {
                        userId: 'manager-new',
                        user: {
                            id: 'manager-new',
                            fullName: 'Laura Vega',
                            email: 'laura@encuentralotodo.app',
                            role: 'USER',
                            avatarUrl: null,
                            isActive: true,
                        },
                    },
                ],
                memberships: [
                    { userId: 'owner-sofia', role: 'OWNER', user: baseUser },
                    { userId: 'manager-carlos', role: 'MANAGER', user: managerUser },
                    {
                        userId: 'manager-new',
                        role: 'MANAGER',
                        user: {
                            id: 'manager-new',
                            fullName: 'Laura Vega',
                            email: 'laura@encuentralotodo.app',
                            role: 'USER',
                            avatarUrl: null,
                            isActive: true,
                        },
                    },
                ],
            }),
        );

        const result = await service.updateBusiness({
            businessId: 'biz-casa-norte',
            name: 'Casa Norte Market',
            description: 'Descripción suficientemente larga para intentar cambiar managers sin permisos válidos.',
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
            managers: ['manager-carlos', 'manager-new'],
        });

        expect(repository.updateBusiness).toHaveBeenCalledWith(
            expect.objectContaining({ managers: ['manager-carlos', 'manager-new'] }),
        );
        expect(result.managersDetailed).toHaveLength(2);
    });

    it('allows an owner to change the membership plan', async () => {
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

        repository.findBusinessAccessById.mockResolvedValue(createBusinessAccessRecord());
        repository.findBusinessById.mockResolvedValue(createBusinessRecord());
        repository.findUsersByIds.mockResolvedValue([managerUser]);
        repository.updateBusiness.mockResolvedValue(createBusinessRecord({ subscriptionType: 'FREE_TRIAL' }));

        const result = await service.updateBusiness(input);

        expect(repository.updateBusiness).toHaveBeenCalledWith(expect.objectContaining({ subscriptionType: 'FREE_TRIAL' }));
        expect(result).toMatchObject({ subscriptionType: 'FREE_TRIAL' });
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

        repository.findBusinessAccessById.mockResolvedValue(createBusinessAccessRecord());
        repository.findBusinessById.mockResolvedValue(createBusinessRecord());
        repository.findUsersByIds.mockResolvedValue([managerUser]);
        repository.updateBusiness.mockResolvedValue(createBusinessRecord({ subscriptionType: 'FREE_TRIAL' }));

        const result = await service.updateBusiness(input);

        expect(repository.updateBusiness).toHaveBeenCalledWith(expect.objectContaining({ subscriptionType: 'FREE_TRIAL' }));
        expect(result).toMatchObject({ subscriptionType: 'FREE_TRIAL' });
    });

    it('allows managers to update operational business fields', async () => {
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
            description: 'Descripción suficientemente larga para una actualización operativa desde manager.',
            category: 'GENERAL_STORE',
            location: {
                lat: 18.4861,
                lng: -69.9312,
                zone: 'Zona Colonial',
                address: 'Calle El Conde 21, Santo Domingo',
            },
            images: {
                profile: 'https://example.com/profile.jpg',
                banner: 'https://example.com/banner.jpg',
            },
            whatsappNumber: '18095550199',
            managers: ['manager-carlos'],
        };

        repository.findBusinessAccessById.mockResolvedValue(createBusinessAccessRecord());
        repository.findBusinessById.mockResolvedValue(createBusinessRecord());
        repository.updateBusiness.mockResolvedValue(
            createBusinessRecord({
                description: input.description,
                zone: input.location.zone,
                address: input.location.address,
                whatsappNumber: input.whatsappNumber,
            }),
        );

        const result = await service.updateBusiness(input);

        expect(repository.updateBusiness).toHaveBeenCalledWith(
            expect.objectContaining({
                description: input.description,
                whatsappNumber: '18095550199',
            }),
        );
        expect(result).toMatchObject({ whatsappNumber: '18095550199' });
    });

    it('prevents managers from changing critical business identity fields', async () => {
        const actor = createCurrentPlatformUser({
            id: 'manager-carlos',
            fullName: 'Carlos Mena',
            email: 'carlos@encuentralotodo.app',
            role: 'USER',
            externalAuthId: 'firebase-manager-carlos',
        });
        const { service, repository } = createService(actor);

        repository.findBusinessAccessById.mockResolvedValue(createBusinessAccessRecord());
        repository.findBusinessById.mockResolvedValue(createBusinessRecord());

        await expect(service.updateBusiness({
            businessId: 'biz-casa-norte',
            name: 'Casa Norte Rebrand',
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
        })).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Managers can only update operational business fields.',
        });
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
    });

    it('allows admins to create a business for another explicit owner', async () => {
        const actor = createCurrentPlatformUser({
            id: 'admin-luis',
            fullName: 'Luis Admin',
            email: 'luis@encuentralotodo.app',
            role: 'ADMIN',
            externalAuthId: 'firebase-admin-luis',
        });
        const { service, repository } = createService(actor);

        repository.findUserById
            .mockResolvedValueOnce({
                id: 'owner-lucia',
                fullName: 'Lucia Diaz',
                email: 'lucia@encuentralotodo.app',
                role: 'USER',
                avatarUrl: null,
                isActive: true,
            })
            .mockResolvedValueOnce(baseUser);
        repository.findUsersByIds.mockResolvedValue([managerUser]);
        repository.createBusiness.mockResolvedValue(
            createBusinessRecord({
                id: 'biz-admin-owner',
                ownerId: 'owner-lucia',
                owner: {
                    id: 'owner-lucia',
                    fullName: 'Lucia Diaz',
                    email: 'lucia@encuentralotodo.app',
                    role: 'USER',
                    avatarUrl: null,
                    isActive: true,
                },
                memberships: [
                    {
                        userId: 'owner-lucia',
                        role: 'OWNER',
                        user: {
                            id: 'owner-lucia',
                            fullName: 'Lucia Diaz',
                            email: 'lucia@encuentralotodo.app',
                            role: 'USER',
                            avatarUrl: null,
                            isActive: true,
                        },
                    },
                    { userId: managerUser.id, role: 'MANAGER', user: managerUser },
                ],
                managers: [{ userId: managerUser.id, user: managerUser }],
                products: [],
                promotions: [],
                reviews: [],
            }),
        );

        const result = await service.createBusinessForOwner({
            name: 'Negocio delegado',
            description: 'Descripción suficientemente larga para el alta delegada desde administración.',
            category: 'GENERAL_STORE',
            location: {
                lat: 18.47,
                lng: -69.9,
                zone: 'Piantini',
                address: 'Av. Sarasota 10',
            },
            images: {
                profile: 'https://example.com/profile.jpg',
                banner: 'https://example.com/banner.jpg',
            },
            subscriptionType: 'PREMIUM',
            ownerId: 'owner-lucia',
            managers: ['manager-carlos'],
            whatsappNumber: '18095550200',
        });

        expect(repository.createBusiness).toHaveBeenCalledWith(
            expect.objectContaining({ ownerId: 'owner-lucia' }),
        );
        expect(result.ownerId).toBe('owner-lucia');
    });
});