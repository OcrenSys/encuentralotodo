import { SearchX } from 'lucide-react';

import { cn } from 'utils';

import { Card } from './primitives';

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[24px] bg-white/70', className)} />;
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="flex min-h-56 flex-col items-center justify-center gap-4 border-dashed text-center">
      <div className="rounded-full bg-[var(--color-primary)]/10 p-4 text-[var(--color-primary)]">
        <SearchX className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">{title}</h3>
        <p className="max-w-sm text-sm text-[var(--color-text-muted)]">{description}</p>
      </div>
    </Card>
  );
}