import { TRPCError } from '@trpc/server';
import type {
    CreateLeadFromCallClickInput,
    CreateLeadFromContactClickInput,
    CreateLeadFromProductClickInput,
    CreateLeadFromPromotionClickInput,
    CreateLeadFromWhatsappClickInput,
    CreateLeadInput,
    GetLeadByIdInput,
    UpdateLeadNotesInput,
    UpdateLeadStatusInput,
    UserProfile,
} from 'types';

import { getBusinessMembershipRole } from '../business/business-access';
import type {
    BusinessRepositoryPort,
    RepositoryBusinessAccessRecord,
} from '../business/business.repository';
import type { ProductRepositoryPort } from '../product/product.repository';
import type { PromotionRepositoryPort } from '../promotion/promotion.repository';
import { mapLead } from './lead.mappers';
import type {
    LeadRepositoryPort,
    RepositoryLeadWithBusinessRecord,
} from './lead.repository';

interface LeadServiceDependencies {
    repository: LeadRepositoryPort;
    businessRepository: BusinessRepositoryPort;
    productRepository: Pick<ProductRepositoryPort, 'findById'>;
    promotionRepository: Pick<PromotionRepositoryPort, 'findById'>;
    currentUser: UserProfile | null;
}

function normalizeNotes(value: string | null | undefined) {
    const normalizedValue = value?.trim();
    return normalizedValue ? normalizedValue : null;
}

export class LeadService {
    private readonly repository: LeadRepositoryPort;
    private readonly businessRepository: BusinessRepositoryPort;
    private readonly productRepository: Pick<ProductRepositoryPort, 'findById'>;
    private readonly promotionRepository: Pick<PromotionRepositoryPort, 'findById'>;
    private readonly currentUser: UserProfile | null;

    constructor({ repository, businessRepository, productRepository, promotionRepository, currentUser }: LeadServiceDependencies) {
        this.repository = repository;
        this.businessRepository = businessRepository;
        this.productRepository = productRepository;
        this.promotionRepository = promotionRepository;
        this.currentUser = currentUser;
    }

    async createLead(input: CreateLeadInput) {
        const business = await this.requireBusiness(input.businessId);
        await this.assertLeadRelationsMatchBusiness(input, business.id);

        const lead = await this.repository.create(input);
        return mapLead(lead);
    }

    async createLeadFromWhatsappClick(input: CreateLeadFromWhatsappClickInput) {
        const business = await this.requireBusiness(input.businessId);

        return this.createLead({
            businessId: business.id,
            source: 'WHATSAPP_CLICK',
            status: 'NEW',
            summary: 'User clicked WhatsApp contact',
            name: input.metadata?.name,
            phone: input.metadata?.phone,
        });
    }

    async createLeadFromCallClick(input: CreateLeadFromCallClickInput) {
        const business = await this.requireBusiness(input.businessId);

        return this.createLead({
            businessId: business.id,
            source: 'CALL_CLICK',
            status: 'NEW',
            summary: 'User clicked call contact',
            name: input.metadata?.name,
            phone: input.metadata?.phone,
        });
    }

    async createLeadFromContactClick(input: CreateLeadFromContactClickInput) {
        const business = await this.requireBusiness(input.businessId);

        return this.createLead({
            businessId: business.id,
            source: 'CONTACT_CLICK',
            status: 'NEW',
            summary: 'User clicked contact action',
            name: input.metadata?.name,
            phone: input.metadata?.phone,
        });
    }

    async createLeadFromPromotionClick(input: CreateLeadFromPromotionClickInput) {
        const promotion = await this.promotionRepository.findById(input.promotionId);
        if (!promotion) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Promotion not found.' });
        }

        return this.createLead({
            businessId: promotion.businessId,
            promotionId: promotion.id,
            source: 'PROMOTION_CLICK',
            status: 'NEW',
            summary: `User clicked promotion: ${promotion.title}`,
            name: input.metadata?.name,
            phone: input.metadata?.phone,
        });
    }

    async createLeadFromProductClick(input: CreateLeadFromProductClickInput) {
        const product = await this.productRepository.findById(input.productId);
        if (!product) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found.' });
        }

        return this.createLead({
            businessId: product.businessId,
            productId: product.id,
            source: 'PRODUCT_CLICK',
            status: 'NEW',
            summary: `User clicked product: ${product.name}`,
            name: input.metadata?.name,
            phone: input.metadata?.phone,
        });
    }

    async listByBusiness(businessId: string) {
        await this.assertBusinessAccess(businessId);

        const leads = await this.repository.listByBusiness(businessId);
        return leads.map(mapLead);
    }

    async getById(input: GetLeadByIdInput) {
        const lead = await this.requireLeadWithBusiness(input.leadId);
        this.ensureBusinessCanBeManaged(lead.business);

        return mapLead(lead);
    }

    async updateLeadStatus(input: UpdateLeadStatusInput) {
        const lead = await this.requireLeadWithBusiness(input.leadId);
        this.ensureBusinessCanBeManaged(lead.business);

        const updatedLead = await this.repository.updateStatus(input.leadId, input.status);
        if (!updatedLead) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found.' });
        }

        return mapLead(updatedLead);
    }

    async updateLeadNotes(input: UpdateLeadNotesInput) {
        const lead = await this.requireLeadWithBusiness(input.leadId);
        this.ensureBusinessCanBeManaged(lead.business);

        const updatedLead = await this.repository.updateNotes(input.leadId, normalizeNotes(input.notes));
        if (!updatedLead) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found.' });
        }

        return mapLead(updatedLead);
    }

    private async requireBusiness(businessId: string) {
        const business = await this.businessRepository.findBusinessAccessById(businessId);
        if (!business) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        return business;
    }

    private async requireLeadWithBusiness(leadId: string) {
        const lead = await this.repository.findByIdWithBusiness(leadId);
        if (!lead) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found.' });
        }

        return lead;
    }

    private async assertBusinessAccess(businessId: string) {
        const business = await this.requireBusiness(businessId);
        this.ensureBusinessCanBeManaged(business);
        return business;
    }

    private async assertLeadRelationsMatchBusiness(input: CreateLeadInput, businessId: string) {
        if (input.businessId !== businessId) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Lead business context is invalid.' });
        }

        if (input.productId) {
            const product = await this.productRepository.findById(input.productId);
            if (!product) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found.' });
            }

            if (product.businessId !== businessId) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Lead product context is invalid.' });
            }
        }

        if (input.promotionId) {
            const promotion = await this.promotionRepository.findById(input.promotionId);
            if (!promotion) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Promotion not found.' });
            }

            if (promotion.businessId !== businessId) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Lead promotion context is invalid.' });
            }
        }
    }

    private ensureBusinessCanBeManaged(business: Pick<RepositoryBusinessAccessRecord, 'ownerId' | 'managers'> | RepositoryLeadWithBusinessRecord['business']) {
        if (!this.currentUser) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
        }

        const membershipRole = getBusinessMembershipRole(this.currentUser, {
            ownerId: business.ownerId,
            managers: business.managers.map((manager) => typeof manager === 'string' ? manager : manager.userId),
            memberships: 'memberships' in business ? business.memberships : undefined,
        });

        if (!membershipRole) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Only an owner or manager can manage leads for this business.' });
        }
    }
}