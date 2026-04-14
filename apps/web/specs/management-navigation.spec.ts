import {
  getNavigationForAccess,
  isPathAllowedForAccess,
} from '../src/lib/management-navigation';

describe('management navigation', () => {
  it('shows platform sections for admin roles using the backend role source of truth', () => {
    const items = getNavigationForAccess({
      mode: 'real',
      role: 'ADMIN',
      hasManagedBusinesses: false,
      ownsManagedBusinesses: false,
    });

    expect(items.some((item) => item.href === '/admin/approvals')).toBe(true);
    expect(items.some((item) => item.href === '/admin/users')).toBe(false);
    expect(
      isPathAllowedForAccess('/analytics', {
        mode: 'real',
        role: 'ADMIN',
        hasManagedBusinesses: false,
        ownsManagedBusinesses: false,
      }),
    ).toBe(true);
  });

  it('exposes superadmin-only sections only to real superadmin roles', () => {
    expect(
      isPathAllowedForAccess('/admin/users', {
        mode: 'real',
        role: 'SUPERADMIN',
        hasManagedBusinesses: false,
        ownsManagedBusinesses: false,
      }),
    ).toBe(true);
    expect(
      isPathAllowedForAccess('/admin/users', {
        mode: 'real',
        role: 'USER',
        hasManagedBusinesses: true,
        ownsManagedBusinesses: true,
      }),
    ).toBe(false);
  });

  it('exposes business sections to real users only when they manage businesses', () => {
    expect(isPathAllowedForAccess('/business', { mode: 'mock', role: 'OWNER' })).toBe(true);
    expect(
      isPathAllowedForAccess('/business', {
        mode: 'real',
        role: 'USER',
        hasManagedBusinesses: true,
        ownsManagedBusinesses: false,
      }),
    ).toBe(true);
    expect(
      isPathAllowedForAccess('/team', {
        mode: 'real',
        role: 'USER',
        hasManagedBusinesses: true,
        ownsManagedBusinesses: false,
      }),
    ).toBe(false);
  });
});