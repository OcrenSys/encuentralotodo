import type { BusinessStatus, SubscriptionType } from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryPlatformAnalyticsSummaryRecord {
    totalApprovedBusinesses: number;
    pendingBusinesses: number;
    totalProducts: number;
    totalActivePromotions: number;
    totalLeads: number;
    totalReviews: number;
    averagePlatformRating: number | null;
    recentBusinessSignups: number;
}

export interface RepositoryPlatformBusinessActivityRecord {
    businessId: string;
    businessName: string;
    status: BusinessStatus;
    subscriptionType: SubscriptionType;
    createdAt: Date;
    leadCreatedAt: Date[];
    productCount: number;
    activePromotionCount: number;
    totalPromotionCount: number;
    reviewRatings: number[];
}

export interface PlatformAnalyticsRepositoryPort {
    getSummary(input: { now: Date; since30Days: Date }): Promise<RepositoryPlatformAnalyticsSummaryRecord>;
    listBusinessActivity(input: { now: Date }): Promise<RepositoryPlatformBusinessActivityRecord[]>;
    listLeadTimestamps(input: { since?: Date }): Promise<Date[]>;
}

export class PlatformAnalyticsRepository implements PlatformAnalyticsRepositoryPort {
    private readonly prisma: ReturnType<typeof getPrismaClient>;

    constructor(prisma: ReturnType<typeof getPrismaClient>) {
        this.prisma = prisma;
    }

    async getSummary(input: { now: Date; since30Days: Date }) {
        const [
            totalApprovedBusinesses,
            pendingBusinesses,
            totalProducts,
            totalActivePromotions,
            totalLeads,
            reviewAggregate,
            recentBusinessSignups,
        ] = await Promise.all([
            this.prisma.business.count({
                where: {
                    status: 'APPROVED',
                },
            }),
            this.prisma.business.count({
                where: {
                    status: 'PENDING',
                },
            }),
            this.prisma.product.count(),
            this.prisma.promotion.count({
                where: {
                    status: {
                        not: 'DRAFT',
                    },
                    endDate: {
                        gte: input.now,
                    },
                },
            }),
            this.prisma.lead.count(),
            this.prisma.review.aggregate({
                _avg: {
                    rating: true,
                },
                _count: {
                    rating: true,
                },
            }),
            this.prisma.business.count({
                where: {
                    createdAt: {
                        gte: input.since30Days,
                    },
                },
            }),
        ]);

        return {
            totalApprovedBusinesses,
            pendingBusinesses,
            totalProducts,
            totalActivePromotions,
            totalLeads,
            totalReviews: reviewAggregate._count.rating,
            averagePlatformRating: reviewAggregate._avg.rating,
            recentBusinessSignups,
        };
    }

    async listBusinessActivity(input: { now: Date }) {
        const records = await this.prisma.business.findMany({
            select: {
                id: true,
                name: true,
                status: true,
                subscriptionType: true,
                createdAt: true,
                products: {
                    select: {
                        id: true,
                    },
                },
                promotions: {
                    select: {
                        id: true,
                        endDate: true,
                    },
                },
                leads: {
                    select: {
                        createdAt: true,
                    },
                },
                reviews: {
                    select: {
                        rating: true,
                    },
                },
            },
        });

        return records.map((record: {
            id: string;
            name: string;
            status: BusinessStatus;
            subscriptionType: SubscriptionType;
            createdAt: Date;
            products: Array<{ id: string }>;
            promotions: Array<{ id: string; endDate: Date }>;
            leads: Array<{ createdAt: Date }>;
            reviews: Array<{ rating: number }>;
        }) => ({
            businessId: record.id,
            businessName: record.name,
            status: record.status,
            subscriptionType: record.subscriptionType,
            createdAt: record.createdAt,
            leadCreatedAt: record.leads.map((lead: { createdAt: Date }) => lead.createdAt),
            productCount: record.products.length,
            activePromotionCount: record.promotions.filter((promotion: { endDate: Date }) => promotion.endDate >= input.now).length,
            totalPromotionCount: record.promotions.length,
            reviewRatings: record.reviews.map((review: { rating: number }) => review.rating),
        }));
    }

    async listLeadTimestamps(input: { since?: Date }) {
        const records = await this.prisma.lead.findMany({
            where: {
                createdAt: input.since
                    ? {
                        gte: input.since,
                    }
                    : undefined,
            },
            orderBy: {
                createdAt: 'asc',
            },
            select: {
                createdAt: true,
            },
        });

        return records.map((record: { createdAt: Date }) => record.createdAt);
    }
}