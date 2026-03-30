'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Heart, Home, Search, User, X } from 'lucide-react';

import { cn } from 'utils';

import { Card } from './primitives';

export function TopSearchHeader({ children }: { children: ReactNode }) {
  return <div className="sticky top-0 z-30 bg-[var(--color-background)]/88 px-4 pb-3 pt-4 backdrop-blur-lg">{children}</div>;
}

export function BottomNavigation({ current = 'home' }: { current?: 'home' | 'search' | 'favorites' | 'profile' }) {
  const items = [
    { key: 'home', label: 'Home', href: '/', icon: Home },
    { key: 'search', label: 'Buscar', href: '/', icon: Search },
    { key: 'favorites', label: 'Favoritos', href: '/', icon: Heart },
    { key: 'profile', label: 'Perfil', href: '/admin', icon: User },
  ] as const;

  return (
    <div className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-24px)] max-w-md -translate-x-1/2 rounded-full border border-white/70 bg-white/92 p-2 shadow-[0_20px_48px_rgba(17,39,60,0.14)] backdrop-blur-xl">
      <nav className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.key === current;
          return (
            <a
              className={cn(
                'flex flex-col items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition-colors',
                active ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-primary)]/5'
              )}
              href={item.href}
              key={item.key}
            >
              <Icon className="size-4" />
              {item.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}

export function FilterDrawer({
  open,
  onOpenChange,
  content,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(19,39,59,0.42)] backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] bg-white px-5 pb-8 pt-5 shadow-2xl focus:outline-none sm:left-auto sm:right-6 sm:top-6 sm:w-[420px] sm:rounded-[32px]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <Dialog.Title className="font-display text-2xl font-semibold text-[var(--color-primary)]">Filtros</Dialog.Title>
              <Dialog.Description className="text-sm text-[var(--color-text-muted)]">Ajusta categoría, distancia y promociones activas.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-primary)]" type="button">
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          <Card className="border-none bg-[var(--color-background)] shadow-none">{content}</Card>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function WhatsAppCTA({ href, floating = false, label = 'Hablar por WhatsApp' }: { href: string; floating?: boolean; label?: string }) {
  return (
    <a
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-secondary)] px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_48px_rgba(79,191,159,0.3)] transition-transform hover:scale-[1.02]',
        floating ? 'fixed bottom-24 right-4 z-40 sm:right-8' : ''
      )}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
}

export function FilterToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={cn(
        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
          : 'border-[var(--color-border)] bg-white text-[var(--color-primary)]'
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}