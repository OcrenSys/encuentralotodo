import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from 'utils';

export function Card({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'rounded-[28px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]',
        className,
      )}
      {...props}
    />
  );
}

export function Button({
  className,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-[rgba(18,36,56,0.08)] bg-[linear-gradient(180deg,#234565_0%,#1b3956_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(17,39,60,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#295075_0%,#1f3c5a_100%)] hover:shadow-[0_16px_30px_rgba(17,39,60,0.18)] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}

export function GhostButton({
  className,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      className={cn(
        'control-surface inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] hover:border-[rgba(31,60,90,0.2)] hover:bg-[rgba(245,248,252,0.96)] hover:shadow-[0_12px_24px_rgba(17,39,60,0.08)]',
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[rgba(202,170,84,0.2)] bg-[linear-gradient(180deg,rgba(253,248,229,0.96),rgba(252,244,213,0.88))] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]',
        className,
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
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-secondary)]">
        {eyebrow}
      </p>
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)] sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}
