import type { LeadSource, LeadStatus } from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryBusinessAnalyticsRecentLeadRecord {
    id: string;
    name: string;
    businessId: string;
    businessName: string;
    source: LeadSource;
    status: LeadStatus;
    summary: string;
    createdAt: Date;
}

export interface RepositoryBusinessAnalyticsRecentPromotionRecord {
    id: string;
    title: string;
    businessId: string;
    businessName: string;
    validUntil: Date;
    createdAt: Date;
}

export interface RepositoryBusinessAnalyticsOverviewRecord {
    businessId: string;
    businessName: string;
    totalLeads: number;
    leadsLast7Days: number;
    leadsLast30Days: number;
    totalProducts: number;
    totalPromotions: number;
    totalReviews: number;
    averageRating: number | null;
    recentLeads: RepositoryBusinessAnalyticsRecentLeadRecord[];
    recentPromotions: RepositoryBusinessAnalyticsRecentPromotionRecord[];
}

export interface BusinessAnalyticsRepositoryPort {
    getOverview(input: { businessId: string; since7Days: Date; since30Days: Date }): Promise<RepositoryBusinessAnalyticsOverviewRecord | null>;
    listLeadTimestamps(input: { businessId: string; since?: Date }): Promise<Date[]>;
}

const recentLeadSelect = {
    id: true,
    name: true,
    businessId: true,
    source: true,
    status: true,
    summary: true,
    createdAt: true,
    business: {
        select: {
            name: true,
        },
    },
} as const;

const recentPromotionSelect = {
    id: true,
    title: true,
    businessId: true,
    endDate: true,
    createdAt: true,
    business: {
        select: {
            name: true,
        },
    },
} as const;

function mapRecentLeadRecord(record: any): RepositoryBusinessAnalyticsRecentLeadRecord {
    return {
        id: record.id,
        name: record.name,
        businessId: record.businessId,
        businessName: record.business.name,
        source: record.source,
        status: record.status,
        summary: record.summary,
        createdAt: record.createdAt,
    };
}

function mapRecentPromotionRecord(record: any): RepositoryBusinessAnalyticsRecentPromotionRecord {
    return {
        id: record.id,
        title: record.title,
        businessId: record.businessId,
        businessName: record.business.name,
        validUntil: record.endDate,
        createdAt: record.createdAt,
    };
}

export class BusinessAnalyticsRepository implements BusinessAnalyticsRepositoryPort {
    private readonly prisma: ReturnType<typeof getPrismaClient>;

    constructor(prisma: ReturnType<typeof getPrismaClient>) {
        this.prisma = prisma;
    }

    async getOverview(input: { businessId: string; since7Days: Date; since30Days: Date }) {
        const [business, totalLeads, leadsLast7Days, leadsLast30Days, totalProducts, totalPromotions, reviewAggregate, recentLeads, recentPromotions] = await Promise.all([
            this.prisma.business.findUnique({
                where: { id: input.businessId },
                select: {
                    id: true,
                    name: true,
                },
            }),
            this.prisma.lead.count({
                where: {
                    businessId: input.businessId,
                },
            }),
            this.prisma.lead.count({
                where: {
                    businessId: input.businessId,
                    createdAt: {
                        gte: input.since7Days,
                    },
                },
            }),
            this.prisma.lead.count({
                where: {
                    businessId: input.businessId,
                    createdAt: {
                        gte: input.since30Days,
                    },
                },
            }),
            this.prisma.product.count({
                where: {
                    businessId: input.businessId,
                },
            }),
            this.prisma.promotion.count({
                where: {
                    businessId: input.businessId,
                },
            }),
            this.prisma.review.aggregate({
                where: {
                    businessId: input.businessId,
                },
                _avg: {
                    rating: true,
                },
                _count: {
                    rating: true,
                },
            }),
            this.prisma.lead.findMany({
                where: {
                    businessId: input.businessId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 5,
                select: recentLeadSelect,
            }),
            this.prisma.promotion.findMany({
                where: {
                    businessId: input.businessId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 5,
                select: recentPromotionSelect,
            }),
        ]);

        if (!business) {
            return null;
        }

        return {
            businessId: business.id,
            businessName: business.name,
            totalLeads,
            leadsLast7Days,
            leadsLast30Days,
            totalProducts,
            totalPromotions,
            totalReviews: reviewAggregate._count.rating,
            averageRating: reviewAggregate._avg.rating,
            recentLeads: recentLeads.map(mapRecentLeadRecord),
            recentPromotions: recentPromotions.map(mapRecentPromotionRecord),
        };
    }

    async listLeadTimestamps(input: { businessId: string; since?: Date }) {
        const records = await this.prisma.lead.findMany({
            where: {
                businessId: input.businessId,
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