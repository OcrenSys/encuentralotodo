'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { createBusinessInputSchema, type CreateBusinessInput } from 'types';
import { BottomNavigation, Button, Card, SectionHeading } from 'ui';

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

      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Nombre del negocio
            </span>
            <input
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              {...form.register('name')}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Descripción
            </span>
            <textarea
              className="min-h-32 w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              {...form.register('description')}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Categoría
            </span>
            <select
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              {...form.register('category')}
            >
              <option value="GENERAL_STORE">Tiendas físicas generales</option>
              <option value="RESTAURANT">Restaurantes / comida</option>
              <option value="SERVICE">Servicios</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Suscripción
            </span>
            <select
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              {...form.register('subscriptionType')}
            >
              <option value="FREE_TRIAL">FREE_TRIAL</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="PREMIUM_PLUS">PREMIUM_PLUS</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Zona
            </span>
            <input
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              {...form.register('location.zone')}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Dirección
            </span>
            <input
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              {...form.register('location.address')}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Latitud
            </span>
            <input
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              step="0.0001"
              type="number"
              {...form.register('location.lat', { valueAsNumber: true })}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Longitud
            </span>
            <input
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              step="0.0001"
              type="number"
              {...form.register('location.lng', { valueAsNumber: true })}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Imagen perfil
            </span>
            <input
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              {...form.register('images.profile')}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Imagen banner
            </span>
            <input
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              {...form.register('images.banner')}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Responsable principal
            </span>
            <select
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              {...form.register('ownerId')}
            >
              <option value="user-ana">Ana Mercado</option>
              <option value="owner-sofia">Sofia Rivas</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              WhatsApp
            </span>
            <input
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              {...form.register('whatsappNumber')}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              Encargados
            </span>
            <input
              className="w-full rounded-[20px] border border-[var(--color-border)] bg-white px-4 py-3"
              onChange={(event) => setManagers(event.target.value)}
              placeholder="carlos, ana"
              value={managers}
            />
          </label>
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
