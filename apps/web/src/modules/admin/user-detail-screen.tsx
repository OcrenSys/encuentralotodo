'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  adminUserProfileUpdateInputSchema,
  type AdminUserProfileUpdateInput,
  type BaseUserRole,
} from 'types';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  FormField,
  Input,
  LoadingSkeleton,
  Select,
} from 'ui';

import { BusinessOwnerSelect } from '../../components/business-owner-select';
import { ModuleHeader } from '../../components/management/module-header';
import { formatRoleLabel, formatStatusLabel } from '../../lib/display-labels';
import { trpc } from '../../lib/trpc';

const baseRoleOptions: Array<{ label: string; value: BaseUserRole }> = [
  { label: 'Usuario', value: 'USER' },
  { label: 'Sin acceso base', value: 'NO_ACCESS' },
];

const emptyValues: Pick<AdminUserProfileUpdateInput, 'fullName' | 'phone'> = {
  fullName: '',
  phone: '',
};

function formatDate(value?: string) {
  if (!value) {
    return 'Sin registro';
  }

  return new Date(value).toLocaleString('es-DO');
}

function getProviderLabel(provider: 'mock' | 'firebase' | 'cognito') {
  switch (provider) {
    case 'firebase':
      return 'Firebase';
    case 'cognito':
      return 'Cognito';
    case 'mock':
    default:
      return 'Mock';
  }
}

export function AdminUserDetailScreen({ userId }: { userId: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const detailQuery = trpc.admin.userById.useQuery(
    { userId },
    { retry: false },
  );
  const form = useForm<Pick<AdminUserProfileUpdateInput, 'fullName' | 'phone'>>(
    {
      defaultValues: emptyValues,
      resolver: zodResolver(
        adminUserProfileUpdateInputSchema.pick({
          fullName: true,
          phone: true,
        }),
      ),
    },
  );

  const [selectedBaseRole, setSelectedBaseRole] =
    useState<BaseUserRole>('USER');
  const [managerBusinessId, setManagerBusinessId] = useState('');
  const [transferTargets, setTransferTargets] = useState<
    Record<string, string>
  >({});
  const [pendingTransferBusinessId, setPendingTransferBusinessId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    form.reset({
      fullName: detailQuery.data.user.fullName,
      phone: detailQuery.data.user.phone ?? '',
    });

    if (
      detailQuery.data.user.role === 'USER' ||
      detailQuery.data.user.role === 'NO_ACCESS'
    ) {
      setSelectedBaseRole(detailQuery.data.user.role);
    } else {
      setSelectedBaseRole('USER');
    }
  }, [detailQuery.data, form]);

  const updateProfile = trpc.admin.updateUserProfile.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.userById.invalidate({ userId }),
        utils.admin.listUsersPage.invalidate(),
        utils.admin.listUsers.invalidate(),
      ]);
      toast.success('Perfil actualizado correctamente.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateBaseRole = trpc.admin.updateBaseUserRole.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.userById.invalidate({ userId }),
        utils.admin.listUsersPage.invalidate(),
        utils.admin.listUsers.invalidate(),
      ]);
      toast.success('Acceso base actualizado.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const assignManager = trpc.admin.assignBusinessRole.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.userById.invalidate({ userId }),
        utils.admin.listUsersPage.invalidate(),
      ]);
      setManagerBusinessId('');
      toast.success('Asignación guardada.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeBusinessRole = trpc.admin.removeBusinessRole.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.userById.invalidate({ userId }),
        utils.admin.listUsersPage.invalidate(),
      ]);
      toast.success('Asignación eliminada.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const transferOwnership = trpc.admin.transferBusinessOwnership.useMutation({
    onSuccess: async (detail) => {
      await Promise.all([
        utils.admin.userById.invalidate({ userId }),
        utils.admin.userById.invalidate({ userId: detail.user.id }),
        utils.admin.listUsersPage.invalidate(),
      ]);
      if (pendingTransferBusinessId) {
        setTransferTargets((current) => {
          const next = { ...current };
          delete next[pendingTransferBusinessId];
          return next;
        });
      }
      setPendingTransferBusinessId(null);
      toast.success('Ownership transferido correctamente.');

      if (detail.user.id !== userId) {
        router.push(`/admin/users/${detail.user.id}`);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const ownedAssignments = useMemo(
    () =>
      detailQuery.data?.businessAssignments.filter(
        (assignment) => assignment.role === 'OWNER',
      ) ?? [],
    [detailQuery.data?.businessAssignments],
  );

  const pendingTransferAssignment = useMemo(
    () =>
      ownedAssignments.find(
        (assignment) => assignment.businessId === pendingTransferBusinessId,
      ),
    [ownedAssignments, pendingTransferBusinessId],
  );

  const managerCandidates = useMemo(() => {
    if (!detailQuery.data) {
      return [];
    }

    const assignedBusinessIds = new Set(
      detailQuery.data.businessAssignments.map(
        (assignment) => assignment.businessId,
      ),
    );

    return detailQuery.data.availableBusinesses.filter(
      (business) => !assignedBusinessIds.has(business.id),
    );
  }, [detailQuery.data]);

  if (detailQuery.isLoading) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  if (detailQuery.error) {
    return (
      <EmptyState
        title="No fue posible cargar el usuario"
        description={detailQuery.error.message}
      />
    );
  }

  if (!detailQuery.data) {
    return (
      <EmptyState
        title="Usuario no encontrado"
        description="La cuenta solicitada no existe o ya no está disponible en la consola."
      />
    );
  }

  const detail = detailQuery.data;
  const canEditProfile = detail.authProviders.every(
    (provider) => provider.provider === 'mock',
  );
  const hasBaseRoleEditable =
    detail.user.role === 'USER' || detail.user.role === 'NO_ACCESS';

  return (
    <div className="space-y-6">
      <ModuleHeader
        title={detail.user.fullName}
        description="Detalle operativo del usuario, con edición mínima del perfil, acceso base, asignaciones de negocio y transferencia de ownership."
        actions={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <Button asChild type="button" variant="ghost">
              <Link href="/admin/users">Volver al listado</Link>
            </Button>
            <Button
              disabled={
                !canEditProfile ||
                !form.formState.isDirty ||
                updateProfile.isPending
              }
              onClick={form.handleSubmit((values) =>
                updateProfile.mutate({ userId, ...values }),
              )}
              type="button"
            >
              {updateProfile.isPending ? 'Guardando...' : 'Guardar perfil'}
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <Card className="space-y-5" interactive={false} variant="elevated">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
              Perfil
            </p>
            <h3 className="font-display text-2xl font-semibold text-text-secondary">
              Datos editables
            </h3>
            <p className="text-sm leading-6 text-text-muted">
              {canEditProfile
                ? 'Esta cuenta usa identidades mock, así que el nombre y el teléfono pueden editarse desde la consola.'
                : 'La cuenta está gobernada por el proveedor de autenticación activo; por ahora solo mostramos sus datos en modo lectura.'}
            </p>
          </div>

          <form className="grid gap-4 md:grid-cols-2">
            <FormField
              className="md:col-span-2"
              error={form.formState.errors.fullName?.message}
              label="Nombre completo"
            >
              <Input
                disabled={!canEditProfile || updateProfile.isPending}
                {...form.register('fullName')}
              />
            </FormField>

            <FormField label="Correo electrónico">
              <Input disabled readOnly value={detail.user.email} />
            </FormField>

            <FormField
              error={form.formState.errors.phone?.message}
              hint="Opcional. Útil como referencia operativa interna."
              label="Teléfono"
            >
              <Input
                disabled={!canEditProfile || updateProfile.isPending}
                placeholder="8095550110"
                {...form.register('phone')}
              />
            </FormField>
          </form>
        </Card>

        <Card className="space-y-4" interactive={false} variant="soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
              Estado de cuenta
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary">
              Resumen operativo
            </h3>
          </div>

          <div className="grid gap-3">
            <div className="interactive-row space-y-2 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                Rol actual
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">
                  {formatRoleLabel(detail.user.role)}
                </Badge>
                <Badge variant={detail.user.isActive ? 'success' : 'error'}>
                  {detail.user.isActive ? 'Activo' : 'Deshabilitado'}
                </Badge>
              </div>
            </div>

            <div className="interactive-row space-y-3 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                  Acceso base
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Solo aplica directamente cuando el usuario no tiene un rol de
                  plataforma elevado.
                </p>
              </div>
              {hasBaseRoleEditable ? (
                <div className="flex flex-col gap-3">
                  <Select
                    aria-label="Acceso base"
                    disabled={updateBaseRole.isPending}
                    onValueChange={(value) =>
                      setSelectedBaseRole(value as BaseUserRole)
                    }
                    options={baseRoleOptions}
                    value={selectedBaseRole}
                  />
                  <Button
                    disabled={
                      selectedBaseRole === detail.user.role ||
                      updateBaseRole.isPending
                    }
                    onClick={() =>
                      updateBaseRole.mutate({ role: selectedBaseRole, userId })
                    }
                    type="button"
                    variant="secondary"
                  >
                    {updateBaseRole.isPending
                      ? 'Guardando...'
                      : 'Guardar acceso base'}
                  </Button>
                </div>
              ) : (
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-white/70 px-4 py-3 text-sm text-text-muted">
                  Primero reduce el rol de plataforma en el listado global si
                  quieres dejar a esta cuenta en USER o NO_ACCESS.
                </div>
              )}
            </div>

            <div className="interactive-row space-y-2 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                Proveedores autenticados
              </p>
              <div className="flex flex-wrap gap-2">
                {detail.authProviders.map((provider) => (
                  <Badge
                    key={`${provider.provider}-${provider.externalUserId}`}
                    variant={provider.emailVerified ? 'success' : 'neutral'}
                  >
                    {getProviderLabel(provider.provider)}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-text-muted">
                {detail.verificationState.hasVerifiedIdentity
                  ? 'Hay al menos una identidad verificada.'
                  : 'No hay identidades verificadas todavía.'}
              </p>
            </div>

            <div className="interactive-row space-y-1 p-4 text-sm text-text-muted">
              <p>
                Último acceso:{' '}
                <span className="font-medium text-text-secondary">
                  {formatDate(detail.user.lastAccessAt)}
                </span>
              </p>
              <p>
                Creado:{' '}
                <span className="font-medium text-text-secondary">
                  {formatDate(detail.user.createdAt)}
                </span>
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="space-y-4" interactive={false} variant="soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
              Asignaciones
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary">
              Roles por negocio
            </h3>
          </div>

          <div className="grid gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-white/60 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <FormField
              hint="Solo agregamos managers aquí. El ownership se transfiere explícitamente para evitar cambios accidentales."
              label="Agregar como manager"
            >
              <Select
                aria-label="Negocio para manager"
                disabled={
                  assignManager.isPending || managerCandidates.length === 0
                }
                onValueChange={setManagerBusinessId}
                options={managerCandidates.map((business) => ({
                  label: `${business.name} · ${formatStatusLabel(business.status)}`,
                  value: business.id,
                }))}
                placeholder="Selecciona un negocio"
                value={managerBusinessId}
              />
            </FormField>
            <Button
              disabled={!managerBusinessId || assignManager.isPending}
              onClick={() =>
                assignManager.mutate({
                  businessId: managerBusinessId,
                  role: 'MANAGER',
                  userId,
                })
              }
              type="button"
            >
              {assignManager.isPending ? 'Asignando...' : 'Agregar manager'}
            </Button>
          </div>

          {detail.businessAssignments.length ? (
            <div className="space-y-3">
              {detail.businessAssignments.map((assignment) => (
                <div
                  className="interactive-row space-y-3 p-4"
                  key={assignment.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text-secondary">
                        {assignment.businessName ?? assignment.businessId}
                      </p>
                      <p className="text-sm text-text-muted">
                        Registrado {formatDate(assignment.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="info">
                        {formatRoleLabel(assignment.role)}
                      </Badge>
                      {assignment.businessStatus ? (
                        <Badge
                          variant={
                            assignment.businessStatus === 'APPROVED'
                              ? 'success'
                              : 'warning'
                          }
                        >
                          {formatStatusLabel(assignment.businessStatus)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {assignment.role === 'MANAGER' ? (
                    <div className="flex justify-end">
                      <Button
                        disabled={removeBusinessRole.isPending}
                        onClick={() =>
                          removeBusinessRole.mutate({
                            businessId: assignment.businessId,
                            role: assignment.role,
                            userId,
                          })
                        }
                        type="button"
                        variant="ghost"
                      >
                        {removeBusinessRole.isPending
                          ? 'Actualizando...'
                          : 'Quitar manager'}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">
                      El ownership no se elimina directamente. Usa la
                      transferencia controlada más abajo.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin asignaciones activas"
              description="Todavía no hay negocios vinculados a esta cuenta."
            />
          )}
        </Card>

        <Card className="space-y-4" interactive={false} variant="soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
              Ownership
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary">
              Transferir propiedad
            </h3>
          </div>

          {ownedAssignments.length ? (
            <div className="space-y-4">
              {ownedAssignments.map((assignment) => {
                const selectedTargetId =
                  transferTargets[assignment.businessId] ?? '';

                return (
                  <div
                    className="interactive-row space-y-3 p-4"
                    key={assignment.id}
                  >
                    <div>
                      <p className="font-semibold text-text-secondary">
                        {assignment.businessName ?? assignment.businessId}
                      </p>
                      <p className="text-sm text-text-muted">
                        Selecciona el nuevo owner y se conservará la
                        compatibilidad con ownerId.
                      </p>
                    </div>

                    <BusinessOwnerSelect
                      canSearchOwners
                      disabled={transferOwnership.isPending}
                      onSelect={(user) =>
                        setTransferTargets((current) => ({
                          ...current,
                          [assignment.businessId]: user.id,
                        }))
                      }
                      value={selectedTargetId}
                    />

                    <Button
                      disabled={
                        !selectedTargetId ||
                        selectedTargetId === detail.user.id ||
                        transferOwnership.isPending
                      }
                      onClick={() =>
                        setPendingTransferBusinessId(assignment.businessId)
                      }
                      type="button"
                      variant="warning"
                    >
                      {transferOwnership.isPending
                        ? 'Transfiriendo...'
                        : 'Transferir ownership'}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Sin negocios para transferir"
              description="Solo los negocios donde esta cuenta es owner aparecen en esta sección."
            />
          )}
        </Card>
      </section>

      <ConfirmDialog
        cancelLabel="Seguir revisando"
        confirmLabel={
          transferOwnership.isPending
            ? 'Transfiriendo...'
            : 'Transferir propiedad'
        }
        confirmVariant="warning"
        description={
          pendingTransferAssignment ? (
            <span>
              Vas a transferir la propiedad principal de{' '}
              <strong>
                {pendingTransferAssignment.businessName ??
                  pendingTransferAssignment.businessId}
              </strong>{' '}
              a otra cuenta.
            </span>
          ) : (
            'Confirma la transferencia de propiedad del negocio seleccionado.'
          )
        }
        isPending={transferOwnership.isPending}
        onConfirm={() => {
          if (!pendingTransferAssignment) {
            return;
          }

          const selectedTargetId =
            transferTargets[pendingTransferAssignment.businessId] ?? '';

          if (!selectedTargetId || selectedTargetId === detail.user.id) {
            return;
          }

          transferOwnership.mutate({
            businessId: pendingTransferAssignment.businessId,
            fromUserId: detail.user.id,
            toUserId: selectedTargetId,
          });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setPendingTransferBusinessId(null);
          }
        }}
        open={Boolean(pendingTransferBusinessId)}
        title="Confirmar transferencia de propiedad"
      />

      <Card className="space-y-4" interactive={false} variant="soft">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
            Auditoría
          </p>
          <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary">
            Cambios recientes sobre esta cuenta
          </h3>
        </div>

        {detail.auditLogs.length ? (
          <div className="space-y-3">
            {detail.auditLogs.slice(0, 10).map((entry) => (
              <div className="interactive-row space-y-2 p-4" key={entry.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="neutral">
                    {formatRoleLabel(entry.action)}
                  </Badge>
                  <span className="text-xs text-text-muted">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-text-muted">
                  Actor:{' '}
                  <span className="font-medium text-text-secondary">
                    {entry.actor?.fullName ?? entry.actorUserId}
                  </span>
                </p>
                {entry.businessId ? (
                  <p className="text-sm text-text-muted">
                    Negocio afectado:{' '}
                    <span className="font-medium text-text-secondary">
                      {entry.businessId}
                    </span>
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin actividad registrada"
            description="Las mutaciones administrativas nuevas se reflejarán aquí para esta cuenta."
          />
        )}
      </Card>
    </div>
  );
}
