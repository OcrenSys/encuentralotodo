'use client';

import type { ManagedProductListItem } from 'types';
import { useDeferredValue, useEffect, useState } from 'react';
import { FileUp, Plus, Search } from 'lucide-react';
import { Button, Card, EmptyState, GhostButton, LoadingSkeleton } from 'ui';

import { ManagementListToolbar } from '../../components/management/management-list-toolbar';
import { ManagementPagination } from '../../components/management/management-pagination';
import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { formatStatusLabel } from '../../lib/display-labels';
import { trpc } from '../../lib/trpc';
import { ProductCatalogCsvDialog } from './product-catalog-csv-dialog';
import { ProductUpsertDialog } from './product-create-dialog';

function formatPrice(price?: number) {
  if (typeof price !== 'number') {
    return 'Precio no definido';
  }

  return new Intl.NumberFormat('es-DO', {
    currency: 'DOP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(price);
}

export function ProductsScreen() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedBusinessId, setSelectedBusinessId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'FEATURED' | 'CATALOG'
  >('ALL');
  const [isCatalogCsvOpen, setIsCatalogCsvOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ManagedProductListItem | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, selectedBusinessId, statusFilter]);

  const managedBusinessesQuery = trpc.business.managed.useQuery(
    { includePending: true },
    { retry: false },
  );
  const productsQuery = trpc.product.managed.useQuery(
    {
      businessId: selectedBusinessId !== 'ALL' ? selectedBusinessId : undefined,
      featured: statusFilter,
      page,
      pageSize,
      search: deferredSearch,
    },
    {
      placeholderData: (previousData) => previousData,
      retry: false,
    },
  );

  const businessOptions = (managedBusinessesQuery.data ?? []).map(
    (business) => ({
      label: business.name,
      value: business.id,
    }),
  );

  const filterOptions = [
    { label: 'Todos los negocios', value: 'ALL' },
    ...businessOptions,
  ];

  if (productsQuery.isLoading || managedBusinessesQuery.isLoading) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  if (productsQuery.error) {
    return (
      <EmptyState
        title="No fue posible cargar los productos"
        description={productsQuery.error.message}
      />
    );
  }

  const products = productsQuery.data?.items ?? [];

  function handleProductDialogChange(open: boolean) {
    setIsProductDialogOpen(open);

    if (!open) {
      setEditingProduct(null);
    }
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Productos"
        description="Catálogo operativo con búsqueda, filtros y paginación real para crear y revisar productos por negocio."
        actions={
          <div className="flex flex-row gap-2 w-full">
            <Button
              onClick={() => setIsCatalogCsvOpen(true)}
              type="button"
              variant="outline"
              className="w-full"
            >
              <FileUp className="mr-2 size-4" />
              Catálogo CSV
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setIsProductDialogOpen(true);
              }}
              type="button"
              className="w-full"
            >
              <Plus className="mr-2 size-4" />
              Nuevo producto
            </Button>
          </div>
        }
      />

      <ManagementListToolbar
        actions={
          productsQuery.isFetching ? (
            <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm text-text-muted">
              <Search className="size-4" />
              Actualizando resultados...
            </div>
          ) : null
        }
        filters={[
          {
            label: 'Negocio',
            onValueChange: setSelectedBusinessId,
            options: filterOptions,
            value: selectedBusinessId,
            widthClassName: 'xl:min-w-[260px]',
          },
          {
            label: 'Estado visual del producto',
            onValueChange: (value) =>
              setStatusFilter(value as typeof statusFilter),
            options: [
              { label: 'Todos', value: 'ALL' },
              { label: 'Destacados', value: 'FEATURED' },
              { label: 'Catálogo', value: 'CATALOG' },
            ],
            value: statusFilter,
          },
        ]}
        searchPlaceholder="Buscar productos por nombre, negocio o descripción"
        searchValue={search}
        summary={`${productsQuery.data?.total ?? 0} productos encontrados`}
        onSearchChange={setSearch}
      />

      {products.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Card
              className="space-y-4"
              interactive={false}
              key={product.id}
              variant="soft"
            >
              <div className="grid h-40 grid-cols-1 gap-0 overflow-hidden rounded-md bg-base">
                {product.images.slice(0, 1).map((image, index) => (
                  <img
                    alt={`${product.name} ${index + 1}`}
                    className="h-full w-full object-cover"
                    key={image}
                    src={image}
                  />
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-text-secondary">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">
                      {product.businessName}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
                      {product.type === 'configurable'
                        ? 'Configurable'
                        : 'Simple'}
                    </p>
                  </div>
                  <StatusBadge
                    status={product.isFeatured ? 'FEATURED' : 'CATALOG'}
                  />
                </div>
                <p className="text-sm leading-6 text-text-muted">
                  {product.type === 'configurable'
                    ? product.configurationSummary
                    : product.description}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-muted">
                    {product.type === 'configurable'
                      ? 'Configurable por selección'
                      : formatPrice(product.price)}
                  </span>
                  <GhostButton
                    onClick={() => {
                      setEditingProduct(product);
                      setIsProductDialogOpen(true);
                    }}
                    type="button"
                  >
                    Editar
                  </GhostButton>
                </div>
                <span className="block text-text-muted">
                  Estado del negocio:{' '}
                  {formatStatusLabel(product.businessStatus)}
                </span>
              </div>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No hay productos para esos filtros"
          description="Cambia la búsqueda o los filtros para ver más opciones del catálogo, o crea un nuevo producto."
        />
      )}

      <ManagementPagination
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
        page={productsQuery.data?.page ?? page}
        pageSize={productsQuery.data?.pageSize ?? pageSize}
        total={productsQuery.data?.total ?? 0}
        totalPages={productsQuery.data?.totalPages ?? 1}
      />

      <ProductUpsertDialog
        businessOptions={businessOptions}
        onOpenChange={handleProductDialogChange}
        open={isProductDialogOpen}
        product={editingProduct ?? undefined}
      />

      <ProductCatalogCsvDialog
        businessOptions={businessOptions}
        filters={{
          businessId:
            selectedBusinessId !== 'ALL' ? selectedBusinessId : undefined,
          featured: statusFilter,
          search: deferredSearch,
        }}
        onOpenChange={setIsCatalogCsvOpen}
        open={isCatalogCsvOpen}
      />
    </div>
  );
}
