import { z } from 'zod';

import {
    analyticsPeriods,
    businessCategories,
    businessStatuses,
    leadSources,
    leadStatuses,
    leadVolumeBuckets,
    promotionUsageLevels,
    reviewStrengthLevels,
    subscriptionTypes,
    userRoles,
} from './domain';

export const userRoleSchema = z.enum(userRoles);
export const subscriptionTypeSchema = z.enum(subscriptionTypes);
export const businessStatusSchema = z.enum(businessStatuses);
export const businessCategorySchema = z.enum(businessCategories);
export const leadSourceSchema = z.enum(leadSources);
export const leadStatusSchema = z.enum(leadStatuses);
export const analyticsPeriodSchema = z.enum(analyticsPeriods);
export const leadVolumeBucketSchema = z.enum(leadVolumeBuckets);
export const promotionUsageLevelSchema = z.enum(promotionUsageLevels);
export const reviewStrengthLevelSchema = z.enum(reviewStrengthLevels);

export const businessLocationSchema = z.object({
    lat: z.number(),
    lng: z.number(),
    zone: z.string().min(2),
    address: z.string().min(5),
});

export const businessImagesSchema = z.object({
    profile: z.string().url(),
    banner: z.string().url(),
});

export const createBusinessInputSchema = z.object({
    name: z.string().min(2).max(80),
    description: z.string().min(20).max(600),
    category: businessCategorySchema,
    location: businessLocationSchema,
    images: businessImagesSchema,
    subscriptionType: subscriptionTypeSchema,
    ownerId: z.string().min(2),
    managers: z.array(z.string()).default([]),
    whatsappNumber: z.string().min(10).max(20),
});

export const listBusinessesInputSchema = z.object({
    category: businessCategorySchema.or(z.literal('ALL')).optional(),
    search: z.string().trim().optional(),
    promosOnly: z.boolean().optional(),
    maxDistanceKm: z.number().positive().max(50).optional(),
    includePending: z.boolean().optional(),
});

export const getBusinessByIdInputSchema = z.object({
    businessId: z.string().min(2),
});

export const approveBusinessInputSchema = z.object({
    businessId: z.string().min(2),
});

export const getBusinessAnalyticsInputSchema = z.object({
    businessId: z.string().min(2),
    period: analyticsPeriodSchema.optional(),
});

export const getPlatformAnalyticsInputSchema = z.object({
    period: analyticsPeriodSchema.optional(),
});

export const createProductInputSchema = z.object({
    businessId: z.string().min(2),
    name: z.string().min(2).max(80),
    description: z.string().min(10).max(300),
    images: z.array(z.string().url()).min(1).max(3),
    price: z.number().positive().optional(),
    isFeatured: z.boolean().default(false),
});

export const getProductByIdInputSchema = z.object({
    productId: z.string().min(2),
});

export const updateProductInputSchema = z.object({
    productId: z.string().min(2),
    name: z.string().min(2).max(80).optional(),
    description: z.string().min(10).max(300).optional(),
    images: z.array(z.string().url()).min(1).max(3).optional(),
    price: z.number().positive().nullable().optional(),
    isFeatured: z.boolean().optional(),
});

export const deleteProductInputSchema = z.object({
    productId: z.string().min(2),
});

export const createPromotionInputSchema = z.object({
    businessId: z.string().min(2),
    title: z.string().min(2).max(80),
    description: z.string().min(10).max(240),
    promoPrice: z.number().positive(),
    originalPrice: z.number().positive(),
    validUntil: z.string().datetime(),
    image: z.string().url(),
});

export const getPromotionByIdInputSchema = z.object({
    promotionId: z.string().min(2),
});

export const updatePromotionInputSchema = z.object({
    promotionId: z.string().min(2),
    title: z.string().min(2).max(80).optional(),
    description: z.string().min(10).max(240).optional(),
    promoPrice: z.number().positive().optional(),
    originalPrice: z.number().positive().optional(),
    validUntil: z.string().datetime().optional(),
    image: z.string().url().optional(),
});

export const deletePromotionInputSchema = z.object({
    promotionId: z.string().min(2),
});

export const createLeadInputSchema = z.object({
    businessId: z.string().min(2),
    name: z.string().min(2).max(120),
    source: leadSourceSchema,
    summary: z.string().min(8).max(300),
});

export const getLeadByIdInputSchema = z.object({
    leadId: z.string().min(2),
});

export const createReviewInputSchema = z.object({
    businessId: z.string().min(2),
    userId: z.string().min(2),
    rating: z.number().min(1).max(5),
    comment: z.string().min(8).max(300),
});

export const signInInputSchema = z.object({
    email: z.string().email(),
    fullName: z.string().min(2).optional(),
});

export const authSessionSchema = z.object({
    provider: z.enum(['mock', 'firebase', 'cognito']),
    user: z
        .object({
            id: z.string(),
            fullName: z.string(),
            email: z.string().email(),
            role: userRoleSchema,
            avatarUrl: z.string().url().optional(),
            isActive: z.boolean().default(true),
        })
        .nullable(),
});

export const updatePlatformUserRoleInputSchema = z.object({
    userId: z.string().min(2),
    role: userRoleSchema,
});

export const setPlatformUserActiveInputSchema = z.object({
    userId: z.string().min(2),
    isActive: z.boolean(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessInputSchema>;
export type ListBusinessesInput = z.infer<typeof listBusinessesInputSchema>;
export type GetBusinessByIdInput = z.infer<typeof getBusinessByIdInputSchema>;
export type ApproveBusinessInput = z.infer<typeof approveBusinessInputSchema>;
export type GetBusinessAnalyticsInput = z.infer<typeof getBusinessAnalyticsInputSchema>;
export type GetPlatformAnalyticsInput = z.infer<typeof getPlatformAnalyticsInputSchema>;
export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type GetProductByIdInput = z.infer<typeof getProductByIdInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductInputSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionInputSchema>;
export type GetPromotionByIdInput = z.infer<typeof getPromotionByIdInputSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionInputSchema>;
export type DeletePromotionInput = z.infer<typeof deletePromotionInputSchema>;
export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;
export type GetLeadByIdInput = z.infer<typeof getLeadByIdInputSchema>;
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;
export type UpdatePlatformUserRoleInput = z.infer<typeof updatePlatformUserRoleInputSchema>;
export type SetPlatformUserActiveInput = z.infer<typeof setPlatformUserActiveInputSchema>;