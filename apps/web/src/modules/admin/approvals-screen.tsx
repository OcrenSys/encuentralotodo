'use client';

import { toast } from 'sonner';
import { Button, Card, EmptyState, LoadingSkeleton } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { SurfaceTable } from '../../components/management/surface-table';
import {
  formatBusinessCategoryLabel,
  formatSubscriptionLabel,
} from '../../lib/display-labels';
import { trpc } from '../../lib/trpc';

function formatOwnerLabel(ownerId: string) {
  return ownerId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function ApprovalsScreen() {
  const utils = trpc.useUtils();
  const pendingQuery = trpc.admin.pendingBusinesses.useQuery();
  const approveBusiness = trpc.admin.approveBusiness.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.pendingBusinesses.invalidate(),
        utils.business.list.invalidate(),
      ]);
      toast.success('Negocio aprobado y sincronizado en la consola.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Cola de aprobaciones"
        description="Revisión centralizada para el administrador general. Aquí se valida la calidad y el estado del negocio antes de publicarlo."
      />

      {pendingQuery.isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton className="h-48" key={index} />
          ))}
        </div>
      ) : pendingQuery.data?.length ? (
        <>
          <div className="hidden lg:block">
            <SurfaceTable
              columns={['Negocio', 'Responsable', 'Plan', 'Estado', 'Acción']}
            >
              {pendingQuery.data.map((business) => (
                <div
                  className="grid grid-cols-5 gap-4 border-b border-[var(--color-border)] px-5 py-4 last:border-b-0 hover:bg-white/70"
                  key={business.id}
                >
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <img
                        alt={business.name}
                        className="size-14 rounded-[18px] object-cover"
                        src={business.images.profile}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--color-primary)]">
                          {business.name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {formatBusinessCategoryLabel(business.category)} ·{' '}
                          {business.location.zone}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">
                          {business.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="self-center text-sm text-[var(--color-text-muted)]">
                    {formatOwnerLabel(business.ownerId)}
                  </div>
                  <div className="self-center text-sm text-[var(--color-text-muted)]">
                    {formatSubscriptionLabel(business.subscriptionType)}
                  </div>
                  <div className="self-center">
                    <StatusBadge status={business.status} />
                  </div>
                  <div className="self-center">
                    <Button
                      className="w-full justify-center"
                      disabled={approveBusiness.isPending}
                      onClick={() =>
                        approveBusiness.mutate({
                          approvedBy: 'admin-luis',
                          businessId: business.id,
                        })
                      }
                    >
                      Aprobar
                    </Button>
                  </div>
                </div>
              ))}
            </SurfaceTable>
          </div>

          <div className="grid gap-4 lg:hidden">
            {pendingQuery.data.map((business) => (
              <Card className="space-y-4 p-4" key={business.id}>
                <img
                  alt={business.name}
                  className="h-40 w-full rounded-[18px] object-cover"
                  src={business.images.banner}
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
                      {business.name}
                    </h3>
                    <StatusBadge status={business.status} />
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {formatBusinessCategoryLabel(business.category)} ·{' '}
                    {business.location.zone}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Responsable: {formatOwnerLabel(business.ownerId)}
                  </p>
                  <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                    {business.description}
                  </p>
                </div>
                <Button
                  disabled={approveBusiness.isPending}
                  onClick={() =>
                    approveBusiness.mutate({
                      approvedBy: 'admin-luis',
                      businessId: business.id,
                    })
                  }
                >
                  Aprobar negocio
                </Button>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No hay aprobaciones pendientes"
          description="La cola está vacía. Los nuevos negocios aparecerán aquí antes de publicarse."
        />
      )}
    </div>
  );
}
