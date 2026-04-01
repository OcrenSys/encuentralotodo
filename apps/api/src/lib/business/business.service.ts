import { TRPCError } from '@trpc/server';
import type {
    ApproveBusinessInput,
    BusinessListFilters,
    CreateBusinessInput,
    UserProfile,
} from 'types';

import type { EmailService } from '../email';
import { isAdminUser } from './business-access';
import { mapBusiness, mapBusinessDetails, mapBusinessSummary } from './business.mappers';
import type { BusinessRepositoryPort } from './business.repository';

interface BusinessServiceDependencies {
    repository: BusinessRepositoryPort;
    emailService: EmailService;
    currentUser: UserProfile | null;
}

function sortBusinessSummaries(left: ReturnType<typeof mapBusinessSummary>, right: ReturnType<typeof mapBusinessSummary>) {
    return right.rating - left.rating || left.distanceKm - right.distanceKm;
}

export class BusinessService {
    private readonly repository: BusinessRepositoryPort;
    private readonly emailService: EmailService;
    private readonly currentUser: UserProfile | null;

    constructor({ repository, emailService, currentUser }: BusinessServiceDependencies) {
        this.repository = repository;
        this.emailService = emailService;
        this.currentUser = currentUser;
    }

    async listBusinesses(filters: BusinessListFilters = {}) {
        const businesses = await this.repository.listBusinesses(filters);

        return businesses
            .map(mapBusinessSummary)
            .filter((business) => (filters.promosOnly ? business.activePromotions.length > 0 : true))
            .filter((business) => (filters.maxDistanceKm ? business.distanceKm <= filters.maxDistanceKm : true))
            .sort(sortBusinessSummaries);
    }

    async getBusinessById(businessId: string) {
        const business = await this.repository.findBusinessById(businessId);

        return business ? mapBusinessDetails(business) : null;
    }

    async createBusiness(input: CreateBusinessInput) {
        const ownerId = await this.resolveOwnerId(input.ownerId);
        const managers = await this.resolveManagerIds(input.managers, ownerId);
        const business = await this.repository.createBusiness({
            ...input,
            ownerId,
            managers,
            status: 'PENDING',
        });

        return mapBusinessSummary(business);
    }

    async listPendingBusinesses() {
        this.ensureAdmin();

        const businesses = await this.repository.listPendingBusinesses();
        return businesses.map(mapBusinessSummary).sort(sortBusinessSummaries);
    }

    async approveBusiness(input: ApproveBusinessInput) {
        this.ensureAdmin();

        const approvedBusiness = await this.repository.approveBusiness(input.businessId);
        if (!approvedBusiness) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        const business = mapBusiness(approvedBusiness);
        const owner = approvedBusiness.owner
            ? {
                id: approvedBusiness.owner.id,
                fullName: approvedBusiness.owner.fullName,
                email: approvedBusiness.owner.email,
                role: approvedBusiness.owner.role,
                avatarUrl: approvedBusiness.owner.avatarUrl ?? undefined,
            }
            : undefined;

        await this.emailService.sendBusinessApprovedEmail({ business, owner });

        return { business, owner };
    }

    private ensureAdmin() {
        if (!isAdminUser(this.currentUser)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required.' });
        }
    }

    private async resolveOwnerId(requestedOwnerId: string) {
        if (isAdminUser(this.currentUser)) {
            const owner = await this.repository.findUserById(requestedOwnerId);
            if (!owner) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Owner not found.' });
            }

            return owner.id;
        }

        if (this.currentUser) {
            const owner = await this.repository.findUserById(this.currentUser.id);
            if (!owner) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authenticated owner not found.' });
            }

            return owner.id;
        }

        const fallbackOwner = await this.repository.findUserById(requestedOwnerId);
        if (!fallbackOwner) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Owner not found.' });
        }

        return fallbackOwner.id;
    }

    private async resolveManagerIds(managerIds: string[], ownerId: string) {
        const normalizedIds = Array.from(new Set(managerIds.filter(Boolean))).filter((managerId) => managerId !== ownerId);

        if (normalizedIds.length === 0) {
            return [];
        }

        const users = await this.repository.findUsersByIds(normalizedIds);
        if (users.length !== normalizedIds.length) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'One or more managers do not exist.' });
        }

        return normalizedIds;
    }
}