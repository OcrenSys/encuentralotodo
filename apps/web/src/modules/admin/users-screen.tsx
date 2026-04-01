'use client';

import { useEffect, useState } from 'react';
import type { PlatformUser, UserRole } from 'types';
import { toast } from 'sonner';
import { Badge, Button, Card, EmptyState, LoadingSkeleton, Select } from 'ui';

import { ModuleHeader } from '../../components/management/module-header';
import { SurfaceTable } from '../../components/management/surface-table';
import { trpc } from '../../lib/trpc';

const roleLabels: Record<UserRole, string> = {
  UNASSIGNED: 'Sin permisos',
  USER: 'Usuario',
  ADMIN: 'Admin',
  SUPERADMIN: 'SuperAdmin',
  GLOBALADMIN: 'GlobalAdmin',
};

const roleOptions: UserRole[] = [
  'UNASSIGNED',
  'USER',
  'ADMIN',
  'SUPERADMIN',
  'GLOBALADMIN',
];

function getProviderLabel(
  provider: PlatformUser['identities'][number]['provider'],
) {
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

function getInitials(user: PlatformUser) {
  return user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function UserAccessSummary({ user }: { user: PlatformUser }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {user.identities.length ? (
          user.identities.map((identity) => (
            <Badge
              className="capitalize"
              key={`${user.id}-${identity.provider}`}
              variant="info"
            >
              {getProviderLabel(identity.provider)}
            </Badge>
          ))
        ) : (
          <Badge variant="neutral">Sin identidad vinculada</Badge>
        )}
      </div>
      <p className="text-xs leading-5 text-text-muted">
        {user.identities.some((identity) => identity.emailVerified)
          ? 'Con al menos un proveedor verificado.'
          : 'Sin correo verificado en los proveedores vinculados.'}
      </p>
    </div>
  );
}

export function UsersScreen() {
  const utils = trpc.useUtils();
  const sessionQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const usersQuery = trpc.admin.listUsers.useQuery(undefined, { retry: false });
  const [draftRoles, setDraftRoles] = useState<Record<string, UserRole>>({});

  useEffect(() => {
    if (!usersQuery.data) {
      return;
    }

    setDraftRoles((current) => {
      const next = { ...current };

      usersQuery.data.forEach((user) => {
        next[user.id] = next[user.id] ?? user.role;
      });

      return next;
    });
  }, [usersQuery.data]);

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: async (user) => {
      setDraftRoles((current) => ({
        ...current,
        [user.id]: user.role,
      }));
      await utils.admin.listUsers.invalidate();
      toast.success('Rol actualizado correctamente.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const setUserActive = trpc.admin.setUserActive.useMutation({
    onSuccess: async (user) => {
      await Promise.all([
        utils.admin.listUsers.invalidate(),
        user.id === sessionQuery.data?.user?.id
          ? utils.auth.me.invalidate()
          : Promise.resolve(),
      ]);
      toast.success(
        user.isActive ? 'Usuario reactivado.' : 'Usuario deshabilitado.',
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const currentUserId = sessionQuery.data?.user?.id;

  if (usersQuery.isLoading) {
    return <LoadingSkeleton className="h-[420px]" />;
  }

  if (usersQuery.error) {
    return (
      <EmptyState
        title="No fue posible cargar los usuarios"
        description={usersQuery.error.message}
      />
    );
  }

  if (!usersQuery.data?.length) {
    return (
      <EmptyState
        title="No hay usuarios registrados"
        description="Los usuarios autenticados aparecerán aquí cuando el backend los sincronice por primera vez."
      />
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Usuarios de plataforma"
        description="Lista centralizada para ajustar roles y desactivar cuentas cuando sea necesario. Los cambios aplican sobre el usuario real persistido en Prisma."
      />

      <div className="hidden lg:block">
        <SurfaceTable
          columns={['Usuario', 'Acceso', 'Rol', 'Estado', 'Acciones']}
        >
          {usersQuery.data.map((user) => {
            const selectedRole = draftRoles[user.id] ?? user.role;
            const isSelf = currentUserId === user.id;
            const isRolePending =
              updateRole.isPending && updateRole.variables?.userId === user.id;
            const isStatusPending =
              setUserActive.isPending &&
              setUserActive.variables?.userId === user.id;

            return (
              <div
                className="grid grid-cols-5 gap-4 border-b border-border-default px-5 py-4 last:border-b-0 hover:bg-white/70"
                key={user.id}
              >
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    {user.avatarUrl ? (
                      <img
                        alt={user.fullName}
                        className="size-12 rounded-full border border-border-subtle object-cover"
                        src={user.avatarUrl}
                      />
                    ) : (
                      <div className="icon-tile size-12 rounded-full text-sm font-semibold">
                        {getInitials(user)}
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-semibold text-text-secondary">
                        {user.fullName}
                      </p>
                      <p className="truncate text-sm text-text-muted">
                        {user.email}
                      </p>
                      <p className="text-xs text-text-muted">
                        Creado{' '}
                        {new Date(user.createdAt).toLocaleDateString('es-DO')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="self-center">
                  <UserAccessSummary user={user} />
                </div>

                <div className="self-center space-y-2">
                  <Select
                    aria-label={`Rol para ${user.fullName}`}
                    disabled={isSelf || isRolePending}
                    onChange={(event) => {
                      const role = event.target.value as UserRole;
                      setDraftRoles((current) => ({
                        ...current,
                        [user.id]: role,
                      }));
                    }}
                    value={selectedRole}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-text-muted">
                    {isSelf
                      ? 'Tu propio rol se protege para evitar perder acceso.'
                      : selectedRole === 'UNASSIGNED'
                        ? 'Sin permisos deja la cuenta autenticada pero sin acceso operativo hasta nueva asignacion.'
                        : 'Actualiza el rol cuando necesites elevar o reducir permisos.'}
                  </p>
                </div>

                <div className="self-center">
                  <Badge variant={user.isActive ? 'success' : 'error'}>
                    {user.isActive ? 'Activo' : 'Deshabilitado'}
                  </Badge>
                </div>

                <div className="self-center space-y-2">
                  <Button
                    className="w-full"
                    disabled={
                      isSelf || selectedRole === user.role || isRolePending
                    }
                    onClick={() =>
                      updateRole.mutate({ role: selectedRole, userId: user.id })
                    }
                    type="button"
                    variant="secondary"
                  >
                    {isRolePending ? 'Guardando...' : 'Guardar rol'}
                  </Button>
                  <Button
                    className="w-full"
                    disabled={isSelf || isStatusPending}
                    onClick={() =>
                      setUserActive.mutate({
                        isActive: !user.isActive,
                        userId: user.id,
                      })
                    }
                    type="button"
                    variant={user.isActive ? 'ghost' : 'primary'}
                  >
                    {isStatusPending
                      ? 'Actualizando...'
                      : user.isActive
                        ? 'Deshabilitar'
                        : 'Reactivar'}
                  </Button>
                </div>
              </div>
            );
          })}
        </SurfaceTable>
      </div>

      <div className="grid gap-4 lg:hidden">
        {usersQuery.data.map((user) => {
          const selectedRole = draftRoles[user.id] ?? user.role;
          const isSelf = currentUserId === user.id;
          const isRolePending =
            updateRole.isPending && updateRole.variables?.userId === user.id;
          const isStatusPending =
            setUserActive.isPending &&
            setUserActive.variables?.userId === user.id;

          return (
            <Card
              className="space-y-4"
              interactive={false}
              key={user.id}
              variant="soft"
            >
              <div className="flex items-start gap-3">
                {user.avatarUrl ? (
                  <img
                    alt={user.fullName}
                    className="size-12 rounded-full border border-border-subtle object-cover"
                    src={user.avatarUrl}
                  />
                ) : (
                  <div className="icon-tile size-12 rounded-full text-sm font-semibold">
                    {getInitials(user)}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="truncate font-display text-xl font-semibold text-text-secondary">
                    {user.fullName}
                  </h3>
                  <p className="truncate text-sm text-text-muted">
                    {user.email}
                  </p>
                </div>
                <Badge variant={user.isActive ? 'success' : 'error'}>
                  {user.isActive ? 'Activo' : 'Deshabilitado'}
                </Badge>
              </div>

              <UserAccessSummary user={user} />

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                  Rol actual
                </p>
                <Select
                  aria-label={`Rol móvil para ${user.fullName}`}
                  disabled={isSelf || isRolePending}
                  onChange={(event) => {
                    const role = event.target.value as UserRole;
                    setDraftRoles((current) => ({
                      ...current,
                      [user.id]: role,
                    }));
                  }}
                  value={selectedRole}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  disabled={
                    isSelf || selectedRole === user.role || isRolePending
                  }
                  onClick={() =>
                    updateRole.mutate({ role: selectedRole, userId: user.id })
                  }
                  type="button"
                  variant="secondary"
                >
                  {isRolePending ? 'Guardando...' : 'Guardar rol'}
                </Button>
                <Button
                  disabled={isSelf || isStatusPending}
                  onClick={() =>
                    setUserActive.mutate({
                      isActive: !user.isActive,
                      userId: user.id,
                    })
                  }
                  type="button"
                  variant={user.isActive ? 'ghost' : 'primary'}
                >
                  {isStatusPending
                    ? 'Actualizando...'
                    : user.isActive
                      ? 'Deshabilitar'
                      : 'Reactivar'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
