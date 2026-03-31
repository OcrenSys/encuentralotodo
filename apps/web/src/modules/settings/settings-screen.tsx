import { BellRing, Globe2, LockKeyhole, Workflow } from 'lucide-react';
import { Card } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';

const settingsSections = [
  {
    title: 'Notificaciones',
    description:
      'Configura avisos operativos, asignación de leads y alertas de aprobación.',
    icon: BellRing,
  },
  {
    title: 'Reglas de visibilidad',
    description:
      'Ajustes de publicación, revisión y exposición por plan o estado.',
    icon: Globe2,
  },
  {
    title: 'Control de acceso',
    description:
      'Vista inicial para permisos más detallados y una futura gestión real de roles.',
    icon: LockKeyhole,
  },
  {
    title: 'Automatización',
    description:
      'Flujos futuros para seguimiento, incorporación y reactivación comercial.',
    icon: Workflow,
  },
];

export function SettingsScreen() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Configuración"
        description="Centro de ajustes operativos. Esta primera versión organiza mejor las opciones clave para que resulten claras desde el inicio."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card className="space-y-4 hover:translate-y-0" key={section.title}>
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
                  {section.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {section.description}
                </p>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
