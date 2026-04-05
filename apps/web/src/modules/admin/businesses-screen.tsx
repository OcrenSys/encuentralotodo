'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, EmptyState, LoadingSkeleton } from 'ui';

import { ManagementListToolbar } from '../../components/management/management-list-toolbar';
import { ManagementPagination } from '../../components/management/management-pagination';
import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { SurfaceTable } from '../../components/management/surface-table';
import {
  formatBusinessCategoryLabel,
  formatSubscriptionLabel,
} from '../../lib/display-labels';
import { trpc } from '../../lib/trpc';

function getResponsibleLabel(business: {
  owner?: { fullName?: string; email?: string };
  ownerId: string;
}) {
  return business.owner?.fullName || business.owner?.email || business.ownerId;
}

function getResponsibleSubLabel(business: {
  owner?: { fullName?: string; email?: string };
}) {
  if (business.owner?.fullName && business.owner?.email) {
    return business.owner.email;
  }

  return null;
}

export function AdminBusinessesScreen() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setPage(1);
  }, [category, deferredSearch, status]);

  const businessesQuery = trpc.business.managedPage.useQuery(
    {
      category: category as 'ALL' | 'GENERAL_STORE' | 'RESTAURANT' | 'SERVICE',
      page,
      pageSize,
      search: deferredSearch,
      status: status as 'ALL' | 'PENDING' | 'APPROVED',
    },
    {
      placeholderData: (previousData) => previousData,
      retry: false,
    },
  );

  if (businessesQuery.isLoading) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  if (businessesQuery.error) {
    return (
      <EmptyState
        title="No fue posible cargar los negocios"
        description={businessesQuery.error.message}
      />
    );
  }

  const businesses = businessesQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Todos los negocios"
        description="Vista global de negocios, responsables y estado de publicación. Está pensada para control y operación diaria."
      />

      <ManagementListToolbar
        filters={[
          {
            label: 'Categoría',
            onValueChange: setCategory,
            options: [
              { label: 'Todas las categorías', value: 'ALL' },
              { label: 'Tienda general', value: 'GENERAL_STORE' },
              { label: 'Restaurante', value: 'RESTAURANT' },
              { label: 'Servicio', value: 'SERVICE' },
            ],
            value: category,
          },
          {
            label: 'Estado del negocio',
            onValueChange: setStatus,
            options: [
              { label: 'Todos los estados', value: 'ALL' },
              { label: 'Pendiente', value: 'PENDING' },
              { label: 'Aprobado', value: 'APPROVED' },
            ],
            value: status,
          },
        ]}
        searchPlaceholder="Buscar negocios por nombre, descripción, zona o dirección"
        searchValue={search}
        summary={`${businessesQuery.data?.total ?? 0} negocios encontrados`}
        onSearchChange={setSearch}
      />

      <div className="hidden lg:block">
        <SurfaceTable
          columns={[
            'Negocio',
            'Zona',
            'Plan',
            'Responsable',
            'Estado',
            'Acciones',
          ]}
        >
          {businesses.map((business) => (
            <div
              className="grid grid-cols-6 gap-4 border-b border-border-default px-5 py-4 last:border-b-0 hover:bg-white/70"
              key={business.id}
            >
              <div className="min-w-0">
                <Link
                  className="truncate font-semibold text-text-secondary transition hover:text-secondary"
                  href={`/business/${business.id}`}
                >
                  {business.name}
                </Link>
                <p className="mt-1 text-sm text-text-muted">
                  {formatBusinessCategoryLabel(business.category)}
                </p>
              </div>
              <div className="self-center text-sm text-text-muted">
                {business.location.zone}
              </div>
              <div className="self-center text-sm text-text-muted">
                {formatSubscriptionLabel(business.subscriptionType)}
              </div>
              <div className="self-center text-sm text-text-muted">
                <p className="font-medium text-text-secondary">
                  {getResponsibleLabel(business)}
                </p>
                {getResponsibleSubLabel(business) ? (
                  <p className="mt-1 text-xs text-text-muted">
                    {getResponsibleSubLabel(business)}
                  </p>
                ) : null}
              </div>
              <div className="self-center">
                <StatusBadge status={business.status} />
              </div>
              <div className="self-center">
                <Button asChild type="button" variant="ghost">
                  <Link href={`/business/${business.id}`}>Ver detalle</Link>
                </Button>
              </div>
            </div>
          ))}
        </SurfaceTable>
      </div>

      <div className="grid gap-4 lg:hidden">
        {businesses.map((business) => (
          <Card
            className="space-y-3"
            interactive={false}
            key={business.id}
            variant="soft"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-semibold text-text-secondary">
                {business.name}
              </h3>
              <StatusBadge status={business.status} />
            </div>
            <p className="text-sm text-text-muted">{business.location.zone}</p>
            <p className="text-sm text-text-muted">
              Plan: {formatSubscriptionLabel(business.subscriptionType)}
            </p>
            <p className="text-sm text-text-muted">
              Responsable: {getResponsibleLabel(business)}
            </p>
            <Button asChild type="button" variant="ghost">
              <Link href={`/business/${business.id}`}>Ver detalle</Link>
            </Button>
          </Card>
        ))}
      </div>

      {!businesses.length ? (
        <EmptyState
          title="No hay negocios para esos filtros"
          description="Prueba otra búsqueda o cambia los filtros de categoría y estado."
        />
      ) : null}

      <ManagementPagination
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
        page={businessesQuery.data?.page ?? page}
        pageSize={businessesQuery.data?.pageSize ?? pageSize}
        total={businessesQuery.data?.total ?? 0}
        totalPages={businessesQuery.data?.totalPages ?? 1}
      />
    </div>
  );
}
