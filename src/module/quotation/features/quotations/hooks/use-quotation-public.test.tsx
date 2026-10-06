import type { ReactNode } from 'react';

import { it, vi, expect, describe } from 'vitest';
// @vitest-environment happy-dom
import { waitFor, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { publicQuotationApi } from '../api/public';
import { usePublicQuotation } from './use-quotation-public';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('usePublicQuotation Hook', () => {
  it('fetches public quotation successfully', async () => {
    vi.spyOn(publicQuotationApi, 'getPublic').mockResolvedValueOnce({
      quotation_number: 'Q-001',
      subject: 'Portal',
      client: { company_name: 'PT Test' },
      revision_number: 1,
      content_html: '<p>Body</p>',
      published_at: '2026-08-14T00:00:00Z',
      signed: false,
      signer_name: null,
      signed_at: null,
    });

    const { result } = renderHook(() => usePublicQuotation('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.quotation_number).toBe('Q-001');
  });
});
