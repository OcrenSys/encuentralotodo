'use client';

import { Select } from 'ui';

import { useRoleView } from '../../lib/role-view';

export function RoleSwitcher() {
  const { roleView, setRoleView } = useRoleView();

  return (
    <label className="flex min-w-[180px] flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
        Ver como
      </span>
      <Select
        className="min-w-[180px]"
        value={roleView}
        onChange={(event) => setRoleView(event.target.value as typeof roleView)}
      >
        <option value="SUPERADMIN">Administrador general</option>
        <option value="OWNER">Propietario</option>
        <option value="MANAGER">Encargado</option>
      </Select>
    </label>
  );
}
