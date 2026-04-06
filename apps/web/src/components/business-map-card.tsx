'use client';

import { Compass, MapPinned } from 'lucide-react';

import type { BusinessDetails } from 'types';
import { buildMapsLink } from 'utils';
import { Card, GhostButton, SectionHeading } from 'ui';

export function BusinessMapCard({ business }: { business: BusinessDetails }) {
  return (
    <section className="space-y-4">
      <SectionHeading
        eyebrow="Mapa"
        title="Ubicación del negocio"
        description="Vista rápida para validar la zona y abrir navegación en Google Maps."
      />
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="market-grid flex h-64 items-center justify-center bg-[var(--color-background)]">
            <div className="max-w-xs space-y-3 px-6 text-center text-sm text-[var(--color-text-muted)]">
              <div className="mx-auto inline-flex rounded-full bg-[var(--color-primary)]/10 p-4 text-[var(--color-primary)]">
                <MapPinned className="size-6" />
              </div>
              <p>
                Usa `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` para habilitar el mapa interactivo. Mientras tanto, el perfil mantiene acceso directo a Google Maps.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 p-6">
            <div className="space-y-3">
              <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">{business.location.zone}</h3>
              <p className="text-sm leading-6 text-[var(--color-text-muted)]">{business.location.address}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                {business.location.lat.toFixed(4)}, {business.location.lng.toFixed(4)}
              </p>
            </div>
            <a href={buildMapsLink(business.location.lat, business.location.lng, business.name)} rel="noreferrer" target="_blank">
              <GhostButton className="gap-2">
                <Compass className="size-4" />
                Abrir navegación
              </GhostButton>
            </a>
          </div>
        </div>
      </Card>
    </section>
  );
}