'use client';

import { useState } from 'react';
import { MessageSquareMore } from 'lucide-react';
import { toast } from 'sonner';

import {
  BusinessHero,
  BottomNavigation,
  Button,
  Card,
  EmptyState,
  LoadingSkeleton,
  ProductCard,
  PromotionCard,
  SectionHeading,
  WhatsAppCTA,
} from 'ui';
import { buildWhatsAppLink, formatDateLabel } from 'utils';
import type { BusinessDetails, UserProfile } from 'types';

import { BusinessOwnerSelect } from './business-owner-select';
import {
  formatBusinessCategoryLabel,
  formatStatusLabel,
  formatSubscriptionLabel,
} from '../lib/display-labels';
import { useCurrentUserRole } from '../lib/platform-authorization';
import { isSuperAdminRole } from '../lib/platform-roles';
import { trpc } from '../lib/trpc';
import { BusinessMapCard } from './business-map-card';

function getUserBadgeLabel(
  user: Pick<UserProfile, 'fullName' | 'email' | 'id'>,
) {
  return user.fullName || user.email || user.id;
}

export function BusinessDetailScreen({ businessId }: { businessId: string }) {
  const { role } = useCurrentUserRole();
  const utils = trpc.useUtils();
  const businessQuery = trpc.business.byId.useQuery({ businessId });
  const business = businessQuery.data as BusinessDetails | undefined;
  const canViewRelationships = isSuperAdminRole(role);
  const [transferTargetId, setTransferTargetId] = useState('');

  const transferOwnership = trpc.admin.transferBusinessOwnership.useMutation({
    onSuccess: async (detail) => {
      const invalidations = [
        utils.business.byId.invalidate({ businessId }),
        utils.admin.listUsersPage.invalidate(),
        utils.admin.userById.invalidate({ userId: detail.user.id }),
      ];

      if (business?.ownerId) {
        invalidations.push(
          utils.admin.userById.invalidate({ userId: business.ownerId }),
        );
      }

      await Promise.all(invalidations);
      setTransferTargetId('');
      toast.success('Ownership transferido correctamente.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (businessQuery.isLoading) {
    return (
      <main className="space-y-6 px-4 py-6 sm:px-6">
        <LoadingSkeleton className="h-80" />
        <LoadingSkeleton className="h-56" />
      </main>
    );
  }

  if (!business) {
    return (
      <main className="px-4 py-10 sm:px-6">
        <EmptyState
          title="Negocio no encontrado"
          description="El perfil que buscas no existe o todavía no está aprobado."
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 pb-36 pt-5 sm:px-6 lg:space-y-10 lg:px-8 xl:max-w-[88rem] xl:px-10">
      <BusinessHero business={business} />

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Descripción"
          title="Qué ofrece este negocio"
          description="Información clave para entender el negocio y decidir si quieres contactarlo."
        />
        <Card className="space-y-5 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-6 lg:space-y-0">
          <div className="space-y-4 lg:space-y-5">
            <div className="surface-inset rounded-[24px] p-4 lg:p-5">
              <p className="text-sm leading-7 text-[var(--color-text-muted)] lg:text-[15px]">
                {business.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="surface-panel-soft rounded-[22px] p-4 text-text-secondary">
                <p className="text-xs uppercase tracking-[0.24em] text-text-muted">
                  Categoría
                </p>
                <p className="mt-2 text-base font-semibold text-text-secondary">
                  {formatBusinessCategoryLabel(business.category)}
                </p>
              </div>
              <div className="surface-panel-soft rounded-[22px] p-4 text-text-secondary">
                <p className="text-xs uppercase tracking-[0.24em] text-text-muted">
                  Zona
                </p>
                <p className="mt-2 text-base font-semibold text-text-secondary">
                  {business.location.zone}
                </p>
              </div>
              <div className="surface-panel-soft rounded-[22px] p-4 text-text-secondary sm:col-span-2 xl:col-span-1">
                <p className="text-xs uppercase tracking-[0.24em] text-text-muted">
                  Plan
                </p>
                <p className="mt-2 text-base font-semibold text-text-secondary">
                  {formatSubscriptionLabel(business.subscriptionType)}
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-[22px] bg-[linear-gradient(180deg,rgba(253,247,226,0.98),rgba(255,251,241,0.94))] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                Promociones
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-primary)]">
                {business.promotions.length}
              </p>
            </div>
            <div className="rounded-[22px] bg-[linear-gradient(180deg,rgba(233,242,253,0.98),rgba(246,249,255,0.94))] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                Productos visibles
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-primary)]">
                {business.products.length}
              </p>
            </div>
            <div className="rounded-[22px] bg-[linear-gradient(180deg,rgba(232,248,243,0.98),rgba(245,251,249,0.94))] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                Estado
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-primary)]">
                {formatStatusLabel(business.status)}
              </p>
            </div>
          </div>
        </Card>
      </section>

      {canViewRelationships ? (
        <section className="space-y-5">
          <SectionHeading
            eyebrow="Relaciones"
            title="Usuarios vinculados al comercio"
            description="Vista administrativa inicial de ownership y managers. Por ahora solo aparece para SuperAdmin, pero queda lista para extenderse a owners más adelante."
          />
          <Card className="space-y-5 lg:grid lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)] lg:gap-6 lg:space-y-0">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                Owner actual
              </p>
              {business.owner ? (
                <div className="surface-inset space-y-4 rounded-[22px] p-4">
                  <p className="font-semibold text-[var(--color-primary)]">
                    {getUserBadgeLabel(business.owner)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {business.owner.email}
                  </p>
                  <div className="space-y-3 border-t border-border-subtle pt-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                      Transferir ownership
                    </p>
                    <p className="text-sm text-text-muted">
                      Cambia el owner principal del comercio y mantiene la
                      compatibilidad con ownerId para el resto del sistema.
                    </p>
                    <BusinessOwnerSelect
                      canSearchOwners={canViewRelationships}
                      disabled={transferOwnership.isPending}
                      onSelect={(user) => setTransferTargetId(user.id)}
                      value={transferTargetId}
                    />
                    <Button
                      className="w-full"
                      disabled={
                        !transferTargetId ||
                        transferTargetId === business.ownerId ||
                        transferOwnership.isPending
                      }
                      onClick={() =>
                        transferOwnership.mutate({
                          businessId: business.id,
                          fromUserId: business.ownerId,
                          toUserId: transferTargetId,
                        })
                      }
                      type="button"
                    >
                      {transferOwnership.isPending
                        ? 'Transfiriendo...'
                        : 'Transferir owner desde este comercio'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="surface-inset rounded-[22px] p-4 text-sm text-[var(--color-text-muted)]">
                  No hay owner resuelto para este negocio.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                Managers asociados
              </p>
              {business.managersDetailed.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {business.managersDetailed.map((manager) => (
                    <div
                      className="surface-inset rounded-[22px] p-4"
                      key={manager.id}
                    >
                      <p className="font-semibold text-[var(--color-primary)]">
                        {getUserBadgeLabel(manager)}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {manager.email}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="surface-inset rounded-[22px] p-4 text-sm text-[var(--color-text-muted)]">
                  Este negocio no tiene managers vinculados todavía.
                </div>
              )}
            </div>
          </Card>
        </section>
      ) : null}

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Productos"
          title="Catálogo visible"
          description="Estos son los productos que el negocio tiene visibles en este momento."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {business.products.map((product) => (
            <ProductCard
              businessName={business.name}
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Promociones"
          title="Promos vigentes"
          description="Ofertas activas con su precio especial y fecha de vigencia."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {business.promotions.map((promotion) => (
            <PromotionCard
              businessName={business.name}
              key={promotion.id}
              promotion={promotion}
            />
          ))}
        </div>
      </section>

      <BusinessMapCard business={business} />

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Reseñas"
          title="Lo que dice la gente"
          description="Opiniones reales para ayudar a tomar una decisión con más confianza."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {business.reviews.map((review) => (
            <Card className="space-y-4" key={review.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--color-primary)]">
                    {review.user?.fullName ?? 'Usuario local'}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                    {formatDateLabel(review.createdAt)}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/5 px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">
                  <MessageSquareMore className="size-4" />
                  {review.rating}/5
                </div>
              </div>
              <p className="text-sm leading-7 text-[var(--color-text-muted)]">
                {review.comment}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <WhatsAppCTA
        href={buildWhatsAppLink(
          business.whatsappNumber,
          `Hola ${business.name}, vi su perfil y quiero más detalles.`,
        )}
        floating
        label="Contactar ahora"
      />
      <BottomNavigation current="search" />
    </main>
  );
}
