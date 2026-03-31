'use client';

import { useEffect, useState } from 'react';
import { Clock3, MapPinned, PhoneCall, Palette, Store } from 'lucide-react';
import { EmptyState, LoadingSkeleton, Card } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
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
        title="No business assigned"
        description="El rol actual no tiene negocios asociados para administrar en esta simulación."
      />
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Business workspace"
        description="Gestiona branding, contacto, ubicación y estado de publicación desde una superficie operativa, no desde una ficha pública de discovery."
        actions={
          accessibleBusinesses.length > 1 ? (
            <select
              className="h-11 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-primary)] outline-none"
              value={selectedBusiness.id}
              onChange={(event) => setSelectedBusinessId(event.target.value)}
            >
              {accessibleBusinesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          ) : null
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden p-0 hover:translate-y-0">
          <div className="relative h-52 bg-[var(--color-primary)]">
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
                  className="size-20 rounded-[24px] object-cover ring-4 ring-white"
                  src={selectedBusiness.images.profile}
                />
                <div>
                  <h3 className="font-display text-2xl font-semibold text-[var(--color-primary)]">
                    {selectedBusiness.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {selectedBusiness.category.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <StatusBadge status={selectedBusiness.status} />
            </div>

            <p className="text-sm leading-7 text-[var(--color-text-muted)]">
              {selectedBusiness.description}
            </p>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="space-y-3 hover:translate-y-0">
            <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
              <PhoneCall className="size-5" />
            </div>
            <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
              Contact & publishing
            </h3>
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              WhatsApp principal: {selectedBusiness.whatsappNumber}
            </p>
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              Plan actual: {selectedBusiness.subscriptionType.replace('_', ' ')}
            </p>
          </Card>
          <Card className="space-y-3 hover:translate-y-0">
            <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
              <Clock3 className="size-5" />
            </div>
            <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
              Hours
            </h3>
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              Placeholder de horarios operativos para la fase 2.
            </p>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3 hover:translate-y-0">
          <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
            <Palette className="size-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
            Branding
          </h3>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Logo, banner y assets vigentes listos para un futuro editor de
            marca.
          </p>
        </Card>
        <Card className="space-y-3 hover:translate-y-0">
          <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
            <MapPinned className="size-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
            Location
          </h3>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            {selectedBusiness.location.zone}
          </p>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            {selectedBusiness.location.address}
          </p>
        </Card>
        <Card className="space-y-3 hover:translate-y-0">
          <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
            <Store className="size-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
            Publication status
          </h3>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Promos activas: {selectedBusiness.activePromotions.length}
          </p>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Productos destacados: {selectedBusiness.featuredProducts.length}
          </p>
        </Card>
      </section>
    </div>
  );
}
