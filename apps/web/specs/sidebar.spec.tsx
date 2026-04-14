import { render } from '@testing-library/react';
import { BarChart3, LayoutDashboard } from 'lucide-react';

import { Sidebar } from '../src/components/layout/sidebar';
import type { NavigationGroup } from '../src/lib/management-navigation';

describe('Sidebar', () => {
  it('renders a dedicated internal scroll region for navigation overflow', () => {
    const groups: NavigationGroup[] = [
      {
        key: 'operation',
        label: 'Operación',
        items: [
          {
            key: 'dashboard',
            label: 'Dashboard',
            description: 'Vista principal',
            href: '/dashboard',
            icon: LayoutDashboard,
            demoRoles: ['SUPERADMIN'],
            group: 'operation',
          },
        ],
      },
      {
        key: 'system',
        label: 'Sistema',
        items: [
          {
            key: 'reports',
            label: 'Reportes',
            description: 'Seguimiento operativo',
            href: '/reports',
            icon: BarChart3,
            demoRoles: ['SUPERADMIN'],
            group: 'system',
          },
        ],
      },
    ];

    const view = render(<Sidebar activePath="/dashboard" groups={groups} />);

    expect(view.container.querySelector('.overflow-y-auto')).toBeTruthy();
    expect(view.container.querySelector('.overscroll-y-contain')).toBeTruthy();
  });
});
