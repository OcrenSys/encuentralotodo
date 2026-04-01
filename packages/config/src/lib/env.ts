import { z } from 'zod';

const serverEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    API_PORT: z.coerce.number().default(4000),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().optional(),
    DATA_MODE: z.enum(['memory', 'prisma']).default('memory'),
    AUTH_PROVIDER: z.enum(['mock', 'firebase', 'cognito']).default('mock'),
    RESEND_API_KEY: z.string().optional(),
    GOOGLE_MAPS_API_KEY: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
    COGNITO_USER_POOL_ID: z.string().optional(),
    COGNITO_CLIENT_ID: z.string().optional(),
}).superRefine((env, ctx) => {
    if ((env.DATA_MODE === 'prisma' || env.AUTH_PROVIDER !== 'mock') && !env.DATABASE_URL) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'DATABASE_URL is required when DATA_MODE=prisma or AUTH_PROVIDER is not mock.',
            path: ['DATABASE_URL'],
        });
    }

    if (env.AUTH_PROVIDER !== 'mock' && env.DATA_MODE !== 'prisma') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Real auth providers require DATA_MODE=prisma so local users can be resolved in the database.',
            path: ['DATA_MODE'],
        });
    }

    if (env.AUTH_PROVIDER !== 'firebase') {
        return;
    }

    if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const hasAnyExplicitCredential = Boolean(env.FIREBASE_CLIENT_EMAIL || env.FIREBASE_PRIVATE_KEY || env.FIREBASE_PROJECT_ID);

        if (hasAnyExplicitCredential && !env.FIREBASE_PROJECT_ID) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'FIREBASE_PROJECT_ID is required when using explicit Firebase Admin credentials.',
                path: ['FIREBASE_PROJECT_ID'],
            });
        }

        if (hasAnyExplicitCredential && !env.FIREBASE_CLIENT_EMAIL) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'FIREBASE_CLIENT_EMAIL is required when using explicit Firebase Admin credentials.',
                path: ['FIREBASE_CLIENT_EMAIL'],
            });
        }

        if (hasAnyExplicitCredential && !env.FIREBASE_PRIVATE_KEY) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'FIREBASE_PRIVATE_KEY is required when using explicit Firebase Admin credentials.',
                path: ['FIREBASE_PRIVATE_KEY'],
            });
        }
    }
});

const publicEnvSchema = z.object({
    NEXT_PUBLIC_API_URL: z.string().default('http://localhost:4000'),
    NEXT_PUBLIC_AUTH_PROVIDER: z.enum(['mock', 'firebase', 'cognito']).default('mock'),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
}).superRefine((env, ctx) => {
    if (env.NEXT_PUBLIC_AUTH_PROVIDER !== 'firebase') {
        return;
    }

    const requiredFields = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_FIREBASE_APP_ID',
    ] as const;

    requiredFields.forEach((fieldName) => {
        if (!env[fieldName]) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${fieldName} is required when NEXT_PUBLIC_AUTH_PROVIDER=firebase.`,
                path: [fieldName],
            });
        }
    });
});

export function parseServerEnv(env: Record<string, string | undefined>) {
    return serverEnvSchema.parse(env);
}

export function parsePublicEnv(env: Record<string, string | undefined>) {
    return publicEnvSchema.parse(env);
}

export function getApiBaseUrl(env: Record<string, string | undefined>) {
    return parsePublicEnv(env).NEXT_PUBLIC_API_URL;
}