import type { Review, UserProfile } from 'types';

import type { RepositoryReviewRecord, RepositoryReviewWithUserRecord } from './review.repository';

function toIsoString(value: Date) {
    return value.toISOString();
}

function mapUser(record: NonNullable<RepositoryReviewWithUserRecord['user']>): UserProfile {
    return {
        id: record.id,
        fullName: record.fullName,
        email: record.email,
        role: record.role,
        avatarUrl: record.avatarUrl ?? undefined,
    };
}

export function mapReview(record: RepositoryReviewRecord): Review {
    return {
        id: record.id,
        rating: record.rating,
        comment: record.comment,
        userId: record.userId,
        businessId: record.businessId,
        createdAt: toIsoString(record.createdAt),
    };
}

export function mapReviewWithUser(record: RepositoryReviewWithUserRecord): Review & { user: UserProfile | undefined } {
    return {
        ...mapReview(record),
        user: record.user ? mapUser(record.user) : undefined,
    };
}