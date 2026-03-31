import { cn } from 'utils';

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
        normalized === 'APPROVED' ||
          normalized === 'ACTIVE' ||
          normalized === 'CLOSED'
          ? 'border-[rgba(79,191,159,0.18)] bg-[linear-gradient(180deg,rgba(232,248,243,0.98),rgba(242,251,247,0.94))] text-[var(--color-primary)]'
          : normalized === 'PENDING' ||
              normalized === 'NEW' ||
              normalized === 'QUEUED'
            ? 'border-[rgba(210,175,91,0.2)] bg-[linear-gradient(180deg,rgba(253,247,226,0.96),rgba(255,251,239,0.92))] text-[var(--color-primary)]'
            : normalized === 'BLOCKED' || normalized === 'EXPIRED'
              ? 'border-[rgba(179,96,96,0.18)] bg-[linear-gradient(180deg,rgba(250,234,234,0.96),rgba(247,223,223,0.92))] text-[#9f3838]'
              : 'border-[rgba(31,60,90,0.12)] bg-[linear-gradient(180deg,rgba(241,246,251,0.96),rgba(246,249,253,0.92))] text-[var(--color-primary)]',
      )}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}
