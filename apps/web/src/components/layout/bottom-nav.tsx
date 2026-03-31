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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(140,156,177,0.18)] bg-[rgba(248,251,254,0.88)] px-3 py-2 shadow-[0_-14px_28px_rgba(17,39,60,0.08)] backdrop-blur-xl lg:hidden">
      <nav className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activePath === item.href;

          return (
            <a
              className={cn(
                'flex min-w-0 flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-[11px] font-semibold transition-all duration-200',
                active
                  ? 'border-[rgba(31,60,90,0.08)] bg-[linear-gradient(180deg,#234565_0%,#1c3957_100%)] text-white shadow-[0_12px_22px_rgba(17,39,60,0.14)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:bg-white/90 hover:text-[var(--color-primary)] hover:shadow-[0_10px_18px_rgba(17,39,60,0.06)]',
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
