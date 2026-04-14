import { formatStatusLabel } from '../../lib/display-labels';
import { Badge } from 'ui';

const badgeToneByStatus = {
  APPROVED: 'success',
  ACTIVE: 'success',
  CLOSED: 'success',
  CONTACTED: 'neutral',
  QUALIFIED: 'success',
  PENDING: 'warning',
  NEW: 'warning',
  LOST: 'error',
  QUEUED: 'warning',
  BLOCKED: 'error',
  EXPIRED: 'error',
} as const;

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const variant =
    badgeToneByStatus[normalized as keyof typeof badgeToneByStatus] ??
    'neutral';

  return (
    <Badge
      className="shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
      variant={variant}
    >
      {formatStatusLabel(status)}
    </Badge>
  );
}
