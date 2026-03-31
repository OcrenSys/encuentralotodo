'use client';

import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Card, EmptyState, GhostButton, LoadingSkeleton } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { useManagementData } from '../../lib/management-data';

export function ProductsScreen() {
  const { loading, managedProducts } = useManagementData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'FEATURED' | 'CATALOG'
  >('ALL');

  const filteredProducts = useMemo(
    () =>
      managedProducts.filter((product) => {
        const matchesSearch = [
          product.name,
          product.description,
          product.businessName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
        const visualStatus = product.isFeatured ? 'FEATURED' : 'CATALOG';
        return (
          matchesSearch &&
          (statusFilter === 'ALL' || visualStatus === statusFilter)
        );
      }),
    [managedProducts, search, statusFilter],
  );

  if (loading) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Products"
        description="Catálogo operativo con filtros, estado visual y punto de entrada para altas futuras. El backend aún no expone CRUD completo de edición, así que esta fase prioriza visibilidad y estructura."
        actions={
          <>
            <GhostButton type="button">Import catalog</GhostButton>
            <Button type="button">
              <Plus className="mr-2 size-4" />
              New product
            </Button>
          </>
        }
      />

      <section className="grid gap-3 rounded-[28px] border border-white/80 bg-white/88 p-4 shadow-[0_12px_32px_rgba(17,39,60,0.08)] md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4">
          <Search className="size-4 text-[var(--color-text-muted)]" />
          <input
            className="h-11 w-full bg-transparent text-sm text-[var(--color-primary)] outline-none"
            placeholder="Buscar productos por nombre, negocio o descripción"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          className="h-11 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-sm font-medium text-[var(--color-primary)] outline-none"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as typeof statusFilter)
          }
        >
          <option value="ALL">Todos</option>
          <option value="FEATURED">Featured</option>
          <option value="CATALOG">Catalog</option>
        </select>
      </section>

      {filteredProducts.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card className="space-y-4 hover:translate-y-0" key={product.id}>
              <div className="grid h-40 grid-cols-3 gap-2 overflow-hidden rounded-[20px] bg-[var(--color-background)]">
                {product.images.slice(0, 3).map((image, index) => (
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
                    <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {product.businessName}
                    </p>
                  </div>
                  <StatusBadge
                    status={product.isFeatured ? 'FEATURED' : 'CATALOG'}
                  />
                </div>
                <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                  {product.description}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[var(--color-text-muted)]">
                  Business status: {product.businessStatus}
                </span>
                <GhostButton type="button">Edit later</GhostButton>
              </div>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No products match the current filters"
          description="Ajusta el texto de búsqueda o el estado para ver más catálogo en esta fase inicial."
        />
      )}
    </div>
  );
}
