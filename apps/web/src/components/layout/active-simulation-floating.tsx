'use client';

import { PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { formatRoleLabel } from '../../lib/display-labels';
import { useCurrentAuthUser } from '../../lib/auth-context';
import { roleProfiles, useRoleView } from '../../lib/role-view';
import { trpc } from '../../lib/trpc';
import { cn } from 'utils';

export function ActiveSimulationFloating() {
  const { roleView } = useRoleView();
  const { provider } = useCurrentAuthUser();
  const sessionQuery = trpc.auth.me.useQuery(undefined, {
    enabled: provider !== 'mock',
    retry: false,
  });
  const currentProfile = roleProfiles[roleView];
  const [isOpen, setIsOpen] = useState(false);
  const sessionUser = sessionQuery.data?.user;
  const isRealSession = provider !== 'mock' && Boolean(sessionUser);
  const title = sessionUser?.fullName ?? currentProfile.fullName;
  const roleLabel = formatRoleLabel(sessionUser?.role ?? currentProfile.role);
  const email = sessionUser?.email ?? currentProfile.email;
  const eyebrow = isRealSession ? 'Sesión actual' : 'Vista demo activa';
  const roleCaption = isRealSession ? 'Rol real' : 'Rol visible';
  const contactCaption = isRealSession ? 'Email' : 'Contacto';
  const helperText = isRealSession
    ? 'Resumen del usuario autenticado y del rol efectivo recibido desde el backend.'
    : 'Estado visible de la simulación actual para validar UX, navegación y permisos visuales sin mezclar esta capa con la identidad autenticada real.';
  const buttonLabel = isRealSession ? 'Usuario actual' : 'Vista demo';

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 hidden w-[300px] xl:w-[320px] lg:block">
      <div
        className="pointer-events-auto flex flex-col items-end gap-3"
        onMouseLeave={() => setIsOpen(false)}
      >
        <div
          className={cn(
            'surface-elevated w-full origin-bottom-right rounded-xl p-5 transition-all duration-normal',
            isOpen
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-3 scale-95 opacity-0',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                {eyebrow}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-text-secondary">
                {title}
              </p>
              <p className="mt-1 text-sm font-medium text-text-muted">
                {roleLabel}
              </p>
            </div>
            <div className="icon-tile size-12">
              <Sparkles className="size-5" />
            </div>
          </div>

          <div className="surface-inset mt-5 space-y-3 p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                {roleCaption}
              </p>
              <p className="mt-1 text-sm font-semibold text-text-secondary">
                {roleLabel}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                {contactCaption}
              </p>
              <p className="mt-1 break-all text-sm text-text-muted">{email}</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-text-muted">{helperText}</p>
        </div>

        <button
          aria-expanded={isOpen}
          className="surface-elevated inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-text-secondary hover:-translate-y-0.5"
          onMouseEnter={() => setIsOpen(true)}
          type="button"
        >
          {isOpen ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeftOpen className="size-4" />
          )}
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
