import type { Promotion } from 'types';

import type { RepositoryPromotionRecord } from './promotion.repository';

function toIsoString(value: Date) {
    return value.toISOString();
}

export function mapPromotion(record: RepositoryPromotionRecord): Promotion {
    return {
        id: record.id,
        title: record.title,
        description: record.description,
        promoPrice: record.promoPrice,
        originalPrice: record.originalPrice,
        validUntil: toIsoString(record.validUntil),
        businessId: record.businessId,
        image: record.image,
        lastUpdated: toIsoString(record.lastUpdated),
    };
}