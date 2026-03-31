import type { ReactNode } from 'react';

import { Card } from 'ui';

export function SurfaceTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-0 hover:translate-y-0 hover:shadow-[0_12px_36px_rgba(17,39,60,0.08)]">
      <div
        className="grid gap-4 border-b border-[var(--color-border)] bg-[var(--color-background)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      <div>{children}</div>
    </Card>
  );
}
