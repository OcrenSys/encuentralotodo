import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { forwardRef } from 'react';

import { cn } from 'utils';

import { Panel } from './primitives';
import {
  ShadSelect,
  ShadSelectContent,
  ShadSelectItem,
  ShadSelectTrigger,
  ShadSelectValue,
} from './select';

type SelectOption = {
  label: string;
  value: string;
};

export const Input = forwardRef<
  HTMLInputElement,
  ComponentPropsWithoutRef<'input'>
>(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      className={cn(
        'field-control h-12 px-4 text-sm placeholder:text-text-muted',
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  );
});

export function Select({
  'aria-label': ariaLabel,
  className,
  disabled,
  name,
  onValueChange,
  options,
  placeholder,
  required,
  value,
}: {
  'aria-label'?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  value?: string;
}) {
  return (
    <ShadSelect disabled={disabled} onValueChange={onValueChange} value={value}>
      <ShadSelectTrigger
        aria-label={ariaLabel}
        className={cn('text-sm font-medium', className)}
        name={name}
      >
        <ShadSelectValue placeholder={placeholder} />
      </ShadSelectTrigger>
      <ShadSelectContent>
        {options.map((option) => (
          <ShadSelectItem key={option.value} value={option.value}>
            {option.label}
          </ShadSelectItem>
        ))}
      </ShadSelectContent>
    </ShadSelect>
  );
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentPropsWithoutRef<'textarea'>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      className={cn(
        'field-control min-h-32 px-4 py-3.5 text-sm placeholder:text-text-muted',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

export function FormField({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn('space-y-2', className)}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <p className="field-error">{error}</p> : null}
      {!error && hint ? <p className="field-hint">{hint}</p> : null}
    </label>
  );
}

export function FormSection({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Panel
      className={cn('space-y-4', className)}
      interactive={false}
      variant="inset"
    >
      <div className="space-y-1">
        <h3 className="font-display text-xl font-semibold text-text-secondary">
          {title}
        </h3>
        {description ? (
          <p className="text-sm leading-6 text-text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </Panel>
  );
}
