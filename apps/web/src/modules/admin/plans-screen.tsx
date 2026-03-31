import { CreditCard, Sparkles } from 'lucide-react';
import { Card } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';

const planCards = [
  {
    title: 'Plan matrix',
    description: 'FREE_TRIAL, PREMIUM y PREMIUM_PLUS continúan como fuente actual. Próximo paso: UI para límites y beneficios por plan.',
    icon: CreditCard,
  },
  {
    title: 'Upgrade prompts',
    description: 'Placeholder para campañas internas de upgrade y recomendaciones comerciales.',
    icon: Sparkles,
  },
];

export function PlansScreen() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Plans"
        description="Módulo inicial de monetización y packaging. Preparado para crecer sin acoplar la consola a decisiones finales de billing."
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
                <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{card.description}</p>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}