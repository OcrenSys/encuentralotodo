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
            label: 'Negocios totales',
            value: allBusinesses.length,
            helper:
              'Negocios visibles y pendientes bajo monitoreo de plataforma.',
            icon: Building2,
            variant: 'blue' as const,
          },
          {
            label: 'Aprobaciones pendientes',
            value: pendingBusinessesQuery.data?.length ?? 0,
            helper:
              'Perfiles que todavía necesitan revisión antes de salir en móvil.',
            icon: CheckCheck,
            variant: 'amber' as const,
          },
          {
            label: 'Promociones activas',
            value: managedPromotions.length,
            helper: 'Promociones activas a nivel de plataforma.',
            icon: Megaphone,
            variant: 'green' as const,
          },
          {
            label: 'Salud de la plataforma',
            value: platformHealth,
            helper: 'Lectura rápida del estado operativo del catálogo.',
            icon: Activity,
            variant: 'neutral' as const,
          },
        ]
      : roleView === 'OWNER'
        ? [
            {
              label: 'Negocios a cargo',
              value: accessibleBusinesses.length,
              helper: 'Negocios que dependen del propietario actual.',
              icon: BriefcaseBusiness,
              variant: 'blue' as const,
            },
            {
              label: 'Productos destacados',
              value: managedProducts.length,
              helper: 'Productos visibles y listos para mantenimiento.',
              icon: Package,
              variant: 'neutral' as const,
            },
            {
              label: 'Promociones activas',
              value: managedPromotions.length,
              helper: 'Campañas vigentes bajo control comercial.',
              icon: Megaphone,
              variant: 'green' as const,
            },
            {
              label: 'Contactos abiertos',
              value: leads.filter((lead) => lead.status !== 'CLOSED').length,
              helper: 'Conversaciones y oportunidades por responder.',
              icon: Inbox,
              variant: 'amber' as const,
            },
          ]
        : [
            {
              label: 'Tareas asignadas',
              value: tasks.length,
              helper: 'Acciones tácticas asignadas al encargado.',
              icon: CheckCheck,
              variant: 'amber' as const,
            },
            {
              label: 'Productos por revisar',
              value: managedProducts.length,
              helper: 'Catálogo que requiere revisión operativa.',
              icon: Package,
              variant: 'neutral' as const,
            },
            {
              label: 'Promociones activas',
              value: managedPromotions.length,
              helper: 'Promos que necesitan seguimiento diario.',
              icon: Megaphone,
              variant: 'green' as const,
            },
            {
              label: 'Contactos nuevos',
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
            label: 'Revisar aprobaciones',
            helper:
              'Atiende la cola pendiente y publica solo perfiles completos.',
            href: '/admin/approvals',
            primary: true,
          },
          {
            label: 'Revisar catálogo de negocios',
            helper: 'Revisa negocios activos y estados de publicación.',
            href: '/admin/businesses',
          },
          {
            label: 'Ver reportes',
            helper: 'Consulta incidencias de salud y reportes de plataforma.',
            href: '/admin/reports',
          },
        ]
      : roleView === 'OWNER'
        ? [
            {
              label: 'Actualizar negocio',
              helper: 'Ajusta branding, contacto, horarios y dirección.',
              href: '/business',
              primary: true,
            },
            {
              label: 'Revisar contactos',
              helper: 'Da seguimiento a mensajes de alto valor.',
              href: '/leads',
            },
            {
              label: 'Lanzar promoción',
              helper: 'Revisa campañas activas y próximas expiraciones.',
              href: '/promotions',
            },
          ]
        : [
            {
              label: 'Revisar productos',
              helper: 'Verifica productos destacados y cambios pendientes.',
              href: '/products',
              primary: true,
            },
            {
              label: 'Atender contactos',
              helper: 'Prioriza nuevos contactos con respuesta rápida.',
              href: '/leads',
            },
            {
              label: 'Revisar negocio',
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
        title="Panel de gestión por rol"
        description="La entrada principal de la web ahora es un centro operativo con indicadores, seguimiento y acciones rápidas según el rol."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <QuickActionsPanel items={quickActions} title="Siguientes pasos" />

        <Card className="space-y-4" interactive={false} variant="soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
                Resumen de tareas
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary">
                Prioridades operativas
              </h3>
            </div>
            <BarChart3 className="size-5 text-text-secondary" />
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div className="interactive-row p-4" key={task.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text-secondary">
                    {task.title}
                  </p>
                  <StatusBadge status={task.state} />
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  Responsable: {task.owner}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4" interactive={false} variant="soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
              Actividad reciente
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary">
              Línea de tiempo operativa
            </h3>
          </div>

          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div className="interactive-row p-4" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-secondary">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-text-muted">
                      {item.detail}
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4" interactive={false} variant="soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
              Resumen en vivo
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary">
              Qué cambia según el rol visible
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-md bg-primary p-4 text-white shadow-md">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Navegación
              </p>
              <p className="mt-2 text-sm leading-6 text-white/82">
                Sidebar y bottom nav filtran módulos por rol visible, sin
                mezclar flujos de consumidor.
              </p>
            </div>
            <div className="surface-inset p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                Contenido del panel
              </p>
              <p className="mt-2 text-sm leading-6 text-text-muted">
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
