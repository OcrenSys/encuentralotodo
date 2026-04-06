import { createCurrentUser } from 'auth';

import type {
    PlatformAnalyticsRepositoryPort,
    RepositoryPlatformAnalyticsSummaryRecord,
    RepositoryPlatformBusinessActivityRecord,
} from './platform-analytics.repository';
import { PlatformAnalyticsService } from './platform-analytics.service';

function createSummaryRecord(overrides: Partial<RepositoryPlatformAnalyticsSummaryRecord> = {}): RepositoryPlatformAnalyticsSummaryRecord {
    return {
        totalApprovedBusinesses: 3,
        pendingBusinesses: 1,
        totalProducts: 12,
        totalActivePromotions: 4,
        totalLeads: 24,
        totalReviews: 8,
        averagePlatformRating: 4.18,
        recentBusinessSignups: 2,
        ...overrides,
    };
}

function createBusinessActivityRecord(overrides: Partial<RepositoryPlatformBusinessActivityRecord> = {}): RepositoryPlatformBusinessActivityRecord {
    return {
        businessId: 'biz-casa-norte',
        businessName: 'Casa Norte Market',
        status: 'APPROVED',
        subscriptionType: 'FREE_TRIAL',
        createdAt: new Date('2026-03-20T10:00:00.000Z'),
        leadCreatedAt: [
            new Date('2026-03-12T10:00:00.000Z'),
            new Date('2026-03-18T10:00:00.000Z'),
            new Date('2026-03-29T10:00:00.000Z'),
            new Date('2026-03-30T10:00:00.000Z'),
            new Date('2026-03-31T10:00:00.000Z'),
        ],
        productCount: 5,
        activePromotionCount: 0,
        totalPromotionCount: 0,
        reviewRatings: [5, 5, 4, 5, 4],
        ...overrides,
    };
}

function createRepositoryMock(): jest.Mocked<PlatformAnalyticsRepositoryPort> {
    return {
        getSummary: jest.fn(),
        listBusinessActivity: jest.fn(),
        listLeadTimestamps: jest.fn(),
    };
}

function createService(currentUser: ReturnType<typeof createCurrentUser> | null) {
    const repository = createRepositoryMock();

    return {
        repository,
        service: new PlatformAnalyticsService({
            repository,
            currentUser,
        }),
    };
}

describe('PlatformAnalyticsService', () => {
    it('builds platform summary, leaderboard and monetization indicators for admins', async () => {
        const { service, repository } = createService(createCurrentUser({
            id: 'admin-luis',
            fullName: 'Luis Admin',
            email: 'luis@encuentralotodo.app',
            role: 'ADMIN',
            authProvider: 'mock',
            externalAuthId: 'admin-luis',
            emailVerified: true,
        }));
        repository.getSummary.mockResolvedValue(createSummaryRecord());
        repository.listBusinessActivity.mockResolvedValue([
            createBusinessActivityRecord(),
            createBusinessActivityRecord({
                businessId: 'biz-sabor-urbano',
                businessName: 'Sabor Urbano',
                subscriptionType: 'PREMIUM_PLUS',
                leadCreatedAt: Array.from({ length: 12 }, (_, index) => new Date(`2026-03-${String(index + 10).padStart(2, '0')}T10:00:00.000Z`)),
                activePromotionCount: 2,
                totalPromotionCount: 3,
                reviewRatings: [5, 4, 5, 5, 4, 5],
            }),
            createBusinessActivityRecord({
                businessId: 'biz-inactivo',
                businessName: 'Negocio Inactivo',
                leadCreatedAt: [],
                productCount: 2,
                activePromotionCount: 0,
                totalPromotionCount: 0,
                reviewRatings: [],
            }),
        ]);
        repository.listLeadTimestamps.mockResolvedValue([
            new Date('2026-03-25T10:00:00.000Z'),
            new Date('2026-03-25T12:00:00.000Z'),
            new Date('2026-03-30T10:00:00.000Z'),
        ]);

        const result = await service.getOverview({ period: '30D' });

        expect(result.summary).toMatchObject({
            totalApprovedBusinesses: 3,
            pendingBusinesses: 1,
            totalProducts: 12,
            totalActivePromotions: 4,
            totalLeads: 24,
            totalReviews: 8,
            averagePlatformRating: 4.18,
            recentBusinessSignups: 2,
        });
        expect(result.businessActivityLeaderboard[0]).toMatchObject({
            businessId: 'biz-sabor-urbano',
            isHighActivityBusiness: true,
        });
        expect(result.businessEngagementIndicators).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    businessId: 'biz-inactivo',
                    indicators: expect.arrayContaining(['No recent lead activity in last 30 days']),
                }),
                expect.objectContaining({
                    businessId: 'biz-casa-norte',
                    indicators: expect.arrayContaining(['Products listed but no active promotions']),
                }),
            ]),
        );
        expect(result.monetizationCandidates).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    businessId: 'biz-sabor-urbano',
                    reasons: expect.arrayContaining(['Candidate for premium analytics or lead-based plans']),
                }),
            ]),
        );
    });

    it('rejects non-admin callers', async () => {
        const { service } = createService(createCurrentUser({
            id: 'owner-sofia',
            fullName: 'Sofia Rivas',
            email: 'sofia@encuentralotodo.app',
            role: 'USER',
            authProvider: 'mock',
            externalAuthId: 'owner-sofia',
            emailVerified: true,
        }));

        await expect(service.getOverview({})).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Admin access required.',
        });
    });
});