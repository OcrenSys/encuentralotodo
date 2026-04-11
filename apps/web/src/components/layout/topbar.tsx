'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

import { ChevronDown, Layers3, Menu, ShieldCheck } from 'lucide-react';

import {
  routeSearchLabels,
  type NavigationGroup,
} from '../../lib/management-navigation';
import { AuthUserPanel } from '../auth/auth-user-panel';
import { NavigationDrawer } from './navigation-drawer';
import { RoleSwitcher } from './role-switcher';

function readScrollOffset(scrollContainer: HTMLDivElement | null) {
  if (window.innerWidth < 1024) {
    return window.scrollY;
  }

  return scrollContainer ? scrollContainer.scrollTop : window.scrollY;
}

function resolveScrollTarget(scrollContainer: HTMLDivElement | null) {
  if (window.innerWidth < 1024 || !scrollContainer) {
    return window;
  }

  return scrollContainer;
}

export function Topbar({
  activePath,
  eyebrow,
  title,
  description,
  navigationGroups,
  scrollContainerRef,
}: {
  activePath: string;
  eyebrow: string;
  title: string;
  description: string;
  navigationGroups: NavigationGroup[];
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}) {
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isNavigationDrawerOpen, setIsNavigationDrawerOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const panelOpenedAtScrollYRef = useRef(0);
  const ignoreScrollUntilRef = useRef(0);
  const activeSurface = routeSearchLabels[activePath] ?? 'Navegación principal';

  const toggleMobilePanel = () => {
    setIsMobilePanelOpen((open) => {
      const nextOpen = !open;

      if (nextOpen) {
        const currentScrollY = readScrollOffset(
          scrollContainerRef?.current ?? null,
        );

        lastScrollYRef.current = currentScrollY;
        panelOpenedAtScrollYRef.current = currentScrollY;
        ignoreScrollUntilRef.current = Date.now() + 260;
        setIsHeaderVisible(true);
      }

      return nextOpen;
    });
  };

  useEffect(() => {
    lastScrollYRef.current = readScrollOffset(
      scrollContainerRef?.current ?? null,
    );
  }, [scrollContainerRef]);

  useEffect(() => {
    setIsMobilePanelOpen(false);
    setIsNavigationDrawerOpen(false);
    setIsHeaderVisible(true);
  }, [activePath]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef?.current ?? null;
    const scrollTarget = resolveScrollTarget(scrollContainer);

    const handleScroll = () => {
      const currentScrollY = readScrollOffset(scrollContainer);
      const delta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY <= 24) {
        setIsHeaderVisible(true);
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (isMobilePanelOpen) {
        setIsHeaderVisible(true);
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (Math.abs(delta) < 10) {
        lastScrollYRef.current = currentScrollY;
        return;
      }

      setIsHeaderVisible(delta < 0);
      lastScrollYRef.current = currentScrollY;
    };

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

    return () => scrollTarget.removeEventListener('scroll', handleScroll);
  }, [isMobilePanelOpen, scrollContainerRef]);

  useEffect(() => {
    if (!isMobilePanelOpen) {
      return;
    }

    const scrollContainer = scrollContainerRef?.current ?? null;
    const scrollTarget = resolveScrollTarget(scrollContainer);

    const handleScroll = () => {
      if (window.innerWidth >= 1024) {
        return;
      }

      const currentScrollY = readScrollOffset(scrollContainer);
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

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

    return () => scrollTarget.removeEventListener('scroll', handleScroll);
  }, [isMobilePanelOpen, scrollContainerRef]);

  return (
    <header
      className={`sticky top-0 z-30 border-b border-border-subtle bg-[rgba(244,248,252,0.74)] backdrop-blur-xl transition-transform duration-normal ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="surface-soft inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">
                <Layers3 className="size-3.5" />
                {eyebrow}
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  type="button"
                  aria-expanded={isNavigationDrawerOpen}
                  aria-label="Abrir navegación"
                  className="surface-soft inline-flex size-10 items-center justify-center rounded-full p-0 text-text-secondary"
                  onClick={() => {
                    setIsMobilePanelOpen(false);
                    setIsNavigationDrawerOpen(true);
                  }}
                >
                  <Menu className="size-4" />
                </button>
                <button
                  type="button"
                  aria-expanded={isMobilePanelOpen}
                  aria-label={
                    isMobilePanelOpen
                      ? 'Ocultar controles de cuenta'
                      : 'Mostrar controles de cuenta'
                  }
                  className="surface-soft inline-flex size-10 items-center justify-center rounded-full p-0 text-text-secondary"
                  onClick={toggleMobilePanel}
                >
                  <ChevronDown
                    className={`size-4 transition-transform duration-normal ${
                      isMobilePanelOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
            <div>
              <h1 className="font-display text-[1.9rem] font-semibold tracking-tight text-text-secondary lg:text-3xl">
                {title}
              </h1>
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-text-muted">
                {description}
              </p>
            </div>
          </div>

          <div className="hidden flex-col gap-3 sm:flex-row sm:items-end lg:flex">
            <RoleSwitcher />
            <AuthUserPanel />
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
              <AuthUserPanel />
              <div className="shell-chrome flex min-w-0 flex-col gap-3 rounded-lg px-4 py-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                    Vista actual
                  </p>
                  <p className="text-sm font-medium text-text-secondary">
                    {activeSurface}
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2 text-xs font-semibold leading-5 text-text-secondary">
                  <ShieldCheck className="size-4" />
                  Este cambio solo afecta la vista. Los permisos reales no
                  cambian.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden shell-chrome flex-col gap-3 rounded-lg px-4 py-2.5 lg:flex lg:flex-row lg:items-center lg:justify-between">
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

      <NavigationDrawer
        activePath={activePath}
        groups={navigationGroups}
        onOpenChange={setIsNavigationDrawerOpen}
        open={isNavigationDrawerOpen}
      />
    </header>
  );
}
