import type { Lead } from 'types';

import type { RepositoryLeadRecord } from './lead.repository';

function toIsoString(value: Date) {
    return value.toISOString();
}

export function mapLead(record: RepositoryLeadRecord): Lead {
    return {
        id: record.id,
        name: record.name ?? undefined,
        businessId: record.businessId,
        businessName: record.businessName,
        productId: record.productId ?? undefined,
        productName: record.productName ?? undefined,
        promotionId: record.promotionId ?? undefined,
        promotionTitle: record.promotionTitle ?? undefined,
        source: record.source,
        status: record.status,
        phone: record.phone ?? undefined,
        updatedAt: toIsoString(record.updatedAt),
        createdAt: toIsoString(record.createdAt),
        summary: record.summary,
        notes: record.notes ?? undefined,
    };
}