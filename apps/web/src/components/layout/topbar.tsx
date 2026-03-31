'use client';

import { Layers3, ShieldCheck } from 'lucide-react';

import { routeSearchLabels } from '../../lib/management-navigation';
import { useRoleView } from '../../lib/role-view';
import { RoleSwitcher } from './role-switcher';

export function Topbar({
  activePath,
  eyebrow,
  title,
  description,
}: {
  activePath: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  const { roleProfile } = useRoleView();

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(140,156,177,0.16)] bg-[rgba(244,248,252,0.74)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="surface-panel-soft inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-secondary)]">
              <Layers3 className="size-3.5" />
              {eyebrow}
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-primary)]">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <RoleSwitcher />
            <div className="surface-panel-soft rounded-[24px] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                Simulated operator
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-primary)]">
                {roleProfile.fullName}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {roleProfile.email}
              </p>
            </div>
          </div>
        </div>

        <div className="shell-chrome flex flex-col gap-3 rounded-[28px] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Current surface
            </p>
            <p className="text-sm font-medium text-[var(--color-primary)]">
              {routeSearchLabels[activePath] ?? 'Workspace navigation'}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(31,60,90,0.08)] bg-[rgba(31,60,90,0.05)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)]">
            <ShieldCheck className="size-4" />
            UI role switcher only. Backend auth remains unchanged.
          </div>
        </div>
      </div>
    </header>
  );
}
