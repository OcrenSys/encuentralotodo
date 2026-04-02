import { createCurrentUser } from 'auth';

import type { BusinessRepositoryPort, RepositoryBusinessAccessRecord } from '../business/business.repository';
import type {
    BusinessAnalyticsRepositoryPort,
    RepositoryBusinessAnalyticsOverviewRecord,
} from './business-analytics.repository';
import { BusinessAnalyticsService } from './business-analytics.service';

function createBusinessAccessRecord(overrides: Partial<RepositoryBusinessAccessRecord> = {}): RepositoryBusinessAccessRecord {
    return {
        id: 'biz-casa-norte',
        ownerId: 'owner-sofia',
        managers: ['manager-carlos'],
        subscriptionType: 'PREMIUM_PLUS',
        status: 'APPROVED',
        ...overrides,
    };
}

function createOverviewRecord(overrides: Partial<RepositoryBusinessAnalyticsOverviewRecord> = {}): RepositoryBusinessAnalyticsOverviewRecord {
    return {
        businessId: 'biz-casa-norte',
        businessName: 'Casa Norte Market',
        totalLeads: 14,
        leadsLast7Days: 4,
        leadsLast30Days: 9,
        totalProducts: 6,
        totalPromotions: 2,
        totalReviews: 5,
        averageRating: 4.4,
        recentLeads: [
            {
                id: 'lead-1',
                name: 'Valentina Guzman',
                businessId: 'biz-casa-norte',
                businessName: 'Casa Norte Market',
                source: 'Promo',
                status: 'NEW',
                summary: 'Consultó por la promoción destacada.',
                createdAt: new Date('2026-03-30T10:00:00.000Z'),
            },
        ],
        recentPromotions: [
            {
                id: 'promo-1',
                title: 'Semana de combos',
                businessId: 'biz-casa-norte',
                businessName: 'Casa Norte Market',
                validUntil: new Date('2026-04-15T10:00:00.000Z'),
                createdAt: new Date('2026-03-28T10:00:00.000Z'),
            },
        ],
        ...overrides,
    };
}

function createBusinessRepositoryMock(): jest.Mocked<BusinessRepositoryPort> {
    return {
        listBusinesses: jest.fn(),
        listBusinessesForManagement: jest.fn(),
        listBusinessesByUserAccess: jest.fn(),
        findBusinessById: jest.fn(),
        findBusinessAccessById: jest.fn(),
        listPendingBusinesses: jest.fn(),
        createBusiness: jest.fn(),
        approveBusiness: jest.fn(),
        findUserById: jest.fn(),
        findUsersByIds: jest.fn(),
    };
}

function createAnalyticsRepositoryMock(): jest.Mocked<BusinessAnalyticsRepositoryPort> {
    return {
        getOverview: jest.fn(),
        listLeadTimestamps: jest.fn(),
    };
}

function createService(currentUser: ReturnType<typeof createCurrentUser> | null) {
    const businessRepository = createBusinessRepositoryMock();
    const repository = createAnalyticsRepositoryMock();

    return {
        businessRepository,
        repository,
        service: new BusinessAnalyticsService({
            repository,
            businessRepository,
            currentUser,
        }),
    };
}

describe('BusinessAnalyticsService', () => {
    it('returns persisted overview metrics, trend points and monetization signals', async () => {
        const { service, businessRepository, repository } = createService(createCurrentUser({
            id: 'owner-sofia',
            fullName: 'Sofia Rivas',
            email: 'sofia@encuentralotodo.app',
            role: 'USER',
            authProvider: 'mock',
            externalAuthId: 'owner-sofia',
            emailVerified: true,
        }));
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccessRecord());
        repository.getOverview.mockResolvedValue(createOverviewRecord());
        repository.listLeadTimestamps.mockResolvedValue([
            new Date('2026-03-25T10:00:00.000Z'),
            new Date('2026-03-25T15:00:00.000Z'),
            new Date('2026-03-30T11:00:00.000Z'),
        ]);

        const result = await service.getOverview({ businessId: 'biz-casa-norte', period: '30D' });

        expect(result).toMatchObject({
            businessId: 'biz-casa-norte',
            businessName: 'Casa Norte Market',
            overview: {
                totalLeads: 14,
                leadsLast7Days: 4,
                leadsLast30Days: 9,
                totalProducts: 6,
                totalPromotions: 2,
                totalReviews: 5,
                averageRating: 4.4,
            },
            recentLeads: [expect.objectContaining({ id: 'lead-1', businessId: 'biz-casa-norte' })],
            recentPromotions: [expect.objectContaining({ id: 'promo-1', businessId: 'biz-casa-norte' })],
            topProducts: [],
            topPromotions: [],
            monetization: expect.objectContaining({
                leadVolumeBucket: 'MEDIUM',
                promotionUsageLevel: 'ACTIVE',
                reviewStrength: 'STRONG',
            }),
        });
        expect(result.leadTrend.some((point) => point.date === '2026-03-25' && point.count === 2)).toBe(true);
    });

    it('scopes access to owner or manager and rejects unrelated users', async () => {
        const { service, businessRepository } = createService(createCurrentUser({
            id: 'user-ana',
            fullName: 'Ana Mercado',
            email: 'ana@encuentralotodo.app',
            role: 'USER',
            authProvider: 'mock',
            externalAuthId: 'user-ana',
            emailVerified: true,
        }));
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccessRecord());

        await expect(service.getOverview({ businessId: 'biz-casa-norte' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Business access required.',
        });
    });

    it('returns empty-state analytics without inventing performance metrics', async () => {
        const { service, businessRepository, repository } = createService(createCurrentUser({
            id: 'manager-carlos',
            fullName: 'Carlos Mena',
            email: 'carlos@encuentralotodo.app',
            role: 'USER',
            authProvider: 'mock',
            externalAuthId: 'manager-carlos',
            emailVerified: true,
        }));
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccessRecord());
        repository.getOverview.mockResolvedValue(createOverviewRecord({
            totalLeads: 0,
            leadsLast7Days: 0,
            leadsLast30Days: 0,
            totalProducts: 0,
            totalPromotions: 0,
            totalReviews: 0,
            averageRating: null,
            recentLeads: [],
            recentPromotions: [],
        }));
        repository.listLeadTimestamps.mockResolvedValue([]);

        const result = await service.getOverview({ businessId: 'biz-casa-norte', period: '7D' });

        expect(result.overview).toMatchObject({
            totalLeads: 0,
            totalProducts: 0,
            totalPromotions: 0,
            totalReviews: 0,
            averageRating: null,
        });
        expect(result.leadTrend.every((point) => point.count === 0)).toBe(true);
        expect(result.topProducts).toEqual([]);
        expect(result.topPromotions).toEqual([]);
        expect(result.monetization).toMatchObject({
            engagementScore: 0,
            leadVolumeBucket: 'NONE',
            promotionUsageLevel: 'NONE',
            reviewStrength: 'NONE',
            upsellCandidateReasons: [],
        });
    });
});