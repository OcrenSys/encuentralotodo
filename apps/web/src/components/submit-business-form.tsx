'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Building2,
  Crown,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { z } from 'zod';

import { createBusinessInputSchema, type CreateBusinessInput } from 'types';
import {
  Badge,
  BottomNavigation,
  Button,
  Card,
  FormField,
  FormSection,
  Input,
  Panel,
  SectionHeading,
  ShadSelect,
  ShadSelectContent,
  ShadSelectItem,
  ShadSelectTrigger,
  ShadSelectValue,
  Textarea,
} from 'ui';

import { BusinessManagersSelect } from './business-managers-select';
import { BusinessOwnerSelect } from './business-owner-select';
import { useCurrentUserRole } from '../lib/platform-authorization';
import { hasPlatformRole, platformAdminRoles } from '../lib/platform-roles';
import { trpc } from '../lib/trpc';

type CreateBusinessFormValues = z.input<typeof createBusinessInputSchema>;

const defaultValues: CreateBusinessFormValues = {
  name: '',
  description: '',
  category: 'GENERAL_STORE',
  location: {
    address: '',
    zone: '',
    lat: 18.47,
    lng: -69.9,
  },
  images: {
    profile:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=300&q=80',
    banner:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80',
  },
  subscriptionType: 'FREE_TRIAL',
  ownerId: '',
  managers: [],
  whatsappNumber: '18095550110',
};

const categoryOptions = [
  {
    value: 'GENERAL_STORE',
    label: 'Tienda general',
    description: 'Locales físicos, mini markets y comercios multipropósito.',
  },
  {
    value: 'RESTAURANT',
    label: 'Restaurante / comida',
    description: 'Restaurantes, cafeterías, cocinas ocultas y delivery.',
  },
  {
    value: 'SERVICE',
    label: 'Servicios',
    description: 'Negocios de servicios profesionales, técnicos o personales.',
  },
] as const;

const subscriptionOptions = [
  {
    value: 'FREE_TRIAL',
    label: 'Free trial',
    description: 'Para alta inicial y validación operativa.',
  },
  {
    value: 'PREMIUM',
    label: 'Premium',
    description: 'Mayor visibilidad y herramientas comerciales base.',
  },
  {
    value: 'PREMIUM_PLUS',
    label: 'Premium Plus',
    description: 'Capacidad expandida para operación comercial avanzada.',
  },
] as const;

export function SubmitBusinessForm() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { currentUser, isLoading: isCurrentUserLoading } = useCurrentUserRole();
  const canAssignUsers = hasPlatformRole(currentUser?.role, platformAdminRoles);
  const form = useForm<CreateBusinessFormValues>({
    resolver: zodResolver(createBusinessInputSchema),
    defaultValues,
  });

  const createBusiness = trpc.business.create.useMutation({
    onSuccess: async () => {
      await utils.business.list.invalidate();
      toast.success('Negocio enviado para aprobación.');
      router.push('/admin');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const payload = createBusinessInputSchema.parse(values);

    createBusiness.mutate(payload);
  });

  const selectedOwnerId = form.watch('ownerId');

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pb-36 pt-6 sm:px-6 lg:px-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <Card className="space-y-5" interactive={false} variant="soft">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Alta controlada</Badge>
            <Badge variant="neutral">Owner real</Badge>
            <Badge variant="success">Aprobación posterior</Badge>
          </div>
          <SectionHeading
            eyebrow="Alta"
            title="Crear un negocio nuevo"
            description="Define el perfil base con una estructura más clara, asigna un propietario real y deja listo el registro para aprobación operacional."
          />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="field-panel flex items-start gap-3 p-4">
              <span className="icon-tile size-11 rounded-2xl">
                <Building2 className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-secondary">
                  Ficha más clara
                </p>
                <p className="text-xs leading-5 text-text-muted">
                  Mejor jerarquía visual, placeholders más útiles y validación
                  visible.
                </p>
              </div>
            </div>
            <div className="field-panel flex items-start gap-3 p-4">
              <span className="icon-tile size-11 rounded-2xl">
                <Crown className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-secondary">
                  Owner asignado
                </p>
                <p className="text-xs leading-5 text-text-muted">
                  Búsqueda remota con debounce y límite fijo para escalar sin
                  listas masivas.
                </p>
              </div>
            </div>
            <div className="field-panel flex items-start gap-3 p-4">
              <span className="icon-tile size-11 rounded-2xl">
                <MapPinned className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-secondary">
                  Perfil listo para discovery
                </p>
                <p className="text-xs leading-5 text-text-muted">
                  Dirección, contacto y media organizados para publicar sin
                  fricción.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Panel
          className="space-y-4 xl:sticky xl:top-6"
          interactive={false}
          variant="brand"
        >
          <div className="space-y-2 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              <Sparkles className="size-4" />
              Checklist operativo
            </div>
            <h3 className="font-display text-2xl font-semibold">
              Antes de enviar
            </h3>
            <p className="text-sm leading-6 text-white/80">
              Verifica propietario, ubicación pública y assets. El alta se
              guarda con estado pendiente.
            </p>
          </div>
          <div className="space-y-3 text-sm text-white/85">
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
              El owner seleccionado recibirá la responsabilidad principal del
              negocio.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
              La búsqueda de usuarios consulta sólo 10 resultados por intento.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
              Managers sigue siendo opcional y puede completarse después.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/80">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <p>
                {canAssignUsers
                  ? 'Tu sesión tiene acceso administrativo para buscar y asignar propietarios reales.'
                  : isCurrentUserLoading
                    ? 'Resolviendo permisos de tu sesión...'
                    : 'Sin acceso admin: la búsqueda remota de propietarios queda deshabilitada para esta sesión.'}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Card className="overflow-hidden" interactive={false} variant="elevated">
        <form
          className="grid gap-6 p-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          onSubmit={onSubmit}
        >
          <FormSection
            className="lg:col-span-2"
            description="Datos base del negocio para identificarlo, categorizarlo y definir el plan inicial."
            title="Información principal"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                className="md:col-span-2"
                error={form.formState.errors.name?.message}
                hint="Usa el nombre comercial que verá el usuario final."
                label="Nombre del negocio"
              >
                <Input
                  placeholder="Ej. Casa Norte Market"
                  {...form.register('name')}
                />
              </FormField>
              <FormField
                className="md:col-span-2"
                error={form.formState.errors.description?.message}
                hint="Resume propuesta de valor, cobertura y tipo de operación en 2 o 3 frases."
                label="Descripción"
              >
                <Textarea
                  placeholder="Describe el tipo de negocio, lo que ofrece y el contexto que necesita el equipo para aprobarlo."
                  {...form.register('description')}
                />
              </FormField>
              <FormField
                error={form.formState.errors.category?.message}
                hint="Escoge la categoría predominante para discovery y reporting."
                label="Categoría"
              >
                <Controller
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <ShadSelect
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <ShadSelectTrigger>
                        <ShadSelectValue placeholder="Selecciona una categoría" />
                      </ShadSelectTrigger>
                      <ShadSelectContent>
                        {categoryOptions.map((option) => (
                          <ShadSelectItem
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </ShadSelectItem>
                        ))}
                      </ShadSelectContent>
                    </ShadSelect>
                  )}
                />
              </FormField>
              <FormField
                error={form.formState.errors.subscriptionType?.message}
                hint="El plan inicial determina capacidad y features desde el alta."
                label="Suscripción"
              >
                <Controller
                  control={form.control}
                  name="subscriptionType"
                  render={({ field }) => (
                    <ShadSelect
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <ShadSelectTrigger>
                        <ShadSelectValue placeholder="Selecciona un plan" />
                      </ShadSelectTrigger>
                      <ShadSelectContent>
                        {subscriptionOptions.map((option) => (
                          <ShadSelectItem
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </ShadSelectItem>
                        ))}
                      </ShadSelectContent>
                    </ShadSelect>
                  )}
                />
              </FormField>
              <div className="md:col-span-2 grid gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-white/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
                  Referencia rápida
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border-subtle bg-white/70 px-4 py-3">
                    <p className="text-sm font-semibold text-text-secondary">
                      Categoría actual
                    </p>
                    <p className="text-xs leading-5 text-text-muted">
                      {
                        categoryOptions.find(
                          (option) => option.value === form.watch('category'),
                        )?.description
                      }
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border-subtle bg-white/70 px-4 py-3">
                    <p className="text-sm font-semibold text-text-secondary">
                      Plan seleccionado
                    </p>
                    <p className="text-xs leading-5 text-text-muted">
                      {
                        subscriptionOptions.find(
                          (option) =>
                            option.value === form.watch('subscriptionType'),
                        )?.description
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            className="lg:col-span-2"
            description="Ubicación pública, canal principal de contacto y propietario responsable del perfil."
            title="Ubicación, contacto y ownership"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                error={form.formState.errors.location?.zone?.message}
                hint="Barrio, sector o referencia corta para filtrar operaciones."
                label="Zona"
              >
                <Input
                  placeholder="Ej. Piantini"
                  {...form.register('location.zone')}
                />
              </FormField>
              <FormField
                error={form.formState.errors.whatsappNumber?.message}
                hint="Número con prefijo país para leads y conversiones por WhatsApp."
                label="WhatsApp"
              >
                <Input
                  placeholder="18095550110"
                  {...form.register('whatsappNumber')}
                />
              </FormField>
              <FormField
                className="md:col-span-2"
                error={form.formState.errors.location?.address?.message}
                hint="Dirección visible para discovery y la ficha pública."
                label="Dirección"
              >
                <Input
                  placeholder="Av. Abraham Lincoln 1012, Santo Domingo"
                  {...form.register('location.address')}
                />
              </FormField>
              <FormField
                error={form.formState.errors.location?.lat?.message}
                hint="Úsalo para ubicar el negocio con precisión en mapas y cercanía."
                label="Latitud"
              >
                <Input
                  step="0.0001"
                  type="number"
                  {...form.register('location.lat', { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                error={form.formState.errors.location?.lng?.message}
                hint="Completa junto a la latitud para soportar distancia y geoubicación."
                label="Longitud"
              >
                <Input
                  step="0.0001"
                  type="number"
                  {...form.register('location.lng', { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                className="md:col-span-2"
                error={form.formState.errors.ownerId?.message}
                hint={
                  canAssignUsers
                    ? 'Búsqueda remota con debounce. Se consultan hasta 10 usuarios por intento.'
                    : 'Necesitas un rol admin activo para buscar propietarios reales.'
                }
                label="Responsable principal"
              >
                <BusinessOwnerSelect
                  canSearchOwners={canAssignUsers}
                  disabled={isCurrentUserLoading || !canAssignUsers}
                  onSelect={(user) => {
                    form.setValue('ownerId', user.id, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.setValue(
                      'managers',
                      (form.getValues('managers') ?? []).filter(
                        (managerId) => managerId !== user.id,
                      ),
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    );
                  }}
                  value={selectedOwnerId}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            className="lg:col-span-2"
            description="Assets visibles del perfil y lista preliminar de managers si ya la tienes disponible."
            title="Media y encargados"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                error={form.formState.errors.images?.profile?.message}
                hint="Ideal para avatar o imagen principal del perfil público."
                label="Imagen perfil"
              >
                <Input
                  placeholder="https://..."
                  {...form.register('images.profile')}
                />
              </FormField>
              <FormField
                error={form.formState.errors.images?.banner?.message}
                hint="Usa un banner horizontal para discovery y portada del negocio."
                label="Imagen banner"
              >
                <Input
                  placeholder="https://..."
                  {...form.register('images.banner')}
                />
              </FormField>
              <FormField
                className="md:col-span-2"
                error={form.formState.errors.managers?.message}
                hint={
                  canAssignUsers
                    ? 'Opcional. Agrega managers reales con búsqueda remota. El owner seleccionado no se puede repetir aquí.'
                    : 'Necesitas un rol admin activo para asignar managers reales.'
                }
                label="Encargados"
              >
                <BusinessManagersSelect
                  canSearchManagers={canAssignUsers}
                  disabled={isCurrentUserLoading || !canAssignUsers}
                  onChange={(managerIds) => {
                    form.setValue('managers', managerIds, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  ownerId={selectedOwnerId}
                  value={form.watch('managers') ?? []}
                />
              </FormField>
            </div>
          </FormSection>

          <div className="flex flex-col gap-3 px-5 pb-5 lg:col-span-2 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm leading-6 text-text-muted">
              El payload final incluye `ownerId` real, categoría, suscripción,
              media y ubicación completa.
            </p>
            <Button
              disabled={
                createBusiness.isPending ||
                isCurrentUserLoading ||
                !canAssignUsers
              }
              type="submit"
            >
              {createBusiness.isPending
                ? 'Enviando alta...'
                : 'Enviar para aprobación'}
            </Button>
          </div>
        </form>
      </Card>

      <BottomNavigation current="profile" />
    </main>
  );
}
