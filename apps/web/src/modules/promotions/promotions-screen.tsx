'use client';

import type { Promotion } from 'types';
import { useDeferredValue, useMemo, useState } from 'react';
import { CalendarClock, PencilLine, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
} from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { ManagementListToolbar } from '../../components/management/management-list-toolbar';
import { StatusBadge } from '../../components/management/status-badge';
import { formatStatusLabel } from '../../lib/display-labels';
import { formatCurrencyNio, sanitizeDisplayText } from '../../lib/formatting';
import { hasPlatformRole, platformAdminRoles } from '../../lib/platform-roles';
import { trpc } from '../../lib/trpc';
import { PromotionUpsertDialog } from './promotion-upsert-dialog';

type ManagedPromotionItem = Promotion & {
  businessName: string;
  businessStatus: string;
  canManage: boolean;
};

function formatRange(startDate: string, endDate: string) {
  return `${new Date(startDate).toLocaleDateString('es-DO')} - ${new Date(endDate).toLocaleDateString('es-DO')}`;
}

export function PromotionsScreen() {
  const [search, setSearch] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState('ALL');
  const [editingPromotion, setEditingPromotion] =
    useState<ManagedPromotionItem | null>(null);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [promotionPendingDelete, setPromotionPendingDelete] =
    useState<ManagedPromotionItem | null>(null);
  const deferredSearch = useDeferredValue(search);
  const utils = trpc.useUtils();

  const sessionQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const managedBusinessesQuery = trpc.business.managed.useQuery(
    { includePending: true },
    { retry: false },
  );
  const selectedBusinessPromotionsQuery =
    trpc.promotion.listByBusiness.useQuery(
      { businessId: selectedBusinessId },
      {
        enabled: selectedBusinessId !== 'ALL',
        placeholderData: (previousData) => previousData,
        retry: false,
      },
    );

  const deletePromotion = trpc.promotion.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.promotion.listByBusiness.invalidate(),
        utils.promotion.listActive.invalidate(),
        utils.business.managed.invalidate(),
        utils.business.managedPage.invalidate(),
      ]);
      setPromotionPendingDelete(null);
      toast.success('Promoción eliminada correctamente.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const currentUser = sessionQuery.data?.user ?? null;
  const isPlatformAdmin = hasPlatformRole(
    currentUser?.role,
    platformAdminRoles,
  );
  const managedBusinesses = managedBusinessesQuery.data ?? [];
  const selectedBusiness =
    selectedBusinessId !== 'ALL'
      ? (managedBusinesses.find(
          (business) => business.id === selectedBusinessId,
        ) ?? null)
      : null;

  const mutableBusinessOptions = useMemo(
    () =>
      managedBusinesses
        .filter(
          (business) =>
            isPlatformAdmin || business.owner?.id === currentUser?.id,
        )
        .map((business) => ({
          label: business.name,
          value: business.id,
        })),
    [currentUser?.id, isPlatformAdmin, managedBusinesses],
  );

  const businessFilterOptions = useMemo(
    () => [
      { label: 'Todos los negocios', value: 'ALL' },
      ...managedBusinesses.map((business) => ({
        label: business.name,
        value: business.id,
      })),
    ],
    [managedBusinesses],
  );

  const promotions = useMemo<ManagedPromotionItem[]>(() => {
    if (selectedBusinessId !== 'ALL' && selectedBusiness) {
      return (selectedBusinessPromotionsQuery.data ?? []).map((promotion) => ({
        ...promotion,
        businessName: selectedBusiness.name,
        businessStatus: selectedBusiness.status,
        canManage:
          isPlatformAdmin || selectedBusiness.owner?.id === currentUser?.id,
      }));
    }

    return managedBusinesses.flatMap((business) => {
      const canManage =
        isPlatformAdmin || business.owner?.id === currentUser?.id;

      return business.promotions.map((promotion) => ({
        ...promotion,
        businessName: business.name,
        businessStatus: business.status,
        canManage,
      }));
    });
  }, [
    currentUser?.id,
    isPlatformAdmin,
    managedBusinesses,
    selectedBusiness,
    selectedBusinessId,
    selectedBusinessPromotionsQuery.data,
  ]);

  const filteredPromotions = useMemo(
    () =>
      promotions.filter((promotion) =>
        [
          promotion.title,
          promotion.description,
          promotion.businessName,
          promotion.type,
        ]
          .join(' ')
          .toLowerCase()
          .includes(deferredSearch.toLowerCase()),
      ),
    [deferredSearch, promotions],
  );

  const isLoading =
    sessionQuery.isLoading ||
    managedBusinessesQuery.isLoading ||
    (selectedBusinessId !== 'ALL' && selectedBusinessPromotionsQuery.isLoading);
  const error =
    sessionQuery.error ??
    managedBusinessesQuery.error ??
    (selectedBusinessId !== 'ALL'
      ? selectedBusinessPromotionsQuery.error
      : null);

  function handlePromotionDialogChange(open: boolean) {
    setIsPromotionDialogOpen(open);

    if (!open) {
      setEditingPromotion(null);
    }
  }

  if (isLoading) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  if (error) {
    return (
      <EmptyState
        title="No fue posible cargar las promociones"
        description={error.message}
      />
    );
  }

  if (!managedBusinesses.length) {
    return (
      <EmptyState
        title="No hay negocios disponibles"
        description="Necesitas al menos un negocio asignado para revisar promociones desde esta consola."
      />
    );
  }

  return (
    <div className="space-y-6 pb-2">
      <ModuleHeader
        title="Promociones"
        description="Campañas reales por negocio con edición, borrado y estados operativos conectados al backend endurecido."
        actions={
          <Button
            className="w-full sm:w-auto"
            disabled={mutableBusinessOptions.length === 0}
            onClick={() => {
              setEditingPromotion(null);
              setIsPromotionDialogOpen(true);
            }}
            type="button"
          >
            <Plus className="mr-2 size-4" />
            Nueva promoción
          </Button>
        }
      />

      <ManagementListToolbar
        filters={[
          {
            label: 'Negocio',
            onValueChange: setSelectedBusinessId,
            options: businessFilterOptions,
            value: selectedBusinessId,
            widthClassName: 'xl:min-w-[260px]',
          },
        ]}
        searchPlaceholder="Buscar promociones por título, descripción o negocio"
        searchValue={search}
        summary={`${filteredPromotions.length} promociones visibles`}
        onSearchChange={setSearch}
        actions={
          selectedBusinessPromotionsQuery.isFetching ? (
            <div className="surface-soft flex items-center gap-2 rounded-full px-3 py-2 text-sm text-text-muted">
              <Search className="size-4" />
              Actualizando promociones...
            </div>
          ) : null
        }
      />

      {filteredPromotions.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPromotions.map((promotion) => (
            <Card
              className="space-y-4"
              interactive={false}
              key={promotion.id}
              variant="soft"
            >
              <div className="relative h-44 overflow-hidden rounded-md bg-primary/10">
                <img
                  alt={promotion.title}
                  className="h-full w-full object-cover"
                  src={promotion.image}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-semibold text-text-secondary">
                        {sanitizeDisplayText(promotion.title, 'Promoción')}
                      </h3>
                      <Badge variant="neutral">
                        {formatStatusLabel(promotion.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-muted">
                      {sanitizeDisplayText(promotion.businessName, 'Negocio')}
                    </p>
                  </div>
                  <StatusBadge status={promotion.status} />
                </div>
                <p className="text-sm leading-6 text-text-muted">
                  {sanitizeDisplayText(promotion.description)}
                </p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text-secondary">
                      {formatCurrencyNio(promotion.promoPrice)}
                    </p>
                    <p className="text-text-muted line-through">
                      {formatCurrencyNio(promotion.originalPrice)}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-right text-text-muted">
                    <CalendarClock className="mt-0.5 size-4" />
                    <span>
                      {formatRange(promotion.startDate, promotion.endDate)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
                  <span>
                    Negocio {formatStatusLabel(promotion.businessStatus)}
                  </span>
                  <span>
                    Actualizado{' '}
                    {new Date(promotion.updatedAt).toLocaleDateString('es-DO')}
                  </span>
                </div>
              </div>
              {promotion.canManage ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingPromotion(promotion);
                      setIsPromotionDialogOpen(true);
                    }}
                    type="button"
                  >
                    <PencilLine className="size-4" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setPromotionPendingDelete(promotion);
                    }}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                    Eliminar
                  </Button>
                </div>
              ) : (
                <div className="surface-inset rounded-md px-3 py-2 text-sm text-text-muted">
                  Puedes revisar esta promoción, pero solo el owner o un admin
                  puede modificarla.
                </div>
              )}
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No hay promociones para esos filtros"
          description="Cambia el negocio o la búsqueda, o crea una nueva campaña para empezar a operar este módulo."
        />
      )}

      <PromotionUpsertDialog
        businessOptions={mutableBusinessOptions}
        onOpenChange={handlePromotionDialogChange}
        open={isPromotionDialogOpen}
        promotion={editingPromotion ?? undefined}
      />

      <ConfirmDialog
        confirmLabel={deletePromotion.isPending ? 'Eliminando...' : 'Eliminar'}
        description={
          promotionPendingDelete
            ? `Se eliminará ${sanitizeDisplayText(promotionPendingDelete.title, 'esta promoción')}. Esta acción no se puede deshacer.`
            : 'Esta acción no se puede deshacer.'
        }
        isPending={deletePromotion.isPending}
        onConfirm={() => {
          if (!promotionPendingDelete) {
            return;
          }

          deletePromotion.mutate({ promotionId: promotionPendingDelete.id });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setPromotionPendingDelete(null);
          }
        }}
        open={Boolean(promotionPendingDelete)}
        title="¿Eliminar promoción?"
      />
    </div>
  );
}
