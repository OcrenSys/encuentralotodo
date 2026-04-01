import type { Lead } from 'types';

import type { RepositoryLeadRecord } from './lead.repository';

function toIsoString(value: Date) {
    return value.toISOString();
}

export function mapLead(record: RepositoryLeadRecord): Lead {
    return {
        id: record.id,
        name: record.name,
        businessId: record.businessId,
        businessName: record.businessName,
        source: record.source,
        status: record.status,
        updatedAt: toIsoString(record.updatedAt),
        summary: record.summary,
    };
}