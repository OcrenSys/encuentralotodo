import type { CreateReviewInput } from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryReviewRecord {
    id: string;
    rating: number;
    comment: string;
    userId: string;
    businessId: string;
    createdAt: Date;
}

export interface RepositoryReviewUserRecord {
    id: string;
    fullName: string;
    email: string;
    role: 'USER' | 'ADMIN' | 'SUPERADMIN' | 'GLOBALADMIN';
    avatarUrl: string | null;
}

export interface RepositoryReviewWithUserRecord extends RepositoryReviewRecord {
    user?: RepositoryReviewUserRecord | null;
}

export interface ReviewRepositoryPort {
    listByBusiness(businessId: string): Promise<RepositoryReviewWithUserRecord[]>;
    create(input: Omit<CreateReviewInput, 'userId'> & { userId: string }): Promise<RepositoryReviewRecord>;
}

const reviewSelect = {
    id: true,
    rating: true,
    comment: true,
    userId: true,
    businessId: true,
    createdAt: true,
} as const;

function mapReviewRecord(record: any): RepositoryReviewRecord {
    return {
        id: record.id,
        rating: record.rating,
        comment: record.comment,
        userId: record.userId,
        businessId: record.businessId,
        createdAt: record.createdAt,
    };
}

function mapReviewWithUserRecord(record: any): RepositoryReviewWithUserRecord {
    return {
        ...mapReviewRecord(record),
        user: record.user
            ? {
                id: record.user.id,
                fullName: record.user.fullName,
                email: record.user.email,
                role: record.user.role,
                avatarUrl: record.user.avatarUrl,
            }
            : undefined,
    };
}

export class ReviewRepository implements ReviewRepositoryPort {
    private readonly prisma: ReturnType<typeof getPrismaClient>;

    constructor(prisma: ReturnType<typeof getPrismaClient>) {
        this.prisma = prisma;
    }

    async listByBusiness(businessId: string) {
        const records = await this.prisma.review.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' },
            select: {
                ...reviewSelect,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return records.map(mapReviewWithUserRecord);
    }

    async create(input: Omit<CreateReviewInput, 'userId'> & { userId: string }) {
        const record = await this.prisma.review.create({
            data: {
                businessId: input.businessId,
                userId: input.userId,
                rating: input.rating,
                comment: input.comment,
            },
            select: reviewSelect,
        });

        return mapReviewRecord(record);
    }
}