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
    <Card className="space-y-4 border-[rgba(140,156,177,0.18)] bg-[linear-gradient(180deg,rgba(250,252,255,0.96),rgba(243,247,252,0.92))] hover:translate-y-0">
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
            className="interactive-row flex flex-col gap-3 rounded-[22px] border border-[rgba(140,156,177,0.12)] p-4 sm:flex-row sm:items-center sm:justify-between"
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
