import {
  getNavigationForAccess,
  isPathAllowedForAccess,
} from '../src/lib/management-navigation';

describe('management navigation', () => {
  it('shows platform sections for admin roles using the backend role source of truth', () => {
    const items = getNavigationForAccess({ mode: 'real', role: 'ADMIN' });

    expect(items.some((item) => item.href === '/admin/approvals')).toBe(true);
    expect(items.some((item) => item.href === '/admin/users')).toBe(false);
    expect(isPathAllowedForAccess('/analytics', { mode: 'real', role: 'ADMIN' })).toBe(true);
  });

  it('exposes superadmin-only sections only to real superadmin roles', () => {
    expect(isPathAllowedForAccess('/admin/users', { mode: 'real', role: 'SUPERADMIN' })).toBe(true);
    expect(isPathAllowedForAccess('/admin/users', { mode: 'real', role: 'USER' })).toBe(false);
  });

  it('keeps demo navigation isolated to mock role simulation', () => {
    expect(isPathAllowedForAccess('/business', { mode: 'mock', role: 'OWNER' })).toBe(true);
    expect(isPathAllowedForAccess('/business', { mode: 'real', role: 'ADMIN' })).toBe(false);
  });
});