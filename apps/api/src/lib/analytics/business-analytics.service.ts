import { TRPCError } from '@trpc/server';
import type { CurrentUser } from 'auth';
import type {
    BusinessAnalyticsOverview,
    GetBusinessAnalyticsInput,
} from 'types';

import { requireActiveUser } from '../auth/authorization';
import { canManageBusiness } from '../business/business-access';
import type { BusinessRepositoryPort } from '../business/business.repository';
import {
    buildTrendPoints,
    calculateEngagementScore,
    isHighActivityBusiness,
    resolveLeadVolumeBucket,
    resolvePromotionUsageLevel,
    resolveReviewStrength,
    roundMetric,
    subtractDays,
} from './analytics.helpers';
import type { BusinessAnalyticsRepositoryPort } from './business-analytics.repository';

interface BusinessAnalyticsServiceDependencies {
    repository: BusinessAnalyticsRepositoryPort;
    businessRepository: BusinessRepositoryPort;
    currentUser: CurrentUser | null;
}

export class BusinessAnalyticsService {
    private readonly repository: BusinessAnalyticsRepositoryPort;
    private readonly businessRepository: BusinessRepositoryPort;
    private readonly currentUser: CurrentUser | null;

    constructor({ repository, businessRepository, currentUser }: BusinessAnalyticsServiceDependencies) {
        this.repository = repository;
        this.businessRepository = businessRepository;
        this.currentUser = currentUser;
    }

    async getOverview(input: GetBusinessAnalyticsInput): Promise<BusinessAnalyticsOverview> {
        const period = input.period ?? '30D';
        const business = await this.businessRepository.findBusinessAccessById(input.businessId);

        if (!business) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        this.ensureBusinessCanBeManaged({ ownerId: business.ownerId, managers: business.managers });

        const now = new Date();
        const since7Days = subtractDays(now, 6);
        const since30Days = subtractDays(now, 29);
        const sincePeriod = period === '7D' ? since7Days : period === '30D' ? since30Days : undefined;

        const [overview, leadTimestamps] = await Promise.all([
            this.repository.getOverview({
                businessId: input.businessId,
                since7Days,
                since30Days,
            }),
            this.repository.listLeadTimestamps({
                businessId: input.businessId,
                since: sincePeriod,
            }),
        ]);

        if (!overview) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        const engagementScore = calculateEngagementScore({
            leadCountLast30Days: overview.leadsLast30Days,
            totalProducts: overview.totalProducts,
            activePromotionCount: overview.totalPromotions,
            reviewCount: overview.totalReviews,
            averageRating: overview.averageRating,
        });
        const leadVolumeBucket = resolveLeadVolumeBucket(overview.leadsLast30Days);
        const promotionUsageLevel = resolvePromotionUsageLevel(overview.totalPromotions);
        const reviewStrength = resolveReviewStrength(overview.totalReviews, overview.averageRating);
        const highActivity = isHighActivityBusiness(overview.leadsLast30Days, engagementScore);
        const upsellCandidateReasons = [
            overview.leadsLast30Days >= 8 ? 'High recent lead volume' : null,
            overview.totalProducts > 0 && overview.totalPromotions === 0 ? 'Has products but no promotions' : null,
            overview.totalReviews >= 5 && (overview.averageRating ?? 0) >= 4.2 ? 'Strong review reputation' : null,
        ].filter((reason): reason is string => Boolean(reason));

        return {
            businessId: overview.businessId,
            businessName: overview.businessName,
            period,
            generatedAt: now.toISOString(),
            overview: {
                totalLeads: overview.totalLeads,
                leadsLast7Days: overview.leadsLast7Days,
                leadsLast30Days: overview.leadsLast30Days,
                totalProducts: overview.totalProducts,
                totalPromotions: overview.totalPromotions,
                totalReviews: overview.totalReviews,
                averageRating: roundMetric(overview.averageRating),
            },
            recentLeads: overview.recentLeads.map((lead) => ({
                ...lead,
                createdAt: lead.createdAt.toISOString(),
            })),
            recentPromotions: overview.recentPromotions.map((promotion) => ({
                ...promotion,
                validUntil: promotion.validUntil.toISOString(),
                createdAt: promotion.createdAt.toISOString(),
            })),
            leadTrend: buildTrendPoints(leadTimestamps, period, now),
            topProducts: [],
            topPromotions: [],
            monetization: {
                engagementScore,
                leadVolumeBucket,
                isHighActivityBusiness: highActivity,
                promotionUsageLevel,
                reviewStrength,
                upsellCandidateReasons,
            },
        };
    }

    private ensureBusinessCanBeManaged(business: { ownerId: string; managers: string[] }) {
        const currentUser = requireActiveUser(this.currentUser);

        if (!canManageBusiness(currentUser, business)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Business access required.' });
        }
    }
}