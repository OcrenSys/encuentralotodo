'use client';

import type { Promotion, PromotionStatus, PromotionType } from 'types';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
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

import { ImageDropzone } from '../../components/image-dropzone';
import { trpc } from '../../lib/trpc';

const promotionFormSchema = z
  .object({
    businessId: z.string().min(2, 'Selecciona un negocio.'),
    title: z.string().min(2, 'Ingresa un título.').max(80),
    description: z
      .string()
      .min(10, 'Agrega una descripción más clara.')
      .max(240),
    type: z.enum(['DISCOUNT', 'EVENT', 'ANNOUNCEMENT']),
    status: z.enum(['DRAFT', 'ACTIVE']),
    startDate: z.string().min(1, 'Selecciona una fecha de inicio.'),
    endDate: z.string().min(1, 'Selecciona una fecha de fin.'),
    promoPrice: z.string().min(1, 'Ingresa el precio promocional.'),
    originalPrice: z.string().min(1, 'Ingresa el precio original.'),
    image: z.array(z.string().url('Sube una imagen válida.')).min(1),
  })
  .superRefine((values, ctx) => {
    const promoPrice = Number(values.promoPrice);
    const originalPrice = Number(values.originalPrice);

    if (Number.isNaN(promoPrice) || promoPrice < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa un precio promocional válido.',
        path: ['promoPrice'],
      });
    }

    if (Number.isNaN(originalPrice) || originalPrice < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa un precio original válido.',
        path: ['originalPrice'],
      });
    }

    if (
      !Number.isNaN(promoPrice) &&
      !Number.isNaN(originalPrice) &&
      originalPrice < promoPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El precio original debe ser mayor o igual al promocional.',
        path: ['originalPrice'],
      });
    }

    if (
      new Date(values.startDate).getTime() >= new Date(values.endDate).getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha final debe ser posterior a la fecha inicial.',
        path: ['endDate'],
      });
    }
  });

type PromotionFormValues = z.infer<typeof promotionFormSchema>;
type PromotionFormStatus = PromotionFormValues['status'];

const emptyValues: PromotionFormValues = {
  businessId: '',
  title: '',
  description: '',
  type: 'DISCOUNT',
  status: 'ACTIVE',
  startDate: '',
  endDate: '',
  promoPrice: '',
  originalPrice: '',
  image: [],
};

function toLocalDateTimeValue(value?: string) {
  return value ? value.slice(0, 16) : '';
}

function toIsoDateTimeValue(value: string) {
  return new Date(value).toISOString();
}

function getInitialValues({
  businessOptions,
  promotion,
}: {
  businessOptions: Array<{ label: string; value: string }>;
  promotion?: Promotion;
}): PromotionFormValues {
  return {
    businessId:
      promotion?.businessId ??
      (businessOptions.length === 1 ? (businessOptions[0]?.value ?? '') : ''),
    title: promotion?.title ?? '',
    description: promotion?.description ?? '',
    type: promotion?.type ?? 'DISCOUNT',
    status: promotion?.status === 'DRAFT' ? 'DRAFT' : 'ACTIVE',
    startDate: toLocalDateTimeValue(promotion?.startDate),
    endDate: toLocalDateTimeValue(promotion?.endDate),
    promoPrice:
      typeof promotion?.promoPrice === 'number'
        ? String(promotion.promoPrice)
        : '',
    originalPrice:
      typeof promotion?.originalPrice === 'number'
        ? String(promotion.originalPrice)
        : '',
    image: promotion?.image ? [promotion.image] : [],
  };
}

export function PromotionUpsertDialog({
  businessOptions,
  onOpenChange,
  open,
  promotion,
}: {
  businessOptions: Array<{ label: string; value: string }>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  promotion?: Promotion;
}) {
  const isEditing = Boolean(promotion);
  const utils = trpc.useUtils();
  const form = useForm<PromotionFormValues>({
    defaultValues: emptyValues,
    resolver: zodResolver(promotionFormSchema),
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getInitialValues({ businessOptions, promotion }));
  }, [businessOptions, form, open, promotion]);

  const createPromotion = trpc.promotion.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.promotion.listByBusiness.invalidate(),
        utils.promotion.listActive.invalidate(),
        utils.business.managed.invalidate(),
        utils.business.managedPage.invalidate(),
      ]);
      toast.success('Promoción guardada correctamente.');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updatePromotion = trpc.promotion.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.promotion.listByBusiness.invalidate(),
        utils.promotion.listActive.invalidate(),
        utils.business.managed.invalidate(),
        utils.business.managedPage.invalidate(),
      ]);
      toast.success('Promoción guardada correctamente.');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const payload = {
      title: values.title,
      description: values.description,
      type: values.type as PromotionType,
      status: values.status as PromotionStatus,
      startDate: toIsoDateTimeValue(values.startDate),
      endDate: toIsoDateTimeValue(values.endDate),
      promoPrice: Number(values.promoPrice),
      originalPrice: Number(values.originalPrice),
      image: values.image[0] ?? '',
    };

    if (isEditing && promotion) {
      updatePromotion.mutate({
        promotionId: promotion.id,
        ...payload,
      });
      return;
    }

    createPromotion.mutate({
      businessId: values.businessId,
      ...payload,
    });
  });

  const isPending = createPromotion.isPending || updatePromotion.isPending;
  const selectedBusinessId = form.watch('businessId');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar promoción' : 'Nueva promoción'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza la campaña manteniendo fechas, estado e imagen en el backend real.'
              : 'Crea una promoción real para un negocio gestionado. La lista se refresca desde tRPC al guardar.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              error={form.formState.errors.businessId?.message}
              hint="Solo se muestran negocios donde puedes crear promociones."
              label="Negocio"
            >
              <Select
                aria-label="Negocio"
                disabled={
                  businessOptions.length === 0 || isPending || isEditing
                }
                onValueChange={(value) =>
                  form.setValue('businessId', value, { shouldValidate: true })
                }
                options={businessOptions}
                placeholder="Selecciona un negocio"
                value={selectedBusinessId}
              />
            </FormField>

            <FormField error={form.formState.errors.type?.message} label="Tipo">
              <Select
                aria-label="Tipo de promoción"
                disabled={isPending}
                onValueChange={(value) =>
                  form.setValue('type', value as PromotionType, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                options={[
                  { label: 'Descuento', value: 'DISCOUNT' },
                  { label: 'Evento', value: 'EVENT' },
                  { label: 'Anuncio', value: 'ANNOUNCEMENT' },
                ]}
                value={form.watch('type')}
              />
            </FormField>

            <FormField
              error={form.formState.errors.status?.message}
              label="Estado inicial"
            >
              <Select
                aria-label="Estado de promoción"
                disabled={isPending}
                onValueChange={(value) =>
                  form.setValue('status', value as PromotionFormStatus, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                options={[
                  { label: 'Activa', value: 'ACTIVE' },
                  { label: 'Borrador', value: 'DRAFT' },
                ]}
                value={form.watch('status')}
              />
            </FormField>

            <FormField
              error={form.formState.errors.title?.message}
              label="Título"
            >
              <Input
                placeholder="Semana de combos corporativos"
                {...form.register('title')}
              />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              error={form.formState.errors.startDate?.message}
              label="Inicio"
            >
              <Input type="datetime-local" {...form.register('startDate')} />
            </FormField>

            <FormField
              error={form.formState.errors.endDate?.message}
              label="Fin"
            >
              <Input type="datetime-local" {...form.register('endDate')} />
            </FormField>

            <FormField
              error={form.formState.errors.promoPrice?.message}
              label="Precio promocional"
            >
              <Input
                inputMode="decimal"
                placeholder="149"
                {...form.register('promoPrice')}
              />
            </FormField>

            <FormField
              error={form.formState.errors.originalPrice?.message}
              label="Precio original"
            >
              <Input
                inputMode="decimal"
                placeholder="199"
                {...form.register('originalPrice')}
              />
            </FormField>
          </div>

          <FormField
            error={form.formState.errors.description?.message}
            label="Descripción"
          >
            <Textarea
              placeholder="Describe el beneficio, la ventana comercial y cualquier condición importante."
              {...form.register('description')}
            />
          </FormField>

          <FormField
            error={form.formState.errors.image?.message}
            hint="Sube una imagen de campaña. El backend seguirá recibiendo la URL final."
            label="Imagen"
          >
            <Controller
              control={form.control}
              name="image"
              render={({ field }) => (
                <ImageDropzone
                  disabled={!selectedBusinessId || isPending}
                  maxFileCount={1}
                  maxFileSizeBytes={5 * 1024 * 1024}
                  onChange={(nextImages) => {
                    field.onChange(nextImages);
                  }}
                  uploadContext={{
                    module: 'promotion-images',
                    businessId: selectedBusinessId || undefined,
                    entityId: promotion?.id,
                  }}
                  value={field.value ?? []}
                />
              )}
            />
          </FormField>

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
                  : 'Crear promoción'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
