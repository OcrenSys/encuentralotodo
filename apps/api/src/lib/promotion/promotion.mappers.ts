import type { Promotion } from 'types';

import type { RepositoryPromotionRecord } from './promotion.repository';
import { resolvePromotionStatus } from './promotion-status';

function toIsoString(value: Date) {
    return value.toISOString();
}

export function mapPromotion(record: RepositoryPromotionRecord): Promotion {
    const status = resolvePromotionStatus({
        endDate: record.endDate,
        storedStatus: record.status,
    });

    return {
        id: record.id,
        businessId: record.businessId,
        title: record.title,
        description: record.description,
        type: record.type,
        startDate: toIsoString(record.startDate),
        endDate: toIsoString(record.endDate),
        status,
        createdAt: toIsoString(record.createdAt),
        updatedAt: toIsoString(record.updatedAt),
        promoPrice: record.promoPrice,
        originalPrice: record.originalPrice,
        validUntil: toIsoString(record.endDate),
        image: record.image,
        lastUpdated: toIsoString(record.updatedAt),
    };
}