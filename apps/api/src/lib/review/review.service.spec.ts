import type {
    CreateReviewInput,
    UserProfile,
} from 'types';

import type {
    BusinessRepositoryPort,
    RepositoryBusinessAccessRecord,
    RepositoryBusinessRecord,
} from '../business/business.repository';
import type {
    RepositoryReviewRecord,
    RepositoryReviewWithUserRecord,
    ReviewRepositoryPort,
} from './review.repository';
import { ReviewService } from './review.service';

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

function createBusinessRecord(overrides: Partial<RepositoryBusinessRecord> = {}): RepositoryBusinessRecord {
    return {
        id: 'biz-casa-norte',
        name: 'Casa Norte Market',
        description: 'Tienda general con delivery rápido.',
        category: 'GENERAL_STORE',
        lat: 18.4861,
        lng: -69.9312,
        zone: 'Zona Norte',
        address: 'Av. Charles Summer 42',
        profileImage: 'https://example.com/profile.jpg',
        bannerImage: 'https://example.com/banner.jpg',
        subscriptionType: 'PREMIUM_PLUS',
        status: 'APPROVED',
        whatsappNumber: '18095550101',
        ownerId: 'owner-sofia',
        lastUpdated: new Date('2026-04-01T10:00:00.000Z'),
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
        owner: undefined,
        managers: [{ userId: 'manager-carlos', user: undefined }],
        products: [],
        promotions: [],
        reviews: [],
        ...overrides,
    };
}

function createReviewRecord(overrides: Partial<RepositoryReviewRecord> = {}): RepositoryReviewRecord {
    return {
        id: 'review-1',
        rating: 5,
        comment: 'Pedido rápido y atención muy clara por WhatsApp.',
        userId: 'user-ana',
        businessId: 'biz-casa-norte',
        createdAt: new Date('2026-03-20T10:00:00.000Z'),
        ...overrides,
    };
}

function createReviewWithUserRecord(overrides: Partial<RepositoryReviewWithUserRecord> = {}): RepositoryReviewWithUserRecord {
    return {
        ...createReviewRecord(),
        user: {
            id: 'user-ana',
            fullName: 'Ana Mercado',
            email: 'ana@encuentralotodo.app',
            role: 'USER',
            avatarUrl: 'https://example.com/avatar.jpg',
        },
        ...overrides,
    };
}

function createReviewRepositoryMock(): jest.Mocked<ReviewRepositoryPort> {
    return {
        listByBusiness: jest.fn(),
        create: jest.fn(),
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
    const repository = createReviewRepositoryMock();
    const businessRepository = createBusinessRepositoryMock();

    return {
        repository,
        businessRepository,
        service: new ReviewService({
            repository,
            businessRepository,
            currentUser,
        }),
    };
}

describe('ReviewService', () => {
    const currentUser = {
        id: 'user-ana',
        fullName: 'Ana Mercado',
        email: 'ana@encuentralotodo.app',
        role: 'USER',
    } as UserProfile;

    it('create review with valid data persists using the server-side current user', async () => {
        const { service, repository, businessRepository } = createService(currentUser);
        const input: CreateReviewInput = {
            businessId: 'biz-casa-norte',
            userId: 'spoofed-user',
            rating: 5,
            comment: 'Pedido rápido y atención muy clara por WhatsApp.',
        };
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.create.mockResolvedValue(createReviewRecord({ userId: 'user-ana' }));

        const result = await service.create(input);

        expect(repository.create).toHaveBeenCalledWith({
            businessId: 'biz-casa-norte',
            rating: 5,
            comment: 'Pedido rápido y atención muy clara por WhatsApp.',
            userId: 'user-ana',
        });
        expect(result).toEqual({
            id: 'review-1',
            rating: 5,
            comment: 'Pedido rápido y atención muy clara por WhatsApp.',
            userId: 'user-ana',
            businessId: 'biz-casa-norte',
            createdAt: '2026-03-20T10:00:00.000Z',
        });
    });

    it('rejects invalid rating', async () => {
        const { service } = createService(currentUser);

        await expect(service.create({
            businessId: 'biz-casa-norte',
            userId: 'user-ana',
            rating: 6,
            comment: 'Comentario inválido por rating.',
        } as CreateReviewInput)).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'Rating must be between 1 and 5.',
        });
    });

    it('rejects invalid business', async () => {
        const { service, businessRepository } = createService(currentUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(null);

        await expect(service.create({
            businessId: 'missing-business',
            userId: 'user-ana',
            rating: 4,
            comment: 'Comentario válido pero sin negocio.',
        })).rejects.toMatchObject({
            code: 'NOT_FOUND',
            message: 'Business not found.',
        });
    });

    it('listByBusiness returns mapped Prisma-backed reviews with public user info', async () => {
        const { service, repository, businessRepository } = createService(null);
        businessRepository.findBusinessById.mockResolvedValue(createBusinessRecord());
        repository.listByBusiness.mockResolvedValue([createReviewWithUserRecord()]);

        const result = await service.listByBusiness('biz-casa-norte');

        expect(result).toEqual([
            {
                id: 'review-1',
                rating: 5,
                comment: 'Pedido rápido y atención muy clara por WhatsApp.',
                userId: 'user-ana',
                businessId: 'biz-casa-norte',
                createdAt: '2026-03-20T10:00:00.000Z',
                user: {
                    id: 'user-ana',
                    fullName: 'Ana Mercado',
                    email: 'ana@encuentralotodo.app',
                    role: 'USER',
                    avatarUrl: 'https://example.com/avatar.jpg',
                },
            },
        ]);
    });

    it('public read remains compatible when the business does not exist', async () => {
        const { service, businessRepository } = createService(null);
        businessRepository.findBusinessById.mockResolvedValue(null);

        await expect(service.listByBusiness('missing-business')).resolves.toEqual([]);
    });

    it('rejects unauthenticated create requests', async () => {
        const { service } = createService(null);

        await expect(service.create({
            businessId: 'biz-casa-norte',
            userId: 'user-ana',
            rating: 4,
            comment: 'Comentario sin sesión.',
        })).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
        });
    });
});