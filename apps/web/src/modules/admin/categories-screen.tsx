import { Layers2, Tags } from 'lucide-react';
import { Card } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';

const categoryCards = [
  {
    title: 'Categorías actuales',
    description:
      'Tienda general, restaurante y servicios son la base actual del catálogo. El siguiente paso será ampliar y ordenar esta estructura.',
    icon: Layers2,
  },
  {
    title: 'Controles editoriales',
    description:
      'Vista inicial para definir orden, nombres alternativos y visibilidad por categoría en la app móvil.',
    icon: Tags,
  },
];

export function CategoriesScreen() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Categorías"
        description="Módulo inicial para ordenar y gobernar las categorías del catálogo sin complicar todavía la operación."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {categoryCards.map((card) => {
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
