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
    <Card className="overflow-hidden border-[rgba(140,156,177,0.18)] p-0 hover:translate-y-0 hover:shadow-[var(--shadow-md)]">
      <div
        className="grid gap-4 border-b border-[rgba(140,156,177,0.16)] bg-[linear-gradient(180deg,rgba(245,248,252,0.96),rgba(238,243,248,0.88))] px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
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
