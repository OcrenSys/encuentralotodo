'use client';

import { toast } from 'sonner';
import { Button, Card, EmptyState, LoadingSkeleton } from 'ui';

import { SubscriptionBadge } from '../../components/management/subscription-badge';
import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { useCurrentPlatformUser } from '../../lib/platform-authorization';
import {
  getResponsibleLabel,
  getResponsibleSubLabel,
} from '../../lib/business-presentation';
import { SurfaceTable } from '../../components/management/surface-table';
import { formatBusinessCategoryLabel } from '../../lib/display-labels';
import { trpc } from '../../lib/trpc';

export function ApprovalsScreen() {
  const utils = trpc.useUtils();
  const { currentUser } = useCurrentPlatformUser();
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
        description="Revisión centralizada para cuentas con permisos de plataforma. Aquí se valida la calidad y el estado del negocio antes de publicarlo."
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
                  className="grid grid-cols-5 gap-4 border-b border-border-default px-5 py-4 last:border-b-0 hover:bg-white/70"
                  key={business.id}
                >
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <img
                        alt={business.name}
                        className="size-14 rounded-md object-cover"
                        src={business.images.profile}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text-secondary">
                          {business.name}
                        </p>
                        <p className="mt-1 line-clamp-1 text-sm font-semibold text-text-muted">
                          {formatBusinessCategoryLabel(business.category)}
                        </p>
                        <p className="mt-2 line-clamp-1 text-sm leading-6 text-text-muted">
                          {business.location.zone}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="self-center text-sm text-text-muted">
                    <p className="font-medium text-text-secondary">
                      {getResponsibleLabel(business)}
                    </p>
                    {getResponsibleSubLabel(business) ? (
                      <p className="mt-1 text-xs text-text-muted">
                        {getResponsibleSubLabel(business)}
                      </p>
                    ) : null}
                  </div>
                  <div className="self-center">
                    <SubscriptionBadge
                      subscriptionType={business.subscriptionType}
                    />
                  </div>
                  <div className="self-center">
                    <StatusBadge status={business.status} />
                  </div>
                  <div className="self-center">
                    <Button
                      className="w-full justify-center"
                      disabled={approveBusiness.isPending || !currentUser}
                      onClick={() =>
                        approveBusiness.mutate({ businessId: business.id })
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
              <Card
                className="space-y-4 p-4"
                interactive={false}
                key={business.id}
                variant="soft"
              >
                <img
                  alt={business.name}
                  className="h-40 w-full rounded-md object-cover"
                  src={business.images.banner}
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl font-semibold text-text-secondary">
                      {business.name}
                    </h3>
                    <StatusBadge status={business.status} />
                  </div>
                  <p className="text-sm text-text-muted">
                    {formatBusinessCategoryLabel(business.category)} ·{' '}
                    {business.location.zone}
                  </p>
                  <p className="text-sm text-text-muted">
                    Responsable: {getResponsibleLabel(business)}
                  </p>
                  {getResponsibleSubLabel(business) ? (
                    <p className="text-xs text-text-muted">
                      {getResponsibleSubLabel(business)}
                    </p>
                  ) : null}
                  <p className="text-sm leading-6 text-text-muted">
                    {business.description}
                  </p>
                </div>
                <SubscriptionBadge
                  subscriptionType={business.subscriptionType}
                />
                <Button
                  disabled={approveBusiness.isPending || !currentUser}
                  onClick={() =>
                    approveBusiness.mutate({ businessId: business.id })
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
