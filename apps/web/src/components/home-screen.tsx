'use client';

import type { ReactNode } from 'react';
import { useDeferredValue, useState } from 'react';
import { ArrowRight, Percent, Plus, ShieldCheck, Store, UtensilsCrossed, Wrench } from 'lucide-react';

import type { BusinessCategory, Promotion } from 'types';
import {
  BottomNavigation,
  BusinessCard,
  CategoryChip,
  EmptyState,
  FilterDrawer,
  FilterToggle,
  LoadingSkeleton,
  ProductCard,
  PromotionCard,
  SearchBar,
  SectionHeading,
  TopSearchHeader,
  WhatsAppCTA,
  Button,
  GhostButton,
} from 'ui';
import { buildWhatsAppLink } from 'utils';

import { trpc } from '../lib/trpc';

const categories: Array<{ key: BusinessCategory | 'ALL'; label: string; icon: ReactNode }> = [
  { key: 'ALL', label: 'Todo', icon: <Store className="size-4" /> },
  { key: 'GENERAL_STORE', label: 'Tiendas', icon: <Store className="size-4" /> },
  { key: 'RESTAURANT', label: 'Comida', icon: <UtensilsCrossed className="size-4" /> },
  { key: 'SERVICE', label: 'Servicios', icon: <Wrench className="size-4" /> },
];

export function MarketplaceHomeScreen() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | 'ALL'>('ALL');
  const [promosOnly, setPromosOnly] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const businessQuery = trpc.business.list.useQuery({
    search: deferredSearch || undefined,
    category: selectedCategory,
    promosOnly,
    maxDistanceKm,
  });
  const promotionsQuery = trpc.promotion.listActive.useQuery();
  const sessionQuery = trpc.auth.me.useQuery();

  const businesses = (businessQuery.data ?? []) as Array<import('types').BusinessSummary>;
  const promotions = (promotionsQuery.data ?? []) as Promotion[];
  const spotlightBusiness = businesses[0];
  const featuredProducts = businesses.flatMap((business) =>
    business.featuredProducts.map((product) => ({
      businessName: business.name,
      product,
    }))
  );

  return (
    <main className="relative min-h-screen pb-36">
      <TopSearchHeader>
        <SearchBar value={search} onChange={setSearch} onOpenFilters={() => setDrawerOpen(true)} />
      </TopSearchHeader>

      <section className="px-4 pb-8 pt-2 sm:px-6">
        <div className="soft-panel market-grid overflow-hidden rounded-[32px] border border-white/70 px-5 py-6 shadow-card sm:px-8 sm:py-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex rounded-full bg-[var(--color-secondary)]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-secondary)]">
                Discovery local con conversión real
              </span>
              <div className="space-y-3">
                <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--color-primary)] sm:text-6xl">
                  Encuentra lo que necesitas cerca y conviértelo en un chat.
                </h1>
                <p className="max-w-xl text-base leading-7 text-[var(--color-text-muted)]">
                  Negocios, productos y promociones listos para explorarse rápido en móvil y cerrar por WhatsApp sin fricción.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="/submit-business">
                  <Button className="gap-2">
                    <Plus className="size-4" />
                    Crear negocio
                  </Button>
                </a>
                <a href="/admin">
                  <GhostButton className="gap-2">
                    <ShieldCheck className="size-4" />
                    Aprobar publicaciones
                  </GhostButton>
                </a>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[440px]">
              {[
                { label: 'Negocios aprobados', value: businesses.length },
                { label: 'Promociones activas', value: promotionsQuery.data?.length ?? 0 },
                { label: 'Rol demo', value: sessionQuery.data?.user?.role ?? 'USER' },
              ].map((metric) => (
                <div className="rounded-[24px] bg-white/75 p-4" key={metric.label}>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{metric.label}</p>
                  <p className="mt-3 font-display text-3xl font-semibold text-[var(--color-primary)]">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-10 px-4 sm:px-6">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {categories.map((category) => (
            <CategoryChip
              active={selectedCategory === category.key}
              icon={category.icon}
              key={category.key}
              label={category.label}
              onClick={() => setSelectedCategory(category.key)}
            />
          ))}
        </div>

        <section className="space-y-5">
          <SectionHeading
            eyebrow="Promociones"
            title="Ofertas listas para convertir"
            description="Selección activa orientada a discovery rápido y contacto inmediato."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {promotionsQuery.isLoading
              ? Array.from({ length: 2 }).map((_, index) => <LoadingSkeleton className="h-72" key={index} />)
              : promotions.map((promotion) => {
                  const businessName = businesses.find((business) => business.id === promotion.businessId)?.name ?? 'Negocio local';
                  return <PromotionCard businessName={businessName} key={promotion.id} promotion={promotion} />;
                })}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Discovery"
              title="Negocios que ya pueden recibir mensajes"
              description="Cards rápidas para escanear categoría, rating, zona y promoción sin entrar a un checkout tradicional."
            />
            {spotlightBusiness ? (
              <a className="hidden items-center gap-2 text-sm font-semibold text-[var(--color-primary)] sm:inline-flex" href={`/business/${spotlightBusiness.id}`}>
                Abrir destacado
                <ArrowRight className="size-4" />
              </a>
            ) : null}
          </div>
          {businessQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <LoadingSkeleton className="h-[360px]" key={index} />
              ))}
            </div>
          ) : businesses.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {businesses.map((business) => (
                <BusinessCard business={business} key={business.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No hay resultados con estos filtros"
              description="Prueba cambiando categoría, ampliando distancia o quitando el filtro de promociones."
            />
          )}
        </section>

        <section className="space-y-5 pb-10">
          <SectionHeading
            eyebrow="Productos"
            title="Vitrina destacada"
            description="Los productos visibles respetan el plan del negocio: destacados para FREE, catálogo limitado para PREMIUM y completo para PREMIUM_PLUS."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.slice(0, 4).map((item) => (
              <ProductCard businessName={item.businessName} key={item.product.id} product={item.product} />
            ))}
          </div>
        </section>
      </section>

      <FilterDrawer
        content={
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Categoría</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <FilterToggle
                    active={selectedCategory === category.key}
                    key={category.key}
                    label={category.label}
                    onClick={() => setSelectedCategory(category.key)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Distancia</p>
              <div className="flex flex-wrap gap-2">
                {[undefined, 3, 5, 10].map((distance) => (
                  <FilterToggle
                    active={maxDistanceKm === distance}
                    key={distance ?? 'all'}
                    label={distance ? `Hasta ${distance} km` : 'Sin límite'}
                    onClick={() => setMaxDistanceKm(distance)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[var(--color-primary)]">Promociones</p>
              <FilterToggle active={promosOnly} label="Solo negocios con promos" onClick={() => setPromosOnly((value) => !value)} />
            </div>
          </div>
        }
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {spotlightBusiness ? (
        <WhatsAppCTA
          floating
          href={buildWhatsAppLink(spotlightBusiness.whatsappNumber, `Hola ${spotlightBusiness.name}, quiero ver sus promociones.`)}
          label="WhatsApp rápido"
        />
      ) : null}

      <BottomNavigation current="home" />
    </main>
  );
}