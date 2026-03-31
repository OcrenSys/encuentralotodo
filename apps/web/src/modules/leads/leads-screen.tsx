'use client';

import { useEffect, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { Card } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { formatStatusLabel } from '../../lib/display-labels';
import { useManagementData } from '../../lib/management-data';

export function LeadsScreen() {
  const { leads } = useManagementData();
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  useEffect(() => {
    if (!selectedLeadId && leads[0]) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  const selectedLead =
    leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Contactos"
        description="Bandeja operativa para seguimiento comercial. Esta etapa usa datos simulados mientras se conecta la fuente real."
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {leads.map((lead) => (
            <button
              className="w-full rounded-[24px] border border-white/80 bg-white/90 p-4 text-left shadow-[0_12px_32px_rgba(17,39,60,0.08)] transition-colors hover:border-[var(--color-secondary)]"
              key={lead.id}
              onClick={() => setSelectedLeadId(lead.id)}
              type="button"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-primary)]">
                    {lead.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {lead.businessName}
                  </p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                <span>{lead.source}</span>
                <span>{lead.updatedAt}</span>
              </div>
            </button>
          ))}
        </div>

        <Card className="space-y-4 hover:translate-y-0">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
            <MessageSquareText className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Detalle del contacto
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-[var(--color-primary)]">
              {selectedLead?.name ?? 'Selecciona un contacto'}
            </h3>
          </div>

          {selectedLead ? (
            <div className="space-y-3 text-sm leading-6 text-[var(--color-text-muted)]">
              <p>Negocio: {selectedLead.businessName}</p>
              <p>Canal: {selectedLead.source}</p>
              <p>Estado: {formatStatusLabel(selectedLead.status)}</p>
              <p>Última actualización: {selectedLead.updatedAt}</p>
              <div className="rounded-[20px] bg-[var(--color-background)] p-4">
                <p>{selectedLead.summary}</p>
              </div>
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
