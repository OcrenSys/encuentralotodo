import { z } from 'zod';

import {
    auditActions,
    analyticsPeriods,
    baseUserRoles,
    businessAssignmentRoles,
    businessCategories,
    businessStatuses,
    leadSources,
    leadStatuses,
    leadVolumeBuckets,
    promotionStatuses,
    promotionTypes,
    promotionUsageLevels,
    reviewStrengthLevels,
    subscriptionTypes,
    userRoles,
} from './domain';

export const userRoleSchema = z.enum(userRoles);
export const baseUserRoleSchema = z.enum(baseUserRoles);
export const businessAssignmentRoleSchema = z.enum(businessAssignmentRoles);
export const auditActionSchema = z.enum(auditActions);
export const subscriptionTypeSchema = z.enum(subscriptionTypes);
export const businessStatusSchema = z.enum(businessStatuses);
export const businessCategorySchema = z.enum(businessCategories);
export const leadSourceSchema = z.enum(leadSources);
export const leadStatusSchema = z.enum(leadStatuses);
export const analyticsPeriodSchema = z.enum(analyticsPeriods);
export const leadVolumeBucketSchema = z.enum(leadVolumeBuckets);
export const promotionTypeSchema = z.enum(promotionTypes);
export const promotionStatusSchema = z.enum(promotionStatuses);
export const promotionUsageLevelSchema = z.enum(promotionUsageLevels);
export const reviewStrengthLevelSchema = z.enum(reviewStrengthLevels);

const managementPaginationInputSchema = z.object({
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(50).optional().default(10),
    search: z.string().trim().max(80).optional().default(''),
});

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

const businessCreateBaseSchema = z.object({
    name: z.string().min(2).max(80),
    description: z.string().min(20).max(600),
    category: businessCategorySchema,
    location: businessLocationSchema,
    images: businessImagesSchema,
    subscriptionType: subscriptionTypeSchema,
    managers: z.array(z.string()).default([]),
    whatsappNumber: z.string().min(10).max(20),
});

export const createBusinessInputSchema = businessCreateBaseSchema;

export const createBusinessForOwnerInputSchema = businessCreateBaseSchema.extend({
    ownerId: z.string().min(2),
});

export const updateBusinessInputSchema = z.object({
    businessId: z.string().min(2),
    name: z.string().min(2).max(80),
    description: z.string().min(20).max(600),
    category: businessCategorySchema,
    location: businessLocationSchema,
    images: businessImagesSchema,
    subscriptionType: subscriptionTypeSchema.optional(),
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

export const productTypeSchema = z.enum(['simple', 'configurable']);

const configurationSummarySchema = z.string().trim().min(10).max(160);

export const createProductInputSchema = z.object({
    businessId: z.string().min(2),
    name: z.string().min(2).max(80),
    description: z.string().min(10).max(300),
    images: z.array(z.string().url()).min(1).max(3),
    type: productTypeSchema.default('simple'),
    configurationSummary: configurationSummarySchema.optional(),
    price: z.number().positive().optional(),
    isFeatured: z.boolean().default(false),
}).superRefine((value, ctx) => {
    if (value.type === 'configurable') {
        if (value.price !== undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Los productos configurables no usan un precio fijo todavía.',
                path: ['price'],
            });
        }

        if (!value.configurationSummary) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Agrega un resumen breve para el producto configurable.',
                path: ['configurationSummary'],
            });
        }
    }
});

export const getProductByIdInputSchema = z.object({
    productId: z.string().min(2),
});

export const updateProductInputSchema = z.object({
    productId: z.string().min(2),
    name: z.string().min(2).max(80).optional(),
    description: z.string().min(10).max(300).optional(),
    images: z.array(z.string().url()).min(1).max(3).optional(),
    type: productTypeSchema.optional(),
    configurationSummary: configurationSummarySchema.nullable().optional(),
    price: z.number().positive().nullable().optional(),
    isFeatured: z.boolean().optional(),
}).superRefine((value, ctx) => {
    if (value.type === 'configurable' && value.price !== undefined && value.price !== null) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Los productos configurables no usan un precio fijo todavía.',
            path: ['price'],
        });
    }
});

export const deleteProductInputSchema = z.object({
    productId: z.string().min(2),
});

export const listManagedProductsInputSchema = managementPaginationInputSchema.extend({
    businessId: z.string().min(2).optional(),
    featured: z.enum(['ALL', 'FEATURED', 'CATALOG']).optional().default('ALL'),
});

export const importManagedProductDraftSchema = z.object({
    name: z.string().min(2).max(80),
    description: z.string().min(10).max(300),
    images: z.array(z.string().url()).max(3).default([]),
    type: z.literal('simple').default('simple'),
    price: z.number().positive(),
    isFeatured: z.boolean(),
});

export const importManagedProductRowInputSchema = z.object({
    rowNumber: z.number().int().min(2),
    product: importManagedProductDraftSchema,
});

export const importManagedProductsInputSchema = z.object({
    businessId: z.string().min(2),
    items: z.array(importManagedProductRowInputSchema).min(1).max(200),
});

export const createPromotionInputSchema = z.object({
    businessId: z.string().min(2),
    title: z.string().min(2).max(80),
    description: z.string().min(10).max(240),
    type: promotionTypeSchema,
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    status: promotionStatusSchema,
    promoPrice: z.number().nonnegative(),
    originalPrice: z.number().nonnegative(),
    image: z.string().url(),
}).superRefine((values, ctx) => {
    if (new Date(values.startDate).getTime() >= new Date(values.endDate).getTime()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La fecha de inicio debe ser anterior a la fecha de fin.',
            path: ['endDate'],
        });
    }

    if (values.originalPrice < values.promoPrice) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'El precio original debe ser mayor o igual al precio promocional.',
            path: ['originalPrice'],
        });
    }
});

export const getPromotionByIdInputSchema = z.object({
    promotionId: z.string().min(2),
});

export const updatePromotionInputSchema = z.object({
    promotionId: z.string().min(2),
    title: z.string().min(2).max(80).optional(),
    description: z.string().min(10).max(240).optional(),
    type: promotionTypeSchema.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: promotionStatusSchema.optional(),
    promoPrice: z.number().nonnegative().optional(),
    originalPrice: z.number().nonnegative().optional(),
    image: z.string().url().optional(),
}).superRefine((values, ctx) => {
    if (values.startDate && values.endDate && new Date(values.startDate).getTime() >= new Date(values.endDate).getTime()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La fecha de inicio debe ser anterior a la fecha de fin.',
            path: ['endDate'],
        });
    }

    if (typeof values.promoPrice === 'number' && typeof values.originalPrice === 'number' && values.originalPrice < values.promoPrice) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'El precio original debe ser mayor o igual al precio promocional.',
            path: ['originalPrice'],
        });
    }
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

export const getUserByIdInputSchema = z.object({
    userId: z.string().min(2),
});

export const selfProfileUpdateInputSchema = z.object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(20).optional().or(z.literal('')),
});

export const adminUserProfileUpdateInputSchema = z.object({
    userId: z.string().min(2),
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(20).optional().or(z.literal('')),
});

export const updateBaseUserRoleInputSchema = z.object({
    userId: z.string().min(2),
    role: baseUserRoleSchema,
});

export const assignUserBusinessRoleInputSchema = z.object({
    userId: z.string().min(2),
    businessId: z.string().min(2),
    role: businessAssignmentRoleSchema,
});

export const removeUserBusinessRoleInputSchema = z.object({
    userId: z.string().min(2),
    businessId: z.string().min(2),
    role: businessAssignmentRoleSchema,
});

export const transferBusinessOwnershipInputSchema = z.object({
    businessId: z.string().min(2),
    fromUserId: z.string().min(2),
    toUserId: z.string().min(2),
    reason: z.string().trim().max(240).optional(),
});

export const removeOwnBusinessRoleInputSchema = z.object({
    businessId: z.string().min(2),
});

export const listManagedBusinessesInputSchema = managementPaginationInputSchema.extend({
    category: businessCategorySchema.or(z.literal('ALL')).optional().default('ALL'),
    status: businessStatusSchema.or(z.literal('ALL')).optional().default('ALL'),
});

export const searchBusinessUsersInputSchema = z.object({
    businessId: z.string().min(2),
    search: z.string().trim().max(80).optional().default(''),
    limit: z.number().int().min(1).max(10).optional().default(10),
});

export const listPlatformUsersInputSchema = managementPaginationInputSchema.extend({
    role: userRoleSchema.or(z.literal('ALL')).optional().default('ALL'),
    status: z.enum(['ALL', 'ACTIVE', 'INACTIVE']).optional().default('ALL'),
});

export const searchPlatformUsersInputSchema = z.object({
    search: z.string().trim().max(80).optional().default(''),
    limit: z.number().int().min(1).max(10).optional().default(10),
});

export type CreateBusinessInput = z.infer<typeof createBusinessInputSchema>;
export type CreateBusinessForOwnerInput = z.infer<typeof createBusinessForOwnerInputSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessInputSchema>;
export type ListBusinessesInput = z.infer<typeof listBusinessesInputSchema>;
export type GetBusinessByIdInput = z.infer<typeof getBusinessByIdInputSchema>;
export type ApproveBusinessInput = z.infer<typeof approveBusinessInputSchema>;
export type GetBusinessAnalyticsInput = z.infer<typeof getBusinessAnalyticsInputSchema>;
export type GetPlatformAnalyticsInput = z.infer<typeof getPlatformAnalyticsInputSchema>;
export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type GetProductByIdInput = z.infer<typeof getProductByIdInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductInputSchema>;
export type ListManagedProductsInput = z.infer<typeof listManagedProductsInputSchema>;
export type ImportManagedProductDraft = z.infer<typeof importManagedProductDraftSchema>;
export type ImportManagedProductRowInput = z.infer<typeof importManagedProductRowInputSchema>;
export type ImportManagedProductsInput = z.infer<typeof importManagedProductsInputSchema>;
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
export type GetUserByIdInput = z.infer<typeof getUserByIdInputSchema>;
export type SelfProfileUpdateInput = z.infer<typeof selfProfileUpdateInputSchema>;
export type AdminUserProfileUpdateInput = z.infer<typeof adminUserProfileUpdateInputSchema>;
export type UpdateBaseUserRoleInput = z.infer<typeof updateBaseUserRoleInputSchema>;
export type AssignUserBusinessRoleInput = z.infer<typeof assignUserBusinessRoleInputSchema>;
export type RemoveUserBusinessRoleInput = z.infer<typeof removeUserBusinessRoleInputSchema>;
export type TransferBusinessOwnershipInput = z.infer<typeof transferBusinessOwnershipInputSchema>;
export type RemoveOwnBusinessRoleInput = z.infer<typeof removeOwnBusinessRoleInputSchema>;
export type ListManagedBusinessesInput = z.infer<typeof listManagedBusinessesInputSchema>;
export type SearchBusinessUsersInput = z.infer<typeof searchBusinessUsersInputSchema>;
export type ListPlatformUsersInput = z.infer<typeof listPlatformUsersInputSchema>;
export type SearchPlatformUsersInput = z.infer<typeof searchPlatformUsersInputSchema>;