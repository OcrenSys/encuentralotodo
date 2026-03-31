import { Button, Card, GhostButton } from 'ui';

type ActionItem = {
  label: string;
  helper: string;
  href?: string;
  primary?: boolean;
};

export function QuickActionsPanel({
  title,
  items,
}: {
  title: string;
  items: ActionItem[];
}) {
  return (
    <Card className="space-y-4 hover:translate-y-0">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          Quick actions
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold text-[var(--color-primary)]">
          {title}
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            className="flex flex-col gap-3 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-background)]/75 p-4 sm:flex-row sm:items-center sm:justify-between"
            key={item.label}
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">
                {item.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                {item.helper}
              </p>
            </div>
            {item.href ? (
              <a href={item.href}>
                {item.primary ? (
                  <Button>{item.label}</Button>
                ) : (
                  <GhostButton>{item.label}</GhostButton>
                )}
              </a>
            ) : item.primary ? (
              <Button type="button">{item.label}</Button>
            ) : (
              <GhostButton type="button">{item.label}</GhostButton>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
