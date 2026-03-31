'use client';

import { Card, LoadingSkeleton } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { SurfaceTable } from '../../components/management/surface-table';
import {
  formatBusinessCategoryLabel,
  formatSubscriptionLabel,
} from '../../lib/display-labels';
import { useManagementData } from '../../lib/management-data';

export function AdminBusinessesScreen() {
  const { allBusinesses, loading } = useManagementData();

  if (loading) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Todos los negocios"
        description="Vista global de negocios, responsables y estado de publicación. Está pensada para control y operación diaria."
      />

      <div className="hidden lg:block">
        <SurfaceTable columns={['Negocio', 'Zona', 'Plan', 'Responsable', 'Estado']}>
          {allBusinesses.map((business) => (
            <div className="grid grid-cols-5 gap-4 border-b border-[var(--color-border)] px-5 py-4 last:border-b-0 hover:bg-white/70" key={business.id}>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--color-primary)]">{business.name}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{formatBusinessCategoryLabel(business.category)}</p>
              </div>
              <div className="self-center text-sm text-[var(--color-text-muted)]">{business.location.zone}</div>
              <div className="self-center text-sm text-[var(--color-text-muted)]">{formatSubscriptionLabel(business.subscriptionType)}</div>
              <div className="self-center text-sm text-[var(--color-text-muted)]">{business.ownerId.replace('owner-', '').replace('user-', '').replace('-', ' ')}</div>
              <div className="self-center">
                <StatusBadge status={business.status} />
              </div>
            </div>
          ))}
        </SurfaceTable>
      </div>

      <div className="grid gap-4 lg:hidden">
        {allBusinesses.map((business) => (
          <Card className="space-y-3 hover:translate-y-0" key={business.id}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">{business.name}</h3>
              <StatusBadge status={business.status} />
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">{business.location.zone}</p>
            <p className="text-sm text-[var(--color-text-muted)]">Plan: {formatSubscriptionLabel(business.subscriptionType)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}