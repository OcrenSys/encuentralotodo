import { TRPCError } from '@trpc/server';
import type { CurrentUser } from 'auth';
import type {
    GetPlatformAnalyticsInput,
    PlatformAnalyticsOverview,
} from 'types';

import { platformAdminRoles, requirePlatformRole } from '../auth/authorization';
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
import type { PlatformAnalyticsRepositoryPort } from './platform-analytics.repository';

interface PlatformAnalyticsServiceDependencies {
    repository: PlatformAnalyticsRepositoryPort;
    currentUser: CurrentUser | null;
}

interface EnrichedBusinessActivity {
    businessId: string;
    businessName: string;
    status: 'PENDING' | 'APPROVED';
    subscriptionType: 'FREE_TRIAL' | 'PREMIUM' | 'PREMIUM_PLUS';
    leadCount: number;
    leadCountLast30Days: number;
    productCount: number;
    activePromotionCount: number;
    totalPromotionCount: number;
    reviewCount: number;
    averageRating: number | null;
    engagementScore: number;
    highActivity: boolean;
    leadVolumeBucket: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    promotionUsageLevel: 'NONE' | 'LIGHT' | 'ACTIVE';
    reviewStrength: 'NONE' | 'LIMITED' | 'STRONG';
    indicators: string[];
    monetizationReasons: string[];
}

export class PlatformAnalyticsService {
    private readonly repository: PlatformAnalyticsRepositoryPort;
    private readonly currentUser: CurrentUser | null;

    constructor({ repository, currentUser }: PlatformAnalyticsServiceDependencies) {
        this.repository = repository;
        this.currentUser = currentUser;
    }

    async getOverview(input: GetPlatformAnalyticsInput = {}): Promise<PlatformAnalyticsOverview> {
        this.ensureAdmin();

        const period = input.period ?? '30D';
        const now = new Date();
        const since30Days = subtractDays(now, 29);
        const sincePeriod = period === '7D' ? subtractDays(now, 6) : period === '30D' ? since30Days : undefined;

        const [summary, businessActivity, leadTimestamps] = await Promise.all([
            this.repository.getSummary({ now, since30Days }),
            this.repository.listBusinessActivity({ now }),
            this.repository.listLeadTimestamps({ since: sincePeriod }),
        ]);

        const enrichedActivity = businessActivity.map((business) => {
            const leadCount = business.leadCreatedAt.length;
            const leadCountLast30Days = business.leadCreatedAt.filter((createdAt) => createdAt >= since30Days).length;
            const reviewCount = business.reviewRatings.length;
            const averageRating = reviewCount > 0
                ? business.reviewRatings.reduce((sum, rating) => sum + rating, 0) / reviewCount
                : null;
            const engagementScore = calculateEngagementScore({
                leadCountLast30Days,
                totalProducts: business.productCount,
                activePromotionCount: business.activePromotionCount,
                reviewCount,
                averageRating,
            });
            const highActivity = isHighActivityBusiness(leadCountLast30Days, engagementScore);
            const leadVolumeBucket = resolveLeadVolumeBucket(leadCountLast30Days);
            const promotionUsageLevel = resolvePromotionUsageLevel(business.activePromotionCount);
            const reviewStrength = resolveReviewStrength(reviewCount, averageRating);
            const indicators = [
                highActivity ? 'High lead activity' : null,
                leadCountLast30Days === 0 ? 'No recent lead activity in last 30 days' : null,
                business.productCount > 0 && business.activePromotionCount === 0 ? 'Products listed but no active promotions' : null,
                reviewStrength === 'STRONG' ? 'Strong review reputation' : null,
            ].filter((indicator): indicator is string => Boolean(indicator));
            const monetizationReasons = [
                highActivity ? 'Candidate for premium analytics or lead-based plans' : null,
                business.productCount > 0 && business.activePromotionCount === 0 ? 'Could benefit from boosts or promotion add-ons' : null,
                reviewStrength === 'STRONG' && business.status === 'APPROVED' ? 'Could support featured listing experiments' : null,
            ].filter((reason): reason is string => Boolean(reason));

            return {
                businessId: business.businessId,
                businessName: business.businessName,
                status: business.status,
                subscriptionType: business.subscriptionType,
                leadCount,
                leadCountLast30Days,
                productCount: business.productCount,
                activePromotionCount: business.activePromotionCount,
                totalPromotionCount: business.totalPromotionCount,
                reviewCount,
                averageRating,
                engagementScore,
                highActivity,
                leadVolumeBucket,
                promotionUsageLevel,
                reviewStrength,
                indicators,
                monetizationReasons,
            } satisfies EnrichedBusinessActivity;
        });

        const leaderboard = [...enrichedActivity]
            .sort((left, right) => right.leadCount - left.leadCount || right.engagementScore - left.engagementScore)
            .slice(0, 10)
            .map((business) => ({
                businessId: business.businessId,
                businessName: business.businessName,
                leadCount: business.leadCount,
                reviewCount: business.reviewCount,
                productCount: business.productCount,
                activePromotionCount: business.activePromotionCount,
                averageRating: roundMetric(business.averageRating),
                engagementScore: business.engagementScore,
                isHighActivityBusiness: business.highActivity,
            }));

        const engagementIndicators = enrichedActivity
            .filter((business) => business.indicators.length > 0)
            .sort((left, right) => right.engagementScore - left.engagementScore || right.leadCountLast30Days - left.leadCountLast30Days)
            .slice(0, 10)
            .map((business) => ({
                businessId: business.businessId,
                businessName: business.businessName,
                status: business.status,
                subscriptionType: business.subscriptionType,
                leadCountLast30Days: business.leadCountLast30Days,
                productCount: business.productCount,
                activePromotionCount: business.activePromotionCount,
                reviewCount: business.reviewCount,
                averageRating: roundMetric(business.averageRating),
                engagementScore: business.engagementScore,
                indicators: business.indicators,
            }));

        const monetizationCandidates = enrichedActivity
            .filter((business) => business.monetizationReasons.length > 0 && business.status === 'APPROVED')
            .sort((left, right) => right.engagementScore - left.engagementScore || right.leadCountLast30Days - left.leadCountLast30Days)
            .slice(0, 10)
            .map((business) => ({
                businessId: business.businessId,
                businessName: business.businessName,
                engagementScore: business.engagementScore,
                leadVolumeBucket: business.leadVolumeBucket,
                promotionUsageLevel: business.promotionUsageLevel,
                reviewStrength: business.reviewStrength,
                reasons: business.monetizationReasons,
            }));

        return {
            period,
            generatedAt: now.toISOString(),
            summary: {
                totalApprovedBusinesses: summary.totalApprovedBusinesses,
                pendingBusinesses: summary.pendingBusinesses,
                totalProducts: summary.totalProducts,
                totalActivePromotions: summary.totalActivePromotions,
                totalLeads: summary.totalLeads,
                totalReviews: summary.totalReviews,
                averagePlatformRating: roundMetric(summary.averagePlatformRating),
                recentBusinessSignups: summary.recentBusinessSignups,
            },
            recentLeadVolume: buildTrendPoints(leadTimestamps, period, now),
            businessActivityLeaderboard: leaderboard,
            businessEngagementIndicators: engagementIndicators,
            monetizationCandidates,
        };
    }

    private ensureAdmin() {
        return requirePlatformRole(this.currentUser, platformAdminRoles, 'Admin access required.');
    }
}