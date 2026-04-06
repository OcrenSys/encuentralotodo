import { TRPCError } from '@trpc/server';
import type { CurrentUser } from 'auth';
import type {
    BusinessListFilters,
    CreateBusinessInput,
    ListManagedBusinessesInput,
    ManagementListResult,
    BusinessDetails,
    UpdateBusinessInput,
} from 'types';

import { isSuperAdmin, platformAdminRoles, requireActiveUser, requirePlatformRole } from '../auth/authorization';
import type { EmailService } from '../email';
import { canEditBusiness, isAdminUser } from './business-access';
import { mapBusiness, mapBusinessDetails, mapBusinessSummary } from './business.mappers';
import type { BusinessRepositoryPort } from './business.repository';

interface BusinessServiceDependencies {
    repository: BusinessRepositoryPort;
    emailService: EmailService;
    currentUser: CurrentUser | null;
}

function sortBusinessSummaries(left: ReturnType<typeof mapBusinessSummary>, right: ReturnType<typeof mapBusinessSummary>) {
    return right.rating - left.rating || left.distanceKm - right.distanceKm;
}

function sortBusinessLikeSummaries(
    left: Pick<ReturnType<typeof mapBusinessSummary>, 'rating' | 'distanceKm'>,
    right: Pick<ReturnType<typeof mapBusinessSummary>, 'rating' | 'distanceKm'>,
) {
    return right.rating - left.rating || left.distanceKm - right.distanceKm;
}

function haveSameManagers(left: string[], right: string[]) {
    if (left.length !== right.length) {
        return false;
    }

    const leftSet = new Set(left);
    return right.every((managerId) => leftSet.has(managerId));
}

export class BusinessService {
    private readonly repository: BusinessRepositoryPort;
    private readonly emailService: EmailService;
    private readonly currentUser: CurrentUser | null;

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

    async listManagedBusinesses(filters: BusinessListFilters = {}) {
        const currentUser = requireActiveUser(this.currentUser);
        const managedFilters = {
            ...filters,
            includePending: true,
        };
        const businesses = isAdminUser(currentUser)
            ? await this.repository.listBusinessesForManagement(managedFilters)
            : await this.repository.listBusinessesByUserAccess(currentUser.id, managedFilters);

        return businesses.map(mapBusinessDetails).sort(sortBusinessLikeSummaries);
    }

    async listManagedBusinessesPage(filters: ListManagedBusinessesInput): Promise<ManagementListResult<BusinessDetails>> {
        const currentUser = requireActiveUser(this.currentUser);
        const result = isAdminUser(currentUser)
            ? await this.repository.listBusinessesForManagementPage(filters)
            : await this.repository.listBusinessesByUserAccessPage(currentUser.id, filters);

        return {
            items: result.items.map(mapBusinessDetails),
            page: filters.page,
            pageSize: filters.pageSize,
            total: result.total,
            totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
        };
    }

    async createBusiness(input: CreateBusinessInput) {
        const currentUser = requireActiveUser(this.currentUser);
        const owner = await this.repository.findUserById(currentUser.id);

        if (!owner) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authenticated owner not found.' });
        }

        const ownerId = owner.id;
        const managers = await this.resolveManagerIds(input.managers, ownerId);
        const business = await this.repository.createBusiness({
            ...input,
            ownerId,
            managers,
            status: 'PENDING',
        });

        return mapBusinessSummary(business);
    }

    async updateBusiness(input: UpdateBusinessInput) {
        const currentUser = requireActiveUser(this.currentUser);
        const businessAccess = await this.repository.findBusinessAccessById(input.businessId);

        if (!businessAccess) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        const isAllowedSuperAdmin = isSuperAdmin(currentUser);
        if (!canEditBusiness(currentUser, businessAccess)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the owner or a SuperAdmin can update this business.' });
        }

        if (!isAllowedSuperAdmin && input.subscriptionType && input.subscriptionType !== businessAccess.subscriptionType) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Only a SuperAdmin can change the membership plan.' });
        }

        if (!isAllowedSuperAdmin && !haveSameManagers(input.managers, businessAccess.managers)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Only a SuperAdmin can change business managers.' });
        }

        const managers = isAllowedSuperAdmin
            ? await this.resolveManagerIds(input.managers ?? businessAccess.managers, businessAccess.ownerId)
            : businessAccess.managers;
        const updatedBusiness = await this.repository.updateBusiness({
            ...input,
            managers,
            subscriptionType: isAllowedSuperAdmin
                ? (input.subscriptionType ?? businessAccess.subscriptionType)
                : businessAccess.subscriptionType,
        });

        if (!updatedBusiness) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        return mapBusinessDetails(updatedBusiness);
    }

    async listPendingBusinesses() {
        this.ensureAdmin();

        const businesses = await this.repository.listPendingBusinesses();
        return businesses.map(mapBusinessDetails).sort(sortBusinessLikeSummaries);
    }

    async approveBusiness(input: { businessId: string }) {
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
        return requirePlatformRole(this.currentUser, platformAdminRoles, 'Admin access required.');
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