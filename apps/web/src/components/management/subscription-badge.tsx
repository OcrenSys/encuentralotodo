'use client';

import { Crown, Gem, Sparkles } from 'lucide-react';
import { Badge } from 'ui';
import type { SubscriptionType } from 'types';

import { formatSubscriptionLabel } from '../../lib/display-labels';

const subscriptionConfig: Record<
  SubscriptionType,
  {
    className: string;
    Icon: typeof Sparkles;
  }
> = {
  FREE_TRIAL: {
    className: 'badge-subscription-trial',
    Icon: Sparkles,
  },
  PREMIUM: {
    className: 'badge-subscription-premium',
    Icon: Crown,
  },
  PREMIUM_PLUS: {
    className: 'badge-subscription-premium-plus',
    Icon: Gem,
  },
};

export function SubscriptionBadge({
  subscriptionType,
}: {
  subscriptionType: SubscriptionType;
}) {
  const config =
    subscriptionConfig[subscriptionType] ?? subscriptionConfig.FREE_TRIAL;
  const Icon = config.Icon;

  return (
    <Badge className={config.className} variant="neutral">
      <Icon className="size-3.5" />
      {formatSubscriptionLabel(subscriptionType)}
    </Badge>
  );
}
