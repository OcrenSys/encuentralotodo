'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  LoadingSkeleton,
} from 'ui';
import {
  selfProfileUpdateInputSchema,
  type SelfProfileUpdateInput,
} from 'types';

import { ModuleHeader } from '../../components/management/module-header';
import { formatRoleLabel, formatStatusLabel } from '../../lib/display-labels';
import { trpc } from '../../lib/trpc';

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

const emptyValues: SelfProfileUpdateInput = {
  fullName: '',
  phone: '',
};

export function ProfileScreen() {
  const utils = trpc.useUtils();
  const profileQuery = trpc.auth.profile.useQuery(undefined, { retry: false });
  const form = useForm<SelfProfileUpdateInput>({
    defaultValues: emptyValues,
    resolver: zodResolver(selfProfileUpdateInputSchema),
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    form.reset({
      fullName: profileQuery.data.user.fullName,
      phone: profileQuery.data.user.phone ?? '',
    });
  }, [form, profileQuery.data]);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.auth.profile.invalidate(),
        utils.auth.me.invalidate(),
      ]);
      toast.success('Perfil actualizado correctamente.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeOwnBusinessRole = trpc.auth.removeOwnBusinessRole.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.auth.profile.invalidate(),
        utils.auth.me.invalidate(),
      ]);
      toast.success('Asignación removida correctamente.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (profileQuery.isLoading) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  if (profileQuery.error) {
    return (
      <EmptyState
        title="No fue posible cargar tu perfil"
        description={profileQuery.error.message}
      />
    );
  }

  if (!profileQuery.data) {
    return (
      <EmptyState
        title="No encontramos tu perfil"
        description="La sesión está autenticada, pero todavía no se pudo resolver un usuario persistido para esta cuenta."
      />
    );
  }

  const profile = profileQuery.data;
  const canEditProfile = profile.authProviders.every(
    (provider) => provider.provider === 'mock',
  );

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Mi perfil"
        description="Revisa tu identidad operativa, el acceso base activo y los negocios donde ya tienes una asignación registrada."
        actions={
          <div className="flex w-full justify-end">
            <Button
              disabled={
                !canEditProfile ||
                !form.formState.isDirty ||
                updateProfile.isPending
              }
              onClick={form.handleSubmit((values) =>
                updateProfile.mutate(values),
              )}
              type="button"
            >
              {updateProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <Card className="space-y-5" interactive={false} variant="elevated">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
              Datos personales
            </p>
            <h3 className="font-display text-2xl font-semibold text-text-secondary">
              Perfil operativo
            </h3>
            <p className="text-sm leading-6 text-text-muted">
              {canEditProfile
                ? 'Puedes editar nombre y teléfono porque esta cuenta usa identidades mock.'
                : 'Nombre y teléfono permanecen de solo lectura porque el proveedor activo administra esos datos.'}
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
              <Input disabled readOnly value={profile.user.email} />
            </FormField>

            <FormField
              error={form.formState.errors.phone?.message}
              hint="Opcional. Úsalo como referencia operativa para soporte o coordinación interna."
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
              Estado de acceso
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary">
              Resumen de sesión
            </h3>
          </div>

          <div className="grid gap-3">
            <div className="interactive-row space-y-2 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                Rol actual
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">
                  {formatRoleLabel(profile.user.role)}
                </Badge>
                <Badge variant={profile.user.isActive ? 'success' : 'error'}>
                  {profile.user.isActive
                    ? 'Cuenta activa'
                    : 'Cuenta deshabilitada'}
                </Badge>
              </div>
            </div>

            <div className="interactive-row space-y-2 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                Proveedores autenticados
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.authProviders.map((provider) => (
                  <Badge
                    key={`${provider.provider}-${provider.externalUserId}`}
                    variant={provider.emailVerified ? 'success' : 'neutral'}
                  >
                    {getProviderLabel(provider.provider)}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-text-muted">
                {profile.verificationState.hasVerifiedIdentity
                  ? 'Hay al menos una identidad verificada.'
                  : 'Todavía no hay identidades verificadas.'}
              </p>
            </div>

            <div className="interactive-row space-y-1 p-4 text-sm text-text-muted">
              <p>
                Último acceso:{' '}
                <span className="font-medium text-text-secondary">
                  {formatDate(profile.user.lastAccessAt)}
                </span>
              </p>
              <p>
                Alta inicial:{' '}
                <span className="font-medium text-text-secondary">
                  {formatDate(profile.user.createdAt)}
                </span>
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4" interactive={false} variant="soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
              Asignaciones
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary">
              Negocios vinculados
            </h3>
          </div>

          {profile.businessAssignments.length ? (
            <div className="space-y-3">
              {profile.businessAssignments.map((assignment) => (
                <div
                  className="interactive-row space-y-2 p-4"
                  key={assignment.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
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
                        disabled={removeOwnBusinessRole.isPending}
                        onClick={() =>
                          removeOwnBusinessRole.mutate({
                            businessId: assignment.businessId,
                          })
                        }
                        type="button"
                        variant="ghost"
                      >
                        {removeOwnBusinessRole.isPending
                          ? 'Actualizando...'
                          : 'Salir de este negocio'}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin asignaciones todavía"
              description="Cuando una cuenta quede ligada a un negocio como owner o manager, aparecerá aquí."
            />
          )}
        </Card>

        <Card className="space-y-4" interactive={false} variant="soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
              Auditoría
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary">
              Cambios recientes
            </h3>
          </div>

          {profile.auditLogs.length ? (
            <div className="space-y-3">
              {profile.auditLogs.slice(0, 8).map((entry) => (
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
                    {entry.actor?.fullName ?? 'Sistema'} ejecutó este cambio.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin actividad registrada"
              description="Las actualizaciones futuras del perfil y del acceso quedarán visibles aquí."
            />
          )}
        </Card>
      </section>
    </div>
  );
}
