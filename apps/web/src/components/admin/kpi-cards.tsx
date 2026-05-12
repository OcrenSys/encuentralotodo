'use client';

import { BriefcaseBusiness, Building2, Clock3, Sparkles } from 'lucide-react';

import { Card, LoadingSkeleton } from 'ui';

import { trpc } from '../../lib/trpc';

const kpiIcons = {
  pending: Clock3,
  businesses: Building2,
  promotions: Sparkles,
  role: BriefcaseBusiness,
} as const;

function KpiSkeleton() {
  return <LoadingSkeleton className="h-32 rounded-lg" />;
}

function KpiCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: keyof typeof kpiIcons;
}) {
  const Icon = kpiIcons[icon];

  return (
    <Card className="space-y-4 p-4" interactive={false} variant="soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
            {label}
          </p>
          <p className="mt-3 font-display text-3xl font-semibold text-text-secondary">
            {value}
          </p>
        </div>
        <div className="icon-tile">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="text-sm leading-6 text-text-muted">{helper}</p>
    </Card>
  );
}

export function KpiCards() {
  const analyticsQuery = trpc.analytics.platformOverview.useQuery({
    period: '30D',
  });
  const sessionQuery = trpc.auth.me.useQuery();

  const isLoading = analyticsQuery.isLoading || sessionQuery.isLoading;

  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <KpiSkeleton key={index} />
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        helper="Negocios esperando aprobación antes de aparecer en discovery."
        icon="pending"
        label="Aprobaciones pendientes"
        value={analyticsQuery.data?.summary.pendingBusinesses ?? 0}
      />
      <KpiCard
        helper="Negocios aprobados y visibles para usuarios finales."
        icon="businesses"
        label="Negocios aprobados"
        value={analyticsQuery.data?.summary.totalApprovedBusinesses ?? 0}
      />
      <KpiCard
        helper="Promociones activas listas para mostrarse en la vitrina actual."
        icon="promotions"
        label="Promociones activas"
        value={analyticsQuery.data?.summary.totalActivePromotions ?? 0}
      />
      <KpiCard
        helper="Rol operativo devuelto por la sesión actual del backend para contrastar permisos reales."
        icon="role"
        label="Rol de la cuenta"
        value={sessionQuery.data?.user?.role ?? 'UNASSIGNED'}
      />
    </section>
  );
}
