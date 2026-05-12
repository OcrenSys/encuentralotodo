'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { Eye, RotateCcw, ShieldCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import type { PlatformUser, UserRole } from 'types';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  Select,
} from 'ui';

import { ManagementListToolbar } from '../../components/management/management-list-toolbar';
import { ManagementPagination } from '../../components/management/management-pagination';
import { ModuleHeader } from '../../components/management/module-header';
import { SurfaceTable } from '../../components/management/surface-table';
import { sanitizeDisplayText } from '../../lib/formatting';
import { trpc } from '../../lib/trpc';

const roleLabels: Record<UserRole, string> = {
  UNASSIGNED: 'Sin permisos',
  NO_ACCESS: 'Sin acceso base',
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
    <div className="space-y-1.5">
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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL');
  const deferredSearch = useDeferredValue(search);
  const usersQuery = trpc.admin.listUsersPage.useQuery(
    {
      page,
      pageSize,
      role: roleFilter,
      search: deferredSearch,
      status: statusFilter,
    },
    { placeholderData: (previousData) => previousData, retry: false },
  );
  const [draftRoles, setDraftRoles] = useState<Record<string, UserRole>>({});
  const [statusDialogUser, setStatusDialogUser] = useState<PlatformUser | null>(
    null,
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, roleFilter, statusFilter]);

  useEffect(() => {
    if (!usersQuery.data?.items) {
      return;
    }

    setDraftRoles((current) => {
      const next = { ...current };

      usersQuery.data.items.forEach((user) => {
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
      await Promise.all([
        utils.admin.listUsers.invalidate(),
        utils.admin.listUsersPage.invalidate(),
      ]);
      toast.success('Rol actualizado correctamente.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const setUserActive = trpc.admin.setUserActive.useMutation({
    onSuccess: async (user) => {
      await Promise.all([
        utils.admin.listUsersPage.invalidate(),
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

  if (!usersQuery.data?.items.length) {
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

      <ManagementListToolbar
        filters={[
          {
            label: 'Rol',
            onValueChange: (value) => setRoleFilter(value as 'ALL' | UserRole),
            options: [
              { label: 'Todos los roles', value: 'ALL' },
              ...roleOptions.map((role) => ({
                label: roleLabels[role],
                value: role,
              })),
            ],
            value: roleFilter,
          },
          {
            label: 'Estado del usuario',
            onValueChange: (value) =>
              setStatusFilter(value as 'ALL' | 'ACTIVE' | 'INACTIVE'),
            options: [
              { label: 'Todos los estados', value: 'ALL' },
              { label: 'Activos', value: 'ACTIVE' },
              { label: 'Inactivos', value: 'INACTIVE' },
            ],
            value: statusFilter,
          },
        ]}
        searchPlaceholder="Buscar usuarios por nombre o correo"
        searchValue={search}
        summary={`${usersQuery.data?.total ?? 0} usuarios encontrados`}
        onSearchChange={setSearch}
      />

      <div className="hidden lg:block">
        <SurfaceTable
          columns={['Usuario', 'Acceso', 'Rol', 'Estado', 'Acciones']}
        >
          {usersQuery.data.items.map((user) => {
            const selectedRole = draftRoles[user.id] ?? user.role;
            const isSelf = currentUserId === user.id;
            const isRolePending =
              updateRole.isPending && updateRole.variables?.userId === user.id;
            const isStatusPending =
              setUserActive.isPending &&
              setUserActive.variables?.userId === user.id;

            return (
              <div
                className="grid grid-cols-5 gap-4 border-b border-border-default px-4 py-3 last:border-b-0 hover:bg-white/70"
                key={user.id}
              >
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    {user.avatarUrl ? (
                      <img
                        alt={sanitizeDisplayText(user.fullName, 'Usuario')}
                        className="size-10 rounded-full border border-border-subtle object-cover"
                        src={user.avatarUrl}
                      />
                    ) : (
                      <div className="icon-tile size-10 rounded-full text-sm font-semibold">
                        {getInitials(user)}
                      </div>
                    )}
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate font-semibold text-text-secondary">
                        {sanitizeDisplayText(
                          user.fullName,
                          'Usuario sin nombre',
                        )}
                      </p>
                      <p className="truncate text-sm text-text-muted">
                        {sanitizeDisplayText(user.email)}
                      </p>
                      <p className="text-xs text-text-muted">
                        Creado{' '}
                        {new Date(user.createdAt).toLocaleDateString('es-NI')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="self-center">
                  <UserAccessSummary user={user} />
                </div>

                <div className="self-center space-y-1.5">
                  <Select
                    aria-label={`Rol para ${user.fullName}`}
                    disabled={isSelf || isRolePending}
                    onValueChange={(value) => {
                      const role = value as UserRole;
                      setDraftRoles((current) => ({
                        ...current,
                        [user.id]: role,
                      }));
                    }}
                    options={roleOptions.map((role) => ({
                      label: roleLabels[role],
                      value: role,
                    }))}
                    value={selectedRole}
                  />
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

                <div className="self-center">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" type="button" variant="ghost">
                      <Link href={`/admin/users/${user.id}`}>
                        <Eye className="size-4" />
                        Detalle
                      </Link>
                    </Button>
                    <Button
                      disabled={
                        isSelf || selectedRole === user.role || isRolePending
                      }
                      onClick={() =>
                        updateRole.mutate({
                          role: selectedRole,
                          userId: user.id,
                        })
                      }
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      <ShieldCheck className="size-4" />
                      {isRolePending ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button
                      disabled={isSelf || isStatusPending}
                      onClick={() => setStatusDialogUser(user)}
                      size="sm"
                      type="button"
                      variant={user.isActive ? 'destructive' : 'primary'}
                    >
                      {user.isActive ? (
                        <UserX className="size-4" />
                      ) : (
                        <RotateCcw className="size-4" />
                      )}
                      {isStatusPending
                        ? 'Actualizando...'
                        : user.isActive
                          ? 'Desactivar'
                          : 'Reactivar'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </SurfaceTable>
      </div>

      <div className="grid gap-4 lg:hidden">
        {usersQuery.data.items.map((user) => {
          const selectedRole = draftRoles[user.id] ?? user.role;
          const isSelf = currentUserId === user.id;
          const isRolePending =
            updateRole.isPending && updateRole.variables?.userId === user.id;
          const isStatusPending =
            setUserActive.isPending &&
            setUserActive.variables?.userId === user.id;

          return (
            <Card
              className="space-y-3"
              interactive={false}
              key={user.id}
              variant="soft"
            >
              <div className="flex items-start gap-3">
                {user.avatarUrl ? (
                  <img
                    alt={sanitizeDisplayText(user.fullName, 'Usuario')}
                    className="size-10 rounded-full border border-border-subtle object-cover"
                    src={user.avatarUrl}
                  />
                ) : (
                  <div className="icon-tile size-10 rounded-full text-sm font-semibold">
                    {getInitials(user)}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="truncate font-display text-xl font-semibold text-text-secondary">
                    {sanitizeDisplayText(user.fullName, 'Usuario sin nombre')}
                  </h3>
                  <p className="truncate text-sm text-text-muted">
                    {sanitizeDisplayText(user.email)}
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
                  onValueChange={(value) => {
                    const role = value as UserRole;
                    setDraftRoles((current) => ({
                      ...current,
                      [user.id]: role,
                    }));
                  }}
                  options={roleOptions.map((role) => ({
                    label: roleLabels[role],
                    value: role,
                  }))}
                  value={selectedRole}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild size="sm" type="button" variant="ghost">
                  <Link href={`/admin/users/${user.id}`}>
                    <Eye className="size-4" />
                    Detalle
                  </Link>
                </Button>
                <Button
                  disabled={
                    isSelf || selectedRole === user.role || isRolePending
                  }
                  onClick={() =>
                    updateRole.mutate({ role: selectedRole, userId: user.id })
                  }
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <ShieldCheck className="size-4" />
                  {isRolePending ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button
                  disabled={isSelf || isStatusPending}
                  onClick={() => setStatusDialogUser(user)}
                  size="sm"
                  type="button"
                  variant={user.isActive ? 'destructive' : 'primary'}
                >
                  {user.isActive ? (
                    <UserX className="size-4" />
                  ) : (
                    <RotateCcw className="size-4" />
                  )}
                  {isStatusPending
                    ? 'Actualizando...'
                    : user.isActive
                      ? 'Desactivar'
                      : 'Reactivar'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <ManagementPagination
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
        page={usersQuery.data?.page ?? page}
        pageSize={usersQuery.data?.pageSize ?? pageSize}
        total={usersQuery.data?.total ?? 0}
        totalPages={usersQuery.data?.totalPages ?? 1}
      />

      <ConfirmDialog
        confirmLabel={
          setUserActive.isPending
            ? 'Actualizando...'
            : statusDialogUser?.isActive
              ? 'Desactivar'
              : 'Reactivar'
        }
        confirmVariant={statusDialogUser?.isActive ? 'destructive' : 'primary'}
        description={
          statusDialogUser?.isActive
            ? 'La cuenta perderá acceso operativo inmediato hasta que un SuperAdmin la reactive de nuevo.'
            : 'La cuenta volverá a tener acceso operativo con el rol que ya tiene asignado.'
        }
        isPending={setUserActive.isPending}
        onConfirm={() => {
          if (!statusDialogUser) {
            return;
          }

          setUserActive.mutate({
            isActive: !statusDialogUser.isActive,
            userId: statusDialogUser.id,
          });
          setStatusDialogUser(null);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialogUser(null);
          }
        }}
        open={Boolean(statusDialogUser)}
        title={
          statusDialogUser?.isActive
            ? '¿Desactivar usuario?'
            : '¿Reactivar usuario?'
        }
      />
    </div>
  );
}
