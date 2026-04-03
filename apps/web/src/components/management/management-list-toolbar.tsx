'use client';

import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input, Select } from 'ui';

type ToolbarFilter = {
  label: string;
  onValueChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  value: string;
  widthClassName?: string;
};

export function ManagementListToolbar({
  actions,
  filters = [],
  searchPlaceholder,
  searchValue,
  summary,
  onSearchChange,
}: {
  actions?: ReactNode;
  filters?: ToolbarFilter[];
  searchPlaceholder: string;
  searchValue: string;
  summary?: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <section className="field-panel space-y-4 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-base px-4">
          <Search className="size-4 shrink-0 text-text-muted" />
          <Input
            className="border-0 bg-transparent px-0 shadow-none"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 md:grid-cols-2 xl:flex xl:flex-wrap">
          {filters.map((filter) => (
            <label
              className={filter.widthClassName ?? 'xl:min-w-[220px]'}
              key={filter.label}
            >
              <span className="sr-only">{filter.label}</span>
              <Select
                aria-label={filter.label}
                onValueChange={filter.onValueChange}
                options={filter.options}
                placeholder={filter.placeholder}
                value={filter.value}
              />
            </label>
          ))}
        </div>
        {summary ? <p className="text-sm text-text-muted">{summary}</p> : null}
      </div>
    </section>
  );
}
