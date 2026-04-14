'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, LoaderCircle } from 'lucide-react';
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

interface BusinessOwnerSelectProps {
  value: string;
  onSelect: (user: PlatformUserSearchResult) => void;
  disabled?: boolean;
  canSearchOwners: boolean;
  businessId?: string;
}

export function BusinessOwnerSelect({
  value,
  onSelect,
  disabled = false,
  canSearchOwners,
  businessId,
}: BusinessOwnerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOwner, setSelectedOwner] =
    useState<PlatformUserSearchResult | null>(null);
  const debouncedSearch = useDebouncedValue(searchTerm, 280);

  const adminOwnerSearchQuery = trpc.admin.searchUsers.useQuery(
    {
      search: debouncedSearch,
      limit: 10,
    },
    {
      enabled: isOpen && canSearchOwners && !businessId,
      retry: false,
      staleTime: 30_000,
    },
  );

  const businessOwnerSearchQuery = trpc.business.searchAssignableUsers.useQuery(
    {
      businessId: businessId ?? '',
      search: debouncedSearch,
      limit: 10,
    },
    {
      enabled: isOpen && canSearchOwners && Boolean(businessId),
      retry: false,
      staleTime: 30_000,
    },
  );

  const ownerSearchQuery = businessId
    ? businessOwnerSearchQuery
    : adminOwnerSearchQuery;

  useEffect(() => {
    if (!value) {
      setSelectedOwner(null);
    }
  }, [value]);

  const ownerOptions = useMemo(() => {
    const queryResults = ownerSearchQuery.data ?? [];

    if (!selectedOwner) {
      return queryResults;
    }

    return queryResults.some((user) => user.id === selectedOwner.id)
      ? queryResults
      : [selectedOwner, ...queryResults];
  }, [ownerSearchQuery.data, selectedOwner]);

  const activeOwner =
    ownerOptions.find((user) => user.id === value) ?? selectedOwner;

  function handleSelect(user: PlatformUserSearchResult) {
    setSelectedOwner(user);
    onSelect(user);
    setIsOpen(false);
  }

  return (
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
            {activeOwner ? (
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-text-secondary">
                  {activeOwner.fullName}
                </span>
                <span className="truncate text-xs text-text-muted">
                  {activeOwner.email}
                </span>
              </span>
            ) : (
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-text-secondary">
                  Buscar y asignar propietario
                </span>
                <span className="truncate text-xs text-text-muted">
                  Nombre, email o identificador del proveedor autenticado.
                </span>
              </span>
            )}
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
            placeholder="Buscar por nombre, email o identificador"
            value={searchTerm}
          />
          <CommandList>
            {!canSearchOwners ? (
              <div className="px-4 py-5 text-sm text-text-muted">
                Solo cuentas con acceso admin pueden buscar propietarios reales.
              </div>
            ) : ownerSearchQuery.isLoading ? (
              <div className="flex items-center gap-2 px-4 py-5 text-sm text-text-muted">
                <LoaderCircle className="size-4 animate-spin" />
                Buscando usuarios...
              </div>
            ) : ownerSearchQuery.error ? (
              <div className="field-error px-4 py-5 text-sm">
                {ownerSearchQuery.error.message}
              </div>
            ) : ownerOptions.length === 0 ? (
              <CommandEmpty>
                No encontramos usuarios para &quot;
                {debouncedSearch || 'tu búsqueda'}&quot;.
              </CommandEmpty>
            ) : (
              <CommandGroup
                heading={debouncedSearch ? 'Resultados' : 'Usuarios recientes'}
              >
                {ownerOptions.map((user) => {
                  const isSelected = user.id === value;

                  return (
                    <CommandItem
                      className="items-start gap-3 py-3"
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
  );
}
