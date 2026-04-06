'use client';

import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from 'utils';

export const ShadSelect = SelectPrimitive.Root;
export const ShadSelectGroup = SelectPrimitive.Group;
export const ShadSelectValue = SelectPrimitive.Value;

export const ShadSelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function ShadSelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      className={cn('et-select-trigger', className)}
      ref={ref}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 text-text-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const ShadSelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function ShadSelectContent(
  { className, children, position = 'popper', ...props },
  ref,
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn('et-select-content', className)}
        position={position}
        ref={ref}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="et-select-scroll-button">
          <ChevronUp className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="et-select-viewport">
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="et-select-scroll-button">
          <ChevronDown className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const ShadSelectLabel = forwardRef<
  ElementRef<typeof SelectPrimitive.Label>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function ShadSelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      className={cn('et-select-label', className)}
      ref={ref}
      {...props}
    />
  );
});

export const ShadSelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function ShadSelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      className={cn('et-select-item', className)}
      ref={ref}
      {...props}
    >
      <span className="et-select-item-indicator">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

export const ShadSelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function ShadSelectSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      className={cn('et-select-separator', className)}
      ref={ref}
      {...props}
    />
  );
});
