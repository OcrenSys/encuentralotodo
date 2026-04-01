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

function createBaseContext() {
    return {
        env: baseEnv,
        authProvider: createAuthProvider('mock'),
        verifiedIdentity: null,
        store: marketplaceStore,
        emailService: createEmailService(),
        businessService: {
            listBusinesses: jest.fn(),
            getBusinessById: jest.fn(),
            createBusiness: jest.fn(),
            listPendingBusinesses: jest.fn(),
            approveBusiness: jest.fn(),
        } as any,
        businessAnalyticsService: {
            getOverview: jest.fn(async () => ({ businessId: 'biz-casa-norte' })),
        } as any,
        productService: {
            listByBusiness: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as any,
        platformAnalyticsService: {
            getOverview: jest.fn(async () => ({ summary: { totalApprovedBusinesses: 1 } })),
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
    };
}

describe('analytics router', () => {
    it('rejects unauthenticated business analytics callers', async () => {
        const caller = appRouter.createCaller({
            ...createBaseContext(),
            currentUser: null,
        });

        await expect(caller.analytics.businessOverview({ businessId: 'biz-casa-norte' })).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
        });
    });

    it('rejects non-admin platform analytics callers', async () => {
        const caller = appRouter.createCaller({
            ...createBaseContext(),
            currentUser: createCurrentUser({
                id: 'owner-sofia',
                fullName: 'Sofia Rivas',
                email: 'sofia@encuentralotodo.app',
                role: 'USER',
                authProvider: 'mock',
                externalAuthId: 'owner-sofia',
                emailVerified: true,
            }),
        });

        await expect(caller.analytics.platformOverview({ period: '30D' })).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Admin access required.',
        });
    });
});