import { Layers2, Tags } from 'lucide-react';
import { Card } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';

const categoryCards = [
  {
    title: 'Current categories',
    description: 'GENERAL_STORE, RESTAURANT y SERVICE son la base actual del catálogo. Próximo paso: CRUD editorial y taxonomía expandible.',
    icon: Layers2,
  },
  {
    title: 'Editorial controls',
    description: 'Placeholder para reglas de orden, alias y visibilidad por categoría en la app móvil.',
    icon: Tags,
  },
];

export function CategoriesScreen() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Categories"
        description="Scaffold de gobierno editorial para categorías. Esta pantalla deja listo el módulo sin acoplarlo todavía a mutations que no existen."
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