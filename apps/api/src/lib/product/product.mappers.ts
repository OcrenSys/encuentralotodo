import type { Product } from 'types';

import type { RepositoryProductRecord } from './product.repository';

export function mapProduct(record: RepositoryProductRecord): Product {
    return {
        id: record.id,
        name: record.name,
        description: record.description,
        images: record.images,
        price: record.price ?? undefined,
        isFeatured: record.isFeatured,
        businessId: record.businessId,
        lastUpdated: record.lastUpdated.toISOString(),
    };
}