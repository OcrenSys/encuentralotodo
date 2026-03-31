import { cn } from 'utils';

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]',
        normalized === 'APPROVED' ||
          normalized === 'ACTIVE' ||
          normalized === 'CLOSED'
          ? 'bg-[var(--color-secondary)]/14 text-[var(--color-primary)]'
          : normalized === 'PENDING' ||
              normalized === 'NEW' ||
              normalized === 'QUEUED'
            ? 'bg-[var(--color-accent)]/24 text-[var(--color-primary)]'
            : normalized === 'BLOCKED' || normalized === 'EXPIRED'
              ? 'bg-[#f3d5d5] text-[#9f3838]'
              : 'bg-[var(--color-primary)]/8 text-[var(--color-primary)]',
      )}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}
