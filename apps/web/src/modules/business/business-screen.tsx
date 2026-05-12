'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock3,
  LoaderCircle,
  Palette,
  PhoneCall,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  type BusinessDetails,
  type UserProfile,
  updateBusinessInputSchema,
} from 'types';
import {
  Button,
  Card,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  ConfirmDialog,
  EmptyState,
  FormField,
  FormSection,
  Input,
  LoadingSkeleton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  Textarea,
} from 'ui';

import { BusinessManagersSelect } from '../../components/business-managers-select';
import { SubscriptionBadge } from '../../components/management/subscription-badge';
import { BusinessOwnerSelect } from '../../components/business-owner-select';
import { ImageDropzone } from '../../components/image-dropzone';
import { ModuleHeader } from '../../components/management/module-header';
import { StatusBadge } from '../../components/management/status-badge';
import { formatBusinessCategoryLabel } from '../../lib/display-labels';
import { useCurrentUserRole } from '../../lib/platform-authorization';
import { isSuperAdminRole } from '../../lib/platform-roles';
import { trpc } from '../../lib/trpc';
import { useDebouncedValue } from '../../lib/use-debounced-value';

type UpdateBusinessFormValues = z.input<typeof updateBusinessInputSchema>;

type EditableBusinessRecord = Pick<
  BusinessDetails,
  | 'id'
  | 'name'
  | 'description'
  | 'category'
  | 'location'
  | 'images'
  | 'subscriptionType'
  | 'whatsappNumber'
  | 'managers'
  | 'ownerId'
  | 'status'
  | 'activePromotions'
  | 'featuredProducts'
> & {
  owner?: UserProfile;
  managersDetailed?: UserProfile[];
};

const emptyFormValues: UpdateBusinessFormValues = {
  businessId: '',
  name: '',
  description: '',
  category: 'GENERAL_STORE',
  location: {
    lat: 0,
    lng: 0,
    zone: '',
    address: '',
  },
  images: {
    profile: '',
    banner: '',
  },
  whatsappNumber: '',
  managers: [],
  subscriptionType: 'FREE_TRIAL',
};

const categoryOptions = [
  { label: 'Tienda general', value: 'GENERAL_STORE' },
  { label: 'Restaurante / comida', value: 'RESTAURANT' },
  { label: 'Servicios', value: 'SERVICE' },
];

const subscriptionOptions = [
  { label: 'Free trial', value: 'FREE_TRIAL' },
  { label: 'Premium', value: 'PREMIUM' },
  { label: 'Premium Plus', value: 'PREMIUM_PLUS' },
];

const BUSINESS_SEARCH_DEBOUNCE_MS = 350;

function buildFormValues(
  business: EditableBusinessRecord,
): UpdateBusinessFormValues {
  return {
    businessId: business.id,
    name: business.name,
    description: business.description,
    category: business.category,
    location: {
      lat: business.location.lat,
      lng: business.location.lng,
      zone: business.location.zone,
      address: business.location.address,
    },
    images: {
      profile: business.images.profile,
      banner: business.images.banner,
    },
    whatsappNumber: business.whatsappNumber,
    managers: business.managers,
    subscriptionType: business.subscriptionType,
  };
}

function SuperAdminBusinessLookup({
  onSelect,
  selectedBusinessId,
  selectedBusinessLabel,
}: {
  onSelect: (businessId: string) => void;
  selectedBusinessId: string;
  selectedBusinessLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(
    search,
    BUSINESS_SEARCH_DEBOUNCE_MS,
  );
  const isSearchPending = search !== debouncedSearch;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const businessesQuery = trpc.business.managedPage.useQuery(
    {
      category: 'ALL',
      page,
      pageSize: 10,
      search: debouncedSearch,
      status: 'ALL',
    },
    {
      placeholderData: (previousData) => previousData,
      retry: false,
    },
  );

  const businesses = businessesQuery.data?.items ?? [];
  const totalPages = businessesQuery.data?.totalPages ?? 1;
  const isSearching = isSearchPending || businessesQuery.isFetching;

  useEffect(() => {
    if (!selectedBusinessId && businesses[0]) {
      onSelect(businesses[0].id);
    }
  }, [businesses, onSelect, selectedBusinessId]);

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={isOpen}
          className="h-auto w-full justify-between rounded-2xl px-4 py-3 text-left sm:max-w-96"
          type="button"
          variant="secondary"
        >
          <span className="min-w-0 flex-1 text-left">
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-text-secondary">
                {selectedBusinessLabel || 'Buscar comercio'}
              </span>
              <span className="truncate text-xs text-text-muted">
                Busca por nombre y navega en bloques de 10 resultados.
              </span>
            </span>
          </span>
          <ChevronsUpDown className="ml-3 size-4 shrink-0 text-text-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(var(--radix-popover-trigger-width),calc(100vw-1rem))] max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-1rem)] overflow-hidden p-0 sm:max-w-96"
        side="bottom"
        sideOffset={8}
      >
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearch}
            placeholder="Buscar comercio por nombre"
            value={search}
          />
          {isSearching ? (
            <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              <LoaderCircle className="size-3.5 animate-spin" />
              Buscando comercios...
            </div>
          ) : null}
          <CommandList className="max-h-[min(18rem,calc(100dvh-13rem))] overscroll-contain">
            {businessesQuery.isLoading ? (
              <div className="flex items-center gap-2 px-4 py-5 text-sm text-text-muted">
                <LoaderCircle className="size-4 animate-spin" />
                Cargando comercios...
              </div>
            ) : businessesQuery.error ? (
              <div className="field-error px-4 py-5 text-sm">
                {businessesQuery.error.message}
              </div>
            ) : businesses.length === 0 ? (
              <CommandEmpty>
                No encontramos comercios para esa búsqueda.
              </CommandEmpty>
            ) : (
              <CommandGroup
                heading={`Resultados${businessesQuery.data ? ` (${businessesQuery.data.total})` : ''}`}
              >
                {businesses.map((business) => {
                  const isSelected = business.id === selectedBusinessId;

                  return (
                    <CommandItem
                      className="items-start gap-3 py-3"
                      key={business.id}
                      onSelect={() => {
                        onSelect(business.id);
                        setIsOpen(false);
                      }}
                      value={`${business.name} ${business.location.zone} ${business.id}`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-text-secondary">
                            {business.name}
                          </p>
                          <StatusBadge status={business.status} />
                        </div>
                        <p className="truncate text-xs text-text-muted">
                          {formatBusinessCategoryLabel(business.category)} ·{' '}
                          {business.location.zone}
                        </p>
                      </div>
                      <Check
                        className={
                          isSelected
                            ? 'mt-1 size-4 shrink-0 text-secondary'
                            : 'mt-1 size-4 shrink-0 opacity-0'
                        }
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
          <div className="flex flex-col gap-3 border-t border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
              Página {businessesQuery.data?.page ?? page} de {totalPages}
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
                variant="ghost"
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Button>
              <Button
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                type="button"
                variant="ghost"
              >
                Siguiente
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function BusinessScreen() {
  const { currentUser, role, isLoading: isRoleLoading } = useCurrentUserRole();
  const utils = trpc.useUtils();
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const isSuperAdmin = isSuperAdminRole(role);
  const hydratedBusinessIdRef = useRef('');

  const superAdminBootstrapQuery = trpc.business.managedPage.useQuery(
    {
      category: 'ALL',
      page: 1,
      pageSize: 10,
      search: '',
      status: 'ALL',
    },
    {
      enabled: isSuperAdmin,
      retry: false,
    },
  );

  const managedBusinessesQuery = trpc.business.managed.useQuery(undefined, {
    enabled: Boolean(currentUser) && !isSuperAdmin,
    retry: false,
  });

  const managedBusinesses = useMemo(
    () => (managedBusinessesQuery.data ?? []) as EditableBusinessRecord[],
    [managedBusinessesQuery.data],
  );

  const selectedBusinessQuery = trpc.business.byId.useQuery(
    { businessId: selectedBusinessId },
    {
      enabled: Boolean(selectedBusinessId),
      retry: false,
    },
  );

  const selectedBusiness = selectedBusinessQuery.data as
    | EditableBusinessRecord
    | undefined;

  const form = useForm<UpdateBusinessFormValues>({
    resolver: zodResolver(updateBusinessInputSchema),
    defaultValues: emptyFormValues,
  });

  useEffect(() => {
    if (!selectedBusinessId && !isSuperAdmin && managedBusinesses[0]) {
      setSelectedBusinessId(managedBusinesses[0].id);
    }
  }, [isSuperAdmin, managedBusinesses, selectedBusinessId]);

  useEffect(() => {
    if (
      !selectedBusinessId &&
      isSuperAdmin &&
      superAdminBootstrapQuery.data?.items[0]
    ) {
      setSelectedBusinessId(superAdminBootstrapQuery.data.items[0].id);
    }
  }, [isSuperAdmin, selectedBusinessId, superAdminBootstrapQuery.data]);

  useEffect(() => {
    if (!selectedBusiness) {
      return;
    }

    if (hydratedBusinessIdRef.current === selectedBusiness.id) {
      return;
    }

    hydratedBusinessIdRef.current = selectedBusiness.id;

    form.reset(buildFormValues(selectedBusiness));
    setTransferTargetId('');
  }, [form, selectedBusiness]);

  const canEditBusiness = Boolean(
    selectedBusiness &&
    currentUser &&
    (isSuperAdmin || currentUser.id === selectedBusiness.ownerId),
  );
  const canEditOperationalFields = Boolean(
    selectedBusiness &&
    currentUser &&
    (isSuperAdmin ||
      currentUser.id === selectedBusiness.ownerId ||
      selectedBusiness.managers.includes(currentUser.id)),
  );
  const canManageManagers = canEditBusiness;
  const canManageSubscription = canEditBusiness;
  const canTransferOwnership = canEditBusiness;

  const updateBusiness = trpc.business.update.useMutation({
    onSuccess: async (updatedBusiness) => {
      await Promise.all([
        utils.business.managed.invalidate(),
        utils.business.managedPage.invalidate(),
        utils.business.byId.invalidate({ businessId: updatedBusiness.id }),
      ]);

      form.reset(buildFormValues(updatedBusiness as EditableBusinessRecord));
      toast.success('Cambios del comercio guardados.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const transferOwnership = trpc.business.transferOwnership.useMutation({
    onSuccess: async () => {
      if (!selectedBusiness) {
        return;
      }

      await Promise.all([
        utils.business.managed.invalidate(),
        utils.business.managedPage.invalidate(),
        utils.business.byId.invalidate({ businessId: selectedBusiness.id }),
      ]);

      setTransferTargetId('');
      setIsTransferDialogOpen(false);
      toast.success('Owner transferido correctamente.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const managerLabels = useMemo<UserProfile[]>(() => {
    return selectedBusiness?.managersDetailed ?? [];
  }, [selectedBusiness]);

  const isLoadingBusiness =
    isRoleLoading ||
    (isSuperAdmin &&
      !selectedBusinessId &&
      superAdminBootstrapQuery.isLoading) ||
    (!isSuperAdmin && managedBusinessesQuery.isLoading) ||
    (Boolean(selectedBusinessId) &&
      selectedBusinessQuery.isLoading &&
      !selectedBusinessQuery.data);

  if (isLoadingBusiness) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  if (!selectedBusiness) {
    return (
      <EmptyState
        description="El rol actual no tiene negocios asociados para administrar en esta simulación."
        title="No tienes un negocio asignado"
      />
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    updateBusiness.mutate(
      updateBusinessInputSchema.parse({
        ...values,
        subscriptionType: canManageSubscription
          ? values.subscriptionType
          : undefined,
        managers: values.managers,
      }),
    );
  });

  return (
    <form className="space-y-6 pb-4 lg:pb-6" onSubmit={onSubmit}>
      <ModuleHeader
        actions={
          isSuperAdmin ? (
            <div className="flex w-full justify-stretch sm:justify-end">
              <SuperAdminBusinessLookup
                onSelect={setSelectedBusinessId}
                selectedBusinessId={selectedBusinessId}
                selectedBusinessLabel={selectedBusiness.name}
              />
            </div>
          ) : managedBusinesses.length > 1 ? (
            <div className="flex w-full justify-stretch sm:justify-end">
              <Select
                onValueChange={setSelectedBusinessId}
                options={managedBusinesses.map((business) => ({
                  label: business.name,
                  value: business.id,
                }))}
                placeholder="Selecciona un negocio"
                value={selectedBusiness.id}
                className="w-full sm:max-w-md"
              />
            </div>
          ) : null
        }
        description="Administra marca, contacto, ubicación y publicación desde una vista operativa pensada para trabajar rápido y con claridad."
        title="Centro de gestión del negocio"
      />

      {!canEditOperationalFields ? (
        <Card className="space-y-3" interactive={false} variant="default">
          <div className="icon-tile">
            <ShieldCheck className="size-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-secondary">
            Vista solo lectura
          </h3>
          <p className="text-sm leading-6 text-text-muted">
            No tienes permisos operativos para editar este comercio.
          </p>
        </Card>
      ) : null}

      {canEditOperationalFields && !canEditBusiness ? (
        <Card className="space-y-3" interactive={false} variant="default">
          <div className="icon-tile">
            <ShieldCheck className="size-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-secondary">
            Edición operativa
          </h3>
          <p className="text-sm leading-6 text-text-muted">
            Como manager puedes actualizar descripción, contacto y ubicación
            operativa. La identidad del negocio, la membresía y la gestión de
            managers siguen reservadas para el owner o un SuperAdmin.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          className="min-w-0 overflow-hidden p-0"
          interactive={false}
          variant="default"
        >
          <div className="relative h-52 bg-primary">
            <img
              alt={selectedBusiness.name}
              className="h-full w-full object-cover opacity-85"
              src={
                form.watch('images.banner') || selectedBusiness.images.banner
              }
            />
          </div>
          <div className="space-y-5 p-5 lg:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <img
                  alt={form.watch('name') || selectedBusiness.name}
                  className="size-20 rounded-lg object-cover ring-4 ring-white"
                  src={
                    form.watch('images.profile') ||
                    selectedBusiness.images.profile
                  }
                />
                <div className="min-w-0 flex-1">
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <Input
                        {...field}
                        className="h-11 w-full text-lg font-semibold"
                        disabled={!canEditBusiness || updateBusiness.isPending}
                        placeholder="Nombre comercial"
                      />
                    )}
                  />
                  <p className="mt-1 text-sm text-text-muted">
                    {formatBusinessCategoryLabel(form.watch('category'))}
                  </p>
                </div>
              </div>
              <StatusBadge status={selectedBusiness.status} />
            </div>

            <Controller
              control={form.control}
              name="description"
              render={({ field }) => (
                <Textarea
                  {...field}
                  className="min-h-28"
                  disabled={
                    !canEditOperationalFields || updateBusiness.isPending
                  }
                  placeholder="Describe el negocio, su propuesta y lo que lo hace claro para discovery."
                />
              )}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                error={form.formState.errors.images?.profile?.message}
                label="Imagen de perfil"
              >
                <Controller
                  control={form.control}
                  name="images.profile"
                  render={({ field }) => (
                    <ImageDropzone
                      disabled={!canEditBusiness || updateBusiness.isPending}
                      maxFileCount={1}
                      maxFileSizeBytes={8 * 1024 * 1024}
                      onChange={(images) => field.onChange(images[0] ?? '')}
                      uploadContext={{
                        businessId: selectedBusiness.id,
                        module: 'business-branding',
                        slot: 'profile',
                      }}
                      value={field.value ? [field.value] : []}
                    />
                  )}
                />
              </FormField>
              <FormField
                error={form.formState.errors.images?.banner?.message}
                label="Banner principal"
              >
                <Controller
                  control={form.control}
                  name="images.banner"
                  render={({ field }) => (
                    <ImageDropzone
                      disabled={!canEditBusiness || updateBusiness.isPending}
                      maxFileCount={1}
                      maxFileSizeBytes={8 * 1024 * 1024}
                      onChange={(images) => field.onChange(images[0] ?? '')}
                      uploadContext={{
                        businessId: selectedBusiness.id,
                        module: 'business-branding',
                        slot: 'banner',
                      }}
                      value={field.value ? [field.value] : []}
                    />
                  )}
                />
              </FormField>
            </div>
          </div>
        </Card>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card
            className="min-w-0 space-y-3"
            interactive={false}
            variant="default"
          >
            <div className="icon-tile">
              <PhoneCall className="size-5" />
            </div>
            <h3 className="font-display text-xl font-semibold text-text-secondary">
              Contacto y publicación
            </h3>
            <FormField
              error={form.formState.errors.whatsappNumber?.message}
              label="WhatsApp principal"
            >
              <Controller
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <Input
                    {...field}
                    disabled={
                      !canEditOperationalFields || updateBusiness.isPending
                    }
                    placeholder="18095550101"
                  />
                )}
              />
            </FormField>
            <div className="space-y-2">
              <p className="text-sm leading-6 text-text-muted">Plan actual</p>
              <SubscriptionBadge
                subscriptionType={selectedBusiness.subscriptionType}
              />
            </div>
          </Card>
          <Card
            className="min-w-0 space-y-3"
            interactive={false}
            variant="default"
          >
            <div className="icon-tile">
              <Clock3 className="size-5" />
            </div>
            <h3 className="font-display text-xl font-semibold text-text-secondary">
              Horarios
            </h3>
            <p className="text-sm leading-6 text-text-muted">
              Placeholder de horarios operativos para la fase 2.
            </p>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <FormSection
          className="min-w-0 lg:col-span-2"
          description="Ajusta la categoría, la zona de cobertura y la dirección pública del comercio."
          title="Datos operativos"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              error={form.formState.errors.category?.message}
              label="Categoría"
            >
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select
                    aria-label="Categoría del negocio"
                    disabled={!canEditBusiness || updateBusiness.isPending}
                    onValueChange={field.onChange}
                    options={categoryOptions}
                    placeholder="Selecciona una categoría"
                    value={field.value}
                  />
                )}
              />
            </FormField>
            <FormField
              error={form.formState.errors.location?.zone?.message}
              label="Zona"
            >
              <Controller
                control={form.control}
                name="location.zone"
                render={({ field }) => (
                  <Input
                    {...field}
                    disabled={
                      !canEditOperationalFields || updateBusiness.isPending
                    }
                    placeholder="Ej. Piantini"
                  />
                )}
              />
            </FormField>
            <FormField
              className="md:col-span-2"
              error={form.formState.errors.location?.address?.message}
              label="Dirección pública"
            >
              <Controller
                control={form.control}
                name="location.address"
                render={({ field }) => (
                  <Input
                    {...field}
                    disabled={
                      !canEditOperationalFields || updateBusiness.isPending
                    }
                    placeholder="Av. Abraham Lincoln 1012, Santo Domingo"
                  />
                )}
              />
            </FormField>
            <FormField
              error={form.formState.errors.location?.lat?.message}
              label="Latitud"
            >
              <Controller
                control={form.control}
                name="location.lat"
                render={({ field }) => (
                  <Input
                    disabled={
                      !canEditOperationalFields || updateBusiness.isPending
                    }
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                    placeholder="18.47"
                    type="number"
                    value={field.value}
                  />
                )}
              />
            </FormField>
            <FormField
              error={form.formState.errors.location?.lng?.message}
              label="Longitud"
            >
              <Controller
                control={form.control}
                name="location.lng"
                render={({ field }) => (
                  <Input
                    disabled={
                      !canEditOperationalFields || updateBusiness.isPending
                    }
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                    placeholder="-69.90"
                    type="number"
                    value={field.value}
                  />
                )}
              />
            </FormField>
          </div>
        </FormSection>
        <Card
          className="min-w-0 space-y-3"
          interactive={false}
          variant="default"
        >
          <div className="icon-tile">
            <Store className="size-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-secondary">
            Estado de publicación
          </h3>
          <p className="text-sm leading-6 text-text-muted">
            Promos activas: {selectedBusiness.activePromotions.length}
          </p>
          <p className="text-sm leading-6 text-text-muted">
            Productos destacados: {selectedBusiness.featuredProducts.length}
          </p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card
          className="min-w-0 space-y-3"
          interactive={false}
          variant="default"
        >
          <div className="icon-tile">
            <Palette className="size-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-secondary">
            Equipo y owner
          </h3>
          <p className="text-sm leading-6 text-text-muted">
            Owner actual:{' '}
            {selectedBusiness.owner?.fullName ?? selectedBusiness.ownerId}
          </p>
          {managerLabels.length ? (
            <div className="flex flex-wrap gap-2">
              {managerLabels.map((manager) => (
                <span
                  className="rounded-full border border-border-subtle bg-white/85 px-3 py-2 text-xs font-semibold text-text-secondary"
                  key={manager.id}
                >
                  {manager.fullName}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-text-muted">
              No hay managers asignados.
            </p>
          )}
          {!canTransferOwnership ? (
            <p className="text-sm leading-6 text-text-muted">
              La membresía y la transferencia de owner siguen reservadas para el
              owner o un SuperAdmin.
            </p>
          ) : null}

          {canManageManagers ? (
            <FormField label="Managers del comercio">
              <Controller
                control={form.control}
                name="managers"
                render={({ field }) => (
                  <BusinessManagersSelect
                    businessId={selectedBusiness.id}
                    canSearchManagers={canManageManagers}
                    disabled={updateBusiness.isPending}
                    onChange={field.onChange}
                    ownerId={selectedBusiness.ownerId}
                    value={field.value ?? []}
                  />
                )}
              />
            </FormField>
          ) : null}
        </Card>

        {canManageSubscription ? (
          <FormSection
            className="min-w-0"
            description="El owner actual o un SuperAdmin puede cambiar la membresía comercial y transferir ownership."
            title="Controles administrativos"
          >
            <FormField
              error={form.formState.errors.subscriptionType?.message}
              label="Membresía"
            >
              <Controller
                control={form.control}
                name="subscriptionType"
                render={({ field }) => (
                  <Select
                    aria-label="Membresía del negocio"
                    disabled={updateBusiness.isPending}
                    onValueChange={field.onChange}
                    options={subscriptionOptions}
                    placeholder="Selecciona la membresía"
                    value={field.value ?? undefined}
                  />
                )}
              />
            </FormField>

            <div className="space-y-3 border-t border-border-subtle pt-4">
              <p className="text-sm font-semibold text-text-secondary">
                Transferir owner
              </p>
              <BusinessOwnerSelect
                businessId={selectedBusiness.id}
                canSearchOwners={canTransferOwnership}
                disabled={transferOwnership.isPending}
                onSelect={(user) => setTransferTargetId(user.id)}
                value={transferTargetId}
              />
              <Button
                className="w-full"
                disabled={
                  !transferTargetId ||
                  transferTargetId === selectedBusiness.ownerId ||
                  transferOwnership.isPending
                }
                onClick={() => setIsTransferDialogOpen(true)}
                type="button"
                variant="warning"
              >
                {transferOwnership.isPending
                  ? 'Transfiriendo owner...'
                  : 'Transferir owner'}
              </Button>
            </div>
          </FormSection>
        ) : null}
      </section>

      <ConfirmDialog
        cancelLabel="Seguir revisando"
        confirmLabel={
          transferOwnership.isPending ? 'Transfiriendo...' : 'Transferir owner'
        }
        confirmVariant="warning"
        description={
          selectedBusiness ? (
            <span>
              Vas a transferir la titularidad principal de{' '}
              <strong>{selectedBusiness.name}</strong>. El nuevo owner asumirá
              el control administrativo del comercio.
            </span>
          ) : (
            'Confirma la transferencia del owner principal del comercio.'
          )
        }
        isPending={transferOwnership.isPending}
        onConfirm={() => {
          if (!selectedBusiness || !transferTargetId) {
            return;
          }

          transferOwnership.mutate({
            businessId: selectedBusiness.id,
            fromUserId: selectedBusiness.ownerId,
            toUserId: transferTargetId,
          });
        }}
        onOpenChange={setIsTransferDialogOpen}
        open={isTransferDialogOpen}
        title="Confirmar transferencia de owner"
      />

      {canEditOperationalFields ? (
        <div className="flex justify-end pt-1">
          <Button disabled={updateBusiness.isPending} type="submit">
            {updateBusiness.isPending
              ? 'Guardando cambios...'
              : 'Guardar cambios'}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
