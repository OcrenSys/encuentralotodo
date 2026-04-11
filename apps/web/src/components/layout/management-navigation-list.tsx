'use client';

import Link from 'next/link';

import {
  quickLinks,
  type NavigationGroup,
} from '../../lib/management-navigation';
import { cn } from 'utils';

function isActiveRoute(activePath: string, href: string) {
  return activePath === href || activePath.startsWith(`${href}/`);
}

export function ManagementNavigationList({
  activePath,
  groups,
  onNavigate,
  showQuickLinks = false,
  variant = 'comfortable',
}: {
  activePath: string;
  groups: NavigationGroup[];
  onNavigate?: () => void;
  showQuickLinks?: boolean;
  variant?: 'comfortable' | 'compact';
}) {
  const isCompact = variant === 'compact';

  return (
    <div className={cn(isCompact ? 'space-y-5' : 'space-y-6')}>
      {groups.map((group) => (
        <section
          className={cn(isCompact ? 'space-y-2' : 'space-y-2.5')}
          key={group.key}
        >
          <p
            className={cn(
              'px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted',
              isCompact && 'text-[10px] tracking-[0.26em]',
            )}
          >
            {group.label}
          </p>
          <div className={cn(isCompact ? 'space-y-1.5' : 'space-y-2')}>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(activePath, item.href);

              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative overflow-hidden border transition-all duration-normal',
                    isCompact
                      ? 'flex items-center gap-3 rounded-xl px-3 py-2.5 pl-4'
                      : 'flex items-start gap-3 rounded-xl px-4 py-3 pl-5',
                    active
                      ? 'action-primary border-primary/10 text-white shadow-md'
                      : 'border-transparent bg-white/40 text-text-muted hover:border-secondary/50 hover:bg-white/72 hover:text-text-secondary hover:shadow-sm',
                  )}
                  href={item.href}
                  key={item.key}
                  onClick={onNavigate}
                  scroll={false}
                >
                  {/* <span
                    className={cn(
                      'absolute left-0 transition-opacity duration-200',
                      isCompact
                        ? 'inset-y-1.5 w-3 rounded-r-full'
                        : 'inset-y-2 w-3 rounded-r-full',
                      active
                        ? 'bg-[rgba(255,255,255,0.78)] opacity-100'
                        : 'bg-secondary opacity-0 group-hover:opacity-70',
                    )}
                  /> */}
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center justify-center rounded-full border transition-colors duration-normal',
                      isCompact ? 'size-8' : 'mt-0.5 size-9',
                      active
                        ? 'border-white/16 bg-white/12 text-white'
                        : 'border-border-subtle bg-white/72 text-text-secondary group-hover:border-primary/20 group-hover:bg-white',
                    )}
                  >
                    <Icon className={cn(isCompact ? 'size-3.5' : 'size-4')} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block font-semibold',
                        isCompact ? 'text-[13px]' : 'text-sm',
                      )}
                    >
                      {item.label}
                    </span>
                    {(!isCompact || active) && item.description ? (
                      <span
                        className={cn(
                          'mt-1 block text-xs',
                          isCompact ? 'line-clamp-1 leading-4' : 'leading-5',
                          active ? 'text-white/74' : 'text-text-muted',
                        )}
                      >
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {showQuickLinks ? (
        <div
          className={cn(
            'surface-soft rounded-lg',
            isCompact ? 'space-y-2 p-3.5' : 'space-y-3 p-4',
          )}
        >
          <div className={cn(isCompact ? 'space-y-1.5' : 'space-y-2')}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              Accesos rápidos
            </p>
            <div
              className={cn(
                isCompact ? 'grid grid-cols-1 gap-1.5' : 'space-y-0',
              )}
            >
              {quickLinks.map((item) => (
                <Link
                  className={cn(
                    'block rounded-md font-medium text-text-secondary transition-colors hover:bg-white/90 hover:shadow-sm',
                    isCompact ? 'px-2.5 py-2 text-[13px]' : 'px-3 py-2 text-sm',
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={onNavigate}
                  scroll={false}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
