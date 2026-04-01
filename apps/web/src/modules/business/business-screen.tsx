'use client';

import { useEffect, useState } from 'react';
import { Clock3, MapPinned, PhoneCall, Palette, Store } from 'lucide-react';
import { Card, EmptyState, LoadingSkeleton, Select } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import {
  formatBusinessCategoryLabel,
  formatSubscriptionLabel,
} from '../../lib/display-labels';
import { useManagementData } from '../../lib/management-data';

export function BusinessScreen() {
  const { accessibleBusinesses, loading } = useManagementData();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');

  useEffect(() => {
    if (!selectedBusinessId && accessibleBusinesses[0]) {
      setSelectedBusinessId(accessibleBusinesses[0].id);
    }
  }, [accessibleBusinesses, selectedBusinessId]);

  const selectedBusiness =
    accessibleBusinesses.find(
      (business) => business.id === selectedBusinessId,
    ) ?? accessibleBusinesses[0];

  if (loading) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  if (!selectedBusiness) {
    return (
      <EmptyState
        title="No tienes un negocio asignado"
        description="El rol actual no tiene negocios asociados para administrar en esta simulación."
      />
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Centro de gestión del negocio"
        description="Administra marca, contacto, ubicación y publicación desde una vista operativa pensada para trabajar rápido y con claridad."
        actions={
          accessibleBusinesses.length > 1 ? (
            <Select
              value={selectedBusiness.id}
              onChange={(event) => setSelectedBusinessId(event.target.value)}
            >
              {accessibleBusinesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </Select>
          ) : null
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          className="overflow-hidden p-0"
          interactive={false}
          variant="soft"
        >
          <div className="relative h-52 bg-primary">
            <img
              alt={selectedBusiness.name}
              className="h-full w-full object-cover opacity-85"
              src={selectedBusiness.images.banner}
            />
          </div>
          <div className="space-y-5 p-5 lg:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <img
                  alt={selectedBusiness.name}
                  className="size-20 rounded-lg object-cover ring-4 ring-white"
                  src={selectedBusiness.images.profile}
                />
                <div>
                  <h3 className="font-display text-2xl font-semibold text-text-secondary">
                    {selectedBusiness.name}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    {formatBusinessCategoryLabel(selectedBusiness.category)}
                  </p>
                </div>
              </div>
              <StatusBadge status={selectedBusiness.status} />
            </div>

            <p className="text-sm leading-7 text-text-muted">
              {selectedBusiness.description}
            </p>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="space-y-3" interactive={false} variant="soft">
            <div className="icon-tile">
              <PhoneCall className="size-5" />
            </div>
            <h3 className="font-display text-xl font-semibold text-text-secondary">
              Contacto y publicación
            </h3>
            <p className="text-sm leading-6 text-text-muted">
              WhatsApp principal: {selectedBusiness.whatsappNumber}
            </p>
            <p className="text-sm leading-6 text-text-muted">
              Plan actual:{' '}
              {formatSubscriptionLabel(selectedBusiness.subscriptionType)}
            </p>
          </Card>
          <Card className="space-y-3" interactive={false} variant="soft">
            <div className="icon-tile">
              <Clock3 className="size-5" />
            </div>
            <h3 className="font-display text-xl font-semibold text-text-secondary">
              Horarios
            </h3>
            <p className="text-sm leading-6 text-text-muted">
              Placeholder de horarios operativos para la fase 2.
            </p>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3" interactive={false} variant="soft">
          <div className="icon-tile">
            <Palette className="size-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-secondary">
            Identidad visual
          </h3>
          <p className="text-sm leading-6 text-text-muted">
            Logo, banner y assets vigentes listos para un futuro editor de
            marca.
          </p>
        </Card>
        <Card className="space-y-3" interactive={false} variant="soft">
          <div className="icon-tile">
            <MapPinned className="size-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-secondary">
            Ubicación
          </h3>
          <p className="text-sm leading-6 text-text-muted">
            {selectedBusiness.location.zone}
          </p>
          <p className="text-sm leading-6 text-text-muted">
            {selectedBusiness.location.address}
          </p>
        </Card>
        <Card className="space-y-3" interactive={false} variant="soft">
          <div className="icon-tile">
            <Store className="size-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-secondary">
            Estado de publicación
          </h3>
          <p className="text-sm leading-6 text-text-muted">
            Promos activas: {selectedBusiness.activePromotions.length}
          </p>
          <p className="text-sm leading-6 text-text-muted">
            Productos destacados: {selectedBusiness.featuredProducts.length}
          </p>
        </Card>
      </section>
    </div>
  );
}
