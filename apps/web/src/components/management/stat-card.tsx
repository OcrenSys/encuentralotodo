import type { LucideIcon } from 'lucide-react';

import { cn } from 'utils';

import { Card } from 'ui';

const statVariants = {
  blue: 'kpi-blue',
  green: 'kpi-green',
  amber: 'kpi-amber',
  neutral: 'kpi-neutral',
} as const;

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  variant = 'neutral',
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  variant?: keyof typeof statVariants;
}) {
  return (
    <Card
      className={cn(
        'space-y-4 border p-4 hover:-translate-y-0.5 lg:p-5',
        statVariants[variant],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="mt-3 font-display text-3xl font-semibold text-[var(--color-primary)]">
            {value}
          </p>
        </div>
        <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.48)] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="text-sm leading-6 text-[var(--color-text-muted)]">
        {helper}
      </p>
    </Card>
  );
}
