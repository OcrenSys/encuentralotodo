import { BellRing, Globe2, LockKeyhole, Workflow } from 'lucide-react';
import { Card } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';

const settingsSections = [
  {
    title: 'Notifications',
    description: 'Configura avisos operativos, asignación de leads y alertas de aprobación.',
    icon: BellRing,
  },
  {
    title: 'Visibility rules',
    description: 'Ajustes de publicación, revisión y exposición por plan o estado.',
    icon: Globe2,
  },
  {
    title: 'Access control',
    description: 'Placeholder para permisos granulares y reemplazo futuro del role switcher.',
    icon: LockKeyhole,
  },
  {
    title: 'Automation',
    description: 'Workflows futuros para seguimiento, onboarding y reactivación comercial.',
    icon: Workflow,
  },
];

export function SettingsScreen() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Settings"
        description="Centro de configuración operativo. Esta primera iteración define la estructura y la jerarquía de ajustes para reemplazar más adelante la configuración ad hoc del MVP."
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
                <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">{section.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{section.description}</p>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}