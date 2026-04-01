import type { Request, Response } from 'express';

import { createAuthProvider } from 'auth';
import type { UserProfile } from 'types';

import { BusinessRepository } from '../lib/business/business.repository';
import { BusinessService } from '../lib/business/business.service';
import { createEmailService } from '../lib/email';
import { LeadRepository } from '../lib/lead/lead.repository';
import { LeadService } from '../lib/lead/lead.service';
import { ProductRepository } from '../lib/product/product.repository';
import { ProductService } from '../lib/product/product.service';
import { PromotionRepository } from '../lib/promotion/promotion.repository';
import { PromotionService } from '../lib/promotion/promotion.service';
import { getPrismaClient } from '../lib/prisma';
import { marketplaceStore } from '../lib/store';

export interface TrpcContext {
  env: {
    NODE_ENV: 'development' | 'staging' | 'production';
    PORT: number;
    HOST: string;
    DATABASE_URL?: string;
    DATA_MODE: 'memory' | 'prisma';
    AUTH_PROVIDER: 'mock' | 'firebase' | 'cognito';
    RESEND_API_KEY?: string;
    GOOGLE_MAPS_API_KEY?: string;
    SENTRY_DSN?: string;
    FIREBASE_PROJECT_ID?: string;
    COGNITO_USER_POOL_ID?: string;
    COGNITO_CLIENT_ID?: string;
  };
  currentUser: UserProfile | null;
  authProvider: ReturnType<typeof createAuthProvider>;
  store: typeof marketplaceStore;
  emailService: ReturnType<typeof createEmailService>;
  businessService: BusinessService;
  productService: ProductService;
  promotionService: PromotionService;
  leadService: LeadService;
}

export function createTrpcContext({ req, env }: { req: Request; res: Response; env: TrpcContext['env'] }): TrpcContext {
  const demoUserEmail = req.headers['x-demo-user'];
  const currentUser = typeof demoUserEmail === 'string' ? marketplaceStore.findUserByEmail(demoUserEmail) : marketplaceStore.getUser('admin-luis');
  const emailService = createEmailService(env.RESEND_API_KEY);
  const prisma = getPrismaClient();
  const businessRepository = new BusinessRepository(prisma);
  const leadRepository = new LeadRepository(prisma);
  const productRepository = new ProductRepository(prisma);
  const promotionRepository = new PromotionRepository(prisma);

  return {
    env,
    currentUser,
    authProvider: createAuthProvider(env.AUTH_PROVIDER, currentUser),
    store: marketplaceStore,
    emailService,
    businessService: new BusinessService({
      repository: businessRepository,
      emailService,
      currentUser,
    }),
    productService: new ProductService({
      repository: productRepository,
      businessRepository,
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
  };
}