'use client';

import { useRoleView } from '../../lib/role-view';

export function RoleSwitcher() {
  const { roleView, setRoleView } = useRoleView();

  return (
    <label className="flex min-w-[180px] flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
        View as
      </span>
      <select
        className="control-surface h-11 rounded-2xl px-4 text-sm font-medium text-[var(--color-primary)] outline-none"
        value={roleView}
        onChange={(event) => setRoleView(event.target.value as typeof roleView)}
      >
        <option value="SUPERADMIN">SuperAdmin</option>
        <option value="OWNER">Owner</option>
        <option value="MANAGER">Manager</option>
      </select>
    </label>
  );
}
