'use client';

import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCheck,
  Inbox,
  Megaphone,
  Package,
} from 'lucide-react';
import { Card, LoadingSkeleton } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { QuickActionsPanel } from '../../components/management/quick-actions-panel';
import { StatCard } from '../../components/management/stat-card';
import { StatusBadge } from '../../components/management/status-badge';
import { useManagementData } from '../../lib/management-data';

export function DashboardScreen() {
  const {
    accessibleBusinesses,
    allBusinesses,
    leads,
    loading,
    managedProducts,
    managedPromotions,
    pendingBusinessesQuery,
    platformHealth,
    recentActivity,
    roleView,
    tasks,
  } = useManagementData();

  const stats =
    roleView === 'SUPERADMIN'
      ? [
          {
            label: 'Total businesses',
            value: allBusinesses.length,
            helper:
              'Negocios visibles y pendientes bajo monitoreo de plataforma.',
            icon: Building2,
            variant: 'blue' as const,
          },
          {
            label: 'Pending approvals',
            value: pendingBusinessesQuery.data?.length ?? 0,
            helper:
              'Perfiles que todavía necesitan revisión antes de salir en móvil.',
            icon: CheckCheck,
            variant: 'amber' as const,
          },
          {
            label: 'Active promotions',
            value: managedPromotions.length,
            helper: 'Promociones activas a nivel de plataforma.',
            icon: Megaphone,
            variant: 'green' as const,
          },
          {
            label: 'Platform health',
            value: platformHealth,
            helper: 'Lectura rápida del estado operativo del catálogo.',
            icon: Activity,
            variant: 'neutral' as const,
          },
        ]
      : roleView === 'OWNER'
        ? [
            {
              label: 'Managed businesses',
              value: accessibleBusinesses.length,
              helper: 'Negocios que dependen del owner actual.',
              icon: BriefcaseBusiness,
              variant: 'blue' as const,
            },
            {
              label: 'Featured products',
              value: managedProducts.length,
              helper: 'Productos visibles y listos para mantenimiento.',
              icon: Package,
              variant: 'neutral' as const,
            },
            {
              label: 'Active promotions',
              value: managedPromotions.length,
              helper: 'Campañas vigentes bajo control comercial.',
              icon: Megaphone,
              variant: 'green' as const,
            },
            {
              label: 'Open leads',
              value: leads.filter((lead) => lead.status !== 'CLOSED').length,
              helper: 'Conversaciones y oportunidades por responder.',
              icon: Inbox,
              variant: 'amber' as const,
            },
          ]
        : [
            {
              label: 'Assigned tasks',
              value: tasks.length,
              helper: 'Acciones tácticas asignadas al manager.',
              icon: CheckCheck,
              variant: 'amber' as const,
            },
            {
              label: 'Products to review',
              value: managedProducts.length,
              helper: 'Catálogo que requiere revisión operativa.',
              icon: Package,
              variant: 'neutral' as const,
            },
            {
              label: 'Active promotions',
              value: managedPromotions.length,
              helper: 'Promos que necesitan seguimiento diario.',
              icon: Megaphone,
              variant: 'green' as const,
            },
            {
              label: 'New leads',
              value: leads.filter((lead) => lead.status === 'NEW').length,
              helper: 'Mensajes nuevos esperando primera respuesta.',
              icon: Inbox,
              variant: 'blue' as const,
            },
          ];

  const quickActions =
    roleView === 'SUPERADMIN'
      ? [
          {
            label: 'Review approvals',
            helper:
              'Atiende la cola pendiente y publica solo perfiles completos.',
            href: '/admin/approvals',
            primary: true,
          },
          {
            label: 'Audit business catalog',
            helper: 'Revisa negocios activos y estados de publicación.',
            href: '/admin/businesses',
          },
          {
            label: 'Open reports',
            helper: 'Consulta incidencias de salud y reportes de plataforma.',
            href: '/admin/reports',
          },
        ]
      : roleView === 'OWNER'
        ? [
            {
              label: 'Update business info',
              helper: 'Ajusta branding, contacto, horarios y dirección.',
              href: '/business',
              primary: true,
            },
            {
              label: 'Review leads',
              helper: 'Da seguimiento a mensajes de alto valor.',
              href: '/leads',
            },
            {
              label: 'Launch promotion',
              helper: 'Revisa campañas activas y próximas expiraciones.',
              href: '/promotions',
            },
          ]
        : [
            {
              label: 'Review product queue',
              helper: 'Verifica productos destacados y cambios pendientes.',
              href: '/products',
              primary: true,
            },
            {
              label: 'Handle leads',
              helper: 'Prioriza nuevos contactos con respuesta rápida.',
              href: '/leads',
            },
            {
              label: 'Check business info',
              helper: 'Confirma datos operativos visibles al cliente final.',
              href: '/business',
            },
          ];

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-24" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton className="h-32" key={index} />
          ))}
        </div>
        <LoadingSkeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Role-aware management dashboard"
        description="La entrada principal de la web ahora es un workspace operativo: KPIs, seguimiento y quick actions por rol, sin patrones de marketplace o discovery como experiencia principal."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <QuickActionsPanel items={quickActions} title="Immediate next steps" />

        <Card className="space-y-4 border-[rgba(140,156,177,0.18)] bg-[linear-gradient(180deg,rgba(250,252,255,0.97),rgba(244,248,252,0.92))] hover:translate-y-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                Queue overview
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold text-[var(--color-primary)]">
                Active operational focus
              </h3>
            </div>
            <BarChart3 className="size-5 text-[var(--color-primary)]" />
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                className="interactive-row rounded-[20px] border border-[rgba(140,156,177,0.12)] p-4"
                key={task.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-primary)]">
                    {task.title}
                  </p>
                  <StatusBadge status={task.state} />
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Owner: {task.owner}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4 border-[rgba(140,156,177,0.18)] bg-[linear-gradient(180deg,rgba(250,252,255,0.97),rgba(244,248,252,0.92))] hover:translate-y-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              Recent activity
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-[var(--color-primary)]">
              Operational timeline
            </h3>
          </div>

          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                className="interactive-row rounded-[20px] border border-[rgba(140,156,177,0.12)] p-4"
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-primary)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                      {item.detail}
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 border-[rgba(140,156,177,0.18)] bg-[linear-gradient(180deg,rgba(250,252,255,0.97),rgba(244,248,252,0.92))] hover:translate-y-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              Live summary
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-[var(--color-primary)]">
              What changes with the role switcher
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[22px] bg-[linear-gradient(180deg,#234565_0%,#1c3957_100%)] p-4 text-white shadow-[0_14px_30px_rgba(17,39,60,0.16)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Navigation
              </p>
              <p className="mt-2 text-sm leading-6 text-white/82">
                Sidebar y bottom nav filtran módulos por rol visible, sin
                mezclar flujos de consumidor.
              </p>
            </div>
            <div className="surface-inset rounded-[22px] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                Dashboard payload
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Cada rol recibe KPIs, quick actions y módulos orientados a su
                operación principal.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
