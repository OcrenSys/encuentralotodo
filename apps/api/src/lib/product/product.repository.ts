import type {
    CreateProductInput,
    UpdateProductInput,
} from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryProductRecord {
    id: string;
    name: string;
    description: string;
    images: string[];
    price: number | null;
    isFeatured: boolean;
    businessId: string;
    lastUpdated: Date;
    createdAt: Date;
}

export interface RepositoryProductWithBusinessRecord extends RepositoryProductRecord {
    business: {
        id: string;
        ownerId: string;
        subscriptionType: 'FREE_TRIAL' | 'PREMIUM' | 'PREMIUM_PLUS';
        status: 'PENDING' | 'APPROVED';
        managers: Array<{ userId: string }>;
    };
}

export interface ProductRepositoryPort {
    listByBusiness(businessId: string): Promise<RepositoryProductRecord[]>;
    findById(productId: string): Promise<RepositoryProductRecord | null>;
    findByIdWithBusiness(productId: string): Promise<RepositoryProductWithBusinessRecord | null>;
    create(input: CreateProductInput): Promise<RepositoryProductRecord>;
    update(productId: string, input: Omit<UpdateProductInput, 'productId'>): Promise<RepositoryProductRecord | null>;
    delete(productId: string): Promise<RepositoryProductRecord | null>;
    countFeaturedByBusiness(businessId: string): Promise<number>;
}

const productSelect = {
    id: true,
    name: true,
    description: true,
    images: true,
    price: true,
    isFeatured: true,
    businessId: true,
    lastUpdated: true,
    createdAt: true,
} as const;

function mapProductRecord(record: any): RepositoryProductRecord {
    return {
        id: record.id,
        name: record.name,
        description: record.description,
        images: record.images,
        price: record.price,
        isFeatured: record.isFeatured,
        businessId: record.businessId,
        lastUpdated: record.lastUpdated,
        createdAt: record.createdAt,
    };
}

function mapProductWithBusinessRecord(record: any): RepositoryProductWithBusinessRecord {
    return {
        ...mapProductRecord(record),
        business: {
            id: record.business.id,
            ownerId: record.business.ownerId,
            subscriptionType: record.business.subscriptionType,
            status: record.business.status,
            managers: (record.business.managers ?? []).map((manager: any) => ({ userId: manager.userId })),
        },
    };
}

export class ProductRepository implements ProductRepositoryPort {
    private readonly prisma: ReturnType<typeof getPrismaClient>;

    constructor(prisma: ReturnType<typeof getPrismaClient>) {
        this.prisma = prisma;
    }

    async listByBusiness(businessId: string) {
        const records = await this.prisma.product.findMany({
            where: { businessId },
            orderBy: { lastUpdated: 'desc' },
            select: productSelect,
        });

        return records.map(mapProductRecord);
    }

    async findById(productId: string) {
        const record = await this.prisma.product.findUnique({
            where: { id: productId },
            select: productSelect,
        });

        return record ? mapProductRecord(record) : null;
    }

    async findByIdWithBusiness(productId: string) {
        const record = await this.prisma.product.findUnique({
            where: { id: productId },
            select: {
                ...productSelect,
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
                    },
                },
            },
        });

        return record ? mapProductWithBusinessRecord(record) : null;
    }

    async create(input: CreateProductInput) {
        const record = await this.prisma.product.create({
            data: {
                businessId: input.businessId,
                name: input.name,
                description: input.description,
                images: input.images,
                price: input.price,
                isFeatured: input.isFeatured,
            },
            select: productSelect,
        });

        return mapProductRecord(record);
    }

    async update(productId: string, input: Omit<UpdateProductInput, 'productId'>) {
        const existing = await this.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true },
        });

        if (!existing) {
            return null;
        }

        const record = await this.prisma.product.update({
            where: { id: productId },
            data: {
                name: input.name,
                description: input.description,
                images: input.images,
                price: input.price === undefined ? undefined : input.price,
                isFeatured: input.isFeatured,
            },
            select: productSelect,
        });

        return mapProductRecord(record);
    }

    async delete(productId: string) {
        const existing = await this.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true },
        });

        if (!existing) {
            return null;
        }

        const record = await this.prisma.product.delete({
            where: { id: productId },
            select: productSelect,
        });

        return mapProductRecord(record);
    }

    async countFeaturedByBusiness(businessId: string) {
        return this.prisma.product.count({
            where: {
                businessId,
                isFeatured: true,
            },
        });
    }
}