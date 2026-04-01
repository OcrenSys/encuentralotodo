import type { Business, BusinessDetails, BusinessSummary, Review, SubscriptionType, UserProfile } from 'types';
import { calculateAverageRating, calculateDistanceKm } from 'utils';

import type {
    RepositoryBusinessRecord,
    RepositoryProductRecord,
    RepositoryPromotionRecord,
    RepositoryReviewRecord,
    RepositoryUserRecord,
} from './business.repository';

const defaultOrigin = { lat: 18.4706, lng: -69.8991 };

function toIsoString(value: Date) {
    return value.toISOString();
}

function mapUser(record: RepositoryUserRecord): UserProfile {
    return {
        id: record.id,
        fullName: record.fullName,
        email: record.email,
        role: record.role,
        avatarUrl: record.avatarUrl ?? undefined,
    };
}

function mapProduct(record: RepositoryProductRecord) {
    return {
        id: record.id,
        name: record.name,
        description: record.description,
        images: record.images,
        price: record.price ?? undefined,
        isFeatured: record.isFeatured,
        businessId: record.businessId,
        lastUpdated: toIsoString(record.lastUpdated),
    };
}

function mapPromotion(record: RepositoryPromotionRecord) {
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

function mapReview(record: RepositoryReviewRecord): Review {
    return {
        id: record.id,
        rating: record.rating,
        comment: record.comment,
        userId: record.userId,
        businessId: record.businessId,
        createdAt: toIsoString(record.createdAt),
    };
}

function getVisibleProducts(subscriptionType: SubscriptionType, products: ReturnType<typeof mapProduct>[]) {
    if (subscriptionType === 'FREE_TRIAL') {
        return products.filter((product) => product.isFeatured).slice(0, 5);
    }

    if (subscriptionType === 'PREMIUM') {
        return products.slice(0, 12);
    }

    return products;
}

export function mapBusiness(record: RepositoryBusinessRecord): Business {
    return {
        id: record.id,
        name: record.name,
        description: record.description,
        category: record.category,
        location: {
            lat: record.lat,
            lng: record.lng,
            zone: record.zone,
            address: record.address,
        },
        images: {
            profile: record.profileImage,
            banner: record.bannerImage,
        },
        subscriptionType: record.subscriptionType,
        ownerId: record.ownerId,
        managers: record.managers.map((manager) => manager.userId),
        status: record.status,
        whatsappNumber: record.whatsappNumber,
        lastUpdated: toIsoString(record.lastUpdated),
    };
}

export function mapBusinessSummary(record: RepositoryBusinessRecord): BusinessSummary {
    const products = record.products.map(mapProduct);
    const promotions = record.promotions.map(mapPromotion);
    const reviews = record.reviews.map(mapReview);
    const business = mapBusiness(record);
    const activePromotions = promotions.filter((promotion) => new Date(promotion.validUntil) >= new Date());

    return {
        ...business,
        rating: calculateAverageRating(reviews),
        reviewCount: reviews.length,
        featuredProducts: products.filter((product) => product.isFeatured).slice(0, 5),
        activePromotions,
        distanceKm: Number(calculateDistanceKm(defaultOrigin, business.location).toFixed(1)),
    };
}

export function mapBusinessDetails(record: RepositoryBusinessRecord): BusinessDetails {
    const summary = mapBusinessSummary(record);
    const products = record.products.map(mapProduct);
    const promotions = record.promotions.map(mapPromotion);

    return {
        ...summary,
        products: getVisibleProducts(record.subscriptionType, products),
        promotions,
        reviews: record.reviews.map((review) => ({
            ...mapReview(review),
            user: review.user ? mapUser(review.user) : undefined,
        })),
        owner: record.owner ? mapUser(record.owner) : undefined,
        managersDetailed: record.managers
            .map((manager) => manager.user)
            .filter((manager): manager is RepositoryUserRecord => Boolean(manager))
            .map(mapUser),
    };
}