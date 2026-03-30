import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from 'utils';

export function Card({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_12px_36px_rgba(17,39,60,0.08)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(17,39,60,0.14)]',
        className
      )}
      {...props}
    />
  );
}

export function Button({ className, ...props }: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
}

export function GhostButton({ className, ...props }: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-colors duration-150 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5',
        className
      )}
      {...props}
    />
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]',
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-secondary)]">{eyebrow}</p>
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)] sm:text-3xl">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
      </div>
    </div>
  );
}