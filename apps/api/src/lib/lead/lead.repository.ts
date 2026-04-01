import type {
    CreateLeadInput,
    LeadSource,
    LeadStatus,
} from 'types';

import type { getPrismaClient } from '../prisma';

export interface RepositoryLeadRecord {
    id: string;
    name: string;
    businessId: string;
    businessName: string;
    source: LeadSource;
    status: LeadStatus;
    updatedAt: Date;
    createdAt: Date;
    summary: string;
}

export interface RepositoryLeadWithBusinessRecord extends RepositoryLeadRecord {
    business: {
        id: string;
        ownerId: string;
        managers: Array<{ userId: string }>;
    };
}

export interface LeadRepositoryPort {
    listByBusiness(businessId: string): Promise<RepositoryLeadRecord[]>;
    findById(leadId: string): Promise<RepositoryLeadRecord | null>;
    findByIdWithBusiness(leadId: string): Promise<RepositoryLeadWithBusinessRecord | null>;
    create(input: CreateLeadInput): Promise<RepositoryLeadRecord>;
}

const leadSelect = {
    id: true,
    name: true,
    source: true,
    status: true,
    summary: true,
    businessId: true,
    updatedAt: true,
    createdAt: true,
    business: {
        select: {
            id: true,
            name: true,
        },
    },
} as const;

function mapLeadRecord(record: any): RepositoryLeadRecord {
    return {
        id: record.id,
        name: record.name,
        businessId: record.businessId,
        businessName: record.business.name,
        source: record.source,
        status: record.status,
        updatedAt: record.updatedAt,
        createdAt: record.createdAt,
        summary: record.summary,
    };
}

function mapLeadWithBusinessRecord(record: any): RepositoryLeadWithBusinessRecord {
    return {
        id: record.id,
        name: record.name,
        businessId: record.businessId,
        businessName: record.business.name,
        source: record.source,
        status: record.status,
        updatedAt: record.updatedAt,
        createdAt: record.createdAt,
        summary: record.summary,
        business: {
            id: record.business.id,
            ownerId: record.business.ownerId,
            managers: (record.business.managers ?? []).map((manager: any) => ({ userId: manager.userId })),
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

    async findById(leadId: string) {
        const record = await this.prisma.lead.findUnique({
            where: { id: leadId },
            select: leadSelect,
        });

        return record ? mapLeadRecord(record) : null;
    }

    async findByIdWithBusiness(leadId: string) {
        const record = await this.prisma.lead.findUnique({
            where: { id: leadId },
            select: {
                id: true,
                name: true,
                source: true,
                status: true,
                summary: true,
                businessId: true,
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
                    },
                },
            },
        });

        return record ? mapLeadWithBusinessRecord(record) : null;
    }

    async create(input: CreateLeadInput) {
        const record = await this.prisma.lead.create({
            data: {
                businessId: input.businessId,
                name: input.name,
                source: input.source,
                summary: input.summary,
            },
            select: leadSelect,
        });

        return mapLeadRecord(record);
    }
}