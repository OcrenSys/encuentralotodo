'use client';

import { toast } from 'sonner';

import { Button, Card, EmptyState, LoadingSkeleton, SectionHeading } from 'ui';

import { trpc } from '../lib/trpc';
import { StatusBadge } from './management/status-badge';
import { AppShell } from './layout/app-shell';
import { KpiCards } from './admin/kpi-cards';

function formatOwnerLabel(ownerId: string) {
  return ownerId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

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
    <AppShell activePath="/admin/approvals">
      <div className="space-y-6">
        <KpiCards />

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Admin"
            title="Pending approvals"
            description="Revisa nuevos negocios, valida la calidad del perfil y aprueba solo lo que ya está listo para operar en discovery."
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
                <Card
                  className="overflow-hidden p-0"
                  interactive={false}
                  variant="soft"
                >
                  <div className="surface-inset grid grid-cols-[minmax(0,2fr)_minmax(180px,1.1fr)_130px_160px] gap-4 rounded-none border-x-0 border-t-0 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                    <span>Business</span>
                    <span>Owner</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  <div>
                    {pendingQuery.data.map((business) => (
                      <div
                        className="grid grid-cols-[minmax(0,2fr)_minmax(180px,1.1fr)_130px_160px] gap-4 border-b border-border-default px-5 py-4 last:border-b-0 hover:bg-white/70"
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
                              <p className="mt-1 text-sm text-text-muted">
                                {business.category.replace('_', ' ')} ·{' '}
                                {business.location.zone}
                              </p>
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-muted">
                                {business.description}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="self-center">
                          <p className="font-medium text-text-secondary">
                            {formatOwnerLabel(business.ownerId)}
                          </p>
                          <p className="mt-1 text-sm text-text-muted">
                            {business.subscriptionType.replace('_', ' ')}
                          </p>
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
                                businessId: business.id,
                              })
                            }
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
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
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-display text-xl font-semibold text-text-secondary">
                          {business.name}
                        </h3>
                        <StatusBadge status={business.status} />
                      </div>
                      <p className="text-sm text-text-muted">
                        {business.category.replace('_', ' ')} ·{' '}
                        {business.location.zone}
                      </p>
                      <p className="text-sm text-text-muted">
                        Owner: {formatOwnerLabel(business.ownerId)}
                      </p>
                      <p className="text-sm leading-6 text-text-muted">
                        {business.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="badge-base badge-info normal-case tracking-normal">
                        {business.subscriptionType.replace('_', ' ')}
                      </div>
                      <Button
                        disabled={approveBusiness.isPending}
                        onClick={() =>
                          approveBusiness.mutate({ businessId: business.id })
                        }
                      >
                        Approve
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="No pending businesses"
              description="Todo lo enviado ya fue aprobado o todavía no se han creado perfiles nuevos."
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
