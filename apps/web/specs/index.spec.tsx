import { redirect } from 'next/navigation';

import Page from '../src/app/page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Page', () => {
  it('should redirect to the dashboard', () => {
    Page();

    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });
});
