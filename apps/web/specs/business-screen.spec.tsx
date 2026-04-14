import { act, fireEvent, render, screen } from '@testing-library/react';

import { BusinessScreen } from '../src/modules/business/business-screen';

const mutateUpdateMock = jest.fn();
const mutateTransferMock = jest.fn();
const invalidateMock = jest.fn(async () => undefined);

const baseBusiness = {
  id: 'biz-casa-norte',
  name: 'Casa Norte Market',
  description:
    'Tienda general con abarrotes, snacks, productos de limpieza y entregas rápidas dentro de la zona norte.',
  category: 'GENERAL_STORE',
  location: {
    lat: 18.4861,
    lng: -69.9312,
    zone: 'Zona Norte',
    address: 'Av. Charles Summer 42, Santo Domingo',
  },
  images: {
    profile: 'https://example.com/profile.jpg',
    banner: 'https://example.com/banner.jpg',
  },
  subscriptionType: 'PREMIUM_PLUS',
  ownerId: 'owner-sofia',
  managers: ['manager-carlos'],
  managersDetailed: [
    {
      id: 'manager-carlos',
      fullName: 'Carlos Mena',
      email: 'carlos@encuentralotodo.app',
      role: 'USER',
    },
  ],
  owner: {
    id: 'owner-sofia',
    fullName: 'Sofia Rivas',
    email: 'sofia@encuentralotodo.app',
    role: 'USER',
  },
  status: 'APPROVED',
  whatsappNumber: '18095550101',
  activePromotions: [],
  featuredProducts: [],
  products: [],
  promotions: [],
  reviews: [],
};

const secondBusiness = {
  ...baseBusiness,
  id: 'biz-bistro-central',
  name: 'Bistro Central',
  location: {
    ...baseBusiness.location,
    zone: 'Centro',
  },
  ownerId: 'owner-lucia',
  owner: {
    id: 'owner-lucia',
    fullName: 'Lucia Diaz',
    email: 'lucia@encuentralotodo.app',
    role: 'USER',
  },
};

const businessesById: Record<string, typeof baseBusiness> = {
  [baseBusiness.id]: baseBusiness,
  [secondBusiness.id]: secondBusiness,
};

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

jest.mock('../src/lib/platform-authorization', () => ({
  useCurrentUserRole: jest.fn(),
}));

jest.mock('../src/components/image-dropzone', () => ({
  ImageDropzone: ({ value }: { value: string[] }) => (
    <div>Dropzone: {value.join(', ')}</div>
  ),
}));

jest.mock('../src/components/business-owner-select', () => ({
  BusinessOwnerSelect: ({
    onSelect,
  }: {
    onSelect: (user: { id: string }) => void;
  }) => (
    <button onClick={() => onSelect({ id: 'owner-lucia' })} type="button">
      Elegir nuevo owner
    </button>
  ),
}));

jest.mock('../src/components/business-managers-select', () => ({
  BusinessManagersSelect: () => <div>Managers selector</div>,
}));

jest.mock('../src/lib/trpc', () => ({
  trpc: {
    useUtils: jest.fn(),
    business: {
      byId: {
        useQuery: jest.fn(),
      },
      managed: {
        useQuery: jest.fn(),
      },
      managedPage: {
        useQuery: jest.fn(),
      },
      transferOwnership: {
        useMutation: jest.fn(),
      },
      update: {
        useMutation: jest.fn(),
      },
    },
    admin: {},
  },
}));

const { useCurrentUserRole } = jest.requireMock(
  '../src/lib/platform-authorization',
) as {
  useCurrentUserRole: jest.Mock;
};

const { trpc } = jest.requireMock('../src/lib/trpc') as any;

describe('BusinessScreen', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: ResizeObserverMock,
      writable: true,
    });

    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: jest.fn(),
      writable: true,
    });

    mutateUpdateMock.mockReset();
    mutateTransferMock.mockReset();
    invalidateMock.mockClear();

    trpc.useUtils.mockReturnValue({
      business: {
        managed: { invalidate: invalidateMock },
        managedPage: { invalidate: invalidateMock },
        byId: { invalidate: invalidateMock },
      },
    });

    trpc.business.managed.useQuery.mockImplementation(() => ({
      data: [baseBusiness],
      isLoading: false,
    }));

    trpc.business.managedPage.useQuery.mockImplementation(() => ({
      data: {
        items: [baseBusiness, secondBusiness],
        page: 1,
        pageSize: 10,
        total: 21,
        totalPages: 3,
      },
      error: null,
      isLoading: false,
    }));

    trpc.business.byId.useQuery.mockImplementation(
      ({ businessId }: { businessId: string }) => ({
        data: businessId
          ? (businessesById[businessId] ?? baseBusiness)
          : undefined,
        isLoading: false,
      }),
    );

    trpc.business.update.useMutation.mockReturnValue({
      mutate: mutateUpdateMock,
      isPending: false,
    });

    trpc.business.transferOwnership.useMutation.mockReturnValue({
      mutate: mutateTransferMock,
      isPending: false,
    });
  });

  it('shows owner-only management controls for the current owner', async () => {
    useCurrentUserRole.mockReturnValue({
      currentUser: { id: 'owner-sofia', role: 'USER' },
      isLoading: false,
      role: 'USER',
    });

    render(<BusinessScreen />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByDisplayValue('Casa Norte Market')).toBeTruthy();
    expect(screen.getByText('Managers selector')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Transferir owner' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    ).toBeTruthy();
  });

  it('lets managers edit operational fields while keeping owner controls locked', async () => {
    useCurrentUserRole.mockReturnValue({
      currentUser: { id: 'manager-carlos', role: 'USER' },
      isLoading: false,
      role: 'USER',
    });

    render(<BusinessScreen />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Edición operativa')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('18095550101'), {
      target: { value: '18095550199' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Guardar cambios' }).closest('form')!,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mutateUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-casa-norte',
        whatsappNumber: '18095550199',
      }),
    );
    expect(screen.queryByText('Managers selector')).toBeNull();
  });

  it('lets SuperAdmin switch businesses from the paginated search selector', async () => {
    useCurrentUserRole.mockReturnValue({
      currentUser: { id: 'superadmin-luis', role: 'SUPERADMIN' },
      isLoading: false,
      role: 'SUPERADMIN',
    });

    render(<BusinessScreen />);

    fireEvent.click(screen.getByRole('button', { name: /Casa Norte Market/i }));
    fireEvent.click(screen.getByText('Bistro Central'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByDisplayValue('Bistro Central')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /Bistro Central/i }),
    ).toBeTruthy();
  });

  it('debounces the SuperAdmin search before changing the query term', async () => {
    jest.useFakeTimers();

    useCurrentUserRole.mockReturnValue({
      currentUser: { id: 'superadmin-luis', role: 'SUPERADMIN' },
      isLoading: false,
      role: 'SUPERADMIN',
    });

    render(<BusinessScreen />);

    fireEvent.click(screen.getByRole('button', { name: /Casa Norte Market/i }));
    fireEvent.change(
      screen.getByPlaceholderText('Buscar comercio por nombre'),
      {
        target: { value: 'Bistro' },
      },
    );

    expect(screen.getByText('Buscando comercios...')).toBeTruthy();
    expect(
      trpc.business.managedPage.useQuery.mock.calls.some(
        ([input]: [{ search: string }]) => input.search === 'Bistro',
      ),
    ).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(349);
    });

    expect(
      trpc.business.managedPage.useQuery.mock.calls.some(
        ([input]: [{ search: string }]) => input.search === 'Bistro',
      ),
    ).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(
      trpc.business.managedPage.useQuery.mock.calls.some(
        ([input]: [{ search: string }]) => input.search === 'Bistro',
      ),
    ).toBe(true);
    expect(screen.queryByText('Buscando comercios...')).toBeNull();
  });

  it('shows owner transfer controls for SuperAdmin', async () => {
    useCurrentUserRole.mockReturnValue({
      currentUser: { id: 'superadmin-luis', role: 'SUPERADMIN' },
      isLoading: false,
      role: 'SUPERADMIN',
    });

    render(<BusinessScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'Elegir nuevo owner' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transferir owner' }));
    expect(
      screen.getByRole('heading', { name: 'Confirmar transferencia de owner' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Transferir owner' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mutateTransferMock).toHaveBeenCalledWith({
      businessId: 'biz-casa-norte',
      fromUserId: 'owner-sofia',
      toUserId: 'owner-lucia',
    });
  });
});
