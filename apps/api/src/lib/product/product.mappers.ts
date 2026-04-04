import type { Product } from 'types';

import type { RepositoryProductRecord } from './product.repository';

export function mapProduct(record: RepositoryProductRecord): Product {
    if (record.type === 'configurable' && record.configurationSummary) {
        return {
            id: record.id,
            name: record.name,
            description: record.description,
            images: record.images,
            type: 'configurable',
            configurationSummary: record.configurationSummary,
            isFeatured: record.isFeatured,
            businessId: record.businessId,
            lastUpdated: record.lastUpdated.toISOString(),
        };
    }

    return {
        id: record.id,
        name: record.name,
        description: record.description,
        images: record.images,
        type: 'simple',
        price: record.price ?? undefined,
        isFeatured: record.isFeatured,
        businessId: record.businessId,
        lastUpdated: record.lastUpdated.toISOString(),
    };
}