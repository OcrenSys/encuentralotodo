'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, Plus, Search } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  GhostButton,
  Input,
  LoadingSkeleton,
} from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { useManagementData } from '../../lib/management-data';
import { formatCurrency, formatDateLabel } from 'utils';

export function PromotionsScreen() {
  const { loading, managedPromotions } = useManagementData();
  const [search, setSearch] = useState('');

  const filteredPromotions = useMemo(
    () =>
      managedPromotions.filter((promotion) =>
        [promotion.title, promotion.description, promotion.businessName]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [managedPromotions, search],
  );

  if (loading) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Promociones"
        description="Gestión de campañas activas y expiración comercial. La creación real ya existe en API; esta fase deja lista la superficie de administración para integrarla con formularios posteriores."
        actions={
          <>
            <GhostButton type="button">Ver vencidas</GhostButton>
            <Button type="button">
              <Plus className="mr-2 size-4" />
              Nueva promoción
            </Button>
          </>
        }
      />

      <label className="field-panel flex items-center gap-3 px-4 py-3">
        <Search className="size-4 text-text-muted" />
        <Input
          className="border-0 bg-transparent px-0 shadow-none"
          placeholder="Buscar promociones por negocio o copy comercial"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      {filteredPromotions.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPromotions.map((promotion) => (
            <Card
              className="space-y-4"
              interactive={false}
              key={promotion.id}
              variant="soft"
            >
              <div className="relative h-44 overflow-hidden rounded-md bg-primary">
                <img
                  alt={promotion.title}
                  className="h-full w-full object-cover opacity-85"
                  src={promotion.image}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-text-secondary">
                      {promotion.title}
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">
                      {promotion.businessName}
                    </p>
                  </div>
                  <StatusBadge status="ACTIVE" />
                </div>
                <p className="text-sm leading-6 text-text-muted">
                  {promotion.description}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold text-text-secondary">
                    {formatCurrency(promotion.promoPrice)}
                  </p>
                  <p className="text-text-muted line-through">
                    {formatCurrency(promotion.originalPrice)}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-text-muted">
                  <CalendarClock className="size-4" />
                  {formatDateLabel(promotion.validUntil)}
                </div>
              </div>
              <GhostButton type="button">Editar campaña</GhostButton>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No se encontraron promociones"
          description="Ajusta la búsqueda para encontrar campañas activas en esta vista."
        />
      )}
    </div>
  );
}
