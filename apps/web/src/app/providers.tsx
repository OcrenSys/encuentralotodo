'use client';

import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { Toaster } from 'sonner';

import { AuthProvider, useCurrentAuthUser } from '../lib/auth-context';
import { getPublicApiBaseUrl } from '../lib/public-runtime-env';
import { RoleViewProvider } from '../lib/role-view';
import {
  getCurrentAuthorizationHeader,
  getPublicAuthProvider,
} from '../lib/firebase-auth';
import { trpc } from '../lib/trpc';

function TrpcProviders({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useCurrentAuthUser();
  const [queryClient] = useState(() => new QueryClient());
  const authProvider = getPublicAuthProvider();

  useEffect(() => {
    void queryClient.invalidateQueries();
  }, [isAuthenticated, queryClient, user?.uid]);

  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: `${getPublicApiBaseUrl()}/trpc`,
            async headers() {
              if (authProvider === 'firebase') {
                const authorization = await getCurrentAuthorizationHeader();
                return authorization ? { authorization } : {};
              }

              return {};
            },
          }),
        ],
      }),
    [authProvider],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RoleViewProvider>
        <TrpcProviders>{children}</TrpcProviders>
      </RoleViewProvider>
    </AuthProvider>
  );
}
