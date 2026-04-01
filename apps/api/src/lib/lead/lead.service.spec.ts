import type {
    CreateLeadInput,
    GetLeadByIdInput,
    UserProfile,
} from 'types';

import type {
    BusinessRepositoryPort,
    RepositoryBusinessAccessRecord,
} from '../business/business.repository';
import type {
    LeadRepositoryPort,
    RepositoryLeadRecord,
    RepositoryLeadWithBusinessRecord,
} from './lead.repository';
import { LeadService } from './lead.service';

function createBusinessAccess(overrides: Partial<RepositoryBusinessAccessRecord> = {}): RepositoryBusinessAccessRecord {
    return {
        id: 'biz-casa-norte',
        ownerId: 'owner-sofia',
        managers: ['manager-carlos'],
        subscriptionType: 'PREMIUM_PLUS',
        status: 'APPROVED',
        ...overrides,
    };
}

function createLeadRecord(overrides: Partial<RepositoryLeadRecord> = {}): RepositoryLeadRecord {
    return {
        id: 'lead-1',
        name: 'Valentina Guzman',
        businessId: 'biz-casa-norte',
        businessName: 'Casa Norte Market',
        source: 'Promo',
        status: 'NEW',
        updatedAt: new Date('2026-04-01T11:48:00.000Z'),
        createdAt: new Date('2026-04-01T11:48:00.000Z'),
        summary: 'Consultó por promo 2x1 y envío express en Zona Norte.',
        ...overrides,
    };
}

function createLeadWithBusinessRecord(overrides: Partial<RepositoryLeadWithBusinessRecord> = {}): RepositoryLeadWithBusinessRecord {
    const base = createLeadRecord();

    return {
        ...base,
        business: {
            id: base.businessId,
            ownerId: 'owner-sofia',
            managers: [{ userId: 'manager-carlos' }],
        },
        ...overrides,
    };
}

function createLeadRepositoryMock(): jest.Mocked<LeadRepositoryPort> {
    return {
        listByBusiness: jest.fn(),
        findById: jest.fn(),
        findByIdWithBusiness: jest.fn(),
        create: jest.fn(),
    };
}

function createBusinessRepositoryMock(): jest.Mocked<BusinessRepositoryPort> {
    return {
        listBusinesses: jest.fn(),
        findBusinessById: jest.fn(),
        findBusinessAccessById: jest.fn(),
        listPendingBusinesses: jest.fn(),
        createBusiness: jest.fn(),
        approveBusiness: jest.fn(),
        findUserById: jest.fn(),
        findUsersByIds: jest.fn(),
    };
}

function createService(currentUser: UserProfile | null) {
    const repository = createLeadRepositoryMock();
    const businessRepository = createBusinessRepositoryMock();

    return {
        repository,
        businessRepository,
        service: new LeadService({
            repository,
            businessRepository,
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

    it('create persists lead correctly for a valid business', async () => {
        const { service, repository, businessRepository } = createService(null);
        const input: CreateLeadInput = {
            businessId: 'biz-casa-norte',
            name: 'Valentina Guzman',
            source: 'Promo',
            summary: 'Consultó por promo 2x1 y envío express en Zona Norte.',
        };
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.create.mockResolvedValue(createLeadRecord());

        const result = await service.create(input);

        expect(repository.create).toHaveBeenCalledWith(input);
        expect(result).toMatchObject({
            id: 'lead-1',
            businessName: 'Casa Norte Market',
            status: 'NEW',
        });
    });

    it('invalid business reference is rejected during public tracking', async () => {
        const { service, businessRepository } = createService(null);
        businessRepository.findBusinessAccessById.mockResolvedValue(null);

        await expect(service.create({
            businessId: 'missing-business',
            name: 'Persona',
            source: 'Perfil',
            summary: 'Pidió más información comercial.',
        })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Business not found.' });
    });

    it('listByBusiness returns mapped Prisma-backed leads for an authorized owner', async () => {
        const { service, repository, businessRepository } = createService(ownerUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.listByBusiness.mockResolvedValue([createLeadRecord()]);

        const result = await service.listByBusiness('biz-casa-norte');

        expect(result).toEqual([
            expect.objectContaining({
                id: 'lead-1',
                source: 'Promo',
                updatedAt: '2026-04-01T11:48:00.000Z',
            }),
        ]);
    });

    it('unauthorized users cannot read another business lead list', async () => {
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
            message: 'Business access required.',
        });
    });

    it('authorized manager can read lead detail for their business', async () => {
        const managerUser = {
            id: 'manager-carlos',
            fullName: 'Carlos Mena',
            email: 'carlos@encuentralotodo.app',
            role: 'USER',
        } as UserProfile;
        const { service, repository } = createService(managerUser);
        const input: GetLeadByIdInput = { leadId: 'lead-1' };
        repository.findByIdWithBusiness.mockResolvedValue(createLeadWithBusinessRecord());

        const result = await service.getById(input);

        expect(result).toMatchObject({ id: 'lead-1', businessName: 'Casa Norte Market' });
    });

    it('admin access works for business lead reads', async () => {
        const adminUser = {
            id: 'admin-luis',
            fullName: 'Luis Admin',
            email: 'luis@encuentralotodo.app',
            role: 'ADMIN',
        } as UserProfile;
        const { service, repository, businessRepository } = createService(adminUser);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.listByBusiness.mockResolvedValue([createLeadRecord()]);

        const result = await service.listByBusiness('biz-casa-norte');

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ id: 'lead-1' });
    });

    it('public lead creation remains contract-compatible', async () => {
        const { service, repository, businessRepository } = createService(null);
        businessRepository.findBusinessAccessById.mockResolvedValue(createBusinessAccess());
        repository.create.mockResolvedValue(createLeadRecord({ source: 'Formulario', summary: 'Dejó mensaje para menú corporativo.' }));

        const result = await service.create({
            businessId: 'biz-casa-norte',
            name: 'Eduardo Molina',
            source: 'Formulario',
            summary: 'Dejó mensaje para menú corporativo.',
        });

        expect(result).toEqual({
            id: 'lead-1',
            name: 'Valentina Guzman',
            businessId: 'biz-casa-norte',
            businessName: 'Casa Norte Market',
            source: 'Formulario',
            status: 'NEW',
            updatedAt: '2026-04-01T11:48:00.000Z',
            summary: 'Dejó mensaje para menú corporativo.',
        });
    });
});