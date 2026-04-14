import type {
    BusinessAssignmentRole,
    CreateLeadInput,
    LeadSource,
    LeadStatus,
} from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryLeadRecord {
    id: string;
    name: string | null;
    phone: string | null;
    businessId: string;
    businessName: string;
    productId: string | null;
    productName: string | null;
    promotionId: string | null;
    promotionTitle: string | null;
    source: LeadSource;
    status: LeadStatus;
    updatedAt: Date;
    createdAt: Date;
    summary: string;
    notes: string | null;
}

export interface RepositoryLeadWithBusinessRecord extends RepositoryLeadRecord {
    business: {
        id: string;
        ownerId: string;
        managers: Array<{ userId: string }>;
        memberships: Array<{ userId: string; role: BusinessAssignmentRole }>;
    };
}

export interface LeadRepositoryPort {
    listByBusiness(businessId: string): Promise<RepositoryLeadRecord[]>;
    findByIdWithBusiness(leadId: string): Promise<RepositoryLeadWithBusinessRecord | null>;
    create(input: CreateLeadInput): Promise<RepositoryLeadRecord>;
    updateStatus(leadId: string, status: LeadStatus): Promise<RepositoryLeadRecord | null>;
    updateNotes(leadId: string, notes: string | null): Promise<RepositoryLeadRecord | null>;
}

const leadSelect = {
    id: true,
    name: true,
    phone: true,
    source: true,
    status: true,
    summary: true,
    notes: true,
    businessId: true,
    productId: true,
    promotionId: true,
    updatedAt: true,
    createdAt: true,
    business: {
        select: {
            id: true,
            name: true,
        },
    },
    product: {
        select: {
            id: true,
            name: true,
        },
    },
    promotion: {
        select: {
            id: true,
            title: true,
        },
    },
} as const;

function mapLeadRecord(record: any): RepositoryLeadRecord {
    return {
        id: record.id,
        name: record.name,
        phone: record.phone,
        businessId: record.businessId,
        businessName: record.business.name,
        productId: record.productId,
        productName: record.product?.name ?? null,
        promotionId: record.promotionId,
        promotionTitle: record.promotion?.title ?? null,
        source: record.source,
        status: record.status,
        updatedAt: record.updatedAt,
        createdAt: record.createdAt,
        summary: record.summary,
        notes: record.notes,
    };
}

function mapLeadWithBusinessRecord(record: any): RepositoryLeadWithBusinessRecord {
    return {
        ...mapLeadRecord(record),
        business: {
            id: record.business.id,
            ownerId: record.business.ownerId,
            managers: (record.business.managers ?? []).map((manager: any) => ({ userId: manager.userId })),
            memberships: (record.business.userRoles ?? []).map((membership: any) => ({
                userId: membership.userId,
                role: membership.role,
            })),
        },
    };
}

export class LeadRepository implements LeadRepositoryPort {
    private readonly prisma: ReturnType<typeof getPrismaClient>;

    constructor(prisma: ReturnType<typeof getPrismaClient>) {
        this.prisma = prisma;
    }

    async listByBusiness(businessId: string) {
        const records = await this.prisma.lead.findMany({
            where: { businessId },
            orderBy: { updatedAt: 'desc' },
            select: leadSelect,
        });

        return records.map(mapLeadRecord);
    }

    async findByIdWithBusiness(leadId: string) {
        const record = await this.prisma.lead.findUnique({
            where: { id: leadId },
            select: {
                id: true,
                name: true,
                phone: true,
                source: true,
                status: true,
                summary: true,
                notes: true,
                businessId: true,
                productId: true,
                promotionId: true,
                updatedAt: true,
                createdAt: true,
                business: {
                    select: {
                        id: true,
                        name: true,
                        ownerId: true,
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
                product: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                promotion: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        return record ? mapLeadWithBusinessRecord(record) : null;
    }

    async create(input: CreateLeadInput) {
        const record = await this.prisma.$transaction(async (transaction: ReturnType<typeof getPrismaClient>) => {
            const createdLead = await transaction.lead.create({
                data: {
                    businessId: input.businessId,
                    productId: input.productId,
                    promotionId: input.promotionId,
                    name: input.name,
                    phone: input.phone,
                    source: input.source,
                    status: input.status,
                    summary: input.summary,
                    notes: input.notes,
                },
                select: leadSelect,
            });

            await transaction.analyticsEvent.create({
                data: {
                    name: 'lead_created',
                    businessId: createdLead.businessId,
                    leadId: createdLead.id,
                    payload: {
                        leadId: createdLead.id,
                        businessId: createdLead.businessId,
                        productId: createdLead.productId,
                        promotionId: createdLead.promotionId,
                        source: createdLead.source,
                        status: createdLead.status,
                        createdAt: createdLead.createdAt.toISOString(),
                    },
                },
            });

            return createdLead;
        });

        return mapLeadRecord(record);
    }

    async updateStatus(leadId: string, status: LeadStatus) {
        const record = await this.prisma.lead.update({
            where: { id: leadId },
            data: { status },
            select: leadSelect,
        }).catch((error: any) => {
            if (error?.code === 'P2025') {
                return null;
            }

            throw error;
        });

        return record ? mapLeadRecord(record) : null;
    }

    async updateNotes(leadId: string, notes: string | null) {
        const record = await this.prisma.lead.update({
            where: { id: leadId },
            data: { notes },
            select: leadSelect,
        }).catch((error: any) => {
            if (error?.code === 'P2025') {
                return null;
            }

            throw error;
        });

        return record ? mapLeadRecord(record) : null;
    }
}