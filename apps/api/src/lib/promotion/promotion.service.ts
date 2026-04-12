import { TRPCError } from '@trpc/server';
import type {
    CreatePromotionInput,
    DeletePromotionInput,
    GetPromotionByIdInput,
    UpdatePromotionInput,
    UserProfile,
} from 'types';

import { canAccessBusiness } from '../business/business-access';
import type {
    BusinessRepositoryPort,
    RepositoryBusinessAccessRecord,
} from '../business/business.repository';
import { mapPromotion } from './promotion.mappers';
import type {
    PromotionRepositoryPort,
    RepositoryPromotionWithBusinessRecord,
} from './promotion.repository';

interface PromotionServiceDependencies {
    repository: PromotionRepositoryPort;
    businessRepository: BusinessRepositoryPort;
    currentUser: UserProfile | null;
}

export class PromotionService {
    private readonly repository: PromotionRepositoryPort;
    private readonly businessRepository: BusinessRepositoryPort;
    private readonly currentUser: UserProfile | null;

    constructor({ repository, businessRepository, currentUser }: PromotionServiceDependencies) {
        this.repository = repository;
        this.businessRepository = businessRepository;
        this.currentUser = currentUser;
    }

    async listActive() {
        const promotions = await this.repository.listActive(new Date());
        return promotions.map(mapPromotion);
    }

    async listByBusiness(businessId: string) {
        const business = await this.businessRepository.findBusinessAccessById(businessId);
        if (!business) {
            return [];
        }

        const promotions = await this.repository.listByBusiness(businessId);
        return promotions.map(mapPromotion);
    }

    async getById(input: GetPromotionByIdInput) {
        const promotion = await this.repository.findById(input.promotionId);
        return promotion ? mapPromotion(promotion) : null;
    }

    async create(input: CreatePromotionInput) {
        const business = await this.requireBusinessAccess(input.businessId);
        this.ensureBusinessCanBeManaged(business);

        const promotion = await this.repository.create(input);
        return mapPromotion(promotion);
    }

    async update(input: UpdatePromotionInput) {
        const promotion = await this.requirePromotionWithAccess(input.promotionId);
        this.ensureBusinessCanBeManaged(promotion.business);

        const updatedPromotion = await this.repository.update(input.promotionId, {
            title: input.title,
            description: input.description,
            promoPrice: input.promoPrice,
            originalPrice: input.originalPrice,
            validUntil: input.validUntil,
            image: input.image,
        });

        if (!updatedPromotion) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Promotion not found.' });
        }

        return mapPromotion(updatedPromotion);
    }

    async delete(input: DeletePromotionInput) {
        const promotion = await this.requirePromotionWithAccess(input.promotionId);
        this.ensureBusinessCanBeManaged(promotion.business);

        const deletedPromotion = await this.repository.delete(input.promotionId);
        if (!deletedPromotion) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Promotion not found.' });
        }

        return mapPromotion(deletedPromotion);
    }

    private async requireBusinessAccess(businessId: string) {
        const business = await this.businessRepository.findBusinessAccessById(businessId);
        if (!business) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        return business;
    }

    private async requirePromotionWithAccess(promotionId: string) {
        const promotion = await this.repository.findByIdWithBusiness(promotionId);
        if (!promotion) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Promotion not found.' });
        }

        return promotion;
    }

    private ensureBusinessCanBeManaged(business: Pick<RepositoryBusinessAccessRecord, 'ownerId' | 'managers'> | RepositoryPromotionWithBusinessRecord['business']) {
        if (!this.currentUser) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
        }

        if (!canAccessBusiness(this.currentUser, {
            ownerId: business.ownerId,
            managers: business.managers.map((manager) => typeof manager === 'string' ? manager : manager.userId),
            memberships: 'memberships' in business ? business.memberships : undefined,
        })) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Business access required.' });
        }
    }
}