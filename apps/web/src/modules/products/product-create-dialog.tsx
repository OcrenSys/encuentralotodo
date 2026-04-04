'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Product, ProductType } from 'types';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Select,
  Textarea,
} from 'ui';

import { trpc } from '../../lib/trpc';

const productFormSchema = z
  .object({
    businessId: z.string().min(2, 'Selecciona un negocio.'),
    name: z.string().min(2, 'Ingresa un nombre.').max(80),
    description: z
      .string()
      .min(10, 'Agrega una descripción más clara.')
      .max(300),
    type: z.enum(['simple', 'configurable']),
    configurationSummary: z.string().trim().max(160).optional(),
    imagePrimary: z.string().url('Ingresa una URL válida.'),
    imageSecondary: z.union([
      z.literal(''),
      z.string().url('Ingresa una URL válida.'),
    ]),
    imageTertiary: z.union([
      z.literal(''),
      z.string().url('Ingresa una URL válida.'),
    ]),
    price: z.string().optional(),
    isFeatured: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'configurable') {
      if (values.price?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Los configurables no usan precio fijo todavía.',
          path: ['price'],
        });
      }

      if (!values.configurationSummary?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Agrega un resumen visible para el catálogo.',
          path: ['configurationSummary'],
        });
      }
    }
  });

type ProductFormValues = z.infer<typeof productFormSchema>;

const emptyValues: ProductFormValues = {
  businessId: '',
  name: '',
  description: '',
  type: 'simple',
  configurationSummary: '',
  imagePrimary: '',
  imageSecondary: '',
  imageTertiary: '',
  price: '',
  isFeatured: false,
};

function getInitialValues({
  businessOptions,
  product,
}: {
  businessOptions: Array<{ label: string; value: string }>;
  product?: Product;
}): ProductFormValues {
  const productType = product?.type ?? 'simple';

  return {
    businessId:
      product?.businessId ??
      (businessOptions.length === 1 ? (businessOptions[0]?.value ?? '') : ''),
    name: product?.name ?? '',
    description: product?.description ?? '',
    type: productType,
    configurationSummary:
      productType === 'configurable'
        ? (product?.configurationSummary ?? '')
        : '',
    imagePrimary: product?.images[0] ?? '',
    imageSecondary: product?.images[1] ?? '',
    imageTertiary: product?.images[2] ?? '',
    price:
      productType === 'simple' && typeof product?.price === 'number'
        ? String(product.price)
        : '',
    isFeatured: product?.isFeatured ?? false,
  };
}

export function ProductUpsertDialog({
  businessOptions,
  onOpenChange,
  open,
  product,
}: {
  businessOptions: Array<{ label: string; value: string }>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  product?: Product;
}) {
  const isEditing = Boolean(product);
  const utils = trpc.useUtils();
  const form = useForm<ProductFormValues>({
    defaultValues: emptyValues,
    resolver: zodResolver(productFormSchema),
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getInitialValues({ businessOptions, product }));
  }, [businessOptions, form, open, product]);

  const createProduct = trpc.product.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.product.managed.invalidate(),
        utils.business.managed.invalidate(),
        utils.business.managedPage.invalidate(),
      ]);
      toast.success('Producto guardado correctamente.');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const updateProduct = trpc.product.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.product.managed.invalidate(),
        utils.business.managed.invalidate(),
        utils.business.managedPage.invalidate(),
      ]);
      toast.success('Producto guardado correctamente.');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const normalizedType = values.type as ProductType;
    const normalizedPrice =
      normalizedType === 'simple' && values.price?.trim()
        ? Number(values.price.trim())
        : undefined;
    const normalizedConfigurationSummary =
      normalizedType === 'configurable'
        ? values.configurationSummary?.trim()
        : undefined;
    const payload = {
      description: values.description,
      images: [
        values.imagePrimary,
        values.imageSecondary,
        values.imageTertiary,
      ].filter(Boolean),
      isFeatured: values.isFeatured,
      name: values.name,
      type: normalizedType,
    } as const;

    if (isEditing && product) {
      updateProduct.mutate({
        productId: product.id,
        ...payload,
        configurationSummary:
          normalizedType === 'configurable'
            ? normalizedConfigurationSummary
            : null,
        price: normalizedType === 'simple' ? (normalizedPrice ?? null) : null,
      });
      return;
    }

    createProduct.mutate({
      businessId: values.businessId,
      ...payload,
      configurationSummary: normalizedConfigurationSummary,
      price: normalizedPrice,
    });
  });

  const isPending = createProduct.isPending || updateProduct.isPending;
  const selectedBusinessId = form.watch('businessId');
  const selectedType = form.watch('type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza el producto usando el mismo contrato de creación para mantener simple y configurable alineados.'
              : 'Crea un producto real en el catálogo del negocio. Al guardar, la lista se actualiza con la consulta de gestión activa.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              error={form.formState.errors.businessId?.message}
              hint="Selecciona el negocio donde se publicará el producto."
              label="Negocio"
            >
              <Select
                aria-label="Negocio"
                disabled={businessOptions.length === 0 || isPending}
                onValueChange={(value) =>
                  form.setValue('businessId', value, { shouldValidate: true })
                }
                options={businessOptions}
                placeholder="Selecciona un negocio"
                value={selectedBusinessId}
              />
            </FormField>

            <FormField
              error={form.formState.errors.type?.message}
              hint="Simple mantiene precio fijo. Configurable usa un resumen público mientras llegan variantes reales."
              label="Tipo"
            >
              <Select
                aria-label="Tipo de producto"
                disabled={isPending}
                onValueChange={(value) => {
                  form.setValue('type', value as ProductType, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });

                  if (value === 'configurable') {
                    form.setValue('price', '', { shouldDirty: true });
                  }
                }}
                options={[
                  { label: 'Simple', value: 'simple' },
                  { label: 'Configurable', value: 'configurable' },
                ]}
                value={selectedType}
              />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              error={form.formState.errors.price?.message}
              hint={
                selectedType === 'simple'
                  ? 'Opcional. Usa números sin símbolo de moneda.'
                  : 'Los configurables todavía no usan precio fijo en catálogo.'
              }
              label="Precio"
            >
              <Input
                disabled={selectedType === 'configurable' || isPending}
                inputMode="decimal"
                placeholder={
                  selectedType === 'simple'
                    ? '1250'
                    : 'Se definirá por opciones'
                }
                {...form.register('price')}
              />
            </FormField>

            <FormField
              error={form.formState.errors.name?.message}
              label="Nombre"
            >
              <Input placeholder="Combo ejecutivo" {...form.register('name')} />
            </FormField>

            <label className="surface-inset flex items-center gap-3 px-4 py-3">
              <input
                className="size-4"
                type="checkbox"
                {...form.register('isFeatured')}
              />
              <span className="text-sm font-medium text-text-secondary">
                Marcar como destacado
              </span>
            </label>
          </div>

          {selectedType === 'configurable' ? (
            <FormField
              error={form.formState.errors.configurationSummary?.message}
              hint="Resumen corto que aparecerá en listas públicas hasta que existan variantes reales."
              label="Resumen configurable"
            >
              <Input
                placeholder="Elige tamaño, topping o combinación al solicitarlo"
                {...form.register('configurationSummary')}
              />
            </FormField>
          ) : null}

          <FormField
            error={form.formState.errors.description?.message}
            label="Descripción"
          >
            <Textarea
              placeholder="Describe beneficios, contenido o características clave del producto."
              {...form.register('description')}
            />
          </FormField>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              error={form.formState.errors.imagePrimary?.message}
              hint="Imagen principal obligatoria."
              label="Imagen 1"
            >
              <Input
                placeholder="https://..."
                {...form.register('imagePrimary')}
              />
            </FormField>
            <FormField
              error={form.formState.errors.imageSecondary?.message}
              hint="Opcional."
              label="Imagen 2"
            >
              <Input
                placeholder="https://..."
                {...form.register('imageSecondary')}
              />
            </FormField>
            <FormField
              error={form.formState.errors.imageTertiary?.message}
              hint="Opcional."
              label="Imagen 3"
            >
              <Input
                placeholder="https://..."
                {...form.register('imageTertiary')}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="ghost"
            >
              Cancelar
            </Button>
            <Button
              disabled={isPending || businessOptions.length === 0}
              type="submit"
            >
              {isPending
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
