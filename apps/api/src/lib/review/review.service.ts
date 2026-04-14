import { TRPCError } from '@trpc/server';
import type {
    CreateReviewInput,
    UserProfile,
} from 'types';

import type { BusinessRepositoryPort } from '../business/business.repository';
import { mapReview, mapReviewWithUser } from './review.mappers';
import type { ReviewRepositoryPort } from './review.repository';

interface ReviewServiceDependencies {
    repository: ReviewRepositoryPort;
    businessRepository: BusinessRepositoryPort;
    currentUser: UserProfile | null;
}

export class ReviewService {
    private readonly repository: ReviewRepositoryPort;
    private readonly businessRepository: BusinessRepositoryPort;
    private readonly currentUser: UserProfile | null;

    constructor({ repository, businessRepository, currentUser }: ReviewServiceDependencies) {
        this.repository = repository;
        this.businessRepository = businessRepository;
        this.currentUser = currentUser;
    }

    async listByBusiness(businessId: string) {
        const business = await this.businessRepository.findBusinessById(businessId);
        if (!business) {
            return [];
        }

        const reviews = await this.repository.listByBusiness(businessId);
        return reviews.map(mapReviewWithUser);
    }

    async create(input: CreateReviewInput) {
        this.ensureAuthenticated();
        this.ensureValidRating(input.rating);

        const business = await this.businessRepository.findBusinessAccessById(input.businessId);
        if (!business) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        const review = await this.repository.create({
            businessId: input.businessId,
            rating: input.rating,
            comment: input.comment,
            userId: this.currentUser!.id,
        });

        return mapReview(review);
    }

    private ensureAuthenticated() {
        if (!this.currentUser) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
        }
    }

    private ensureValidRating(rating: number) {
        if (rating < 1 || rating > 5) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Rating must be between 1 and 5.' });
        }
    }
}