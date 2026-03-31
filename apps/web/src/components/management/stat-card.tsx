import type { LucideIcon } from 'lucide-react';

import { Card } from 'ui';

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="space-y-4 p-4 hover:translate-y-0 hover:shadow-[0_12px_36px_rgba(17,39,60,0.08)] lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="mt-3 font-display text-3xl font-semibold text-[var(--color-primary)]">
            {value}
          </p>
        </div>
        <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="text-sm leading-6 text-[var(--color-text-muted)]">
        {helper}
      </p>
    </Card>
  );
}
