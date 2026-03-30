import { z } from 'zod';

const serverEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().optional(),
    DATA_MODE: z.enum(['memory', 'prisma']).default('memory'),
    AUTH_PROVIDER: z.enum(['mock', 'firebase', 'cognito']).default('mock'),
    RESEND_API_KEY: z.string().optional(),
    GOOGLE_MAPS_API_KEY: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    FIREBASE_PROJECT_ID: z.string().optional(),
    COGNITO_USER_POOL_ID: z.string().optional(),
    COGNITO_CLIENT_ID: z.string().optional(),
});

const publicEnvSchema = z.object({
    NEXT_PUBLIC_API_URL: z.string().default('http://localhost:4000'),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
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