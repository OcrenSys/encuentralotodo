import type { Request, Response } from 'express';

import { createAuthProvider, createCurrentUser, type AuthProvider, type CurrentUser, type VerifiedIdentity } from 'auth';

import { BusinessAnalyticsRepository } from '../lib/analytics/business-analytics.repository';
import { BusinessAnalyticsService } from '../lib/analytics/business-analytics.service';
import { AuthIdentityService } from '../lib/auth/auth-identity.service';
import { PrismaAuthIdentityRepository } from '../lib/auth/auth-identity.repository';
import { resolveVerifiedRequestIdentity } from '../lib/auth/request-auth';
import { PlatformAnalyticsRepository } from '../lib/analytics/platform-analytics.repository';
import { PlatformAnalyticsService } from '../lib/analytics/platform-analytics.service';
import { BusinessRepository } from '../lib/business/business.repository';
import { BusinessService } from '../lib/business/business.service';
import { createEmailService } from '../lib/email';
import { LeadRepository } from '../lib/lead/lead.repository';
import { LeadService } from '../lib/lead/lead.service';
import { ProductRepository } from '../lib/product/product.repository';
import { ProductService } from '../lib/product/product.service';
import { PromotionRepository } from '../lib/promotion/promotion.repository';
import { PromotionService } from '../lib/promotion/promotion.service';
import { ReviewRepository } from '../lib/review/review.repository';
import { ReviewService } from '../lib/review/review.service';
import { UserAdminRepository } from '../lib/user/user-admin.repository';
import { UserAdminService } from '../lib/user/user-admin.service';
import { getPrismaClient } from '../lib/prisma';
import { marketplaceStore } from '../lib/store';

export interface TrpcContext {
  env: {
    NODE_ENV: 'development' | 'staging' | 'production';
    PORT: number;
    API_PORT: number;
    HOST: string;
    DATABASE_URL?: string;
    DATA_MODE: 'memory' | 'prisma';
    AUTH_PROVIDER: 'mock' | 'firebase' | 'cognito';
    RESEND_API_KEY?: string;
    GOOGLE_MAPS_API_KEY?: string;
    SENTRY_DSN?: string;
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_CLIENT_EMAIL?: string;
    FIREBASE_PRIVATE_KEY?: string;
    FIREBASE_SERVICE_ACCOUNT_JSON?: string;
    COGNITO_USER_POOL_ID?: string;
    COGNITO_CLIENT_ID?: string;
  };
  currentUser: CurrentUser | null;
  verifiedIdentity: VerifiedIdentity | null;
  authProvider: AuthProvider;
  store: typeof marketplaceStore;
  emailService: ReturnType<typeof createEmailService>;
  businessService: BusinessService;
  businessAnalyticsService: BusinessAnalyticsService;
  productService: ProductService;
  platformAnalyticsService: PlatformAnalyticsService;
  promotionService: PromotionService;
  leadService: LeadService;
  reviewService: ReviewService;
  userAdminService: UserAdminService;
}

function resolveMockCurrentUser(identity: VerifiedIdentity | null) {
  if (!identity) {
    return null;
  }

  const seededUser = marketplaceStore.getUser(identity.externalUserId) ??
    (identity.email ? marketplaceStore.findUserByEmail(identity.email) : null);

  if (!seededUser) {
    return createCurrentUser({
      id: identity.externalUserId,
      fullName: identity.displayName ?? identity.email ?? identity.externalUserId,
      email: identity.email ?? `${identity.externalUserId}@mock.encuentralotodo.local`,
      role: 'UNASSIGNED',
      avatarUrl: identity.avatarUrl,
      isActive: true,
      authProvider: identity.provider,
      externalAuthId: identity.externalUserId,
      emailVerified: identity.emailVerified,
    });
  }

  return createCurrentUser({
    id: seededUser.id,
    fullName: seededUser.fullName,
    email: seededUser.email,
    role: seededUser.role,
    avatarUrl: seededUser.avatarUrl,
    isActive: seededUser.isActive ?? true,
    authProvider: identity.provider,
    externalAuthId: identity.externalUserId,
    emailVerified: identity.emailVerified,
  });
}

export async function resolveRequestAuthContext(input: {
  req: Request;
  env: TrpcContext['env'];
  authProvider: AuthProvider;
  authIdentityService: Pick<AuthIdentityService, 'resolveCurrentUser'>;
}) {
  const verifiedIdentity = await resolveVerifiedRequestIdentity({
    request: input.req,
    authProviderName: input.env.AUTH_PROVIDER,
    authProvider: input.authProvider,
  });

  const currentUser =
    input.env.AUTH_PROVIDER === 'mock'
      ? resolveMockCurrentUser(verifiedIdentity)
      : verifiedIdentity
        ? await input.authIdentityService.resolveCurrentUser(verifiedIdentity)
        : null;

  return {
    verifiedIdentity,
    currentUser,
  };
}

export async function createTrpcContext({ req, env }: { req: Request; res: Response; env: TrpcContext['env'] }): Promise<TrpcContext> {
  const authProvider = createAuthProvider(env.AUTH_PROVIDER, {
    firebase: {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
      serviceAccountJson: env.FIREBASE_SERVICE_ACCOUNT_JSON,
    },
  });
  const emailService = createEmailService(env.RESEND_API_KEY);
  const prisma = getPrismaClient();
  const businessRepository = new BusinessRepository(prisma);
  const businessAnalyticsRepository = new BusinessAnalyticsRepository(prisma);
  const authIdentityRepository = new PrismaAuthIdentityRepository(prisma);
  const authIdentityService = new AuthIdentityService({ repository: authIdentityRepository });
  const leadRepository = new LeadRepository(prisma);
  const platformAnalyticsRepository = new PlatformAnalyticsRepository(prisma);
  const productRepository = new ProductRepository(prisma);
  const promotionRepository = new PromotionRepository(prisma);
  const reviewRepository = new ReviewRepository(prisma);
  const userAdminRepository = new UserAdminRepository(prisma);
  const { currentUser, verifiedIdentity } = await resolveRequestAuthContext({
    req,
    env,
    authProvider,
    authIdentityService,
  });

  return {
    env,
    currentUser,
    verifiedIdentity,
    authProvider,
    store: marketplaceStore,
    emailService,
    businessService: new BusinessService({
      repository: businessRepository,
      emailService,
      currentUser,
    }),
    businessAnalyticsService: new BusinessAnalyticsService({
      repository: businessAnalyticsRepository,
      businessRepository,
      currentUser,
    }),
    productService: new ProductService({
      repository: productRepository,
      businessRepository,
      currentUser,
    }),
    platformAnalyticsService: new PlatformAnalyticsService({
      repository: platformAnalyticsRepository,
      currentUser,
    }),
    promotionService: new PromotionService({
      repository: promotionRepository,
      businessRepository,
      currentUser,
    }),
    leadService: new LeadService({
      repository: leadRepository,
      businessRepository,
      currentUser,
    }),
    reviewService: new ReviewService({
      repository: reviewRepository,
      businessRepository,
      currentUser,
    }),
    userAdminService: new UserAdminService({
      repository: userAdminRepository,
      currentUser,
    }),
  };
}