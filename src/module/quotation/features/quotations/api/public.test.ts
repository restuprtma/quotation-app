import { it, vi, expect, describe, beforeEach } from 'vitest';

import axios, { endpoints } from 'src/shared/lib/axios';

import { publicQuotationApi } from './public';

describe('Public Quotation API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('endpoints.quotation.public.get builds the correct path', () => {
    expect(endpoints.quotation.public.get('test-token')).toBe('/p/q/test-token');
  });

  it('endpoints.quotation.public.sign builds the correct path', () => {
    expect(endpoints.quotation.public.sign('test-token')).toBe('/p/q/test-token/sign');
  });

  it('getPublic calls axios with withoutAuthRefresh', async () => {
    const mockData = {
      quotation_number: 'Q-001',
      subject: 'Portal',
      client: { company_name: 'PT Aman' },
      revision_number: 1,
      content_html: '<p>Content</p>',
      published_at: '2026-08-14T00:00:00Z',
      signed: false,
      signer_name: null,
      signed_at: null,
    };

    const mockGet = vi.spyOn(axios, 'get').mockResolvedValueOnce({
      data: { data: mockData },
    });

    const result = await publicQuotationApi.getPublic('test-token');

    expect(mockGet).toHaveBeenCalledWith(
      '/p/q/test-token',
      expect.objectContaining({ _skipAuthRefresh: true })
    );
    expect(result).toEqual(mockData);
  });

  it('signPublic calls axios with withoutAuthRefresh and payload', async () => {
    const payload = {
      signer_name: 'Budi',
      signer_email: 'budi@example.com',
      signature_data: 'data:image/png;base64,iVBORw0KGgo=',
      consent: true,
    };

    const mockPost = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { data: { signed: true } },
    });

    const result = await publicQuotationApi.signPublic('test-token', payload);

    expect(mockPost).toHaveBeenCalledWith(
      '/p/q/test-token/sign',
      payload,
      expect.objectContaining({ _skipAuthRefresh: true })
    );
    expect(result).toEqual({ signed: true });
  });
});
