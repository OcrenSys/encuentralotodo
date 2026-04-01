'use client';

import { cn } from 'utils';

import type { NavigationItem } from '../../lib/management-navigation';

export function BottomNav({
  items,
  activePath,
}: {
  items: NavigationItem[];
  activePath: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-[rgba(248,251,254,0.88)] px-3 py-2 shadow-[0_-14px_28px_rgba(17,39,60,0.08)] backdrop-blur-xl lg:hidden">
      <nav className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activePath === item.href;

          return (
            <a
              className={cn(
                'flex min-w-0 flex-col items-center gap-1 rounded-md border px-2 py-2 text-[11px] font-semibold transition-all duration-normal',
                active
                  ? 'action-primary border-primary/10 text-white shadow-md'
                  : 'border-transparent text-text-muted hover:bg-white/90 hover:text-text-secondary hover:shadow-sm',
              )}
              href={item.href}
              key={item.key}
            >
              <Icon className="size-4" />
              <span className="truncate">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
