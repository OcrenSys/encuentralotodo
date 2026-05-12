import { CreditCard, Sparkles } from 'lucide-react';
import { Card } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';

const planCards = [
  {
    title: 'Matriz de planes',
    description:
      'Prueba gratis, Premium y Premium Plus siguen siendo la base actual. El siguiente paso será mostrar límites y beneficios de forma clara.',
    icon: CreditCard,
  },
  {
    title: 'Sugerencias de mejora',
    description:
      'Vista inicial para futuras campañas internas y recomendaciones comerciales según el plan.',
    icon: Sparkles,
  },
];

export function PlansScreen() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Planes"
        description="Módulo inicial para monetización y beneficios. Está preparado para crecer sin complicar esta primera versión."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {planCards.map((card) => {
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
