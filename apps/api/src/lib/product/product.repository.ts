import type {
    CreateProductInput,
    ListManagedProductsInput,
    ProductType,
    UpdateProductInput,
} from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryProductRecord {
    id: string;
    name: string;
    description: string;
    images: string[];
    type: ProductType;
    configurationSummary: string | null;
    price: number | null;
    isFeatured: boolean;
    businessId: string;
    lastUpdated: Date;
    createdAt: Date;
}

export interface RepositoryProductWithBusinessRecord extends RepositoryProductRecord {
    business: {
        id: string;
        name: string;
        ownerId: string;
        subscriptionType: 'FREE_TRIAL' | 'PREMIUM' | 'PREMIUM_PLUS';
        status: 'PENDING' | 'APPROVED';
        managers: Array<{ userId: string }>;
    };
}

export interface RepositoryManagedProductListRecord extends RepositoryProductRecord {
    business: {
        id: string;
        name: string;
        ownerId: string;
        status: 'PENDING' | 'APPROVED';
        managers: Array<{ userId: string }>;
    };
}

export interface RepositoryManagedProductListResult {
    items: RepositoryManagedProductListRecord[];
    total: number;
}

export interface ProductRepositoryPort {
    listByBusiness(businessId: string): Promise<RepositoryProductRecord[]>;
    listManaged(input: ListManagedProductsInput, actorId: string | null, includeAllBusinesses: boolean): Promise<RepositoryManagedProductListResult>;
    listManagedForExport(input: ListManagedProductsInput, actorId: string | null, includeAllBusinesses: boolean): Promise<RepositoryManagedProductListRecord[]>;
    createMany(input: CreateProductInput[]): Promise<RepositoryProductRecord[]>;
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
    type: true,
    configurationSummary: true,
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
        type: record.type,
        configurationSummary: record.configurationSummary,
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
            name: record.business.name,
            ownerId: record.business.ownerId,
            subscriptionType: record.business.subscriptionType,
            status: record.business.status,
            managers: (record.business.managers ?? []).map((manager: any) => ({ userId: manager.userId })),
        },
    };
}

function mapManagedProductListRecord(record: any): RepositoryManagedProductListRecord {
    return {
        ...mapProductRecord(record),
        business: {
            id: record.business.id,
            name: record.business.name,
            ownerId: record.business.ownerId,
            status: record.business.status,
            managers: (record.business.managers ?? []).map((manager: any) => ({ userId: manager.userId })),
        },
    };
}

function buildManagedProductsWhere(
    input: ListManagedProductsInput,
    actorId: string | null,
    includeAllBusinesses: boolean,
) {
    const clauses: Record<string, unknown>[] = [];

    if (input.businessId) {
        clauses.push({ businessId: input.businessId });
    }

    if (input.featured === 'FEATURED') {
        clauses.push({ isFeatured: true });
    }

    if (input.featured === 'CATALOG') {
        clauses.push({ isFeatured: false });
    }

    if (input.search) {
        clauses.push({
            OR: [
                { name: { contains: input.search, mode: 'insensitive' } },
                { description: { contains: input.search, mode: 'insensitive' } },
                { business: { name: { contains: input.search, mode: 'insensitive' } } },
            ],
        });
    }

    if (!includeAllBusinesses && actorId) {
        clauses.push({
            business: {
                OR: [
                    { ownerId: actorId },
                    { managers: { some: { userId: actorId } } },
                ],
            },
        });
    }

    if (clauses.length === 0) {
        return undefined;
    }

    return { AND: clauses };
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

    async listManaged(input: ListManagedProductsInput, actorId: string | null, includeAllBusinesses: boolean) {
        const where = buildManagedProductsWhere(input, actorId, includeAllBusinesses);
        const skip = (input.page - 1) * input.pageSize;

        const [records, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                orderBy: [
                    { lastUpdated: 'desc' },
                    { name: 'asc' },
                ],
                skip,
                take: input.pageSize,
                select: {
                    ...productSelect,
                    business: {
                        select: {
                            id: true,
                            name: true,
                            ownerId: true,
                            status: true,
                            managers: {
                                select: {
                                    userId: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            items: records.map(mapManagedProductListRecord),
            total,
        };
    }

    async listManagedForExport(input: ListManagedProductsInput, actorId: string | null, includeAllBusinesses: boolean) {
        const filters = buildManagedProductsWhere(input, actorId, includeAllBusinesses);
        const where = filters
            ? { AND: [filters, { type: 'simple' }] }
            : { type: 'simple' };
        const records = await this.prisma.product.findMany({
            where,
            orderBy: [
                { lastUpdated: 'desc' },
                { name: 'asc' },
            ],
            select: {
                ...productSelect,
                business: {
                    select: {
                        id: true,
                        name: true,
                        ownerId: true,
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

        return records.map(mapManagedProductListRecord);
    }

    async createMany(input: CreateProductInput[]) {
        const records = await this.prisma.$transaction(
            input.map((item) => this.prisma.product.create({
                data: {
                    businessId: item.businessId,
                    name: item.name,
                    description: item.description,
                    images: item.images,
                    type: item.type,
                    configurationSummary: item.type === 'configurable' ? item.configurationSummary ?? null : null,
                    price: item.type === 'configurable' ? null : item.price,
                    isFeatured: item.isFeatured,
                },
                select: productSelect,
            })),
        );

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
                        name: true,
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
                type: input.type,
                configurationSummary: input.type === 'configurable' ? input.configurationSummary ?? null : null,
                price: input.type === 'configurable' ? null : input.price,
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
                type: input.type,
                configurationSummary: input.configurationSummary === undefined ? undefined : input.configurationSummary,
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