'use client';

import type { Lead, LeadStatus } from 'types';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { MessageSquareText, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  EmptyState,
  LoadingSkeleton,
  Select,
  Textarea,
} from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { formatStatusLabel } from '../../lib/display-labels';
import { sanitizeDisplayText } from '../../lib/formatting';
import { isSuperAdminRole } from '../../lib/platform-roles';
import { trpc } from '../../lib/trpc';

const statusFilterOptions = [
  { label: 'Todos los estados', value: 'ALL' },
  { label: 'Nuevo', value: 'NEW' },
  { label: 'Contactado', value: 'CONTACTED' },
  { label: 'Calificado', value: 'QUALIFIED' },
  { label: 'Cerrado', value: 'CLOSED' },
  { label: 'Perdido', value: 'LOST' },
];

const statusUpdateOptions = statusFilterOptions.filter(
  (option) => option.value !== 'ALL',
);

function formatLeadDate(value: string) {
  return new Date(value).toLocaleString('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function buildLeadContext(lead: Lead) {
  if (lead.productName) {
    return `Producto: ${lead.productName}`;
  }

  if (lead.promotionTitle) {
    return `Promoción: ${lead.promotionTitle}`;
  }

  return 'Interacción general del negocio';
}

export function LeadsScreen() {
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const deferredSearch = useDeferredValue(search);
  const utils = trpc.useUtils();

  const sessionQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const managedBusinessesQuery = trpc.business.managed.useQuery(
    { includePending: true },
    { retry: false },
  );

  const currentUser = sessionQuery.data?.user ?? null;
  const isSuperAdmin = isSuperAdminRole(currentUser?.role);

  const businessOptions = useMemo(
    () =>
      (managedBusinessesQuery.data ?? []).map((business) => ({
        label: business.name,
        value: business.id,
      })),
    [managedBusinessesQuery.data],
  );

  useEffect(() => {
    if (!selectedBusinessId && businessOptions[0]) {
      setSelectedBusinessId(businessOptions[0].value);
    }
  }, [businessOptions, selectedBusinessId]);

  const leadsQuery = trpc.lead.listByBusiness.useQuery(
    { businessId: selectedBusinessId },
    {
      enabled: Boolean(selectedBusinessId) && !isSuperAdmin,
      placeholderData: (previousData) => previousData,
      retry: false,
    },
  );

  const updateLeadStatus = trpc.lead.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.lead.listByBusiness.invalidate({
        businessId: selectedBusinessId,
      });
      toast.success('Estado del lead actualizado.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateLeadNotes = trpc.lead.updateNotes.useMutation({
    onSuccess: async () => {
      await utils.lead.listByBusiness.invalidate({
        businessId: selectedBusinessId,
      });
      toast.success('Notas del lead actualizadas.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const leads = leadsQuery.data ?? [];

  const filteredLeads = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesStatus =
        statusFilter === 'ALL' || lead.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          lead.name,
          lead.summary,
          lead.businessName,
          lead.productName,
          lead.promotionTitle,
          lead.source,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [deferredSearch, leads, statusFilter]);

  useEffect(() => {
    if (!filteredLeads.length) {
      setSelectedLeadId('');
      return;
    }

    const selectedLeadStillVisible = filteredLeads.some(
      (lead) => lead.id === selectedLeadId,
    );

    if (!selectedLeadStillVisible) {
      setSelectedLeadId(filteredLeads[0].id);
    }
  }, [filteredLeads, selectedLeadId]);

  const selectedLead =
    filteredLeads.find((lead) => lead.id === selectedLeadId) ??
    filteredLeads[0];

  useEffect(() => {
    setNotesDraft(selectedLead?.notes ?? '');
  }, [selectedLead?.id, selectedLead?.notes]);

  const leadCountsByStatus = useMemo(() => {
    return leads.reduce<Record<string, number>>((accumulator, lead) => {
      accumulator[lead.status] = (accumulator[lead.status] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [leads]);

  const isLoading =
    sessionQuery.isLoading ||
    managedBusinessesQuery.isLoading ||
    leadsQuery.isLoading;
  const error =
    sessionQuery.error ?? managedBusinessesQuery.error ?? leadsQuery.error;

  if (isLoading) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  if (error) {
    return (
      <EmptyState
        title="No fue posible cargar los leads"
        description={error.message}
      />
    );
  }

  if (isSuperAdmin) {
    return (
      <EmptyState
        title="La bandeja de leads no está disponible para SuperAdmin"
        description="Los leads se gestionan únicamente desde la membresía owner o manager de cada negocio. La vista global llegará en una fase posterior de analytics."
      />
    );
  }

  if (!businessOptions.length) {
    return (
      <EmptyState
        title="No hay negocios asignados"
        description="Necesitas pertenecer como owner o manager a un negocio para revisar y gestionar leads desde esta bandeja."
      />
    );
  }

  return (
    <div className="space-y-6 pb-2">
      <ModuleHeader
        title="Leads"
        description="Bandeja operativa con leads reales, seguimiento por estado y notas internas listas para analytics, ranking y monetización."
      />

      <section className="field-panel grid gap-3 p-4 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
        <label className="flex min-w-0 items-center gap-3 rounded-xl bg-base px-4">
          <Search className="size-4 shrink-0 text-text-muted" />
          <input
            className="field-control h-12 border-0 bg-transparent px-0 shadow-none"
            placeholder="Buscar por lead, resumen, producto, promoción o canal"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <Select
          aria-label="Filtrar por negocio"
          onValueChange={setSelectedBusinessId}
          options={businessOptions}
          value={selectedBusinessId}
        />
        <Select
          aria-label="Filtrar por estado"
          onValueChange={setStatusFilter}
          options={statusFilterOptions}
          value={statusFilter}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {statusUpdateOptions.map((option) => (
          <Card interactive={false} key={option.value} variant="soft">
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
              {option.label}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-text-secondary">
              {leadCountsByStatus[option.value] ?? 0}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)]">
        <div className="space-y-3">
          {filteredLeads.length ? (
            filteredLeads.map((lead) => {
              const isSelected = lead.id === selectedLead?.id;

              return (
                <button
                  className={[
                    'field-panel w-full space-y-3 p-4 text-left transition-colors',
                    isSelected ? 'ring-2 ring-primary/30' : 'hover:bg-base',
                  ].join(' ')}
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-text-secondary">
                          {sanitizeDisplayText(lead.name, 'Lead sin nombre')}
                        </p>
                        <StatusBadge status={lead.status} />
                      </div>
                      <p className="text-sm text-text-muted">
                        {lead.businessName}
                      </p>
                    </div>
                    <p className="text-xs text-text-muted">
                      {formatLeadDate(lead.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <StatusBadge status={lead.source} />
                    <span>{buildLeadContext(lead)}</span>
                    {lead.phone ? <span>Tel: {lead.phone}</span> : null}
                  </div>
                  <p className="text-sm leading-6 text-text-muted">
                    {lead.summary}
                  </p>
                </button>
              );
            })
          ) : (
            <EmptyState
              title="No hay leads para esos filtros"
              description="Cambia el negocio o los filtros para revisar otras interacciones capturadas."
            />
          )}
        </div>

        <Card className="space-y-5" interactive={false} variant="soft">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquareText className="size-5" />
          </div>

          {selectedLead ? (
            <>
              <div className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                      Lead seleccionado
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-text-secondary">
                      {sanitizeDisplayText(
                        selectedLead.name,
                        'Lead sin nombre',
                      )}
                    </h3>
                  </div>
                  <StatusBadge status={selectedLead.status} />
                </div>
                <div className="space-y-1 text-sm leading-6 text-text-muted">
                  <p>Negocio: {selectedLead.businessName}</p>
                  <p>Canal: {formatStatusLabel(selectedLead.source)}</p>
                  <p>Contexto: {buildLeadContext(selectedLead)}</p>
                  <p>Creado: {formatLeadDate(selectedLead.createdAt)}</p>
                  <p>Actualizado: {formatLeadDate(selectedLead.updatedAt)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                  Resumen capturado
                </p>
                <div className="surface-inset rounded-xl px-4 py-3 text-sm leading-6 text-text-muted">
                  {selectedLead.summary}
                </div>
              </div>

              <label className="space-y-2">
                <span className="field-label">Estado del lead</span>
                <Select
                  aria-label="Cambiar estado del lead"
                  disabled={updateLeadStatus.isPending}
                  onValueChange={(value) => {
                    if (value === selectedLead.status) {
                      return;
                    }

                    updateLeadStatus.mutate({
                      leadId: selectedLead.id,
                      status: value as LeadStatus,
                    });
                  }}
                  options={statusUpdateOptions}
                  value={selectedLead.status}
                />
              </label>

              <label className="space-y-2">
                <span className="field-label">Notas internas</span>
                <Textarea
                  placeholder="Agrega seguimiento interno, contexto comercial o próximos pasos."
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                />
              </label>

              <div className="flex items-center justify-end gap-2">
                <Button
                  disabled={
                    updateLeadNotes.isPending ||
                    notesDraft === (selectedLead.notes ?? '')
                  }
                  onClick={() => {
                    updateLeadNotes.mutate({
                      leadId: selectedLead.id,
                      notes: notesDraft,
                    });
                  }}
                  type="button"
                >
                  {updateLeadNotes.isPending ? 'Guardando...' : 'Guardar notas'}
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              title="Selecciona un lead"
              description="Elige una interacción de la lista para revisar su contexto, cambiar el estado y guardar notas internas."
            />
          )}
        </Card>
      </section>
    </div>
  );
}
