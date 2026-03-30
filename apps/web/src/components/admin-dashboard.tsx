'use client';

import { toast } from 'sonner';

import { BottomNavigation, Button, Card, EmptyState, LoadingSkeleton, SectionHeading } from 'ui';

import { trpc } from '../lib/trpc';

export function AdminDashboard() {
  const utils = trpc.useUtils();
  const pendingQuery = trpc.admin.pendingBusinesses.useQuery();
  const approveBusiness = trpc.admin.approveBusiness.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.pendingBusinesses.invalidate(),
        utils.business.list.invalidate(),
      ]);
      toast.success('Negocio aprobado y email disparado.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <main className="space-y-8 px-4 pb-36 pt-6 sm:px-6">
      <SectionHeading
        eyebrow="Admin"
        title="Aprobaciones pendientes"
        description="Cada negocio enviado por usuarios entra aquí antes de quedar visible en discovery."
      />

      {pendingQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <LoadingSkeleton className="h-64" key={index} />
          ))}
        </div>
      ) : pendingQuery.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {pendingQuery.data.map((business) => (
            <Card className="space-y-4" key={business.id}>
              <img alt={business.name} className="h-44 w-full rounded-[20px] object-cover" src={business.images.banner} />
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-semibold text-[var(--color-primary)]">{business.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{business.category.replace('_', ' ')} · {business.location.zone}</p>
                <p className="text-sm leading-7 text-[var(--color-text-muted)]">{business.description}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {business.subscriptionType}
                </div>
                <Button disabled={approveBusiness.isPending} onClick={() => approveBusiness.mutate({ approvedBy: 'admin-luis', businessId: business.id })}>
                  Aprobar negocio
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No hay negocios pendientes" description="Todo lo enviado ya fue aprobado o todavía no se han creado perfiles nuevos." />
      )}

      <BottomNavigation current="profile" />
    </main>
  );
}