import type { Request, Response } from 'express';

import { createAuthProvider } from 'auth';
import type { UserProfile } from 'types';

import { createEmailService } from '../lib/email';
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
}

export function createTrpcContext({ req, env }: { req: Request; res: Response; env: TrpcContext['env'] }): TrpcContext {
  const demoUserEmail = req.headers['x-demo-user'];
  const currentUser = typeof demoUserEmail === 'string' ? marketplaceStore.findUserByEmail(demoUserEmail) : marketplaceStore.getUser('admin-luis');

  return {
    env,
    currentUser,
    authProvider: createAuthProvider(env.AUTH_PROVIDER, currentUser),
    store: marketplaceStore,
    emailService: createEmailService(env.RESEND_API_KEY),
  };
}