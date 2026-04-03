'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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

const productCreateFormSchema = z.object({
  businessId: z.string().min(2, 'Selecciona un negocio.'),
  name: z.string().min(2, 'Ingresa un nombre.').max(80),
  description: z.string().min(10, 'Agrega una descripción más clara.').max(300),
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
});

type ProductCreateFormValues = z.infer<typeof productCreateFormSchema>;

const emptyValues: ProductCreateFormValues = {
  businessId: '',
  name: '',
  description: '',
  imagePrimary: '',
  imageSecondary: '',
  imageTertiary: '',
  price: '',
  isFeatured: false,
};

export function ProductCreateDialog({
  businessOptions,
  onOpenChange,
  open,
}: {
  businessOptions: Array<{ label: string; value: string }>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const utils = trpc.useUtils();
  const form = useForm<ProductCreateFormValues>({
    defaultValues: emptyValues,
    resolver: zodResolver(productCreateFormSchema),
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      ...emptyValues,
      businessId:
        businessOptions.length === 1 ? (businessOptions[0]?.value ?? '') : '',
    });
  }, [businessOptions, form, open]);

  const createProduct = trpc.product.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.product.managed.invalidate(),
        utils.business.managed.invalidate(),
        utils.business.managedPage.invalidate(),
      ]);
      toast.success('Producto creado correctamente.');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const normalizedPrice = values.price?.trim()
      ? Number(values.price.trim())
      : undefined;

    createProduct.mutate({
      businessId: values.businessId,
      description: values.description,
      images: [
        values.imagePrimary,
        values.imageSecondary,
        values.imageTertiary,
      ].filter(Boolean),
      isFeatured: values.isFeatured,
      name: values.name,
      price: normalizedPrice,
    });
  });

  const isPending = createProduct.isPending;
  const selectedBusinessId = form.watch('businessId');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
          <DialogDescription>
            Crea un producto real en el catálogo del negocio. Al guardar, la
            lista se actualiza con la consulta de gestión activa.
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
              error={form.formState.errors.price?.message}
              hint="Opcional. Usa números sin símbolo de moneda."
              label="Precio"
            >
              <Input
                inputMode="decimal"
                placeholder="1250"
                {...form.register('price')}
              />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
              {isPending ? 'Guardando...' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
