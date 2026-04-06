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
    <label className="flex min-w-[180px] flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
        Simulación de vista
      </span>
      <Select
        className="min-w-[180px]"
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
