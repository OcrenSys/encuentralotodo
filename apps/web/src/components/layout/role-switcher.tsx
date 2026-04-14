'use client';

import { Select } from 'ui';

import { useCurrentAuthUser } from '../../lib/auth-context';
import { useRoleView } from '../../lib/role-view';

export function RoleSwitcher() {
  const { provider } = useCurrentAuthUser();
  const { roleView, setRoleView } = useRoleView();

  if (provider !== 'mock') {
    return null;
  }

  return (
    <label className="flex w-full min-w-0 flex-col gap-2 sm:min-w-[180px] sm:max-w-[220px]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
        Simulación de vista
      </span>
      <Select
        className="w-full"
        onValueChange={(value) => setRoleView(value as typeof roleView)}
        options={[
          { label: 'Administrador general', value: 'SUPERADMIN' },
          { label: 'Propietario', value: 'OWNER' },
          { label: 'Encargado', value: 'MANAGER' },
        ]}
        value={roleView}
      />
    </label>
  );
}
