import { TRPCError } from '@trpc/server';
import type {
    CreatePromotionInput,
    DeletePromotionInput,
    GetPromotionByIdInput,
    PromotionStatus,
    UpdatePromotionInput,
    UserProfile,
} from 'types';

import { canManageBusiness } from '../business/business-access';
import type {
    BusinessRepositoryPort,
    RepositoryBusinessAccessRecord,
} from '../business/business.repository';
import { mapPromotion } from './promotion.mappers';
import type {
    PromotionRepositoryPort,
    RepositoryPromotionWithBusinessRecord,
} from './promotion.repository';
import { normalizePromotionStatusForPersistence } from './promotion-status';

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
        this.assertValidDateRange(input.startDate, input.endDate);

        const promotion = await this.repository.create({
            ...input,
            status: this.normalizeStatus(input.status, input.endDate),
        });
        return mapPromotion(promotion);
    }

    async update(input: UpdatePromotionInput) {
        const promotion = await this.requirePromotionWithAccess(input.promotionId);
        this.ensureBusinessCanBeManaged(promotion.business);

        const nextStartDate = input.startDate ?? promotion.startDate.toISOString();
        const nextEndDate = input.endDate ?? promotion.endDate.toISOString();
        this.assertValidDateRange(nextStartDate, nextEndDate);

        const updatedPromotion = await this.repository.update(input.promotionId, {
            title: input.title,
            description: input.description,
            type: input.type,
            startDate: input.startDate,
            endDate: input.endDate,
            status: this.normalizeStatus(input.status ?? promotion.status, nextEndDate),
            promoPrice: input.promoPrice,
            originalPrice: input.originalPrice,
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

        if (!canManageBusiness(this.currentUser, {
            ownerId: business.ownerId,
            managers: business.managers.map((manager) => typeof manager === 'string' ? manager : manager.userId),
            memberships: 'memberships' in business ? business.memberships : undefined,
        })) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the owner or a platform admin can manage promotions.' });
        }
    }

    private assertValidDateRange(startDate: string, endDate: string) {
        if (new Date(startDate).getTime() >= new Date(endDate).getTime()) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Promotion start date must be before the end date.',
            });
        }
    }

    private normalizeStatus(status: PromotionStatus, endDate: string) {
        return normalizePromotionStatusForPersistence({
            requestedStatus: status,
            endDate: new Date(endDate),
        }) as PromotionStatus;
    }
}