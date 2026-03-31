import type { ReactNode } from 'react';

export function ModuleHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="surface-panel-soft flex flex-col gap-4 rounded-[30px] px-5 py-5 lg:flex-row lg:items-end lg:justify-between lg:px-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold text-[var(--color-primary)] sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
