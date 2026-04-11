import type {
    BusinessAssignmentRole,
    BusinessListFilters,
    BusinessStatus,
    CreateBusinessInput,
    ListManagedBusinessesInput,
    ProductType,
    UpdateBusinessInput,
    UserRole,
} from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryUserRecord {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    isActive: boolean;
}

export interface RepositoryManagerRecord {
    userId: string;
    user?: RepositoryUserRecord | null;
}

export interface RepositoryBusinessMembershipRecord {
    userId: string;
    role: BusinessAssignmentRole;
    user?: RepositoryUserRecord | null;
}

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
    memberships: RepositoryBusinessMembershipRecord[];
    products: RepositoryProductRecord[];
    promotions: RepositoryPromotionRecord[];
    reviews: RepositoryReviewRecord[];
}

export interface RepositoryBusinessAccessRecord {
    id: string;
    ownerId: string;
    managers: string[];
    memberships: RepositoryBusinessMembershipRecord[];
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
    synchronizeCanonicalMemberships(): Promise<void>;
    findBusinessById(businessId: string): Promise<RepositoryBusinessRecord | null>;
    findBusinessAccessById(businessId: string): Promise<RepositoryBusinessAccessRecord | null>;
    listPendingBusinesses(): Promise<RepositoryBusinessRecord[]>;
    createBusiness(input: CreateBusinessInput & { ownerId: string; managers: string[]; status: BusinessStatus }): Promise<RepositoryBusinessRecord>;
    updateBusiness(input: UpdateBusinessInput & { subscriptionType: RepositoryBusinessRecord['subscriptionType']; managers: string[] }): Promise<RepositoryBusinessRecord | null>;
    approveBusiness(businessId: string): Promise<RepositoryBusinessRecord | null>;
    searchUsers(input: { search: string; limit: number }): Promise<RepositoryUserRecord[]>;
    findUserById(userId: string): Promise<RepositoryUserRecord | null>;
    findUsersByIds(userIds: string[]): Promise<RepositoryUserRecord[]>;
}

const userSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    avatarUrl: true,
    isActive: true,
} as const;

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
    userRoles: {
        select: {
            userId: true,
            role: true,
            user: {
                select: userSelect,
            },
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
    const membershipState = resolveBusinessMembershipState(record);

    return {
        ...record,
        category: record.category,
        subscriptionType: record.subscriptionType,
        status: record.status,
        ownerId: membershipState.ownerId,
        owner: membershipState.owner,
        managers: membershipState.managers,
        memberships: membershipState.memberships,
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
    };
}

function mapUserRecord(record: any): RepositoryUserRecord {
    return {
        id: record.id,
        fullName: record.fullName,
        email: record.email,
        role: record.role,
        avatarUrl: record.avatarUrl,
        isActive: Boolean(record.isActive),
    };
}

function mapBusinessAccessRecord(record: any): RepositoryBusinessAccessRecord {
    const membershipState = resolveBusinessMembershipState(record);

    return {
        id: record.id,
        ownerId: membershipState.ownerId,
        subscriptionType: record.subscriptionType,
        status: record.status,
        managers: membershipState.managers.map((manager) => manager.userId),
        memberships: membershipState.memberships,
    };
}

function mapMembershipUser(record: any): RepositoryUserRecord | undefined {
    if (!record) {
        return undefined;
    }

    return mapUserRecord(record);
}

function createMembershipRecord(
    userId: string,
    role: BusinessAssignmentRole,
    user?: RepositoryUserRecord,
): RepositoryBusinessMembershipRecord {
    return {
        userId,
        role,
        user,
    };
}

function resolveBusinessMembershipState(record: any) {
    const legacyOwner = mapMembershipUser(record.owner);
    const legacyManagersById = new Map<string, RepositoryUserRecord | undefined>(
        (record.managers ?? []).map((manager: any) => [manager.userId, mapMembershipUser(manager.user)]),
    );
    const membershipByUserId = new Map<string, RepositoryBusinessMembershipRecord>();
    const missingCanonicalRoles: Array<{ businessId: string; userId: string; role: BusinessAssignmentRole }> = [];
    const conflicts: string[] = [];

    for (const membership of record.userRoles ?? []) {
        const existing = membershipByUserId.get(membership.userId);
        const user = mapMembershipUser(membership.user)
            ?? legacyManagersById.get(membership.userId)
            ?? (membership.userId === record.ownerId ? legacyOwner : undefined);

        if (existing && existing.role !== membership.role) {
            conflicts.push(`Business ${record.id} has multiple canonical roles for user ${membership.userId}.`);
            continue;
        }

        membershipByUserId.set(
            membership.userId,
            createMembershipRecord(membership.userId, membership.role, user),
        );
    }

    if (!membershipByUserId.has(record.ownerId)) {
        membershipByUserId.set(record.ownerId, createMembershipRecord(record.ownerId, 'OWNER', legacyOwner));
        missingCanonicalRoles.push({ businessId: record.id, userId: record.ownerId, role: 'OWNER' });
    } else if (membershipByUserId.get(record.ownerId)?.role !== 'OWNER') {
        conflicts.push(`Business ${record.id} legacy owner ${record.ownerId} conflicts with canonical role ${membershipByUserId.get(record.ownerId)?.role}.`);
    }

    for (const legacyManager of record.managers ?? []) {
        if (legacyManager.userId === record.ownerId) {
            continue;
        }

        const existing = membershipByUserId.get(legacyManager.userId);
        if (!existing) {
            membershipByUserId.set(
                legacyManager.userId,
                createMembershipRecord(legacyManager.userId, 'MANAGER', mapMembershipUser(legacyManager.user)),
            );
            missingCanonicalRoles.push({ businessId: record.id, userId: legacyManager.userId, role: 'MANAGER' });
            continue;
        }

        if (existing.role !== 'MANAGER') {
            conflicts.push(`Business ${record.id} legacy manager ${legacyManager.userId} conflicts with canonical role ${existing.role}.`);
        }
    }

    const memberships = Array.from(membershipByUserId.values()).sort((left, right) => {
        if (left.role !== right.role) {
            return left.role.localeCompare(right.role);
        }

        return left.userId.localeCompare(right.userId);
    });
    const owners = memberships.filter((membership) => membership.role === 'OWNER');

    if (owners.length !== 1) {
        conflicts.push(`Business ${record.id} must resolve to exactly one owner, found ${owners.length}.`);
    }

    return {
        ownerId: owners[0]?.userId ?? record.ownerId,
        owner: owners[0]?.user ?? legacyOwner,
        managers: memberships
            .filter((membership) => membership.role === 'MANAGER')
            .map((membership) => ({
                userId: membership.userId,
                user: membership.user,
            })),
        memberships,
        missingCanonicalRoles,
        conflicts,
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

        await this.synchronizeCanonicalMembershipsForRecords(records);

        return records.map(mapBusinessRecord);
    }

    async listBusinessesForManagement(filters: BusinessListFilters = {}) {
        const records = await this.prisma.business.findMany({
            where: buildBusinessWhere(filters),
            select: businessDetailSelect,
        });

        await this.synchronizeCanonicalMembershipsForRecords(records);

        return records.map(mapBusinessRecord);
    }

    async listBusinessesByUserAccess(userId: string, filters: BusinessListFilters = {}) {
        const records = await this.prisma.business.findMany({
            where: buildBusinessWhere(filters, {
                userRoles: {
                    some: {
                        userId,
                    },
                },
            }),
            select: businessDetailSelect,
        });

        await this.synchronizeCanonicalMembershipsForRecords(records);

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

        await this.synchronizeCanonicalMembershipsForRecords(records);

        return {
            items: records.map(mapBusinessRecord),
            total,
        };
    }

    async listBusinessesByUserAccessPage(userId: string, filters: ListManagedBusinessesInput) {
        const where = buildManagedBusinessWhere(filters, {
            userRoles: {
                some: {
                    userId,
                },
            },
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

        await this.synchronizeCanonicalMembershipsForRecords(records);

        return {
            items: records.map(mapBusinessRecord),
            total,
        };
    }

    async synchronizeCanonicalMemberships() {
        const records = await this.prisma.business.findMany({
            select: {
                id: true,
                name: true,
                ownerId: true,
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
                userRoles: {
                    select: {
                        userId: true,
                        role: true,
                        user: {
                            select: userSelect,
                        },
                    },
                },
            },
        });

        await this.synchronizeCanonicalMembershipsForRecords(records);
    }

    async findBusinessById(businessId: string) {
        const record = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: businessDetailSelect,
        });

        await this.synchronizeCanonicalMembershipsForRecords(record ? [record] : []);

        return record ? mapBusinessRecord(record) : null;
    }

    async findBusinessAccessById(businessId: string) {
        const record = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: {
                id: true,
                name: true,
                ownerId: true,
                owner: {
                    select: userSelect,
                },
                subscriptionType: true,
                status: true,
                managers: {
                    select: {
                        userId: true,
                        user: {
                            select: userSelect,
                        },
                    },
                },
                userRoles: {
                    select: {
                        userId: true,
                        role: true,
                        user: {
                            select: userSelect,
                        },
                    },
                },
            },
        });

        await this.synchronizeCanonicalMembershipsForRecords(record ? [record] : []);

        return record ? mapBusinessAccessRecord(record) : null;
    }

    async listPendingBusinesses() {
        const records = await this.prisma.business.findMany({
            where: {
                status: 'PENDING',
            },
            select: businessDetailSelect,
        });

        await this.synchronizeCanonicalMembershipsForRecords(records);

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
                userRoles: {
                    create: [
                        { userId: input.ownerId, role: 'OWNER' },
                        ...input.managers.map((userId) => ({ userId, role: 'MANAGER' as const })),
                    ],
                },
            },
            select: businessSummarySelect,
        });

        return mapBusinessRecord(record);
    }

    async updateBusiness(input: UpdateBusinessInput & { subscriptionType: RepositoryBusinessRecord['subscriptionType']; managers: string[] }) {
        const existing = await this.prisma.business.findUnique({
            where: { id: input.businessId },
            select: { id: true },
        });

        if (!existing) {
            return null;
        }

        const record = await this.prisma.business.update({
            where: { id: input.businessId },
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
                whatsappNumber: input.whatsappNumber,
                userRoles: {
                    deleteMany: {
                        role: 'MANAGER',
                    },
                    create: input.managers.map((userId) => ({ userId, role: 'MANAGER' as const })),
                },
            },
            select: businessDetailSelect,
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

    async searchUsers(input: { search: string; limit: number }) {
        const normalizedSearch = input.search.trim();
        const users = await this.prisma.user.findMany({
            where: normalizedSearch
                ? {
                    OR: [
                        {
                            fullName: {
                                contains: normalizedSearch,
                                mode: 'insensitive',
                            },
                        },
                        {
                            email: {
                                contains: normalizedSearch,
                                mode: 'insensitive',
                            },
                        },
                        {
                            identities: {
                                some: {
                                    OR: [
                                        {
                                            email: {
                                                contains: normalizedSearch,
                                                mode: 'insensitive',
                                            },
                                        },
                                        {
                                            externalUserId: {
                                                contains: normalizedSearch,
                                                mode: 'insensitive',
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                }
                : undefined,
            orderBy: [
                { createdAt: 'desc' },
                { fullName: 'asc' },
            ],
            take: input.limit,
            select: userSelect,
        });

        return users.map(mapUserRecord);
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

    private async synchronizeCanonicalMembershipsForRecords(records: any[]) {
        if (records.length === 0) {
            return;
        }

        const missingRoleMap = new Map<string, { businessId: string; userId: string; role: BusinessAssignmentRole }>();
        const conflicts: string[] = [];

        for (const record of records) {
            const membershipState = resolveBusinessMembershipState(record);

            membershipState.missingCanonicalRoles.forEach((role) => {
                missingRoleMap.set(`${role.businessId}:${role.userId}`, role);
            });
            conflicts.push(...membershipState.conflicts);
        }

        if (conflicts.length > 0) {
            throw new Error(`Business membership conflicts require manual review: ${conflicts.join(' | ')}`);
        }

        const missingRoles = Array.from(missingRoleMap.values());
        if (missingRoles.length === 0) {
            return;
        }

        await this.prisma.$transaction(async (tx) => {
            const existingMemberships = await tx.userBusinessRole.findMany({
                where: {
                    OR: missingRoles.map((membership) => ({
                        userId: membership.userId,
                        businessId: membership.businessId,
                    })),
                },
                select: {
                    id: true,
                    userId: true,
                    businessId: true,
                    role: true,
                    createdAt: true,
                },
                orderBy: [{ createdAt: 'asc' }],
            });

            const existingByKey = new Map<string, typeof existingMemberships>();

            for (const existingMembership of existingMemberships) {
                const key = `${existingMembership.businessId}:${existingMembership.userId}`;
                const bucket = existingByKey.get(key);

                if (bucket) {
                    bucket.push(existingMembership);
                } else {
                    existingByKey.set(key, [existingMembership]);
                }
            }

            for (const membership of missingRoles) {
                const key = `${membership.businessId}:${membership.userId}`;
                const existingRecords = existingByKey.get(key) ?? [];
                const recordToKeep = existingRecords.find((existingRecord) => existingRecord.role === membership.role)
                    ?? existingRecords[0];
                const duplicateIds = existingRecords
                    .filter((existingRecord) => existingRecord.id !== recordToKeep?.id)
                    .map((existingRecord) => existingRecord.id);

                if (duplicateIds.length > 0) {
                    await tx.userBusinessRole.deleteMany({
                        where: {
                            id: {
                                in: duplicateIds,
                            },
                        },
                    });
                }

                if (!recordToKeep) {
                    await tx.userBusinessRole.create({
                        data: membership,
                    });
                    continue;
                }

                if (recordToKeep.role !== membership.role) {
                    await tx.userBusinessRole.update({
                        where: {
                            id: recordToKeep.id,
                        },
                        data: {
                            role: membership.role,
                        },
                    });
                }
            }
        });
    }
}