'use client';

import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { Toaster } from 'sonner';

import { getApiBaseUrl } from 'config';

import { RoleViewProvider, useRoleView } from '../lib/role-view';
import { trpc } from '../lib/trpc';

function TrpcProviders({ children }: { children: React.ReactNode }) {
  const { roleProfile } = useRoleView();
  const [queryClient] = useState(() => new QueryClient());
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: `${getApiBaseUrl(process.env)}/trpc`,
            headers() {
              return {
                'x-demo-user': roleProfile.email,
              };
            },
          }),
        ],
      }),
    [roleProfile.email],
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
    <RoleViewProvider>
      <TrpcProviders>{children}</TrpcProviders>
    </RoleViewProvider>
  );
}
