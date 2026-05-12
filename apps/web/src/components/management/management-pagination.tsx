'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Select } from 'ui';

function getVisibleRange(page: number, pageSize: number, total: number) {
  if (total === 0) {
    return '0 de 0';
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `${start}-${end} de ${total}`;
}

export function ManagementPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="field-panel flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-text-muted">
          Mostrando {getVisibleRange(page, pageSize, total)}
        </p>
        <label className="flex items-center gap-3 text-sm text-text-muted">
          <span>Filas</span>
          <Select
            aria-label="Cantidad de filas por página"
            className="min-w-[110px]"
            onValueChange={(value) => onPageSizeChange(Number(value))}
            options={[
              { label: '10', value: '10' },
              { label: '20', value: '20' },
              { label: '30', value: '30' },
            ]}
            value={String(pageSize)}
          />
        </label>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-sm text-text-muted">
          Página {Math.min(page, totalPages)} de {Math.max(totalPages, 1)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
            variant="ghost"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            aria-label="Página siguiente"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            type="button"
            variant="ghost"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
