import { TRPCError } from '@trpc/server';
import type {
    CreateLeadInput,
    GetLeadByIdInput,
    UserProfile,
} from 'types';

import { canAccessBusiness } from '../business/business-access';
import type {
    BusinessRepositoryPort,
    RepositoryBusinessAccessRecord,
} from '../business/business.repository';
import { mapLead } from './lead.mappers';
import type {
    LeadRepositoryPort,
    RepositoryLeadWithBusinessRecord,
} from './lead.repository';

interface LeadServiceDependencies {
    repository: LeadRepositoryPort;
    businessRepository: BusinessRepositoryPort;
    currentUser: UserProfile | null;
}

export class LeadService {
    private readonly repository: LeadRepositoryPort;
    private readonly businessRepository: BusinessRepositoryPort;
    private readonly currentUser: UserProfile | null;

    constructor({ repository, businessRepository, currentUser }: LeadServiceDependencies) {
        this.repository = repository;
        this.businessRepository = businessRepository;
        this.currentUser = currentUser;
    }

    async create(input: CreateLeadInput) {
        await this.requireBusiness(input.businessId);

        const lead = await this.repository.create(input);
        return mapLead(lead);
    }

    async listByBusiness(businessId: string) {
        const business = await this.requireBusiness(businessId);
        this.ensureBusinessCanBeManaged(business);

        const leads = await this.repository.listByBusiness(businessId);
        return leads.map(mapLead);
    }

    async getById(input: GetLeadByIdInput) {
        const lead = await this.requireLeadWithBusiness(input.leadId);
        this.ensureBusinessCanBeManaged(lead.business);

        return mapLead(lead);
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

    private ensureBusinessCanBeManaged(business: Pick<RepositoryBusinessAccessRecord, 'ownerId' | 'managers'> | RepositoryLeadWithBusinessRecord['business']) {
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