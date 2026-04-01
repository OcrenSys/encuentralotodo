'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { createBusinessInputSchema, type CreateBusinessInput } from 'types';
import {
  BottomNavigation,
  Button,
  Card,
  FormField,
  FormSection,
  Input,
  SectionHeading,
  Select,
  Textarea,
} from 'ui';

import { trpc } from '../lib/trpc';

const defaultValues: CreateBusinessInput = {
  name: '',
  description: '',
  category: 'GENERAL_STORE',
  location: {
    address: '',
    zone: '',
    lat: 18.47,
    lng: -69.9,
  },
  images: {
    profile:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=300&q=80',
    banner:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80',
  },
  subscriptionType: 'FREE_TRIAL',
  ownerId: 'user-ana',
  managers: [],
  whatsappNumber: '18095550110',
};

export function SubmitBusinessForm() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [managers, setManagers] = useState('');
  const form = useForm<any>({
    resolver: zodResolver(createBusinessInputSchema),
    defaultValues,
  });

  const createBusiness = trpc.business.create.useMutation({
    onSuccess: async () => {
      await utils.business.list.invalidate();
      toast.success('Negocio enviado para aprobación.');
      router.push('/admin');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const payload: CreateBusinessInput = {
      ...values,
      managers: managers
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    };

    createBusiness.mutate(payload);
  });

  return (
    <main className="space-y-8 px-4 pb-36 pt-6 sm:px-6">
      <SectionHeading
        eyebrow="Alta"
        title="Publica un negocio nuevo"
        description="El dueño crea el perfil, un admin lo aprueba y luego el negocio queda visible para discovery y WhatsApp."
      />

      <Card interactive={false} variant="soft">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <FormSection
            className="md:col-span-2"
            description="Base operativa del perfil antes de pasar a aprobación."
            title="Información principal"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField className="md:col-span-2" label="Nombre del negocio">
                <Input {...form.register('name')} />
              </FormField>
              <FormField className="md:col-span-2" label="Descripción">
                <Textarea {...form.register('description')} />
              </FormField>
              <FormField label="Categoría">
                <Select {...form.register('category')}>
                  <option value="GENERAL_STORE">
                    Tiendas físicas generales
                  </option>
                  <option value="RESTAURANT">Restaurantes / comida</option>
                  <option value="SERVICE">Servicios</option>
                </Select>
              </FormField>
              <FormField label="Suscripción">
                <Select {...form.register('subscriptionType')}>
                  <option value="FREE_TRIAL">FREE_TRIAL</option>
                  <option value="PREMIUM">PREMIUM</option>
                  <option value="PREMIUM_PLUS">PREMIUM_PLUS</option>
                </Select>
              </FormField>
            </div>
          </FormSection>

          <FormSection
            className="md:col-span-2"
            description="Datos visibles en discovery y en la ficha del negocio."
            title="Ubicación y contacto"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Zona">
                <Input {...form.register('location.zone')} />
              </FormField>
              <FormField className="md:col-span-2" label="Dirección">
                <Input {...form.register('location.address')} />
              </FormField>
              <FormField label="Latitud">
                <Input
                  step="0.0001"
                  type="number"
                  {...form.register('location.lat', { valueAsNumber: true })}
                />
              </FormField>
              <FormField label="Longitud">
                <Input
                  step="0.0001"
                  type="number"
                  {...form.register('location.lng', { valueAsNumber: true })}
                />
              </FormField>
              <FormField label="WhatsApp">
                <Input {...form.register('whatsappNumber')} />
              </FormField>
              <FormField label="Responsable principal">
                <Select {...form.register('ownerId')}>
                  <option value="user-ana">Ana Mercado</option>
                  <option value="owner-sofia">Sofia Rivas</option>
                </Select>
              </FormField>
            </div>
          </FormSection>

          <FormSection
            className="md:col-span-2"
            description="Assets actuales para la vitrina y el perfil público."
            title="Media y encargados"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Imagen perfil">
                <Input {...form.register('images.profile')} />
              </FormField>
              <FormField label="Imagen banner">
                <Input {...form.register('images.banner')} />
              </FormField>
              <FormField className="md:col-span-2" label="Encargados">
                <Input
                  onChange={(event) => setManagers(event.target.value)}
                  placeholder="carlos, ana"
                  value={managers}
                />
              </FormField>
            </div>
          </FormSection>

          <div className="md:col-span-2 flex justify-end">
            <Button disabled={createBusiness.isPending} type="submit">
              {createBusiness.isPending
                ? 'Enviando...'
                : 'Enviar para aprobación'}
            </Button>
          </div>
        </form>
      </Card>

      <BottomNavigation current="profile" />
    </main>
  );
}
