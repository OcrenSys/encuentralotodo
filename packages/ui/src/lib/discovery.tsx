'use client';

import type { ReactNode } from 'react';
import { MapPin, MessageCircle, Search, SlidersHorizontal, Star, Store, Tag } from 'lucide-react';

import type { BusinessDetails, BusinessSummary, Product, Promotion } from 'types';
import { buildMapsLink, buildWhatsAppLink, cn, formatCurrency, formatDateLabel, formatRelativeDistance, formatRating } from 'utils';

import { Badge, Button, Card, GhostButton } from './primitives';

export function CategoryChip({
  active,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150',
        active
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
          : 'border-[var(--color-border)] bg-white text-[var(--color-primary)] hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]'
      )}
      onClick={onClick}
      type="button"
    >
      <span className="size-4">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export function SearchBar({
  value,
  onChange,
  onOpenFilters,
}: {
  value: string;
  onChange: (value: string) => void;
  onOpenFilters: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/90 p-2 shadow-[0_12px_36px_rgba(17,39,60,0.08)] backdrop-blur-sm">
      <div className="flex flex-1 items-center gap-3 rounded-full px-3">
        <Search className="size-4 text-[var(--color-text-muted)]" />
        <input
          className="h-10 w-full bg-transparent text-sm text-[var(--color-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
          placeholder="Busca negocios, productos o promociones"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <button
        className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-primary)] transition-transform hover:scale-105"
        onClick={onOpenFilters}
        type="button"
      >
        <SlidersHorizontal className="size-4" />
      </button>
    </div>
  );
}

export function BusinessCard({ business }: { business: BusinessSummary }) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="relative h-40 overflow-hidden rounded-[20px]">
        <img alt={business.name} className="h-full w-full object-cover" src={business.images.banner} />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          {business.activePromotions.length > 0 ? <Badge>{business.activePromotions.length} promos</Badge> : null}
          {business.promoBadge ? <Badge className="bg-[var(--color-secondary)] text-white">{business.promoBadge}</Badge> : null}
        </div>
      </div>
      <div className="flex items-start gap-3">
        <img alt={`${business.name} logo`} className="size-14 rounded-2xl object-cover ring-4 ring-white" src={business.images.profile} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-[var(--color-primary)]">{business.name}</h3>
            <div className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/5 px-2 py-1 text-xs font-semibold text-[var(--color-primary)]">
              <Star className="size-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
              {formatRating(business.rating || 0)}
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">{business.category.replace('_', ' ')}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {business.location.zone}
            </span>
            <span>{formatRelativeDistance(business.distanceKm)}</span>
            <span>{business.reviewCount} reseñas</span>
          </div>
        </div>
      </div>
      <p className="line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">{business.description}</p>
      <div className="mt-auto flex gap-2">
        <a className="flex-1" href={`/business/${business.id}`}>
          <Button className="w-full">Ver negocio</Button>
        </a>
        <a href={buildWhatsAppLink(business.whatsappNumber, `Hola ${business.name}, te encontré en EncuentraloTodo.`)} rel="noreferrer" target="_blank">
          <GhostButton aria-label={`Contactar ${business.name} por WhatsApp`}>
            <MessageCircle className="size-4" />
          </GhostButton>
        </a>
      </div>
    </Card>
  );
}

export function PromotionCard({
  businessName,
  promotion,
}: {
  businessName: string;
  promotion: Promotion;
}) {
  return (
    <Card className="flex h-full flex-col gap-4 bg-[var(--color-primary)] text-white">
      <div className="relative h-40 overflow-hidden rounded-[20px]">
        <img alt={promotion.title} className="h-full w-full object-cover opacity-85" src={promotion.image} />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <Badge>{formatDateLabel(promotion.validUntil)}</Badge>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{businessName}</span>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-xl font-semibold">{promotion.title}</h3>
        <p className="text-sm leading-6 text-white/78">{promotion.description}</p>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-[var(--color-accent)]">{formatCurrency(promotion.promoPrice)}</p>
          <p className="text-sm text-white/58 line-through">{formatCurrency(promotion.originalPrice)}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-sm font-medium">
          <Tag className="size-4" />
          Promo activa
        </div>
      </div>
    </Card>
  );
}

export function ProductCard({
  businessName,
  product,
}: {
  businessName: string;
  product: Product;
}) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="grid h-40 grid-cols-3 gap-2 overflow-hidden rounded-[20px] bg-[var(--color-background)]">
        {product.images.slice(0, 3).map((image, index) => (
          <img alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" key={image} src={image} />
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-[var(--color-primary)]">{product.name}</h3>
          {product.isFeatured ? <Badge className="bg-[var(--color-secondary)] text-white">Destacado</Badge> : null}
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">{product.description}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-2 text-[var(--color-text-muted)]">
          <Store className="size-4" />
          {businessName}
        </span>
        {product.price ? <strong className="text-[var(--color-primary)]">{formatCurrency(product.price)}</strong> : null}
      </div>
    </Card>
  );
}

export function BusinessHero({ business }: { business: BusinessDetails }) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_20px_48px_rgba(17,39,60,0.14)]">
      <div className="relative h-56 overflow-hidden bg-[var(--color-primary)] sm:h-72">
        <img alt={business.name} className="h-full w-full object-cover opacity-80" src={business.images.banner} />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(19,39,59,0.88)] via-transparent to-transparent" />
      </div>
      <div className="relative px-5 pb-6 pt-0 sm:px-8">
        <div className="-mt-10 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <img alt={`${business.name} logo`} className="size-24 rounded-[28px] border-4 border-white object-cover shadow-xl" src={business.images.profile} />
            <div className="space-y-2 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)]">{business.name}</h1>
                <Badge className="bg-[var(--color-secondary)] text-white">{business.subscriptionType.replace('_', ' ')}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-4 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                  {formatRating(business.rating)} ({business.reviewCount} reseñas)
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" />
                  {business.location.zone}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={buildWhatsAppLink(business.whatsappNumber, `Hola ${business.name}, quiero más información.`)} rel="noreferrer" target="_blank">
              <Button className="gap-2">
                <MessageCircle className="size-4" />
                WhatsApp
              </Button>
            </a>
            <a href={buildMapsLink(business.location.lat, business.location.lng, business.name)} rel="noreferrer" target="_blank">
              <GhostButton className="gap-2">
                <MapPin className="size-4" />
                Ubicación
              </GhostButton>
            </a>
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--color-text-muted)]">{business.description}</p>
      </div>
    </section>
  );
}