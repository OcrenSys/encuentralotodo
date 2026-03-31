import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';

const reportCards = [
  {
    title: 'Incidentes de plataforma',
    description:
      'Vista inicial para alertas de calidad, moderación y fallas de integridad en el catálogo.',
    icon: AlertTriangle,
  },
  {
    title: 'Salud operativa',
    description:
      'Vista inicial para seguimiento de aprobaciones, carga acumulada y actividad crítica.',
    icon: ShieldAlert,
  },
];

export function ReportsScreen() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Reportes"
        description="Superficie inicial para incidentes, backlog y salud de la plataforma. El objetivo es separar claramente la operación interna del antiguo feed público."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card className="space-y-4 hover:translate-y-0" key={card.title}>
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {card.description}
                </p>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
