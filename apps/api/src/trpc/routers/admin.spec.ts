import { createAuthProvider, createCurrentUser } from 'auth';

import { createEmailService } from '../../lib/email';
import { marketplaceStore } from '../../lib/store';
import { appRouter } from '../router';

const baseEnv = {
    NODE_ENV: 'development' as const,
    PORT: 4000,
    API_PORT: 4000,
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://example',
    DATA_MODE: 'prisma' as const,
    AUTH_PROVIDER: 'mock' as const,
};

describe('admin router', () => {
    it('rejects unauthorized approval callers', async () => {
        const caller = appRouter.createCaller({
            env: baseEnv,
            currentUser: createCurrentUser({
                id: 'user-ana',
                fullName: 'Ana Mercado',
                email: 'ana@encuentralotodo.app',
                role: 'USER',
                authProvider: 'mock',
                externalAuthId: 'user-ana',
                emailVerified: true,
            }),
            verifiedIdentity: null,
            authProvider: createAuthProvider('mock'),
            store: marketplaceStore,
            emailService: createEmailService(),
            businessService: {
                listBusinesses: jest.fn(),
                getBusinessById: jest.fn(),
                createBusiness: jest.fn(),
                listPendingBusinesses: jest.fn(async () => []),
                approveBusiness: jest.fn(),
            } as any,
            businessAnalyticsService: {
                getOverview: jest.fn(),
            } as any,
            productService: {
                listByBusiness: jest.fn(),
                getById: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            } as any,
            platformAnalyticsService: {
                getOverview: jest.fn(),
            } as any,
            promotionService: {
                listActive: jest.fn(),
                listByBusiness: jest.fn(),
                getById: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            } as any,
            leadService: {
                create: jest.fn(),
                listByBusiness: jest.fn(),
                getById: jest.fn(),
            } as any,
            reviewService: {
                listByBusiness: jest.fn(),
                create: jest.fn(),
            } as any,
            userAdminService: {
                listUsers: jest.fn(async () => []),
                updateUserRole: jest.fn(),
                setUserActive: jest.fn(),
            } as any,
        });

        await expect(caller.admin.approveBusiness({ businessId: 'biz-casa-norte', approvedBy: 'user-ana' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Admin access required.',
        });
    });

    it('rejects non-superadmin callers for platform users', async () => {
        const caller = appRouter.createCaller({
            env: baseEnv,
            currentUser: createCurrentUser({
                id: 'admin-luis',
                fullName: 'Luis Admin',
                email: 'luis@encuentralotodo.app',
                role: 'ADMIN',
                authProvider: 'mock',
                externalAuthId: 'admin-luis',
                emailVerified: true,
            }),
            verifiedIdentity: null,
            authProvider: createAuthProvider('mock'),
            store: marketplaceStore,
            emailService: createEmailService(),
            businessService: {
                listBusinesses: jest.fn(),
                getBusinessById: jest.fn(),
                createBusiness: jest.fn(),
                listPendingBusinesses: jest.fn(async () => []),
                approveBusiness: jest.fn(),
            } as any,
            businessAnalyticsService: {
                getOverview: jest.fn(),
            } as any,
            productService: {
                listByBusiness: jest.fn(),
                getById: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            } as any,
            platformAnalyticsService: {
                getOverview: jest.fn(),
            } as any,
            promotionService: {
                listActive: jest.fn(),
                listByBusiness: jest.fn(),
                getById: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            } as any,
            leadService: {
                create: jest.fn(),
                listByBusiness: jest.fn(),
                getById: jest.fn(),
            } as any,
            reviewService: {
                listByBusiness: jest.fn(),
                create: jest.fn(),
            } as any,
            userAdminService: {
                listUsers: jest.fn(async () => []),
                updateUserRole: jest.fn(),
                setUserActive: jest.fn(),
            } as any,
        });

        await expect(caller.admin.listUsers()).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'SuperAdmin access required.',
        });
    });
});