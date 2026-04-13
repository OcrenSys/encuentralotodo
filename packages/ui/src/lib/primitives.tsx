import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from 'utils';

const surfaceVariants = {
  default: 'surface-default',
  soft: 'surface-soft',
  elevated: 'surface-elevated',
  brand: 'surface-brand',
  inset: 'surface-inset',
} as const;

const surfacePadding = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
} as const;

const buttonVariants = {
  primary: 'action-primary',
  secondary: 'action-secondary',
  warning: 'action-warning',
  destructive: 'action-destructive',
  ghost: 'action-secondary border-transparent bg-transparent shadow-none',
  outline: 'action-secondary border',
  google:
    'bg-[#DB4437] text-[#ffffff] border border-[#dadce0] hover:bg-[#c1351d] active:bg-[#a52714]',
} as const;

const buttonSizes = {
  sm: 'gap-2 px-3.5 py-2 text-sm',
  md: 'gap-2 px-4 py-2.5 text-sm',
  lg: 'gap-2.5 px-5 py-3 text-base',
  icon: 'size-10 p-0',
} as const;

const badgeVariants = {
  neutral: 'badge-neutral',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
} as const;

type SurfaceVariant = keyof typeof surfaceVariants;
type SurfacePadding = keyof typeof surfacePadding;

export function Surface({
  className,
  variant = 'default',
  padding = 'md',
  interactive = false,
  ...props
}: ComponentPropsWithoutRef<'div'> & {
  variant?: SurfaceVariant;
  padding?: SurfacePadding;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        surfaceVariants[variant],
        surfacePadding[padding],
        interactive && 'surface-interactive',
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  variant = 'default',
  interactive = true,
  padding = 'md',
  ...props
}: ComponentPropsWithoutRef<'div'> & {
  variant?: SurfaceVariant;
  padding?: SurfacePadding;
  interactive?: boolean;
}) {
  return (
    <Surface
      className={className}
      interactive={interactive}
      padding={padding}
      variant={variant}
      {...props}
    />
  );
}

export function Panel(
  props: ComponentPropsWithoutRef<'div'> & {
    variant?: SurfaceVariant;
    padding?: SurfacePadding;
    interactive?: boolean;
  },
) {
  return <Surface {...props} />;
}

export function Button({
  asChild = false,
  className,
  size = 'sm',
  variant = 'primary',
  ...props
}: ComponentPropsWithoutRef<'button'> & {
  asChild?: boolean;
  size?: keyof typeof buttonSizes;
  variant?: keyof typeof buttonVariants;
}) {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-normal disabled:cursor-not-allowed disabled:opacity-60',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function GhostButton({
  asChild = false,
  className,
  ...props
}: ComponentPropsWithoutRef<'button'> & {
  asChild?: boolean;
}) {
  return (
    <Button
      asChild={asChild}
      className={className}
      variant="ghost"
      {...props}
    />
  );
}

export function Badge({
  children,
  className,
  variant = 'warning',
}: {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof badgeVariants;
}) {
  return (
    <span className={cn('badge-base', badgeVariants[variant], className)}>
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
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
        {eyebrow}
      </p>
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold text-text-secondary sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-text-muted">
          {description}
        </p>
      </div>
    </div>
  );
}
