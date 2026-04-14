import type { Request } from 'express';
import { TRPCError } from '@trpc/server';

import { AuthTokenVerificationError, type AuthProvider, type AuthProviderName, type VerifiedIdentity } from 'auth';

function readAuthorizationToken(request: Request) {
    const authorizationHeader = request.headers.authorization;
    if (!authorizationHeader) {
        return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
        return null;
    }

    return token.trim();
}

function readMockToken(request: Request) {
    const demoUserHeader = request.headers['x-demo-user'];
    return typeof demoUserHeader === 'string' ? demoUserHeader.trim() : null;
}

export async function resolveVerifiedRequestIdentity(input: {
    request: Request;
    authProviderName: AuthProviderName;
    authProvider: AuthProvider;
}): Promise<VerifiedIdentity | null> {
    const idToken =
        input.authProviderName === 'mock'
            ? readMockToken(input.request) ?? readAuthorizationToken(input.request)
            : readAuthorizationToken(input.request);

    if (!idToken) {
        return null;
    }

    try {
        return await input.authProvider.verifyIdToken(idToken);
    } catch (error) {
        if (error instanceof AuthTokenVerificationError) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Invalid authentication token.',
            });
        }

        throw error;
    }
}