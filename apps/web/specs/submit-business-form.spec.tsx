import { act, fireEvent, render, screen } from '@testing-library/react';

import { SubmitBusinessForm } from '../src/components/submit-business-form';

const pushMock = jest.fn();
const invalidateMock = jest.fn(async () => undefined);

const mockOwnerResults = [
  {
    id: 'user-ana',
    fullName: 'Ana Mercado',
    email: 'ana@encuentralotodo.app',
    role: 'USER',
    isActive: true,
  },
  {
    id: 'user-carlos',
    fullName: 'Carlos Perez',
    email: 'carlos@encuentralotodo.app',
    role: 'ADMIN',
    isActive: true,
  },
];

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('../src/lib/platform-authorization', () => ({
  useCurrentUserRole: jest.fn(),
}));

jest.mock('../src/components/business-owner-select', () => ({
  BusinessOwnerSelect: ({
    disabled,
    onSelect,
    value,
  }: {
    disabled?: boolean;
    onSelect: (user: (typeof mockOwnerResults)[number]) => void;
    value?: string;
  }) => {
    return (
      <div>
        <p>Owner actual: {value || 'sin owner'}</p>
        <button
          disabled={disabled}
          onClick={() => onSelect(mockOwnerResults[0])}
          type="button"
        >
          Responsable principal
        </button>
      </div>
    );
  },
}));

jest.mock('../src/components/business-managers-select', () => ({
  BusinessManagersSelect: ({
    disabled,
    onChange,
    value,
  }: {
    disabled?: boolean;
    onChange: (managerIds: string[]) => void;
    value?: string[];
  }) => {
    return (
      <div>
        <p>Managers actuales: {(value ?? []).join(', ') || 'sin managers'}</p>
        <button
          disabled={disabled}
          onClick={() => onChange(['user-carlos'])}
          type="button"
        >
          Encargados
        </button>
      </div>
    );
  },
}));

jest.mock('../src/lib/trpc', () => ({
  trpc: {
    useUtils: jest.fn(),
    business: {
      create: {
        useMutation: jest.fn(),
      },
    },
  },
}));

jest.mock('../src/lib/file-storage', () => ({
  getFileStorageProvider: () => ({
    name: 'firebase',
    uploadFile: jest.fn(),
  }),
}));

jest.mock('../src/components/image-dropzone', () => ({
  ImageDropzone: ({
    onChange,
    uploadContext,
    value,
  }: {
    onChange: (images: string[]) => void;
    uploadContext?: { slot?: string };
    value: string[];
  }) => {
    const label =
      uploadContext?.slot === 'profile'
        ? 'Subir imagen profile'
        : uploadContext?.slot === 'banner'
          ? 'Subir imagen banner'
          : 'Subir imagen';

    const imageUrl =
      uploadContext?.slot === 'profile'
        ? 'https://cdn.example.com/business/profile-uploaded.png'
        : 'https://cdn.example.com/business/banner-uploaded.png';

    return (
      <div>
        <p>
          Valor {uploadContext?.slot ?? 'general'}:{' '}
          {value.join(', ') || 'sin imagen'}
        </p>
        <button onClick={() => onChange([imageUrl])} type="button">
          {label}
        </button>
      </div>
    );
  },
}));

const { useCurrentUserRole } = jest.requireMock(
  '../src/lib/platform-authorization',
) as { useCurrentUserRole: jest.Mock };

const { trpc } = jest.requireMock('../src/lib/trpc') as any;

describe('SubmitBusinessForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    invalidateMock.mockClear();

    Object.defineProperty(window, 'URL', {
      configurable: true,
      value: {
        createObjectURL: jest.fn(() => 'blob:business-preview'),
        revokeObjectURL: jest.fn(),
      },
    });

    useCurrentUserRole.mockReturnValue({
      currentUser: {
        id: 'admin-luis',
        role: 'ADMIN',
      },
      isLoading: false,
    });

    trpc.useUtils.mockReturnValue({
      business: {
        list: {
          invalidate: invalidateMock,
        },
      },
    });

    trpc.business.create.useMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  it('syncs ownerId and managers through the selector controls', async () => {
    render(<SubmitBusinessForm />);

    expect(screen.getByText('Owner actual: sin owner')).toBeTruthy();
    expect(screen.getByText('Managers actuales: sin managers')).toBeTruthy();

    fireEvent.click(
      screen.getAllByText('Responsable principal')[1] as HTMLElement,
    );
    fireEvent.click(screen.getAllByText('Encargados')[1] as HTMLElement);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Owner actual: user-ana')).toBeTruthy();
    expect(screen.getByText('Managers actuales: user-carlos')).toBeTruthy();
  });

  it('hydrates and updates the business profile image URL through the dropzone', async () => {
    render(<SubmitBusinessForm />);

    expect(
      screen.getByText(
        /Valor profile: https:\/\/images.unsplash.com\/photo-1520607162513-77705c0f0d4a/i,
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByText('Subir imagen profile'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText(
        /Valor profile: https:\/\/cdn.example.com\/business\/profile-uploaded.png/i,
      ),
    ).toBeTruthy();
  });
});
