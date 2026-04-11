'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, LoaderCircle, X } from 'lucide-react';
import type { PlatformUserSearchResult, UserRole } from 'types';
import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui';

import { trpc } from '../lib/trpc';
import { useDebouncedValue } from '../lib/use-debounced-value';

const roleLabels: Record<UserRole, string> = {
  UNASSIGNED: 'Sin permisos',
  NO_ACCESS: 'Sin acceso base',
  USER: 'Usuario',
  ADMIN: 'Admin',
  SUPERADMIN: 'SuperAdmin',
  GLOBALADMIN: 'GlobalAdmin',
};

function getInitials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

interface BusinessManagersSelectProps {
  value: string[];
  ownerId: string;
  onChange: (managerIds: string[]) => void;
  disabled?: boolean;
  canSearchManagers: boolean;
}

export function BusinessManagersSelect({
  value,
  ownerId,
  onChange,
  disabled = false,
  canSearchManagers,
}: BusinessManagersSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedManagers, setSelectedManagers] = useState<
    PlatformUserSearchResult[]
  >([]);
  const debouncedSearch = useDebouncedValue(searchTerm, 280);

  const managerSearchQuery = trpc.admin.searchUsers.useQuery(
    {
      search: debouncedSearch,
      limit: 10,
    },
    {
      enabled: isOpen && canSearchManagers,
      retry: false,
      staleTime: 30_000,
    },
  );

  useEffect(() => {
    setSelectedManagers((current) =>
      current.filter((user) => value.includes(user.id) && user.id !== ownerId),
    );
  }, [ownerId, value]);

  const selectedManagerIds = useMemo(
    () => new Set(value.filter((managerId) => managerId !== ownerId)),
    [ownerId, value],
  );

  const managerOptions = useMemo(() => {
    const baseOptions = managerSearchQuery.data ?? [];
    const merged = [...selectedManagers, ...baseOptions];
    const uniqueById = new Map<string, PlatformUserSearchResult>();

    merged.forEach((user) => {
      if (user.id !== ownerId) {
        uniqueById.set(user.id, user);
      }
    });

    return Array.from(uniqueById.values());
  }, [managerSearchQuery.data, ownerId, selectedManagers]);

  const activeManagers = useMemo(
    () =>
      managerOptions.filter((user) => selectedManagerIds.has(user.id)) ?? [],
    [managerOptions, selectedManagerIds],
  );

  function handleSelect(user: PlatformUserSearchResult) {
    if (user.id === ownerId || selectedManagerIds.has(user.id)) {
      return;
    }

    const nextManagers = [
      ...value.filter((managerId) => managerId !== ownerId),
      user.id,
    ];
    setSelectedManagers((current) => [
      ...current.filter((item) => item.id !== user.id),
      user,
    ]);
    onChange(nextManagers);
    setSearchTerm('');
  }

  function handleRemove(managerId: string) {
    setSelectedManagers((current) =>
      current.filter((user) => user.id !== managerId),
    );
    onChange(
      value.filter((currentManagerId) => currentManagerId !== managerId),
    );
  }

  return (
    <div className="space-y-3">
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={isOpen}
            className="et-combobox-trigger h-auto min-h-14 w-full max-w-full justify-between rounded-2xl px-4 py-3 text-left"
            disabled={disabled}
            type="button"
            variant="secondary"
          >
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-text-secondary">
                  {activeManagers.length
                    ? `${activeManagers.length} manager${activeManagers.length > 1 ? 's' : ''} seleccionado${activeManagers.length > 1 ? 's' : ''}`
                    : 'Buscar y agregar managers'}
                </span>
                <span className="truncate text-xs text-text-muted">
                  Nombre, email o identificador del proveedor autenticado.
                </span>
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-text-muted" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(var(--radix-popover-trigger-width),calc(100vw-1rem))] max-w-[calc(100vw-1rem)] p-0 sm:max-w-[460px]"
          side="bottom"
          sideOffset={8}
        >
          <Command shouldFilter={false}>
            <CommandInput
              onValueChange={setSearchTerm}
              placeholder="Buscar managers por nombre, email o identificador"
              value={searchTerm}
            />
            <CommandList>
              {!canSearchManagers ? (
                <div className="px-4 py-5 text-sm text-text-muted">
                  Solo cuentas con acceso admin pueden buscar managers reales.
                </div>
              ) : managerSearchQuery.isLoading ? (
                <div className="flex items-center gap-2 px-4 py-5 text-sm text-text-muted">
                  <LoaderCircle className="size-4 animate-spin" />
                  Buscando usuarios...
                </div>
              ) : managerSearchQuery.error ? (
                <div className="field-error px-4 py-5 text-sm">
                  {managerSearchQuery.error.message}
                </div>
              ) : managerOptions.length === 0 ? (
                <CommandEmpty>
                  No encontramos usuarios para &quot;
                  {debouncedSearch || 'tu búsqueda'}&quot;.
                </CommandEmpty>
              ) : (
                <CommandGroup
                  heading={
                    debouncedSearch ? 'Resultados' : 'Usuarios recientes'
                  }
                >
                  {managerOptions.map((user) => {
                    const isSelected = selectedManagerIds.has(user.id);
                    const isOwner = user.id === ownerId;

                    return (
                      <CommandItem
                        className="items-start gap-3 py-3"
                        disabled={isOwner}
                        key={user.id}
                        onSelect={() => handleSelect(user)}
                        value={`${user.fullName} ${user.email} ${user.id}`}
                      >
                        <div className="icon-tile size-10 shrink-0 rounded-full text-xs font-semibold">
                          {getInitials(user.fullName)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-text-secondary">
                              {user.fullName}
                            </p>
                            <Badge
                              variant={user.isActive ? 'success' : 'warning'}
                            >
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {isOwner ? (
                              <Badge variant="info">Owner</Badge>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-text-muted">
                            {user.email}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                            {roleLabels[user.role]}
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
          </Command>
        </PopoverContent>
      </Popover>

      {activeManagers.length ? (
        <div className="flex flex-wrap gap-2">
          {activeManagers.map((manager) => (
            <div
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-border-subtle bg-white/85 px-3 py-2 shadow-sm"
              key={manager.id}
            >
              <div className="icon-tile size-8 shrink-0 rounded-full text-[11px] font-semibold">
                {getInitials(manager.fullName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-text-secondary">
                  {manager.fullName}
                </p>
                <p className="truncate text-[11px] text-text-muted">
                  {manager.email}
                </p>
              </div>
              <button
                aria-label={`Quitar manager ${manager.fullName}`}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-white text-text-muted hover:border-border-default hover:text-text-secondary"
                onClick={() => handleRemove(manager.id)}
                type="button"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
