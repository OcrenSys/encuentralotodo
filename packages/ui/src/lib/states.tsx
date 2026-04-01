import { SearchX } from 'lucide-react';

import { cn } from 'utils';

import { Card } from './primitives';

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-white/70', className)} />
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
