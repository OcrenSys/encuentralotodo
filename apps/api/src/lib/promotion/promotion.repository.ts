import type {
    BusinessAssignmentRole,
    CreatePromotionInput,
    UpdatePromotionInput,
} from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryPromotionRecord {
    id: string;
    title: string;
    description: string;
    promoPrice: number;
    originalPrice: number;
    validUntil: Date;
    businessId: string;
    image: string;
    lastUpdated: Date;
    createdAt: Date;
}

export interface RepositoryPromotionWithBusinessRecord extends RepositoryPromotionRecord {
    business: {
        id: string;
        ownerId: string;
        subscriptionType: 'FREE_TRIAL' | 'PREMIUM' | 'PREMIUM_PLUS';
        status: 'PENDING' | 'APPROVED';
        managers: Array<{ userId: string }>;
        memberships: Array<{ userId: string; role: BusinessAssignmentRole }>;
    };
}

export interface PromotionRepositoryPort {
    listByBusiness(businessId: string): Promise<RepositoryPromotionRecord[]>;
    listActive(now: Date): Promise<RepositoryPromotionRecord[]>;
    findById(promotionId: string): Promise<RepositoryPromotionRecord | null>;
    findByIdWithBusiness(promotionId: string): Promise<RepositoryPromotionWithBusinessRecord | null>;
    create(input: CreatePromotionInput): Promise<RepositoryPromotionRecord>;
    update(promotionId: string, input: Omit<UpdatePromotionInput, 'promotionId'>): Promise<RepositoryPromotionRecord | null>;
    delete(promotionId: string): Promise<RepositoryPromotionRecord | null>;
}

const promotionSelect = {
    id: true,
    title: true,
    description: true,
    promoPrice: true,
    originalPrice: true,
    validUntil: true,
    businessId: true,
    image: true,
    lastUpdated: true,
    createdAt: true,
} as const;

function mapPromotionRecord(record: any): RepositoryPromotionRecord {
    return {
        id: record.id,
        title: record.title,
        description: record.description,
        promoPrice: record.promoPrice,
        originalPrice: record.originalPrice,
        validUntil: record.validUntil,
        businessId: record.businessId,
        image: record.image,
        lastUpdated: record.lastUpdated,
        createdAt: record.createdAt,
    };
}

function mapPromotionWithBusinessRecord(record: any): RepositoryPromotionWithBusinessRecord {
    return {
        ...mapPromotionRecord(record),
        business: {
            id: record.business.id,
            ownerId: record.business.ownerId,
            subscriptionType: record.business.subscriptionType,
            status: record.business.status,
            managers: (record.business.managers ?? []).map((manager: any) => ({ userId: manager.userId })),
            memberships: (record.business.userRoles ?? []).map((membership: any) => ({
                userId: membership.userId,
                role: membership.role,
            })),
        },
    };
}

export class PromotionRepository implements PromotionRepositoryPort {
    private readonly prisma: ReturnType<typeof getPrismaClient>;

    constructor(prisma: ReturnType<typeof getPrismaClient>) {
        this.prisma = prisma;
    }

    async listByBusiness(businessId: string) {
        const records = await this.prisma.promotion.findMany({
            where: { businessId },
            orderBy: { lastUpdated: 'desc' },
            select: promotionSelect,
        });

        return records.map(mapPromotionRecord);
    }

    async listActive(now: Date) {
        const records = await this.prisma.promotion.findMany({
            where: {
                validUntil: {
                    gte: now,
                },
            },
            orderBy: { lastUpdated: 'desc' },
            select: promotionSelect,
        });

        return records.map(mapPromotionRecord);
    }

    async findById(promotionId: string) {
        const record = await this.prisma.promotion.findUnique({
            where: { id: promotionId },
            select: promotionSelect,
        });

        return record ? mapPromotionRecord(record) : null;
    }

    async findByIdWithBusiness(promotionId: string) {
        const record = await this.prisma.promotion.findUnique({
            where: { id: promotionId },
            select: {
                ...promotionSelect,
                business: {
                    select: {
                        id: true,
                        ownerId: true,
                        subscriptionType: true,
                        status: true,
                        managers: {
                            select: {
                                userId: true,
                            },
                        },
                        userRoles: {
                            select: {
                                userId: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        return record ? mapPromotionWithBusinessRecord(record) : null;
    }

    async create(input: CreatePromotionInput) {
        const record = await this.prisma.promotion.create({
            data: {
                businessId: input.businessId,
                title: input.title,
                description: input.description,
                promoPrice: input.promoPrice,
                originalPrice: input.originalPrice,
                validUntil: new Date(input.validUntil),
                image: input.image,
            },
            select: promotionSelect,
        });

        return mapPromotionRecord(record);
    }

    async update(promotionId: string, input: Omit<UpdatePromotionInput, 'promotionId'>) {
        const existing = await this.prisma.promotion.findUnique({
            where: { id: promotionId },
            select: { id: true },
        });

        if (!existing) {
            return null;
        }

        const record = await this.prisma.promotion.update({
            where: { id: promotionId },
            data: {
                title: input.title,
                description: input.description,
                promoPrice: input.promoPrice,
                originalPrice: input.originalPrice,
                validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
                image: input.image,
            },
            select: promotionSelect,
        });

        return mapPromotionRecord(record);
    }

    async delete(promotionId: string) {
        const existing = await this.prisma.promotion.findUnique({
            where: { id: promotionId },
            select: { id: true },
        });

        if (!existing) {
            return null;
        }

        const record = await this.prisma.promotion.delete({
            where: { id: promotionId },
            select: promotionSelect,
        });

        return mapPromotionRecord(record);
    }
}