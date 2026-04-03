import type {
    BusinessListFilters,
    BusinessStatus,
    CreateBusinessInput,
    ListManagedBusinessesInput,
    UserRole,
} from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryUserRecord {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
}

export interface RepositoryManagerRecord {
    userId: string;
    user?: RepositoryUserRecord | null;
}

export interface RepositoryProductRecord {
    id: string;
    name: string;
    description: string;
    images: string[];
    price: number | null;
    isFeatured: boolean;
    businessId: string;
    lastUpdated: Date;
}

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
}

export interface RepositoryReviewRecord {
    id: string;
    rating: number;
    comment: string;
    userId: string;
    businessId: string;
    createdAt: Date;
    user?: RepositoryUserRecord | null;
}

export interface RepositoryBusinessRecord {
    id: string;
    name: string;
    description: string;
    category: 'GENERAL_STORE' | 'RESTAURANT' | 'SERVICE';
    lat: number;
    lng: number;
    zone: string;
    address: string;
    profileImage: string;
    bannerImage: string;
    subscriptionType: 'FREE_TRIAL' | 'PREMIUM' | 'PREMIUM_PLUS';
    status: 'PENDING' | 'APPROVED';
    whatsappNumber: string;
    ownerId: string;
    lastUpdated: Date;
    createdAt: Date;
    owner?: RepositoryUserRecord | null;
    managers: RepositoryManagerRecord[];
    products: RepositoryProductRecord[];
    promotions: RepositoryPromotionRecord[];
    reviews: RepositoryReviewRecord[];
}

export interface RepositoryBusinessAccessRecord {
    id: string;
    ownerId: string;
    managers: string[];
    subscriptionType: 'FREE_TRIAL' | 'PREMIUM' | 'PREMIUM_PLUS';
    status: 'PENDING' | 'APPROVED';
}

export interface RepositoryManagedBusinessesPage {
    items: RepositoryBusinessRecord[];
    total: number;
}

export interface BusinessRepositoryPort {
    listBusinesses(filters?: BusinessListFilters): Promise<RepositoryBusinessRecord[]>;
    listBusinessesForManagement(filters?: BusinessListFilters): Promise<RepositoryBusinessRecord[]>;
    listBusinessesByUserAccess(userId: string, filters?: BusinessListFilters): Promise<RepositoryBusinessRecord[]>;
    listBusinessesForManagementPage(filters: ListManagedBusinessesInput): Promise<RepositoryManagedBusinessesPage>;
    listBusinessesByUserAccessPage(userId: string, filters: ListManagedBusinessesInput): Promise<RepositoryManagedBusinessesPage>;
    findBusinessById(businessId: string): Promise<RepositoryBusinessRecord | null>;
    findBusinessAccessById(businessId: string): Promise<RepositoryBusinessAccessRecord | null>;
    listPendingBusinesses(): Promise<RepositoryBusinessRecord[]>;
    createBusiness(input: CreateBusinessInput & { ownerId: string; managers: string[]; status: BusinessStatus }): Promise<RepositoryBusinessRecord>;
    approveBusiness(businessId: string): Promise<RepositoryBusinessRecord | null>;
    findUserById(userId: string): Promise<RepositoryUserRecord | null>;
    findUsersByIds(userIds: string[]): Promise<RepositoryUserRecord[]>;
}

const userSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    avatarUrl: true,
} as const;

const productSelect = {
    id: true,
    name: true,
    description: true,
    images: true,
    price: true,
    isFeatured: true,
    businessId: true,
    lastUpdated: true,
} as const;

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
} as const;

const reviewSelect = {
    id: true,
    rating: true,
    comment: true,
    userId: true,
    businessId: true,
    createdAt: true,
} as const;

const businessSummarySelect = {
    id: true,
    name: true,
    description: true,
    category: true,
    lat: true,
    lng: true,
    zone: true,
    address: true,
    profileImage: true,
    bannerImage: true,
    subscriptionType: true,
    status: true,
    whatsappNumber: true,
    ownerId: true,
    lastUpdated: true,
    createdAt: true,
    managers: {
        select: {
            userId: true,
        },
    },
    products: {
        select: productSelect,
    },
    promotions: {
        select: promotionSelect,
    },
    reviews: {
        select: reviewSelect,
    },
} as const;

const businessDetailSelect = {
    ...businessSummarySelect,
    owner: {
        select: userSelect,
    },
    managers: {
        select: {
            userId: true,
            user: {
                select: userSelect,
            },
        },
    },
    reviews: {
        select: {
            ...reviewSelect,
            user: {
                select: userSelect,
            },
        },
    },
} as const;

function mapBusinessRecord(record: any): RepositoryBusinessRecord {
    return {
        ...record,
        category: record.category,
        subscriptionType: record.subscriptionType,
        status: record.status,
        managers: (record.managers ?? []).map((manager: any) => ({
            userId: manager.userId,
            user: manager.user
                ? {
                    id: manager.user.id,
                    fullName: manager.user.fullName,
                    email: manager.user.email,
                    role: manager.user.role,
                    avatarUrl: manager.user.avatarUrl,
                }
                : undefined,
        })),
        products: (record.products ?? []).map((product: any) => ({
            ...product,
            price: product.price,
        })),
        promotions: (record.promotions ?? []).map((promotion: any) => ({
            ...promotion,
        })),
        reviews: (record.reviews ?? []).map((review: any) => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            userId: review.userId,
            businessId: review.businessId,
            createdAt: review.createdAt,
            user: review.user
                ? {
                    id: review.user.id,
                    fullName: review.user.fullName,
                    email: review.user.email,
                    role: review.user.role,
                    avatarUrl: review.user.avatarUrl,
                }
                : undefined,
        })),
        owner: record.owner
            ? {
                id: record.owner.id,
                fullName: record.owner.fullName,
                email: record.owner.email,
                role: record.owner.role,
                avatarUrl: record.owner.avatarUrl,
            }
            : undefined,
    };
}

function mapUserRecord(record: any): RepositoryUserRecord {
    return {
        id: record.id,
        fullName: record.fullName,
        email: record.email,
        role: record.role,
        avatarUrl: record.avatarUrl,
    };
}

function mapBusinessAccessRecord(record: any): RepositoryBusinessAccessRecord {
    return {
        id: record.id,
        ownerId: record.ownerId,
        subscriptionType: record.subscriptionType,
        status: record.status,
        managers: (record.managers ?? []).map((manager: { userId: string }) => manager.userId),
    };
}

function buildBusinessWhere(filters: BusinessListFilters = {}, accessClause?: Record<string, unknown>) {
    const clauses: Record<string, unknown>[] = [];

    if (!filters.includePending) {
        clauses.push({ status: 'APPROVED' });
    }

    if (filters.category && filters.category !== 'ALL') {
        clauses.push({ category: filters.category });
    }

    if (filters.search) {
        clauses.push({
            OR: [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { zone: { contains: filters.search, mode: 'insensitive' } },
            ],
        });
    }

    if (accessClause) {
        clauses.push(accessClause);
    }

    if (clauses.length === 0) {
        return undefined;
    }

    return { AND: clauses };
}

function buildManagedBusinessWhere(filters: ListManagedBusinessesInput, accessClause?: Record<string, unknown>) {
    const clauses: Record<string, unknown>[] = [];

    if (filters.category && filters.category !== 'ALL') {
        clauses.push({ category: filters.category });
    }

    if (filters.status && filters.status !== 'ALL') {
        clauses.push({ status: filters.status });
    }

    if (filters.search) {
        clauses.push({
            OR: [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { zone: { contains: filters.search, mode: 'insensitive' } },
                { address: { contains: filters.search, mode: 'insensitive' } },
            ],
        });
    }

    if (accessClause) {
        clauses.push(accessClause);
    }

    if (clauses.length === 0) {
        return undefined;
    }

    return { AND: clauses };
}

export class BusinessRepository implements BusinessRepositoryPort {
    private readonly prisma: ReturnType<typeof getPrismaClient>;

    constructor(prisma: ReturnType<typeof getPrismaClient>) {
        this.prisma = prisma;
    }

    async listBusinesses(filters: BusinessListFilters = {}) {
        const records = await this.prisma.business.findMany({
            where: buildBusinessWhere(filters),
            select: businessSummarySelect,
        });

        return records.map(mapBusinessRecord);
    }

    async listBusinessesForManagement(filters: BusinessListFilters = {}) {
        const records = await this.prisma.business.findMany({
            where: buildBusinessWhere(filters),
            select: businessDetailSelect,
        });

        return records.map(mapBusinessRecord);
    }

    async listBusinessesByUserAccess(userId: string, filters: BusinessListFilters = {}) {
        const records = await this.prisma.business.findMany({
            where: buildBusinessWhere(filters, {
                OR: [
                    { ownerId: userId },
                    {
                        managers: {
                            some: {
                                userId,
                            },
                        },
                    },
                ],
            }),
            select: businessDetailSelect,
        });

        return records.map(mapBusinessRecord);
    }

    async listBusinessesForManagementPage(filters: ListManagedBusinessesInput) {
        const where = buildManagedBusinessWhere(filters);
        const skip = (filters.page - 1) * filters.pageSize;
        const [records, total] = await Promise.all([
            this.prisma.business.findMany({
                where,
                select: businessDetailSelect,
                orderBy: [
                    { lastUpdated: 'desc' },
                    { name: 'asc' },
                ],
                skip,
                take: filters.pageSize,
            }),
            this.prisma.business.count({ where }),
        ]);

        return {
            items: records.map(mapBusinessRecord),
            total,
        };
    }

    async listBusinessesByUserAccessPage(userId: string, filters: ListManagedBusinessesInput) {
        const where = buildManagedBusinessWhere(filters, {
            OR: [
                { ownerId: userId },
                {
                    managers: {
                        some: {
                            userId,
                        },
                    },
                },
            ],
        });
        const skip = (filters.page - 1) * filters.pageSize;
        const [records, total] = await Promise.all([
            this.prisma.business.findMany({
                where,
                select: businessDetailSelect,
                orderBy: [
                    { lastUpdated: 'desc' },
                    { name: 'asc' },
                ],
                skip,
                take: filters.pageSize,
            }),
            this.prisma.business.count({ where }),
        ]);

        return {
            items: records.map(mapBusinessRecord),
            total,
        };
    }

    async findBusinessById(businessId: string) {
        const record = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: businessDetailSelect,
        });

        return record ? mapBusinessRecord(record) : null;
    }

    async findBusinessAccessById(businessId: string) {
        const record = await this.prisma.business.findUnique({
            where: { id: businessId },
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
        });

        return record ? mapBusinessAccessRecord(record) : null;
    }

    async listPendingBusinesses() {
        const records = await this.prisma.business.findMany({
            where: {
                status: 'PENDING',
            },
            select: businessSummarySelect,
        });

        return records.map(mapBusinessRecord);
    }

    async createBusiness(input: CreateBusinessInput & { ownerId: string; managers: string[]; status: BusinessStatus }) {
        const record = await this.prisma.business.create({
            data: {
                name: input.name,
                description: input.description,
                category: input.category,
                lat: input.location.lat,
                lng: input.location.lng,
                zone: input.location.zone,
                address: input.location.address,
                profileImage: input.images.profile,
                bannerImage: input.images.banner,
                subscriptionType: input.subscriptionType,
                status: input.status,
                whatsappNumber: input.whatsappNumber,
                ownerId: input.ownerId,
                managers: {
                    create: input.managers.map((userId) => ({ userId })),
                },
            },
            select: businessSummarySelect,
        });

        return mapBusinessRecord(record);
    }

    async approveBusiness(businessId: string) {
        const existing = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: { id: true },
        });

        if (!existing) {
            return null;
        }

        const record = await this.prisma.business.update({
            where: { id: businessId },
            data: {
                status: 'APPROVED',
            },
            select: businessDetailSelect,
        });

        return mapBusinessRecord(record);
    }

    async findUserById(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: userSelect,
        });

        return user ? mapUserRecord(user) : null;
    }

    async findUsersByIds(userIds: string[]) {
        if (userIds.length === 0) {
            return [];
        }

        const users = await this.prisma.user.findMany({
            where: {
                id: {
                    in: userIds,
                },
            },
            select: userSelect,
        });

        return users.map(mapUserRecord);
    }
}