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
      className={cn('space-y-4 border p-4 lg:p-5', statVariants[variant])}
      interactive={false}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
            {label}
          </p>
          <p className="mt-3 font-display text-3xl font-semibold text-text-secondary">
            {value}
          </p>
        </div>
        <div className="icon-tile border border-white/60 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="text-sm leading-6 text-text-muted">{helper}</p>
    </Card>
  );
}
