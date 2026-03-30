import { z } from 'zod';

import {
    businessCategories,
    businessStatuses,
    subscriptionTypes,
    userRoles,
} from './domain';

export const userRoleSchema = z.enum(userRoles);
export const subscriptionTypeSchema = z.enum(subscriptionTypes);
export const businessStatusSchema = z.enum(businessStatuses);
export const businessCategorySchema = z.enum(businessCategories);

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
    approvedBy: z.string().min(2),
});

export const createProductInputSchema = z.object({
    businessId: z.string().min(2),
    name: z.string().min(2).max(80),
    description: z.string().min(10).max(300),
    images: z.array(z.string().url()).min(1).max(3),
    price: z.number().positive().optional(),
    isFeatured: z.boolean().default(false),
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
        })
        .nullable(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessInputSchema>;
export type ListBusinessesInput = z.infer<typeof listBusinessesInputSchema>;
export type GetBusinessByIdInput = z.infer<typeof getBusinessByIdInputSchema>;
export type ApproveBusinessInput = z.infer<typeof approveBusinessInputSchema>;
export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionInputSchema>;
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;