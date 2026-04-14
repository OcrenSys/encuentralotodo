import { useId } from 'react';

import { cn } from 'utils';

type BrandLogoVariant = 'lockup' | 'mark';

export function BrandLogo({
  className,
  markClassName,
  variant = 'lockup',
}: {
  className?: string;
  markClassName?: string;
  variant?: BrandLogoVariant;
}) {
  const gradientAId = useId();
  const gradientBId = useId();

  const mark = (
    <svg
      aria-hidden="true"
      className={cn('h-auto w-full', markClassName)}
      viewBox="0 0 120 120"
    >
      <defs>
        <linearGradient
          id={gradientAId}
          x1="10"
          x2="106"
          y1="108"
          y2="18"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0b3555" />
          <stop offset="0.58" stopColor="#1f7f93" />
          <stop offset="1" stopColor="#38beb3" />
        </linearGradient>
        <linearGradient
          id={gradientBId}
          x1="30"
          x2="86"
          y1="72"
          y2="26"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#195d78" />
          <stop offset="1" stopColor="#42c4b4" />
        </linearGradient>
      </defs>
      <path
        d="M60 10c24.7 0 44 18 44 42 0 16.8-7.2 28.4-19.7 40.9L67 110.4c-3.8 3.9-10.2 3.9-14 0L35.7 92.9C23.2 80.4 16 68.8 16 52c0-24 19.3-42 44-42Z"
        fill={`url(#${gradientAId})`}
      />
      <path
        d="M50.6 68.8 34.8 53.7a6.4 6.4 0 0 1-.2-9 6.4 6.4 0 0 1 9-.2L54 54.4l22.6-25.3a6.4 6.4 0 1 1 9.5 8.6L58.8 68.5a6.4 6.4 0 0 1-8.2.3Z"
        fill={`url(#${gradientBId})`}
      />
      <path
        d="M79.4 32.4 95 16.8a6.6 6.6 0 0 1 9.3 0 6.6 6.6 0 0 1 0 9.4L88.7 41.8a6.6 6.6 0 0 1-9.3 0 6.6 6.6 0 0 1 0-9.4Z"
        fill={`url(#${gradientBId})`}
      />
      <circle cx="107" cy="15" fill="#ff8d62" r="7.3" />
    </svg>
  );

  if (variant === 'mark') {
    return (
      <div className={cn('inline-flex items-center', className)}>{mark}</div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div className="w-11 shrink-0 sm:w-12 lg:w-14">{mark}</div>
      <div className="min-w-0">
        <div className="font-display text-[1.05rem] font-semibold tracking-tight text-text-secondary sm:text-[1.15rem] lg:text-[1.25rem]">
          Encuentralo<span className="text-secondary">Todo</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-text-muted sm:text-[11px]">
          Local Discovery Platform
        </div>
      </div>
    </div>
  );
}
