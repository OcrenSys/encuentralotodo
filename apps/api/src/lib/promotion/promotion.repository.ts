import type {
    BusinessAssignmentRole,
    CreatePromotionInput,
    PromotionStatus,
    PromotionType,
    UpdatePromotionInput,
} from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryPromotionRecord {
    id: string;
    businessId: string;
    title: string;
    description: string;
    type: PromotionType;
    startDate: Date;
    endDate: Date;
    status: PromotionStatus;
    createdAt: Date;
    updatedAt: Date;
    promoPrice: number;
    originalPrice: number;
    image: string;
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
    businessId: true,
    title: true,
    description: true,
    type: true,
    startDate: true,
    endDate: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    promoPrice: true,
    originalPrice: true,
    image: true,
} as const;

function mapPromotionRecord(record: any): RepositoryPromotionRecord {
    return {
        id: record.id,
        businessId: record.businessId,
        title: record.title,
        description: record.description,
        type: record.type,
        startDate: record.startDate,
        endDate: record.endDate,
        status: record.status,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        promoPrice: record.promoPrice,
        originalPrice: record.originalPrice,
        image: record.image,
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
            orderBy: { updatedAt: 'desc' },
            select: promotionSelect,
        });

        return records.map(mapPromotionRecord);
    }

    async listActive(now: Date) {
        const records = await this.prisma.promotion.findMany({
            where: {
                status: {
                    not: 'DRAFT',
                },
                endDate: {
                    gte: now,
                },
            },
            orderBy: { updatedAt: 'desc' },
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
                type: input.type,
                startDate: new Date(input.startDate),
                endDate: new Date(input.endDate),
                status: input.status,
                promoPrice: input.promoPrice,
                originalPrice: input.originalPrice,
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
                type: input.type,
                startDate: input.startDate ? new Date(input.startDate) : undefined,
                endDate: input.endDate ? new Date(input.endDate) : undefined,
                status: input.status,
                promoPrice: input.promoPrice,
                originalPrice: input.originalPrice,
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