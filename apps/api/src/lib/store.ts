import {
  cloneMarketplaceSeed,
  type Business,
  type BusinessDetails,
  type BusinessListFilters,
  type BusinessSummary,
  type CreateBusinessInput,
  type CreateProductInput,
  type CreatePromotionInput,
  type CreateReviewInput,
  type MarketplaceSeedData,
  type Product,
  type Promotion,
  type Review,
} from 'types';
import { calculateAverageRating, calculateDistanceKm } from 'utils';

const defaultOrigin = { lat: 18.4706, lng: -69.8991 };
const now = () => new Date().toISOString();

declare global {
  var __encuentralotodoSeed__: MarketplaceSeedData | undefined;
}

function getSeed() {
  if (!global.__encuentralotodoSeed__) {
    global.__encuentralotodoSeed__ = cloneMarketplaceSeed();
  }

  return global.__encuentralotodoSeed__;
}

function getVisibleProducts(subscriptionType: Business['subscriptionType'], products: Product[]) {
  if (subscriptionType === 'FREE_TRIAL') {
    return products.filter((product) => product.isFeatured).slice(0, 5);
  }

  if (subscriptionType === 'PREMIUM') {
    return products.slice(0, 12);
  }

  return products;
}

function buildSummary(data: MarketplaceSeedData, business: Business): BusinessSummary {
  const products = data.products.filter((product) => product.businessId === business.id);
  const activePromotions = data.promotions.filter(
    (promotion) => promotion.businessId === business.id && new Date(promotion.validUntil) >= new Date()
  );
  const reviews = data.reviews.filter((review) => review.businessId === business.id);

  return {
    ...business,
    rating: calculateAverageRating(reviews),
    reviewCount: reviews.length,
    featuredProducts: products.filter((product) => product.isFeatured).slice(0, 5),
    activePromotions,
    distanceKm: Number(calculateDistanceKm(defaultOrigin, business.location).toFixed(1)),
  };
}

export class MarketplaceStore {
  private readonly data = getSeed();

  listBusinesses(filters: BusinessListFilters = {}) {
    return this.data.businesses
      .filter((business) => (filters.includePending ? true : business.status === 'APPROVED'))
      .filter((business) => (filters.category && filters.category !== 'ALL' ? business.category === filters.category : true))
      .filter((business) => {
        if (!filters.search) {
          return true;
        }

        const normalizedSearch = filters.search.toLowerCase();
        return [business.name, business.description, business.location.zone].some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        );
      })
      .map((business) => buildSummary(this.data, business))
      .filter((business) => (filters.promosOnly ? business.activePromotions.length > 0 : true))
      .filter((business) => (filters.maxDistanceKm ? business.distanceKm <= filters.maxDistanceKm : true))
      .sort((left, right) => right.rating - left.rating || left.distanceKm - right.distanceKm);
  }

  getBusinessById(businessId: string) {
    const business = this.data.businesses.find((candidate) => candidate.id === businessId);
    if (!business) {
      return null;
    }

    const summary = buildSummary(this.data, business);
    const reviews = this.data.reviews.filter((review) => review.businessId === business.id);
    const visibleProducts = getVisibleProducts(
      business.subscriptionType,
      this.data.products.filter((product) => product.businessId === business.id)
    );

    const details: BusinessDetails = {
      ...summary,
      products: visibleProducts,
      promotions: this.data.promotions.filter((promotion) => promotion.businessId === business.id),
      reviews: reviews.map((review) => ({
        ...review,
        user: this.data.users.find((user) => user.id === review.userId),
      })),
      owner: this.data.users.find((user) => user.id === business.ownerId),
      managersDetailed: this.data.users.filter((user) => business.managers.includes(user.id)),
    };

    return details;
  }

  listPendingBusinesses() {
    return this.listBusinesses({ includePending: true }).filter((business) => business.status === 'PENDING');
  }

  createBusiness(input: CreateBusinessInput & { ownerId: string }) {
    const business: Business = {
      id: `biz-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: input.name,
      description: input.description,
      category: input.category,
      location: input.location,
      images: input.images,
      subscriptionType: input.subscriptionType,
      ownerId: input.ownerId,
      managers: input.managers,
      status: 'PENDING',
      whatsappNumber: input.whatsappNumber,
      lastUpdated: now(),
    };

    this.data.businesses.unshift(business);
    return buildSummary(this.data, business);
  }

  approveBusiness(businessId: string) {
    const business = this.data.businesses.find((candidate) => candidate.id === businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    business.status = 'APPROVED';
    business.lastUpdated = now();
    return business;
  }

  createProduct(input: CreateProductInput) {
    const business = this.data.businesses.find((candidate) => candidate.id === input.businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    const businessProducts = this.data.products.filter((product) => product.businessId === business.id);
    const featuredCount = businessProducts.filter((product) => product.isFeatured).length;

    if (business.subscriptionType === 'FREE_TRIAL' && !input.isFeatured) {
      throw new Error('FREE_TRIAL solo permite productos destacados.');
    }

    if (business.subscriptionType === 'FREE_TRIAL' && input.isFeatured && featuredCount >= 5) {
      throw new Error('FREE_TRIAL permite un máximo de 5 productos destacados.');
    }

    const product: Product = input.type === 'configurable'
      ? {
        id: `prod-${Date.now()}`,
        businessId: input.businessId,
        name: input.name,
        description: input.description,
        images: input.images,
        type: 'configurable',
        configurationSummary: input.configurationSummary ?? 'Configurable al solicitarlo',
        isFeatured: input.isFeatured,
        lastUpdated: now(),
      }
      : {
        id: `prod-${Date.now()}`,
        businessId: input.businessId,
        name: input.name,
        description: input.description,
        images: input.images,
        type: 'simple',
        price: input.price,
        isFeatured: input.isFeatured,
        lastUpdated: now(),
      };

    this.data.products.unshift(product);
    return product;
  }

  createPromotion(input: CreatePromotionInput) {
    const promotion: Promotion = {
      id: `promo-${Date.now()}`,
      ...input,
      endDate: input.endDate,
      validUntil: input.endDate,
      createdAt: now(),
      updatedAt: now(),
      lastUpdated: now(),
    };

    this.data.promotions.unshift(promotion);
    return promotion;
  }

  createReview(input: CreateReviewInput) {
    const review: Review = {
      id: `review-${Date.now()}`,
      ...input,
      createdAt: now(),
    };

    this.data.reviews.unshift(review);
    return review;
  }

  getUser(userId: string) {
    return this.data.users.find((user) => user.id === userId) ?? null;
  }

  findUserByEmail(email: string) {
    return this.data.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  listPromotions() {
    return this.data.promotions.filter((promotion) => promotion.status !== 'DRAFT' && new Date(promotion.endDate) >= new Date());
  }
}

export const marketplaceStore = new MarketplaceStore();