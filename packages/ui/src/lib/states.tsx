import { SearchX } from 'lucide-react';

import { cn } from 'utils';

import { Card } from './primitives';

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-white/70', className)} />
  );
}

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <LoadingSkeleton className="h-4 w-32 rounded-full" />
      <LoadingSkeleton className="h-10 w-56 max-w-full" />
      <LoadingSkeleton className="h-4 w-full max-w-2xl" />
      <LoadingSkeleton className="h-4 w-3/4 max-w-xl" />
    </div>
  );
}

export function PanelCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('surface-default space-y-4 p-5', className)}>
      <LoadingSkeleton className="h-4 w-24 rounded-full" />
      <LoadingSkeleton className="h-8 w-2/3" />
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-5/6" />
    </div>
  );
}

export function TableListSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('surface-default overflow-hidden p-0', className)}>
      <div className="grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] gap-3 border-b border-border-subtle px-5 py-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton className="h-4 w-24" key={`header-${index}`} />
        ))}
      </div>
      <div className="space-y-3 px-5 py-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            className="grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] gap-3 rounded-xl border border-border-subtle/80 bg-white/60 px-4 py-4"
            key={`row-${rowIndex}`}
          >
            <LoadingSkeleton className="h-4 w-3/4" />
            <LoadingSkeleton className="h-4 w-2/3" />
            <LoadingSkeleton className="h-4 w-1/2" />
            <LoadingSkeleton className="h-4 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton({
  fields = 6,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn('surface-default space-y-5 p-5', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div className="space-y-2.5" key={`field-${index}`}>
          <LoadingSkeleton className="h-4 w-28 rounded-full" />
          <LoadingSkeleton className="h-12 w-full rounded-2xl" />
        </div>
      ))}
      <div className="flex justify-end">
        <LoadingSkeleton className="h-11 w-36 rounded-full" />
      </div>
    </div>
  );
}

export function ContentSectionLoadingShell({
  variant = 'table',
  className,
}: {
  variant?: 'table' | 'form' | 'cards';
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeaderSkeleton />
      {variant === 'form' ? (
        <FormSkeleton />
      ) : variant === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <PanelCardSkeleton className="min-h-44" key={`card-${index}`} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <PanelCardSkeleton key={`summary-${index}`} />
            ))}
          </div>
          <TableListSkeleton />
        </>
      )}
    </div>
  );
}

export function FullLayoutLoadingShell() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8 xl:px-10">
      <div className="surface-elevated relative overflow-hidden px-6 py-8 sm:px-8 lg:px-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/35 to-transparent" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
          <div className="space-y-6">
            <PageHeaderSkeleton className="max-w-3xl" />
            <div className="grid gap-4 md:grid-cols-2">
              <PanelCardSkeleton className="min-h-48" />
              <PanelCardSkeleton className="min-h-48" />
            </div>
          </div>
          <FormSkeleton className="surface-soft" fields={5} />
        </div>
      </div>
    </main>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card
      className="flex min-h-56 flex-col items-center justify-center gap-4 border-dashed text-center"
      interactive={false}
    >
      <div className="icon-tile size-14 rounded-full bg-primary/10 text-text-secondary">
        <SearchX className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-xl font-semibold text-text-secondary">
          {title}
        </h3>
        <p className="max-w-sm text-sm text-text-muted">{description}</p>
      </div>
    </Card>
  );
}
