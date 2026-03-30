'use client';

import { MessageSquareMore } from 'lucide-react';

import { BusinessHero, BottomNavigation, Card, EmptyState, LoadingSkeleton, ProductCard, PromotionCard, SectionHeading, WhatsAppCTA } from 'ui';
import { buildWhatsAppLink, formatDateLabel } from 'utils';
import type { BusinessDetails } from 'types';

import { trpc } from '../lib/trpc';
import { BusinessMapCard } from './business-map-card';

export function BusinessDetailScreen({ businessId }: { businessId: string }) {
  const businessQuery = trpc.business.byId.useQuery({ businessId });
  const business = businessQuery.data as BusinessDetails | undefined;

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
        <EmptyState title="Negocio no encontrado" description="El perfil que buscas no existe o todavía no está aprobado." />
      </main>
    );
  }

  return (
    <main className="space-y-10 px-4 pb-36 pt-6 sm:px-6">
      <BusinessHero business={business} />

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Descripción"
          title="Qué ofrece este negocio"
          description="Perfil pensado para discovery: contexto suficiente para decidir si vale la pena abrir el chat."
        />
        <Card className="space-y-4">
          <p className="text-sm leading-7 text-[var(--color-text-muted)]">{business.description}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] bg-[var(--color-background)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Promociones</p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-primary)]">{business.promotions.length}</p>
            </div>
            <div className="rounded-[20px] bg-[var(--color-background)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Productos visibles</p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-primary)]">{business.products.length}</p>
            </div>
            <div className="rounded-[20px] bg-[var(--color-background)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Estado</p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-primary)]">{business.status}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-5">
        <SectionHeading eyebrow="Productos" title="Catálogo visible" description="El catálogo cambia según el plan del negocio y las reglas del MVP." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {business.products.map((product) => (
            <ProductCard businessName={business.name} key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading eyebrow="Promociones" title="Promos vigentes" description="Ofertas con precio promocional, precio original y vigencia clara." />
        <div className="grid gap-4 md:grid-cols-2">
          {business.promotions.map((promotion) => (
            <PromotionCard businessName={business.name} key={promotion.id} promotion={promotion} />
          ))}
        </div>
      </section>

      <BusinessMapCard business={business} />

      <section className="space-y-5">
        <SectionHeading eyebrow="Reviews" title="Lo que dice la gente" description="Prueba social ligera para ayudar a la conversión sin convertir la app en un e-commerce pesado." />
        <div className="grid gap-4 md:grid-cols-2">
          {business.reviews.map((review) => (
            <Card className="space-y-4" key={review.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--color-primary)]">{review.user?.fullName ?? 'Usuario local'}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{formatDateLabel(review.createdAt)}</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/5 px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">
                  <MessageSquareMore className="size-4" />
                  {review.rating}/5
                </div>
              </div>
              <p className="text-sm leading-7 text-[var(--color-text-muted)]">{review.comment}</p>
            </Card>
          ))}
        </div>
      </section>

      <WhatsAppCTA href={buildWhatsAppLink(business.whatsappNumber, `Hola ${business.name}, vi su perfil y quiero más detalles.`)} floating label="Contactar ahora" />
      <BottomNavigation current="search" />
    </main>
  );
}