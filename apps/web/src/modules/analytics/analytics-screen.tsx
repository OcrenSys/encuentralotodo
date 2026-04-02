'use client';

import {
  BarChart3,
  ChartColumnIncreasing,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Card, EmptyState, LoadingSkeleton } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatCard } from '../../components/management/stat-card';
import { useManagementData } from '../../lib/management-data';

export function AnalyticsScreen() {
  const {
    businessAnalytics,
    loading,
    platformAnalytics,
    roleView,
    canViewPlatformData,
    isMockMode,
  } = useManagementData();

  const usesPlatformRoleView = isMockMode
    ? roleView === 'SUPERADMIN'
    : canViewPlatformData;

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-24" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton className="h-32" key={index} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <LoadingSkeleton className="h-72" />
          <LoadingSkeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!isMockMode && !canViewPlatformData) {
    return (
      <EmptyState
        title="Sin acceso a analítica de plataforma"
        description="La analítica real solo usa el rol resuelto por el backend. La analítica por negocio se habilitará cuando exista autorización por membresía de negocio."
      />
    );
  }

  const stats = usesPlatformRoleView
    ? [
        {
          helper: 'Negocios aprobados y visibles para discovery.',
          icon: BarChart3,
          label: 'Negocios aprobados',
          value: platformAnalytics?.summary.totalApprovedBusinesses ?? 0,
          variant: 'blue' as const,
        },
        {
          helper: 'Promociones vigentes con ventana activa.',
          icon: TrendingUp,
          label: 'Promociones activas',
          value: platformAnalytics?.summary.totalActivePromotions ?? 0,
          variant: 'green' as const,
        },
        {
          helper: 'Volumen total de leads persistidos en plataforma.',
          icon: ChartColumnIncreasing,
          label: 'Leads acumulados',
          value: platformAnalytics?.summary.totalLeads ?? 0,
          variant: 'amber' as const,
        },
        {
          helper: 'Promedio real a partir de reviews persistidas.',
          icon: Star,
          label: 'Rating plataforma',
          value: platformAnalytics?.summary.averagePlatformRating ?? 0,
          variant: 'neutral' as const,
        },
      ]
    : [
        {
          helper: 'Total histórico de leads del negocio principal visible.',
          icon: BarChart3,
          label: 'Leads totales',
          value: businessAnalytics?.overview.totalLeads ?? 0,
          variant: 'blue' as const,
        },
        {
          helper: 'Volumen reciente útil para seguimiento comercial.',
          icon: TrendingUp,
          label: 'Leads últimos 30d',
          value: businessAnalytics?.overview.leadsLast30Days ?? 0,
          variant: 'amber' as const,
        },
        {
          helper: 'Reseñas persistidas asociadas al negocio.',
          icon: ChartColumnIncreasing,
          label: 'Reviews',
          value: businessAnalytics?.overview.totalReviews ?? 0,
          variant: 'neutral' as const,
        },
        {
          helper: 'Señal monetizable derivada de actividad real.',
          icon: Star,
          label: 'Engagement score',
          value: businessAnalytics?.monetization.engagementScore ?? 0,
          variant: 'green' as const,
        },
      ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Analítica"
        description="Capa inicial de métricas reales para dirección y negocio, basada solo en actividad persistida y señales monetizables explicables."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {usesPlatformRoleView ? (
          <>
            <Card className="space-y-4 border-[rgba(140,156,177,0.18)] bg-[linear-gradient(180deg,rgba(250,252,255,0.97),rgba(244,248,252,0.92))] hover:translate-y-0">
              <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
                Leaderboard de actividad
              </h3>
              <div className="space-y-3">
                {(platformAnalytics?.businessActivityLeaderboard ?? [])
                  .slice(0, 6)
                  .map((business) => (
                    <div
                      className="surface-inset flex items-center justify-between gap-3 rounded-[20px] p-4"
                      key={business.businessId}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-primary)]">
                          {business.businessName}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {business.leadCount} leads,{' '}
                          {business.activePromotionCount} promos activas, rating{' '}
                          {business.averageRating ?? 'sin data'}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-[var(--color-primary)]">
                        {business.engagementScore}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
            <Card className="space-y-4 border-[rgba(140,156,177,0.18)] bg-[linear-gradient(180deg,rgba(250,252,255,0.97),rgba(244,248,252,0.92))] hover:translate-y-0">
              <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
                Candidatos de monetización
              </h3>
              <div className="space-y-3">
                {(platformAnalytics?.monetizationCandidates ?? [])
                  .slice(0, 6)
                  .map((business) => (
                    <div
                      className="surface-inset rounded-[20px] p-4"
                      key={business.businessId}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--color-primary)]">
                          {business.businessName}
                        </p>
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                          {business.leadVolumeBucket}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                        {business.reasons.join(' · ')}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className="space-y-4 border-[rgba(140,156,177,0.18)] bg-[linear-gradient(180deg,rgba(250,252,255,0.97),rgba(244,248,252,0.92))] hover:translate-y-0">
              <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
                Tendencia reciente de leads
              </h3>
              <div className="space-y-3">
                {(businessAnalytics?.leadTrend ?? [])
                  .slice(-10)
                  .map((point) => (
                    <div
                      className="grid grid-cols-[90px_1fr_36px] items-center gap-3"
                      key={point.date}
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        {point.date.slice(5)}
                      </span>
                      <div className="h-2 rounded-full bg-[var(--color-background)]">
                        <div
                          className="h-2 rounded-full bg-[var(--color-secondary)]"
                          style={{
                            width: `${Math.max(point.count * 18, point.count > 0 ? 12 : 0)}px`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-primary)]">
                        {point.count}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
            <Card className="space-y-4 border-[rgba(140,156,177,0.18)] bg-[linear-gradient(180deg,rgba(250,252,255,0.97),rgba(244,248,252,0.92))] hover:translate-y-0">
              <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
                Señales monetizables del negocio
              </h3>
              <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
                <div className="surface-inset rounded-[20px] p-4">
                  Leads 30d: {businessAnalytics?.overview.leadsLast30Days ?? 0}{' '}
                  · Bucket:{' '}
                  {businessAnalytics?.monetization.leadVolumeBucket ?? 'NONE'}
                </div>
                <div className="surface-inset rounded-[20px] p-4">
                  Promociones:{' '}
                  {businessAnalytics?.overview.totalPromotions ?? 0} · Uso:{' '}
                  {businessAnalytics?.monetization.promotionUsageLevel ??
                    'NONE'}
                </div>
                <div className="surface-inset rounded-[20px] p-4">
                  Reviews: {businessAnalytics?.overview.totalReviews ?? 0} ·
                  Fortaleza:{' '}
                  {businessAnalytics?.monetization.reviewStrength ?? 'NONE'}
                </div>
                <div className="surface-inset rounded-[20px] p-4">
                  {businessAnalytics?.monetization.upsellCandidateReasons.length
                    ? businessAnalytics.monetization.upsellCandidateReasons.join(
                        ' · ',
                      )
                    : 'Sin señales de upsell todavía basadas en la actividad persistida.'}
                </div>
              </div>
            </Card>
          </>
        )}
      </section>
    </div>
  );
}
