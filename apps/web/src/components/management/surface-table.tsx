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
    <Card className="overflow-hidden p-0" interactive={false} variant="soft">
      <div
        className="surface-inset grid gap-4 rounded-none border-x-0 border-t-0 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted"
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
