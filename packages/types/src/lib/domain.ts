export const userRoles = ['USER', 'ADMIN', 'SUPERADMIN', 'GLOBALADMIN'] as const;
export type UserRole = (typeof userRoles)[number];

export const subscriptionTypes = ['FREE_TRIAL', 'PREMIUM', 'PREMIUM_PLUS'] as const;
export type SubscriptionType = (typeof subscriptionTypes)[number];

export const businessStatuses = ['PENDING', 'APPROVED'] as const;
export type BusinessStatus = (typeof businessStatuses)[number];

export const businessCategories = [
    'GENERAL_STORE',
    'RESTAURANT',
    'SERVICE',
] as const;
export type BusinessCategory = (typeof businessCategories)[number];

export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
}

export interface BusinessLocation {
    lat: number;
    lng: number;
    zone: string;
    address: string;
}

export interface BusinessImages {
    profile: string;
    banner: string;
}

export interface Business {
    id: string;
    name: string;
    description: string;
    category: BusinessCategory;
    location: BusinessLocation;
    images: BusinessImages;
    subscriptionType: SubscriptionType;
    ownerId: string;
    managers: string[];
    status: BusinessStatus;
    whatsappNumber: string;
    promoBadge?: string;
    lastUpdated: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    images: string[];
    price?: number;
    isFeatured: boolean;
    businessId: string;
    lastUpdated: string;
}

export interface Promotion {
    id: string;
    title: string;
    description: string;
    promoPrice: number;
    originalPrice: number;
    validUntil: string;
    businessId: string;
    image: string;
    lastUpdated: string;
}

export interface Review {
    id: string;
    rating: number;
    comment: string;
    userId: string;
    businessId: string;
    createdAt: string;
}

export interface BusinessSummary extends Business {
    rating: number;
    reviewCount: number;
    featuredProducts: Product[];
    activePromotions: Promotion[];
    distanceKm: number;
}

export interface BusinessDetails extends BusinessSummary {
    products: Product[];
    promotions: Promotion[];
    reviews: Array<Review & { user: UserProfile | undefined }>;
    owner?: UserProfile;
    managersDetailed: UserProfile[];
}

export interface MarketplaceSeedData {
    users: UserProfile[];
    businesses: Business[];
    products: Product[];
    promotions: Promotion[];
    reviews: Review[];
}

export interface BusinessListFilters {
    category?: BusinessCategory | 'ALL';
    search?: string;
    promosOnly?: boolean;
    maxDistanceKm?: number;
    includePending?: boolean;
}

export interface AuthSession {
    provider: 'mock' | 'firebase' | 'cognito';
    user: UserProfile | null;
}