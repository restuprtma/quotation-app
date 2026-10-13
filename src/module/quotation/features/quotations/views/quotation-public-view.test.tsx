import { it, vi, expect, describe, afterEach } from 'vitest';
// @vitest-environment happy-dom
import { render, screen, cleanup } from '@testing-library/react';

import * as useHooks from '../hooks/use-quotation-public';
import { QuotationPublicView } from './quotation-public-view';

afterEach(cleanup);

vi.mock('../hooks/use-quotation-public');
vi.mock('src/shared/ui/iconify', () => ({
  Iconify: ({ icon, ...props }: any) => <span data-testid={`icon-${icon}`} {...props} />,
}));
vi.mock('src/locales', () => ({
  useTranslate: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'public.loading': 'Loading quotation...',
        'public.notFound': 'The quotation link was not found or is no longer valid.',
        'public.genericError': 'An error occurred while processing the request.',
        'public.signedConfirmation': 'This quotation has been signed.',
      };
      return translations[key] || key;
    },
  }),
}));

describe('QuotationPublicView', () => {
  it('renders loading state when isLoading is true', () => {
    vi.spyOn(useHooks, 'usePublicQuotation').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    vi.spyOn(useHooks, 'useSignPublicQuotation').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    render(<QuotationPublicView token="test-token" />);
    expect(screen.getByTestId('quotation-public-loading')).toBeDefined();
  });

  it('renders not found state on 404 or missing quotation', () => {
    vi.spyOn(useHooks, 'usePublicQuotation').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('404'),
    } as any);

    render(<QuotationPublicView token="test-token" />);
    expect(
      screen.getByText('The quotation link was not found or is no longer valid.')
    ).toBeDefined();
  });

  it('renders signed confirmation state when quotation.signed is true', () => {
    vi.spyOn(useHooks, 'usePublicQuotation').mockReturnValue({
      data: {
        quotation_number: 'VEN/2026/001',
        subject: 'Signed Deal',
        client: { company_name: 'Client A' },
        revision_number: 1,
        content_html: '<p>Document Body</p>',
        published_at: '2026-08-14T00:00:00Z',
        signed: true,
        signer_name: 'Budi Hartono',
        signed_at: '2026-08-15T00:00:00Z',
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QuotationPublicView token="test-token" />);
    expect(screen.getAllByText('This quotation has been signed.').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Budi Hartono/)).toBeDefined();
    expect(screen.queryByTestId('signature-form')).toBeNull();
  });

  it('renders unsigned state with signature form when quotation.signed is false', () => {
    vi.spyOn(useHooks, 'usePublicQuotation').mockReturnValue({
      data: {
        quotation_number: 'VEN/2026/002',
        subject: 'Pending Deal',
        client: { company_name: 'Client B', client_pic: 'Bapak Reza' },
        revision_number: 1,
        content_html: '<p>Pending Document Body</p>',
        published_at: '2026-08-14T00:00:00Z',
        signed: false,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<QuotationPublicView token="test-token" />);
    expect(screen.getByText('VEN/2026/002')).toBeDefined();
    expect(screen.getByTestId('signature-form')).toBeDefined();
    expect(screen.getByText(/Bapak Reza/)).toBeDefined();
  });
});
