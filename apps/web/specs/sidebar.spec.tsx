import { render } from '@testing-library/react';
import { BarChart3, LayoutDashboard } from 'lucide-react';

import { Sidebar } from '../src/components/layout/sidebar';

describe('Sidebar', () => {
  it('renders a dedicated internal scroll region for navigation overflow', () => {
    const view = render(
      <Sidebar
        activePath="/dashboard"
        items={[
          {
            key: 'dashboard',
            label: 'Dashboard',
            description: 'Vista principal',
            href: '/dashboard',
            icon: LayoutDashboard,
            roles: ['SUPERADMIN'],
          },
          {
            key: 'reports',
            label: 'Reportes',
            description: 'Seguimiento operativo',
            href: '/reports',
            icon: BarChart3,
            roles: ['SUPERADMIN'],
          },
        ]}
      />,
    );

    expect(view.container.querySelector('.overflow-y-auto')).toBeTruthy();
    expect(view.container.querySelector('.overscroll-y-contain')).toBeTruthy();
  });
});
