'use client';

import { useEffect, useRef, useState } from 'react';

import { ChevronDown, Layers3, ShieldCheck } from 'lucide-react';

import { formatRoleLabel } from '../../lib/display-labels';
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
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const panelOpenedAtScrollYRef = useRef(0);
  const ignoreScrollUntilRef = useRef(0);
  const activeSurface = routeSearchLabels[activePath] ?? 'Navegación principal';

  const toggleMobilePanel = () => {
    setIsMobilePanelOpen((open) => {
      const nextOpen = !open;

      if (nextOpen) {
        const currentScrollY = window.scrollY;

        lastScrollYRef.current = currentScrollY;
        panelOpenedAtScrollYRef.current = currentScrollY;
        ignoreScrollUntilRef.current = Date.now() + 260;
      }

      return nextOpen;
    });
  };

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
  }, []);

  useEffect(() => {
    if (!isMobilePanelOpen) {
      return;
    }

    const handleScroll = () => {
      if (window.innerWidth >= 1024) {
        return;
      }

      const currentScrollY = window.scrollY;
      if (Date.now() < ignoreScrollUntilRef.current) {
        lastScrollYRef.current = currentScrollY;
        return;
      }

      const scrolledDown = currentScrollY - lastScrollYRef.current > 6;
      const distanceFromOpen = currentScrollY - panelOpenedAtScrollYRef.current;

      if (scrolledDown && distanceFromOpen > 40 && currentScrollY > 24) {
        setIsMobilePanelOpen(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobilePanelOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-[rgba(244,248,252,0.74)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="surface-soft inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">
                <Layers3 className="size-3.5" />
                {eyebrow}
              </div>
              <button
                type="button"
                aria-expanded={isMobilePanelOpen}
                aria-label={
                  isMobilePanelOpen ? 'Ocultar controles' : 'Mostrar controles'
                }
                className="surface-soft inline-flex size-10 items-center justify-center rounded-full p-0 text-text-secondary lg:hidden"
                onClick={toggleMobilePanel}
              >
                <ChevronDown
                  className={`size-4 transition-transform duration-normal ${
                    isMobilePanelOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-text-secondary">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-text-muted">
                {description}
              </p>
            </div>
          </div>

          <div className="hidden flex-col gap-3 sm:flex-row sm:items-end lg:flex">
            <RoleSwitcher />
            <div className="surface-soft rounded-lg px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                Usuario simulado
              </p>
              <p className="mt-2 text-sm font-semibold text-text-secondary">
                {roleProfile.fullName}
              </p>
              <p className="text-xs text-text-muted">
                {formatRoleLabel(roleProfile.role)} · {roleProfile.email}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-[grid-template-rows,opacity,margin] duration-slow ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
            isMobilePanelOpen
              ? 'mt-0 grid grid-rows-[1fr] opacity-100 delay-0'
              : '-mt-2 grid grid-rows-[0fr] opacity-0 pointer-events-none delay-100'
          }`}
        >
          <div className="min-h-0">
            <div
              className={`space-y-3 pb-1 transition-[transform,opacity,filter] duration-slow ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isMobilePanelOpen
                  ? 'translate-y-0 scale-100 opacity-100 blur-0 delay-75'
                  : '-translate-y-2 scale-[0.985] opacity-0 blur-[2px] delay-0'
              }`}
            >
              <div className="surface-soft rounded-lg px-4 py-4">
                <RoleSwitcher />
              </div>
              <div className="surface-soft rounded-lg px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                  Usuario simulado
                </p>
                <p className="mt-2 text-sm font-semibold text-text-secondary">
                  {roleProfile.fullName}
                </p>
                <p className="text-xs text-text-muted">
                  {formatRoleLabel(roleProfile.role)} · {roleProfile.email}
                </p>
              </div>
              <div className="shell-chrome flex flex-col gap-3 rounded-lg px-4 py-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                    Vista actual
                  </p>
                  <p className="text-sm font-medium text-text-secondary">
                    {activeSurface}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-2 text-xs font-semibold text-text-secondary">
                  <ShieldCheck className="size-4" />
                  Este cambio solo afecta la vista. Los permisos reales no
                  cambian.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden shell-chrome flex-col gap-3 rounded-lg px-4 py-3 lg:flex lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              Vista actual
            </p>
            <p className="text-sm font-medium text-text-secondary">
              {activeSurface}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-2 text-xs font-semibold text-text-secondary">
            <ShieldCheck className="size-4" />
            Este cambio solo afecta la vista. Los permisos reales no cambian.
          </div>
        </div>
      </div>
    </header>
  );
}
