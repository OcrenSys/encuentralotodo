export const userRoles = ['UNASSIGNED', 'USER', 'NO_ACCESS', 'ADMIN', 'SUPERADMIN', 'GLOBALADMIN'] as const;
export type UserRole = (typeof userRoles)[number];

export const baseUserRoles = ['USER', 'NO_ACCESS'] as const;
export type BaseUserRole = (typeof baseUserRoles)[number];

export const businessAssignmentRoles = ['OWNER', 'MANAGER'] as const;
export type BusinessAssignmentRole = (typeof businessAssignmentRoles)[number];

export const auditActions = [
    'USER_PROFILE_UPDATED',
    'USER_BASE_ROLE_UPDATED',
    'USER_PLATFORM_ROLE_UPDATED',
    'USER_STATUS_UPDATED',
    'USER_BUSINESS_ROLE_ASSIGNED',
    'USER_BUSINESS_ROLE_REMOVED',
    'BUSINESS_OWNERSHIP_TRANSFERRED',
] as const;
export type AuditAction = (typeof auditActions)[number];

export const subscriptionTypes = ['FREE_TRIAL', 'PREMIUM', 'PREMIUM_PLUS'] as const;
export type SubscriptionType = (typeof subscriptionTypes)[number];

export const businessStatuses = ['PENDING', 'APPROVED'] as const;
export type BusinessStatus = (typeof businessStatuses)[number];

export const leadSources = ['WhatsApp', 'Promo', 'Perfil', 'Formulario'] as const;
export type LeadSource = (typeof leadSources)[number];

export const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED'] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const analyticsPeriods = ['7D', '30D', 'ALL'] as const;
export type AnalyticsPeriod = (typeof analyticsPeriods)[number];

export const leadVolumeBuckets = ['NONE', 'LOW', 'MEDIUM', 'HIGH'] as const;
export type LeadVolumeBucket = (typeof leadVolumeBuckets)[number];

export const promotionUsageLevels = ['NONE', 'LIGHT', 'ACTIVE'] as const;
export type PromotionUsageLevel = (typeof promotionUsageLevels)[number];

export const reviewStrengthLevels = ['NONE', 'LIMITED', 'STRONG'] as const;
export type ReviewStrengthLevel = (typeof reviewStrengthLevels)[number];

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
    phone?: string;
    avatarUrl?: string;
    isActive?: boolean;
    lastAccessAt?: string;
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

export type ProductType = 'simple' | 'configurable';

type ProductBase = {
    id: string;
    name: string;
    description: string;
    images: string[];
    isFeatured: boolean;
    businessId: string;
    lastUpdated: string;
};

export type Product =
    | (ProductBase & {
        type?: 'simple';
        price?: number;
        configurationSummary?: undefined;
    })
    | (ProductBase & {
        type: 'configurable';
        price?: undefined;
        configurationSummary: string;
    });

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

export interface Lead {
    id: string;
    name: string;
    businessId: string;
    businessName: string;
    source: LeadSource;
    status: LeadStatus;
    updatedAt: string;
    summary: string;
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
    leads: Lead[];
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

export interface PlatformUserIdentity {
    provider: 'mock' | 'firebase' | 'cognito';
    externalUserId: string;
    email?: string;
    emailVerified: boolean;
}

export interface PlatformUser {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
    phone?: string;
    isActive: boolean;
    lastAccessAt?: string;
    createdAt: string;
    updatedAt: string;
    identities: PlatformUserIdentity[];
}

export interface PlatformUserSearchResult {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
    isActive: boolean;
}

export interface UserBusinessAssignment {
    id: string;
    userId: string;
    businessId: string;
    role: BusinessAssignmentRole;
    createdAt: string;
    updatedAt: string;
    businessName?: string;
    businessStatus?: BusinessStatus;
    user?: UserProfile;
}

export interface AuditLogEntry {
    id: string;
    actorUserId: string;
    targetUserId?: string;
    businessId?: string;
    action: AuditAction;
    metadata?: Record<string, unknown>;
    createdAt: string;
    actor?: UserProfile;
    targetUser?: UserProfile;
}

export interface SelfProfile {
    user: PlatformUser;
    authProviders: PlatformUserIdentity[];
    businessAssignments: UserBusinessAssignment[];
    auditLogs: AuditLogEntry[];
    verificationState: {
        hasVerifiedIdentity: boolean;
    };
}

export interface AdminUserDetail {
    user: PlatformUser;
    authProviders: PlatformUserIdentity[];
    businessAssignments: UserBusinessAssignment[];
    availableBusinesses: Array<{
        id: string;
        name: string;
        status: BusinessStatus;
        ownerId: string;
    }>;
    auditLogs: AuditLogEntry[];
    verificationState: {
        hasVerifiedIdentity: boolean;
    };
}

export interface ManagementListResult<TItem> {
    items: TItem[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export type ManagedProductListItem = Product & {
    businessName: string;
    businessStatus: BusinessStatus;
};

export interface ManagedProductListFilters {
    page?: number;
    pageSize?: number;
    search?: string;
    businessId?: string;
    featured?: 'ALL' | 'FEATURED' | 'CATALOG';
}

export interface ManagedBusinessListFilters {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: BusinessCategory | 'ALL';
    status?: BusinessStatus | 'ALL';
}

export interface PlatformUsersListFilters {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: UserRole | 'ALL';
    status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

export interface AnalyticsTrendPoint {
    date: string;
    count: number;
}

export interface AnalyticsRecentLead {
    id: string;
    name: string;
    businessId: string;
    businessName: string;
    source: LeadSource;
    status: LeadStatus;
    summary: string;
    createdAt: string;
}

export interface AnalyticsRecentPromotion {
    id: string;
    title: string;
    businessId: string;
    businessName: string;
    validUntil: string;
    createdAt: string;
}

export interface AnalyticsTopPerformer {
    id: string;
    name: string;
    leadCount: number;
}

export interface BusinessAnalyticsOverviewMetrics {
    totalLeads: number;
    leadsLast7Days: number;
    leadsLast30Days: number;
    totalProducts: number;
    totalPromotions: number;
    totalReviews: number;
    averageRating: number | null;
}

export interface BusinessMonetizationSignals {
    engagementScore: number;
    leadVolumeBucket: LeadVolumeBucket;
    isHighActivityBusiness: boolean;
    promotionUsageLevel: PromotionUsageLevel;
    reviewStrength: ReviewStrengthLevel;
    upsellCandidateReasons: string[];
}

export interface BusinessAnalyticsOverview {
    businessId: string;
    businessName: string;
    period: AnalyticsPeriod;
    generatedAt: string;
    overview: BusinessAnalyticsOverviewMetrics;
    recentLeads: AnalyticsRecentLead[];
    recentPromotions: AnalyticsRecentPromotion[];
    leadTrend: AnalyticsTrendPoint[];
    topProducts: AnalyticsTopPerformer[];
    topPromotions: AnalyticsTopPerformer[];
    monetization: BusinessMonetizationSignals;
}

export interface PlatformAnalyticsSummary {
    totalApprovedBusinesses: number;
    pendingBusinesses: number;
    totalProducts: number;
    totalActivePromotions: number;
    totalLeads: number;
    totalReviews: number;
    averagePlatformRating: number | null;
    recentBusinessSignups: number;
}

export interface PlatformActivityLeaderboardEntry {
    businessId: string;
    businessName: string;
    leadCount: number;
    reviewCount: number;
    productCount: number;
    activePromotionCount: number;
    averageRating: number | null;
    engagementScore: number;
    isHighActivityBusiness: boolean;
}

export interface PlatformBusinessEngagementIndicator {
    businessId: string;
    businessName: string;
    status: BusinessStatus;
    subscriptionType: SubscriptionType;
    leadCountLast30Days: number;
    productCount: number;
    activePromotionCount: number;
    reviewCount: number;
    averageRating: number | null;
    engagementScore: number;
    indicators: string[];
}

export interface PlatformMonetizationCandidate {
    businessId: string;
    businessName: string;
    engagementScore: number;
    leadVolumeBucket: LeadVolumeBucket;
    promotionUsageLevel: PromotionUsageLevel;
    reviewStrength: ReviewStrengthLevel;
    reasons: string[];
}

export interface PlatformAnalyticsOverview {
    period: AnalyticsPeriod;
    generatedAt: string;
    summary: PlatformAnalyticsSummary;
    recentLeadVolume: AnalyticsTrendPoint[];
    businessActivityLeaderboard: PlatformActivityLeaderboardEntry[];
    businessEngagementIndicators: PlatformBusinessEngagementIndicator[];
    monetizationCandidates: PlatformMonetizationCandidate[];
}