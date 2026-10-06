import { it, vi, expect, describe, beforeEach } from 'vitest';

import axios, { endpoints } from 'src/shared/lib/axios';

import {
  createQuotationRevision,
  getQuotationHistory,
  publishQuotation,
  type PublishQuotationRequest,
  type QuotationRevisionHistoryItem,
  type QuotationRevisionResponse,
} from './lifecycle';

describe('Quotation Lifecycle API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('endpoints configuration', () => {
    it('endpoints.quotation.quotations.publish builds the correct publish URL', () => {
      const id = 'quo-12345';
      expect(endpoints.quotation.quotations.publish(id)).toBe(
        '/quotation/v1/quotations/quo-12345/publish'
      );
    });

    it('endpoints.quotation.quotations.revisions builds the correct revisions URL', () => {
      const id = 'quo-12345';
      expect(endpoints.quotation.quotations.revisions(id)).toBe(
        '/quotation/v1/quotations/quo-12345/revisions'
      );
    });
  });

  describe('publishQuotation', () => {
    const quotationId = 'quotation-uuid-1';
    const payload: PublishQuotationRequest = {
      revision_id: 'revision-uuid-1',
      content_version: 3,
      confirm_legal_modified: true,
      confirm_commercial_modified: false,
    };

    it('successfully calls publish endpoint and unwraps response data', async () => {
      const mockPost = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: { status: 'published' },
          message: 'Quotation published successfully',
        },
      });

      const result = await publishQuotation(quotationId, payload);

      expect(mockPost).toHaveBeenCalledWith(
        '/quotation/v1/quotations/quotation-uuid-1/publish',
        payload
      );
      expect(result).toEqual({ status: 'published' });
    });

    it('throws error when envelope response has null data', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: null,
          message: 'Confirmation required for modified content',
        },
      });

      await expect(publishQuotation(quotationId, payload)).rejects.toThrow(
        'Confirmation required for modified content'
      );
    });

    it('throws error when envelope response has errors object with detail', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: null,
          errors: { detail: ['Draft generation must be completed before publishing'] },
        },
      });

      await expect(publishQuotation(quotationId, payload)).rejects.toThrow(
        'Draft generation must be completed before publishing'
      );
    });

    it('propagates rejection when axios.post rejects', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Network error'));

      await expect(publishQuotation(quotationId, payload)).rejects.toThrow('Network error');
    });
  });

  describe('createQuotationRevision', () => {
    const quotationId = 'quotation-uuid-2';
    const mockRevision: QuotationRevisionResponse = {
      id: 'revision-uuid-2',
      quotation_id: quotationId,
      revision_number: 2,
      publication_status: 'draft',
      content_version: 1,
      legal_content_modified: false,
      commercial_content_modified: false,
    };

    it('successfully calls revisions endpoint and unwraps new revision data', async () => {
      const mockPost = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: mockRevision,
          message: 'Quotation revision created successfully',
        },
      });

      const result = await createQuotationRevision(quotationId);

      expect(mockPost).toHaveBeenCalledWith('/quotation/v1/quotations/quotation-uuid-2/revisions');
      expect(result).toEqual(mockRevision);
    });

    it('throws error when envelope response has null data and string error', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: null,
          errors: 'Active draft revision already exists',
        },
      });

      await expect(createQuotationRevision(quotationId)).rejects.toThrow(
        'Active draft revision already exists'
      );
    });

    it('propagates rejection when axios.post rejects', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Server unavailable'));

      await expect(createQuotationRevision(quotationId)).rejects.toThrow('Server unavailable');
    });
  });

  describe('getQuotationHistory', () => {
    const quotationId = 'quotation-uuid-3';
    const mockHistory: QuotationRevisionHistoryItem[] = [
      {
        id: 'rev-1',
        revision_number: 1,
        publication_status: 'published',
        is_signed: true,
        legal_content_modified: false,
        commercial_content_modified: true,
        created_at: '2026-10-01T10:00:00Z',
        published_at: '2026-10-01T11:00:00Z',
        rate_card_version: '1.0.0',
        legal_template_version: '1.0.0',
        prompt_version: '1.0.0',
      },
    ];

    it('successfully calls revisions endpoint with view=history param and unwraps data', async () => {
      const mockGet = vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          data: mockHistory,
          message: 'Quotation revision history retrieved successfully',
        },
      });

      const result = await getQuotationHistory(quotationId);

      expect(mockGet).toHaveBeenCalledWith('/quotation/v1/quotations/quotation-uuid-3/revisions', {
        params: { view: 'history' },
      });
      expect(result).toEqual(mockHistory);
    });

    it('throws error when envelope response has null data', async () => {
      vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          data: null,
          message: 'Failed to retrieve history',
        },
      });

      await expect(getQuotationHistory(quotationId)).rejects.toThrow('Failed to retrieve history');
    });

    it('propagates rejection when axios.get rejects', async () => {
      vi.spyOn(axios, 'get').mockRejectedValueOnce(new Error('Network error'));

      await expect(getQuotationHistory(quotationId)).rejects.toThrow('Network error');
    });
  });
});
