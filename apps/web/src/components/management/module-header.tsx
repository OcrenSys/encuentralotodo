import type { ReactNode } from 'react';

import { Panel } from 'ui';

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
    <Panel
      className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:px-6"
      interactive={false}
      variant="soft"
    >
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold text-text-secondary sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-text-muted">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-row w-full">{actions}</div> : null}
    </Panel>
  );
}
