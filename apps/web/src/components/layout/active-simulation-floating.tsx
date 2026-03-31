'use client';

import { PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { roleProfiles, useRoleView } from '../../lib/role-view';
import { cn } from 'utils';

export function ActiveSimulationFloating() {
  const { roleView } = useRoleView();
  const currentProfile = roleProfiles[roleView];
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 hidden w-[300px] xl:w-[320px] lg:block">
      <div
        className="pointer-events-auto flex flex-col items-end gap-3"
        onMouseLeave={() => setIsOpen(false)}
      >
        <div
          className={cn(
            'surface-panel-elevated w-full origin-bottom-right rounded-[30px] p-5 transition-all duration-200',
            isOpen
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-3 scale-95 opacity-0',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                Active simulation
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-primary)]">
                {currentProfile.fullName}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                {currentProfile.label}
              </p>
            </div>
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,rgba(35,69,101,0.12),rgba(35,69,101,0.05))] text-[var(--color-primary)]">
              <Sparkles className="size-5" />
            </div>
          </div>

          <div className="surface-inset mt-5 space-y-3 rounded-[24px] p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Role label
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                {currentProfile.label}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Contact
              </p>
              <p className="mt-1 break-all text-sm text-[var(--color-text-muted)]">
                {currentProfile.email}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
            Estado visible de la simulación actual para validar UX, navegación y
            permisos visuales sin perder contexto mientras operas la consola.
          </p>
        </div>

        <button
          aria-expanded={isOpen}
          className="surface-panel-elevated inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--color-primary)] hover:-translate-y-0.5"
          onMouseEnter={() => setIsOpen(true)}
          type="button"
        >
          {isOpen ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
          Active simulation
        </button>
      </div>
    </div>
  );
}
