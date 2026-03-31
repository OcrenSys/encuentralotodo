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
  return <LoadingSkeleton className="h-32 rounded-[24px]" />;
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
    <Card className="space-y-4 p-4 hover:translate-y-0 hover:shadow-[0_12px_36px_rgba(17,39,60,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="mt-3 font-display text-3xl font-semibold text-[var(--color-primary)]">
            {value}
          </p>
        </div>
        <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="text-sm leading-6 text-[var(--color-text-muted)]">
        {helper}
      </p>
    </Card>
  );
}

export function KpiCards() {
  const pendingQuery = trpc.admin.pendingBusinesses.useQuery();
  const businessQuery = trpc.business.list.useQuery();
  const promotionsQuery = trpc.promotion.listActive.useQuery();
  const sessionQuery = trpc.auth.me.useQuery();

  const isLoading =
    pendingQuery.isLoading ||
    businessQuery.isLoading ||
    promotionsQuery.isLoading ||
    sessionQuery.isLoading;

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
        value={pendingQuery.data?.length ?? 0}
      />
      <KpiCard
        helper="Negocios aprobados y visibles para usuarios finales."
        icon="businesses"
        label="Negocios totales"
        value={businessQuery.data?.length ?? 0}
      />
      <KpiCard
        helper="Promociones activas listas para mostrarse en la vitrina actual."
        icon="promotions"
        label="Promociones activas"
        value={promotionsQuery.data?.length ?? 0}
      />
      <KpiCard
        helper="Sesión demo actual usada para validar permisos y experiencia."
        icon="role"
        label="Rol de la cuenta"
        value={sessionQuery.data?.user?.role ?? 'USER'}
      />
    </section>
  );
}
