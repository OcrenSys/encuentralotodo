import type {
    CreateLeadInput,
    UserProfile,
} from 'types';

import type {
    BusinessRepositoryPort,
    RepositoryBusinessAccessRecord,
} from '../business/business.repository';
import type { ProductRepositoryPort, RepositoryProductRecord } from '../product/product.repository';
import type { PromotionRepositoryPort, RepositoryPromotionRecord } from '../promotion/promotion.repository';
import type {
    LeadRepositoryPort,
    RepositoryLeadRecord,
    RepositoryLeadWithBusinessRecord,
} from './lead.repository';
import { LeadService } from './lead.service';

function createBusinessAccess(overrides: Partial<RepositoryBusinessAccessRecord> = {}): RepositoryBusinessAccessRecord {
    return {
        id: overrides.id ?? 'biz-casa-norte',
        ownerId: overrides.ownerId ?? 'owner-sofia',
        managers: overrides.managers ?? ['manager-carlos'],
        memberships: overrides.memberships ?? [
            { userId: 'owner-sofia', role: 'OWNER' },
            { userId: 'manager-carlos', role: 'MANAGER' },
        ],
        subscriptionType: overrides.subscriptionType ?? 'PREMIUM_PLUS',
        status: overrides.status ?? 'APPROVED',
    };
}

function createLeadRecord(overrides: Partial<RepositoryLeadRecord> = {}): RepositoryLeadRecord {
    return {
        id: overrides.id ?? 'lead-1',
        name: overrides.name ?? 'Valentina Guzman',
        phone: overrides.phone ?? '18095551212',
        businessId: overrides.businessId ?? 'biz-casa-norte',
        businessName: overrides.businessName ?? 'Casa Norte Market',
        productId: overrides.productId ?? null,
        productName: overrides.productName ?? null,
        promotionId: overrides.promotionId ?? null,
        promotionTitle: overrides.promotionTitle ?? null,
        source: overrides.source ?? 'CONTACT_CLICK',
        status: overrides.status ?? 'NEW',
        updatedAt: overrides.updatedAt ?? new Date('2026-04-13T11:48:00.000Z'),
        createdAt: overrides.createdAt ?? new Date('2026-04-13T10:48:00.000Z'),
        summary: overrides.summary ?? 'User clicked contact action',
        notes: overrides.notes ?? null,
    };
}

function createLeadWithBusinessRecord(overrides: Partial<RepositoryLeadWithBusinessRecord> = {}): RepositoryLeadWithBusinessRecord {
    const base = createLeadRecord(overrides);

    return {
        ...base,
        business: {
            id: overrides.business?.id ?? base.businessId,
            ownerId: overrides.business?.ownerId ?? 'owner-sofia',
            managers: overrides.business?.managers ?? [{ userId: 'manager-carlos' }],
            memberships: overrides.business?.memberships ?? [
                { userId: 'owner-sofia', role: 'OWNER' },
                { userId: 'manager-carlos', role: 'MANAGER' },
            ],
        },
    };
}

function createProductRecord(overrides: Partial<RepositoryProductRecord> = {}): RepositoryProductRecord {
    return {
        id: overrides.id ?? 'prod-1',
        name: overrides.name ?? 'Lunch box ejecutivo',
        description: overrides.description ?? 'Combo ejecutivo listo para oficina.',
        images: overrides.images ?? ['https://example.com/product.jpg'],
        type: overrides.type ?? 'simple',
        configurationSummary: overrides.configurationSummary ?? null,
        price: overrides.price ?? 18,
        isFeatured: overrides.isFeatured ?? false,
        businessId: overrides.businessId ?? 'biz-casa-norte',
        lastUpdated: overrides.lastUpdated ?? new Date('2026-04-13T10:48:00.000Z'),
        createdAt: overrides.createdAt ?? new Date('2026-04-12T10:48:00.000Z'),
    };
}

function createPromotionRecord(overrides: Partial<RepositoryPromotionRecord> = {}): RepositoryPromotionRecord {
    return {
        id: overrides.id ?? 'promo-1',
        businessId: overrides.businessId ?? 'biz-casa-norte',
        title: overrides.title ?? 'Lunch corporativo 2x1',
        description: overrides.description ?? 'Promocion activa para equipos corporativos.',
        type: overrides.type ?? 'DISCOUNT',
        startDate: overrides.startDate ?? new Date('2026-04-10T00:00:00.000Z'),
        endDate: overrides.endDate ?? new Date('2026-04-20T00:00:00.000Z'),
        status: overrides.status ?? 'ACTIVE',
        createdAt: overrides.createdAt ?? new Date('2026-04-10T00:00:00.000Z'),
        updatedAt: overrides.updatedAt ?? new Date('2026-04-13T00:00:00.000Z'),
        promoPrice: overrides.promoPrice ?? 12,
        originalPrice: overrides.originalPrice ?? 20,
        image: overrides.image ?? 'https://example.com/promotion.jpg',
    };
}

function createLeadRepositoryMock(): jest.Mocked<LeadRepositoryPort> {
    return {
        listByBusiness: jest.fn(),
        findByIdWithBusiness: jest.fn(),
        create: jest.fn(),
        updateStatus: jest.fn(),
        updateNotes: jest.fn(),
    };
}

function createBusinessRepositoryMock(): jest.Mocked<BusinessRepositoryPort> {
    return {
        listBusinesses: jest.fn(),
        listBusinessesForManagement: jest.fn(),
        listBusinessesByUserAccess: jest.fn(),
        listBusinessesForManagementPage: jest.fn(),
        listBusinessesByUserAccessPage: jest.fn(),
        findBusinessById: jest.fn(),
        findBusinessAccessById: jest.fn(),
        listPendingBusinesses: jest.fn(),
        createBusiness: jest.fn(),
        updateBusiness: jest.fn(),
        approveBusiness: jest.fn(),
        listBusinessMembershipSources: jest.fn(),
        upsertCanonicalMemberships: jest.fn(),
        searchUsers: jest.fn(),
        findUserById: jest.fn(),
        findUsersByIds: jest.fn(),
    } as unknown as jest.Mocked<BusinessRepositoryPort>;
}

function createProductRepositoryMock(): jest.Mocked<Pick<ProductRepositoryPort, 'findById'>> {
    return {
        findById: jest.fn(),
    };
}

function createPromotionRepositoryMock(): jest.Mocked<Pick<PromotionRepositoryPort, 'findById'>> {
    return {
        findById: jest.fn(),
    };
}

function createService(currentUser: UserProfile | null) {
    const repository = createLeadRepositoryMock();
    const businessRepository = createBusinessRepositoryMock();
    const productRepository = createProductRepositoryMock();
    const promotionRepository = createPromotionRepositoryMock();

    return {
        repository,
        businessRepository,
        productRepository,
        promotionRepository,
        service: new LeadService({
            repository,
            businessRepository,
            productRepository,
            promotionRepository,
            currentUser,
        }),
    };
}

describe('LeadService', () => {
    const ownerUser = {
        id: 'owner-sofia',
        fullName: 'Sofia Rivas',
        email: 'sofia@encuentralotodo.app',
        role: 'USER',
    } as UserProfile;

    const managerUser = {
        id: 'manager-carlos',
        fullName: 'Carlos Mena',
        email: 'carlos@encuentralotodo.app',
        role: 'USER',
    } as UserProfile;

    it('creates a WhatsApp lead with NEW status and meaningful summary', async () => {
        const { service, repository, businessRepository } = createService(null);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.create.mockResolvedValue(createLeadRecord({ source: 'WHATSAPP_CLICK', summary: 'User clicked WhatsApp contact' }));

        const result = await service.createLeadFromWhatsappClick({
            businessId: 'biz-casa-norte',
            metadata: { name: 'Valentina Guzman', phone: '18095551212' },
        });

        expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
            businessId: 'biz-casa-norte',
            source: 'WHATSAPP_CLICK',
            status: 'NEW',
            summary: 'User clicked WhatsApp contact',
        }));
        expect(result).toMatchObject({ source: 'WHATSAPP_CLICK', status: 'NEW' });
    });

    it('creates a call lead from the call click source', async () => {
        const { service, repository, businessRepository } = createService(null);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.create.mockResolvedValue(createLeadRecord({ source: 'CALL_CLICK', summary: 'User clicked call contact' }));

        await service.createLeadFromCallClick({ businessId: 'biz-casa-norte' });

        expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
            source: 'CALL_CLICK',
            summary: 'User clicked call contact',
        }));
    });

    it('creates a contact lead from the generic contact action', async () => {
        const { service, repository, businessRepository } = createService(null);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.create.mockResolvedValue(createLeadRecord({ source: 'CONTACT_CLICK', summary: 'User clicked contact action' }));

        await service.createLeadFromContactClick({ businessId: 'biz-casa-norte' });

        expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
            source: 'CONTACT_CLICK',
            summary: 'User clicked contact action',
        }));
    });

    it('creates a promotion lead resolving business and promotion context', async () => {
        const { service, repository, promotionRepository, businessRepository } = createService(null);
        const promotion = createPromotionRecord({ id: 'promo-lunch', title: 'Lunch corporativo 2x1' });
        promotionRepository.findById.mockResolvedValue(promotion);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.create.mockResolvedValue(createLeadRecord({
            source: 'PROMOTION_CLICK',
            promotionId: promotion.id,
            promotionTitle: promotion.title,
            summary: `User clicked promotion: ${promotion.title}`,
        }));

        const result = await service.createLeadFromPromotionClick({ promotionId: promotion.id });

        expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
            businessId: promotion.businessId,
            promotionId: promotion.id,
            source: 'PROMOTION_CLICK',
            summary: `User clicked promotion: ${promotion.title}`,
        }));
        expect(result).toMatchObject({ promotionId: promotion.id, source: 'PROMOTION_CLICK' });
    });

    it('creates a product lead resolving business and product context', async () => {
        const { service, repository, productRepository, businessRepository } = createService(null);
        const product = createProductRecord({ id: 'prod-box', name: 'Lunch box ejecutivo' });
        productRepository.findById.mockResolvedValue(product);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.create.mockResolvedValue(createLeadRecord({
            source: 'PRODUCT_CLICK',
            productId: product.id,
            productName: product.name,
            summary: `User clicked product: ${product.name}`,
        }));

        const result = await service.createLeadFromProductClick({ productId: product.id });

        expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
            businessId: product.businessId,
            productId: product.id,
            source: 'PRODUCT_CLICK',
            summary: `User clicked product: ${product.name}`,
        }));
        expect(result).toMatchObject({ productId: product.id, source: 'PRODUCT_CLICK' });
    });

    it('rejects lead creation for a missing business', async () => {
        const { service, businessRepository } = createService(null);
        businessRepository.findBusinessAccessById.mockResolvedValue(null);

        await expect(service.createLead({
            businessId: 'missing-business',
            source: 'CONTACT_CLICK',
            status: 'NEW',
            summary: 'User clicked contact action',
        })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Business not found.' });
    });

    it('rejects an invalid product context for internal lead creation', async () => {
        const { service, businessRepository, productRepository } = createService(null);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        productRepository.findById.mockResolvedValue(createProductRecord({ businessId: 'biz-other' }));

        await expect(service.createLead({
            businessId: 'biz-casa-norte',
            productId: 'prod-1',
            source: 'PRODUCT_CLICK',
            status: 'NEW',
            summary: 'User clicked product: Lunch box ejecutivo',
        })).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'Lead product context is invalid.' });
    });

    it('lists leads for an authorized owner', async () => {
        const { service, repository, businessRepository } = createService(ownerUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.listByBusiness.mockResolvedValue([createLeadRecord()]);

        const result = await service.listByBusiness('biz-casa-norte');

        expect(result).toEqual([
            expect.objectContaining({
                id: 'lead-1',
                source: 'CONTACT_CLICK',
                createdAt: '2026-04-13T10:48:00.000Z',
            }),
        ]);
    });

    it('rejects unauthorized lead inbox access', async () => {
        const outsider = {
            id: 'user-ana',
            fullName: 'Ana Mercado',
            email: 'ana@encuentralotodo.app',
            role: 'USER',
        } as UserProfile;
        const { service, businessRepository } = createService(outsider);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());

        await expect(service.listByBusiness('biz-casa-norte')).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Only an owner or manager can manage leads for this business.',
        });
    });

    it('rejects superadmin direct lead management access', async () => {
        const superAdmin = {
            id: 'superadmin-luis',
            fullName: 'Luis SuperAdmin',
            email: 'luis@encuentralotodo.app',
            role: 'SUPERADMIN',
        } as UserProfile;
        const { service, businessRepository } = createService(superAdmin);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());

        await expect(service.listByBusiness('biz-casa-norte')).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Only an owner or manager can manage leads for this business.',
        });
    });

    it('allows a manager to update lead status', async () => {
        const { service, repository } = createService(managerUser);
        repository.findByIdWithBusiness.mockResolvedValue(createLeadWithBusinessRecord());
        repository.updateStatus.mockResolvedValue(createLeadRecord({ status: 'QUALIFIED' }));

        const result = await service.updateLeadStatus({ leadId: 'lead-1', status: 'QUALIFIED' });

        expect(repository.updateStatus).toHaveBeenCalledWith('lead-1', 'QUALIFIED');
        expect(result).toMatchObject({ status: 'QUALIFIED' });
    });

    it('persists notes updates and normalizes blank notes to undefined in the response', async () => {
        const { service, repository } = createService(ownerUser);
        repository.findByIdWithBusiness.mockResolvedValue(createLeadWithBusinessRecord());
        repository.updateNotes.mockResolvedValue(createLeadRecord({ notes: null }));

        const result = await service.updateLeadNotes({ leadId: 'lead-1', notes: '' });

        expect(repository.updateNotes).toHaveBeenCalledWith('lead-1', null);
        expect(result.notes).toBeUndefined();
    });

    it('requires authentication for lead status changes', async () => {
        const { service, repository } = createService(null);
        repository.findByIdWithBusiness.mockResolvedValue(createLeadWithBusinessRecord());

        await expect(service.updateLeadStatus({ leadId: 'lead-1', status: 'CONTACTED' })).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
        });
    });
});