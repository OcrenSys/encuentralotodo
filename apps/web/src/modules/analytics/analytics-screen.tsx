'use client';

import { BarChart3, ChartColumnIncreasing, TrendingUp } from 'lucide-react';
import { Card } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatCard } from '../../components/management/stat-card';
import { useManagementData } from '../../lib/management-data';

export function AnalyticsScreen() {
  const { accessibleBusinesses, leads, managedPromotions, managedProducts } =
    useManagementData();

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Analytics"
        description="Capa inicial de métricas para dirección y negocio. Los gráficos avanzados quedan preparados como placeholders hasta integrar series reales."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          helper="Negocios visibles dentro del rol actual."
          icon={BarChart3}
          label="Businesses in scope"
          value={accessibleBusinesses.length}
          variant="blue"
        />
        <StatCard
          helper="Productos actualmente visibles en la superficie operativa."
          icon={ChartColumnIncreasing}
          label="Products in scope"
          value={managedProducts.length}
          variant="neutral"
        />
        <StatCard
          helper="Promos activas que impactan conversión."
          icon={TrendingUp}
          label="Active promotions"
          value={managedPromotions.length}
          variant="green"
        />
        <StatCard
          helper="Leads observados por la simulación actual."
          icon={BarChart3}
          label="Tracked leads"
          value={leads.length}
          variant="amber"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4 border-[rgba(140,156,177,0.18)] bg-[linear-gradient(180deg,rgba(250,252,255,0.97),rgba(244,248,252,0.92))] hover:translate-y-0">
          <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
            Revenue / conversion placeholder
          </h3>
          <div className="surface-inset grid h-72 place-items-center rounded-[24px] text-sm text-[var(--color-text-muted)]">
            Próximo paso: conectar series de conversiones, tickets y revenue por
            periodo.
          </div>
        </Card>
        <Card className="space-y-4 border-[rgba(140,156,177,0.18)] bg-[linear-gradient(180deg,rgba(250,252,255,0.97),rgba(244,248,252,0.92))] hover:translate-y-0">
          <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
            Channel performance placeholder
          </h3>
          <div className="surface-inset grid h-72 place-items-center rounded-[24px] text-sm text-[var(--color-text-muted)]">
            Próximo paso: desglosar leads por fuente y eficiencia de campañas.
          </div>
        </Card>
      </section>
    </div>
  );
}
