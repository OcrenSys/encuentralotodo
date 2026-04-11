import { TRPCError } from '@trpc/server';
import type { CurrentUser } from 'auth';
import type {
    BusinessListFilters,
    CreateBusinessForOwnerInput,
    CreateBusinessInput,
    ListManagedBusinessesInput,
    ManagementListResult,
    BusinessDetails,
    PlatformUserSearchResult,
    SearchBusinessUsersInput,
    TransferBusinessOwnershipInput,
    UpdateBusinessInput,
} from 'types';

import { isSuperAdmin, platformAdminRoles, requireActiveUser, requirePlatformRole } from '../auth/authorization';
import type { EmailService } from '../email';
import { canEditBusiness, canEditBusinessOperationally, isAdminUser, isBusinessOwner } from './business-access';
import { mapBusiness, mapBusinessDetails, mapBusinessSummary } from './business.mappers';
import type { BusinessRepositoryPort } from './business.repository';
import type { UserAdminRepositoryPort } from '../user/user-admin.repository';

interface BusinessServiceDependencies {
    repository: BusinessRepositoryPort;
    emailService: EmailService;
    currentUser: CurrentUser | null;
    userAdminRepository?: Pick<UserAdminRepositoryPort, 'countBusinessOwners' | 'createAuditLog' | 'transferBusinessOwnership'>;
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

function haveSameImages(
    left: UpdateBusinessInput['images'],
    right: Pick<BusinessDetails, 'images'>['images'],
) {
    return left.profile === right.profile && left.banner === right.banner;
}

function hasCriticalIdentityChanges(currentBusiness: BusinessDetails, input: UpdateBusinessInput) {
    return currentBusiness.name !== input.name
        || currentBusiness.category !== input.category
        || !haveSameImages(input.images, currentBusiness.images);
}

export class BusinessService {
    private readonly repository: BusinessRepositoryPort;
    private readonly emailService: EmailService;
    private readonly currentUser: CurrentUser | null;
    private readonly userAdminRepository?: Pick<UserAdminRepositoryPort, 'countBusinessOwners' | 'createAuditLog' | 'transferBusinessOwnership'>;

    constructor({ repository, emailService, currentUser, userAdminRepository }: BusinessServiceDependencies) {
        this.repository = repository;
        this.emailService = emailService;
        this.currentUser = currentUser;
        this.userAdminRepository = userAdminRepository;
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

    async searchAssignableUsers(input: SearchBusinessUsersInput): Promise<PlatformUserSearchResult[]> {
        const currentUser = requireActiveUser(this.currentUser);
        const business = await this.repository.findBusinessAccessById(input.businessId);

        if (!business) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        if (!canEditBusiness(currentUser, business)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the owner or a SuperAdmin can manage business membership.' });
        }

        const users = await this.repository.searchUsers({
            search: input.search,
            limit: Math.min(input.limit, 10),
        });

        return users.map((user) => ({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl ?? undefined,
            isActive: user.isActive,
        }));
    }

    async createBusiness(input: CreateBusinessInput) {
        const currentUser = requireActiveUser(this.currentUser);
        const owner = await this.repository.findUserById(currentUser.id);

        if (!owner) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authenticated owner not found.' });
        }

        const business = await this.createBusinessRecord({
            input,
            ownerId: owner.id,
        });

        return mapBusinessSummary(business);
    }

    async createBusinessForOwner(input: CreateBusinessForOwnerInput) {
        requirePlatformRole(this.currentUser, platformAdminRoles, 'Admin access required.');

        const owner = await this.repository.findUserById(input.ownerId);
        if (!owner) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Selected owner does not exist.' });
        }

        const business = await this.createBusinessRecord({
            input,
            ownerId: owner.id,
        });

        return mapBusinessSummary(business);
    }

    async updateBusiness(input: UpdateBusinessInput) {
        const currentUser = requireActiveUser(this.currentUser);
        const [businessAccess, currentBusiness] = await Promise.all([
            this.repository.findBusinessAccessById(input.businessId),
            this.repository.findBusinessById(input.businessId),
        ]);

        if (!businessAccess || !currentBusiness) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        const isAllowedSuperAdmin = isSuperAdmin(currentUser);
        if (!canEditBusinessOperationally(currentUser, businessAccess)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Business access required.' });
        }

        const isOwner = isBusinessOwner(currentUser, businessAccess);

        if (!isAllowedSuperAdmin && !isOwner) {
            if (input.subscriptionType && input.subscriptionType !== businessAccess.subscriptionType) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the owner or a SuperAdmin can change the membership plan.' });
            }

            if (!haveSameManagers(input.managers, businessAccess.managers)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the owner or a SuperAdmin can change business managers.' });
            }

            if (hasCriticalIdentityChanges(mapBusinessDetails(currentBusiness), input)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Managers can only update operational business fields.' });
            }
        }

        const managers = (isAllowedSuperAdmin || isOwner)
            ? await this.resolveManagerIds(input.managers ?? businessAccess.managers, businessAccess.ownerId)
            : businessAccess.managers;
        const updatedBusiness = await this.repository.updateBusiness({
            ...input,
            managers,
            subscriptionType: (isAllowedSuperAdmin || isOwner)
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

    async transferOwnership(input: TransferBusinessOwnershipInput) {
        const currentUser = requireActiveUser(this.currentUser);
        const businessAccess = await this.repository.findBusinessAccessById(input.businessId);

        if (!this.userAdminRepository) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Ownership transfer support is not available.' });
        }

        if (!businessAccess) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found.' });
        }

        const isAllowedSuperAdmin = isSuperAdmin(currentUser);
        if (!isAllowedSuperAdmin && !isBusinessOwner(currentUser, businessAccess)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the owner or a SuperAdmin can transfer ownership.' });
        }

        if (!isAllowedSuperAdmin && currentUser.id !== input.fromUserId) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Ownership transfer must originate from the current owner.' });
        }

        const ownerCount = await this.userAdminRepository.countBusinessOwners(input.businessId);
        if (ownerCount <= 1 && input.fromUserId === input.toUserId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Ownership transfer requires a different target owner.',
            });
        }

        await this.userAdminRepository.transferBusinessOwnership({
            businessId: input.businessId,
            fromUserId: input.fromUserId,
            toUserId: input.toUserId,
        });

        await this.userAdminRepository.createAuditLog({
            actorUserId: currentUser.id,
            targetUserId: input.toUserId,
            businessId: input.businessId,
            action: 'BUSINESS_OWNERSHIP_TRANSFERRED',
            metadata: {
                fromUserId: input.fromUserId,
                toUserId: input.toUserId,
                reason: input.reason,
            },
        });

        return this.getBusinessById(input.businessId);
    }

    private ensureAdmin() {
        return requirePlatformRole(this.currentUser, platformAdminRoles, 'Admin access required.');
    }

    private async createBusinessRecord(input: { input: CreateBusinessInput | CreateBusinessForOwnerInput; ownerId: string }) {
        const managers = await this.resolveManagerIds(input.input.managers, input.ownerId);

        return this.repository.createBusiness({
            ...input.input,
            ownerId: input.ownerId,
            managers,
            status: 'PENDING',
        });
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