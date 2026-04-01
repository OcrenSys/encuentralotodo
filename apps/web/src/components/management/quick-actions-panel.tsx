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
    <Card className="space-y-4" interactive={false} variant="soft">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
          Acciones rápidas
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold text-text-secondary">
          {title}
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            className="interactive-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            key={item.label}
          >
            <div>
              <p className="text-sm font-semibold text-text-secondary">
                {item.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-text-muted">
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
