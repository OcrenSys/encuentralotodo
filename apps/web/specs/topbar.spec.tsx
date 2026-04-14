import { act, fireEvent, render } from '@testing-library/react';
import type { RefObject } from 'react';

import { Topbar } from '../src/components/layout/topbar';
import type { NavigationGroup } from '../src/lib/management-navigation';

jest.mock('../src/components/layout/role-switcher', () => ({
  RoleSwitcher: () => <div>RoleSwitcher</div>,
}));

jest.mock('../src/components/auth/auth-user-panel', () => ({
  AuthUserPanel: () => <div>AuthUserPanel</div>,
}));

function createScrollContainer() {
  const element = document.createElement('div');

  Object.defineProperty(element, 'scrollTop', {
    value: 0,
    writable: true,
  });

  document.body.appendChild(element);

  return element;
}

function renderTopbar() {
  const scrollContainer = createScrollContainer();
  const scrollContainerRef = {
    current: scrollContainer,
  } as RefObject<HTMLDivElement>;
  const navigationGroups: NavigationGroup[] = [
    {
      key: 'operation',
      label: 'Operación',
      items: [],
    },
  ];

  const view = render(
    <Topbar
      activePath="/dashboard"
      description="Resumen operativo de la consola."
      eyebrow="Gestión"
      navigationGroups={navigationGroups}
      scrollContainerRef={scrollContainerRef}
      title="Dashboard"
    />,
  );

  return {
    ...view,
    header: view.getByRole('banner'),
    scrollContainer,
  };
}

describe('Topbar', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('stays visible near the top and ignores tiny scroll changes', () => {
    const { header, scrollContainer } = renderTopbar();

    act(() => {
      scrollContainer.scrollTop = 8;
      fireEvent.scroll(scrollContainer);
    });

    expect(header.className).toContain('translate-y-0');
    expect(header.className).not.toContain('-translate-y-full');
  });

  it('hides on downward scroll and returns on upward scroll', () => {
    const { header, scrollContainer } = renderTopbar();

    act(() => {
      scrollContainer.scrollTop = 96;
      fireEvent.scroll(scrollContainer);
    });

    expect(header.className).toContain('-translate-y-full');

    act(() => {
      scrollContainer.scrollTop = 36;
      fireEvent.scroll(scrollContainer);
    });

    expect(header.className).toContain('translate-y-0');
  });
});
