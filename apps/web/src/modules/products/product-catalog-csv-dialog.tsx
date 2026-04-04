'use client';

import { useEffect, useMemo, useState } from 'react';
import { importManagedProductDraftSchema } from 'types';
import { Download, FileUp, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  GhostButton,
  Input,
  Panel,
} from 'ui';

import { trpc } from '../../lib/trpc';

type ImportRowPayload = {
  product: {
    description: string;
    images: string[];
    isFeatured: boolean;
    name: string;
    price: number;
  };
  rowNumber: number;
};

type PreviewSummary = {
  businessCount: number;
  errors: string[];
  totalItems: number;
  valid: boolean;
};

export function getProductCatalogPrimaryActionLabel({
  importPending,
  isImportReady,
  previewPending,
}: {
  importPending: boolean;
  isImportReady: boolean;
  previewPending: boolean;
}) {
  if (importPending) {
    return 'Importando...';
  }

  if (previewPending) {
    return 'Validando...';
  }

  return isImportReady ? 'Import Products' : 'Preview Import';
}

const requiredHeaders = ['name', 'description', 'price', 'isFeatured'] as const;

function parseCsvContent(content: string) {
  const rows: string[][] = [];
  let currentCell = '';
  let currentRow: string[] = [];
  let insideQuotes = false;
  const normalizedContent = content.replace(/^\uFEFF/, '');

  for (let index = 0; index < normalizedContent.length; index += 1) {
    const character = normalizedContent[index];
    const nextCharacter = normalizedContent[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !insideQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }

      currentRow.push(currentCell.trim());
      currentCell = '';

      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseBoolean(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  if (['true', '1', 'si', 'sí', 'yes'].includes(normalizedValue)) {
    return true;
  }

  if (['false', '0', 'no'].includes(normalizedValue)) {
    return false;
  }

  return null;
}

function buildImportRows(content: string) {
  const parsedRows = parseCsvContent(content);
  if (parsedRows.length < 2) {
    return {
      errors: [
        'El archivo CSV debe incluir encabezados y al menos una fila de productos.',
      ],
      items: [] as ImportRowPayload[],
    };
  }

  const [headerRow, ...dataRows] = parsedRows;
  const headerIndex = new Map(
    headerRow.map((header, index) => [header.trim(), index]),
  );
  const missingHeaders = requiredHeaders.filter(
    (header) => !headerIndex.has(header),
  );

  if (missingHeaders.length > 0) {
    return {
      errors: [
        `Faltan columnas obligatorias en el CSV: ${missingHeaders.join(', ')}.`,
      ],
      items: [] as ImportRowPayload[],
    };
  }

  const errors: string[] = [];
  const items: ImportRowPayload[] = [];

  dataRows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const getCell = (header: string) =>
      row[headerIndex.get(header) ?? -1] ?? '';
    const priceValue = getCell('price');
    const parsedFeatured = parseBoolean(getCell('isFeatured'));

    if (parsedFeatured === null) {
      errors.push(`Fila ${rowNumber}: isFeatured debe ser true o false.`);
      return;
    }

    const candidate = {
      description: getCell('description'),
      images: [getCell('image1'), getCell('image2'), getCell('image3')].filter(
        Boolean,
      ),
      isFeatured: parsedFeatured,
      name: getCell('name'),
      price: priceValue ? Number(priceValue) : Number.NaN,
    };

    const result = importManagedProductDraftSchema.safeParse(candidate);
    if (!result.success) {
      errors.push(
        `Fila ${rowNumber}: ${result.error.issues.map((issue) => issue.message).join(', ')}`,
      );
      return;
    }

    items.push({
      product: result.data,
      rowNumber,
    });
  });

  return { errors, items };
}

export function ProductCatalogCsvDialog({
  businessOptions,
  open,
  onOpenChange,
  filters,
}: {
  businessOptions: Array<{ label: string; value: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    businessId?: string;
    featured: 'ALL' | 'FEATURED' | 'CATALOG';
    search: string;
  };
}) {
  const utils = trpc.useUtils();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewItems, setPreviewItems] = useState<ImportRowPayload[]>([]);
  const [previewSummary, setPreviewSummary] = useState<PreviewSummary | null>(
    null,
  );
  const selectedBusiness = useMemo(
    () => businessOptions.find((option) => option.value === filters.businessId),
    [businessOptions, filters.businessId],
  );

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setPreviewItems([]);
      setPreviewSummary(null);
    }
  }, [open]);

  const exportCatalogQuery = trpc.product.exportManagedCsv.useQuery(
    {
      businessId: filters.businessId,
      featured: filters.featured,
      page: 1,
      pageSize: 10,
      search: filters.search,
    },
    {
      enabled: false,
      retry: false,
    },
  );

  const previewImport = trpc.product.previewManagedImport.useMutation();
  const importProducts = trpc.product.importManaged.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        utils.product.managed.invalidate(),
        utils.business.managed.invalidate(),
        utils.business.managedPage.invalidate(),
      ]);
      toast.success(
        `${result.importedCount} productos importados correctamente.`,
      );
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isImportReady = Boolean(
    previewSummary?.valid && previewItems.length > 0,
  );
  const hasSelectedBusiness = Boolean(filters.businessId && selectedBusiness);
  const isBusy =
    exportCatalogQuery.isFetching ||
    previewImport.isPending ||
    importProducts.isPending;

  function resetPreviewState(file: File | null) {
    setSelectedFile(file);
    setPreviewItems([]);
    setPreviewSummary(null);
  }

  async function handleExportCatalog() {
    try {
      const file = await exportCatalogQuery.refetch();
      if (!file.data) {
        toast.error('No fue posible generar el archivo CSV.');
        return;
      }

      const blob = new Blob([`\uFEFF${file.data.content}`], {
        type: file.data.mimeType,
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = downloadUrl;
      anchor.download = file.data.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible exportar el catálogo.',
      );
    }
  }

  async function handlePrimaryAction() {
    if (isImportReady) {
      await importProducts.mutateAsync({
        businessId: filters.businessId ?? '',
        items: previewItems,
      });
      return;
    }

    if (!selectedFile) {
      toast.error('Selecciona un archivo CSV antes de continuar.');
      return;
    }

    if (!filters.businessId) {
      toast.error(
        'Selecciona un negocio específico antes de importar el catálogo.',
      );
      return;
    }

    const fileContent = await selectedFile.text();
    const localResult = buildImportRows(fileContent);

    if (localResult.errors.length > 0) {
      setPreviewItems([]);
      setPreviewSummary({
        businessCount: 0,
        errors: localResult.errors,
        totalItems: 0,
        valid: false,
      });
      return;
    }

    try {
      const previewResult = await previewImport.mutateAsync({
        businessId: filters.businessId,
        items: localResult.items,
      });

      setPreviewItems(localResult.items);
      setPreviewSummary(previewResult);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible validar el archivo CSV.',
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="space-y-5">
        <DialogHeader>
          <DialogTitle>Catálogo CSV</DialogTitle>
          <DialogDescription>
            Exporta el catálogo filtrado actual o importa un CSV. La importación
            solo se habilita cuando todo el archivo pasa la validación completa.
          </DialogDescription>
        </DialogHeader>

        <Panel
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          interactive={false}
          variant="inset"
        >
          <div>
            <p className="font-medium text-text-secondary">
              Descargar plantilla actual
            </p>
            <p className="text-sm text-text-muted">
              El CSV exportado respeta los filtros visibles y sirve como base
              para nuevas importaciones.
            </p>
          </div>
          <GhostButton
            disabled={exportCatalogQuery.isFetching}
            onClick={handleExportCatalog}
            type="button"
          >
            <Download className="mr-2 size-4" />
            {exportCatalogQuery.isFetching ? 'Exportando...' : 'Descargar CSV'}
          </GhostButton>
        </Panel>

        <FormField
          hint="Campos requeridos: name, description, price, isFeatured. image1, image2 e image3 son opcionales. createdAt y updatedAt se generan automáticamente."
          label="Archivo CSV"
        >
          <Input
            accept=".csv,text/csv"
            disabled={!hasSelectedBusiness || isBusy}
            onChange={(event) =>
              resetPreviewState(event.target.files?.[0] ?? null)
            }
            type="file"
          />
        </FormField>

        <Panel className="space-y-2" interactive={false} variant="inset">
          <p className="font-medium text-text-secondary">
            Contexto de importación
          </p>
          {hasSelectedBusiness ? (
            <p className="text-sm text-text-muted">
              Los productos se importarán en {selectedBusiness?.label}. No
              incluyas businessId en el CSV.
            </p>
          ) : (
            <p className="text-sm text-text-muted">
              Para importar, primero filtra la pantalla por un negocio
              específico.
            </p>
          )}
        </Panel>

        {selectedFile ? (
          <Panel className="space-y-2" interactive={false} variant="soft">
            <div className="flex items-center gap-2 text-text-secondary">
              <FileUp className="size-4" />
              <span className="font-medium">{selectedFile.name}</span>
            </div>
            <p className="text-sm text-text-muted">
              Tamaño: {(selectedFile.size / 1024).toFixed(1)} KB. Si cambias el
              archivo, la previsualización se reinicia.
            </p>
          </Panel>
        ) : null}

        {previewSummary ? (
          <Panel
            className="space-y-4"
            interactive={false}
            variant={previewSummary.valid ? 'soft' : 'inset'}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={previewSummary.valid ? 'success' : 'error'}>
                {previewSummary.valid
                  ? 'Validación lista'
                  : 'Validación con errores'}
              </Badge>
              <Badge variant="info">{previewSummary.totalItems} filas</Badge>
              {previewSummary.valid ? (
                <Badge variant="neutral">
                  {previewSummary.businessCount} negocios
                </Badge>
              ) : null}
            </div>

            {previewSummary.errors.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary">
                  Corrige estos errores antes de importar:
                </p>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-border-subtle bg-white/70 p-3 text-sm text-text-muted">
                  {previewSummary.errors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {previewSummary.valid ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary">
                  Preview de importación
                </p>
                <div className="space-y-2 rounded-2xl border border-border-subtle bg-white/70 p-3">
                  {previewItems.slice(0, 5).map((item) => (
                    <div
                      className="flex items-start justify-between gap-3 text-sm"
                      key={item.rowNumber}
                    >
                      <div>
                        <p className="font-medium text-text-secondary">
                          {item.product.name}
                        </p>
                        <p className="text-text-muted">
                          {selectedBusiness?.label}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.product.isFeatured ? 'warning' : 'neutral'
                        }
                      >
                        {item.product.isFeatured ? 'Destacado' : 'Catálogo'}
                      </Badge>
                    </div>
                  ))}
                  {previewItems.length > 5 ? (
                    <p className="text-sm text-text-muted">
                      Y {previewItems.length - 5} productos adicionales listos
                      para importar.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Panel>
        ) : null}

        <DialogFooter>
          <Button
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="ghost"
          >
            Cerrar
          </Button>
          <Button
            disabled={isBusy || !selectedFile || !hasSelectedBusiness}
            onClick={handlePrimaryAction}
            type="button"
          >
            <Upload className="mr-2 size-4" />
            {getProductCatalogPrimaryActionLabel({
              importPending: importProducts.isPending,
              isImportReady,
              previewPending: previewImport.isPending,
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
