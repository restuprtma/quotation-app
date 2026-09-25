import type {
  ManualRequest,
  BlueprintStatus,
  BlueprintDetail,
  CreateBlueprintInput,
  BlueprintListResponse,
  SaveBlueprintSectionDraftRequest,
} from '../types';

import { it, vi, expect, describe, beforeEach } from 'vitest';

import axios, { endpoints } from 'src/shared/lib/axios';

import {
  getBlueprint,
  listBlueprints,
  createBlueprint,
  continueBlueprint,
  getBlueprintStatus,
  retryBlueprintSection,
  completeBlueprintSection,
  saveBlueprintDraftSection,
} from './index';

describe('Blueprint API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockStatus: BlueprintStatus = {
    blueprint_id: 'bp-123',
    revision_id: 'rev-456',
    title: 'Test Blueprint',
    generation_status: 'pending',
    publication_status: 'draft',
    completeness_status: 'incomplete',
    content_version: 1,
    sections: [
      {
        type: 'context',
        status: 'completed',
        attempts: 0,
        updated_at: '2026-09-17T10:00:00Z',
      },
    ],
    created_at: '2026-09-17T10:00:00Z',
    updated_at: '2026-09-17T10:00:00Z',
  };

  const mockDetail: BlueprintDetail = {
    status: mockStatus,
    quotation_id: 'q-123',
    source_quotation_revision_id: 'q-rev-1',
    content_json: {},
    validation_result: {},
    cross_validation_result: {},
  };

  const mockList: BlueprintListResponse = {
    items: [
      {
        blueprint_id: 'bp-123',
        quotation_id: 'q-123',
        title: 'Test Blueprint',
        generation_status: 'pending',
        updated_at: '2026-09-17T10:00:00Z',
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
    total_pages: 1,
  };

  describe('Endpoints config', () => {
    it('has correct endpoints configured under endpoints.quotation.blueprints', () => {
      const bpEndpoints = (endpoints as any).quotation?.blueprints;
      expect(bpEndpoints).toBeDefined();
      expect(bpEndpoints.root).toBe('/quotation/v1/blueprints');
      expect(bpEndpoints.generate).toBe('/quotation/v1/blueprints/generate');
      expect(bpEndpoints.byId('bp-123')).toBe('/quotation/v1/blueprints/bp-123');
      expect(bpEndpoints.generationStatus('bp-123')).toBe(
        '/quotation/v1/blueprints/bp-123/generation-status'
      );
      expect(bpEndpoints.continue('bp-123')).toBe('/quotation/v1/blueprints/bp-123/continue');
      expect(bpEndpoints.retrySection('bp-123', 'journey')).toBe(
        '/quotation/v1/blueprints/bp-123/sections/journey/retry'
      );
      expect(bpEndpoints.manualComplete('bp-123', 'journey')).toBe(
        '/quotation/v1/blueprints/bp-123/sections/journey/manual'
      );
      expect(bpEndpoints.draftSection('bp-123', 'journey')).toBe(
        '/quotation/v1/blueprints/bp-123/sections/journey/draft'
      );
    });
  });

  describe('createBlueprint', () => {
    it('calls POST /quotation/v1/blueprints/generate with timeout 200000 and unwraps data.data', async () => {
      const input: CreateBlueprintInput = {
        idempotency_key: 'idem-1',
        quotation_id: 'q-1',
        source_quotation_revision_id: 'q-rev-1',
        title: 'BP Title',
        business_goals: ['Goal 1'],
        actors: ['Actor 1'],
        business_phases: ['Phase 1'],
      };

      const spy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { data: mockStatus, message: 'Created' },
      } as any);

      const result = await createBlueprint(input);

      expect(spy).toHaveBeenCalledWith(
        '/quotation/v1/blueprints/generate',
        input,
        expect.objectContaining({ timeout: 200000 })
      );
      expect(result).toEqual(mockStatus);
    });
  });

  describe('getBlueprint', () => {
    it('calls GET /quotation/v1/blueprints/:id and unwraps data.data with signal', async () => {
      const controller = new AbortController();
      const spy = vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: { data: mockDetail, message: 'Success' },
      } as any);

      const result = await getBlueprint('bp-123', controller.signal);

      expect(spy).toHaveBeenCalledWith('/quotation/v1/blueprints/bp-123', {
        signal: controller.signal,
      });
      expect(result).toEqual(mockDetail);
    });
  });

  describe('getBlueprintStatus', () => {
    it('calls GET /quotation/v1/blueprints/:id/generation-status and unwraps data.data', async () => {
      const spy = vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: { data: mockStatus, message: 'Success' },
      } as any);

      const result = await getBlueprintStatus('bp-123');

      expect(spy).toHaveBeenCalledWith('/quotation/v1/blueprints/bp-123/generation-status', {
        signal: undefined,
      });
      expect(result).toEqual(mockStatus);
    });
  });

  describe('continueBlueprint', () => {
    it('calls POST /quotation/v1/blueprints/:id/continue with empty body and timeout 200000', async () => {
      const spy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { data: mockStatus, message: 'Success' },
      } as any);

      const result = await continueBlueprint('bp-123');

      expect(spy).toHaveBeenCalledWith(
        '/quotation/v1/blueprints/bp-123/continue',
        undefined,
        expect.objectContaining({ timeout: 200000 })
      );
      expect(result).toEqual(mockStatus);
    });
  });

  describe('retryBlueprintSection', () => {
    it('calls POST /quotation/v1/blueprints/:id/sections/:section/retry with empty body and timeout 200000', async () => {
      const spy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { data: mockStatus, message: 'Success' },
      } as any);

      const result = await retryBlueprintSection('bp-123', 'journey');

      expect(spy).toHaveBeenCalledWith(
        '/quotation/v1/blueprints/bp-123/sections/journey/retry',
        undefined,
        expect.objectContaining({ timeout: 200000 })
      );
      expect(result).toEqual(mockStatus);
    });
  });

  describe('completeBlueprintSection', () => {
    it('calls PUT /quotation/v1/blueprints/:id/sections/:section/manual with payload and timeout 200000', async () => {
      const payload: ManualRequest<{ journey: any }> = {
        revision_id: 'rev-456',
        content_version: 2,
        content: {
          journey: { phases: [], actors: [], activities: [] },
        },
      };

      const spy = vi.spyOn(axios, 'put').mockResolvedValueOnce({
        data: { data: mockStatus, message: 'Success' },
      } as any);

      const result = await completeBlueprintSection('bp-123', 'journey', payload);

      expect(spy).toHaveBeenCalledWith(
        '/quotation/v1/blueprints/bp-123/sections/journey/manual',
        payload,
        expect.objectContaining({ timeout: 200000 })
      );
      expect(result).toEqual(mockStatus);
    });
  });

  describe('saveBlueprintDraftSection', () => {
    it('calls PUT /quotation/v1/blueprints/:id/sections/:section/draft with payload and timeout 200000 and unwraps data.data', async () => {
      const payload: SaveBlueprintSectionDraftRequest<{ journey: any }> = {
        revision_id: 'rev-456',
        content_version: 3,
        content: {
          journey: {
            phases: [{ id: 'phase-1', label: 'Discovery', order: 1 }],
            actors: [{ id: 'actor-1', label: 'Customer', order: 1 }],
            activities: [],
          },
        },
      };

      const spy = vi.spyOn(axios, 'put').mockResolvedValueOnce({
        data: {
          data: {
            ...mockDetail,
            status: {
              ...mockStatus,
              content_version: 4,
              sections: [
                {
                  type: 'journey',
                  status: 'manual_edit',
                  attempts: 1,
                  updated_at: '2026-09-18T14:00:00Z',
                },
              ],
            },
          },
          message: 'Draft saved',
        },
      } as any);

      const result = await saveBlueprintDraftSection('bp-123', 'journey', payload);

      expect(spy).toHaveBeenCalledWith(
        '/quotation/v1/blueprints/bp-123/sections/journey/draft',
        payload,
        expect.objectContaining({ timeout: 200000 })
      );
      expect(result.status.content_version).toBe(4);
      expect(result.status.sections[0].status).toBe('manual_edit');
    });

    it('propagates 409 conflict error with status and response intact', async () => {
      const conflictError: any = new Error('execution_conflict');
      conflictError.status = 409;
      conflictError.response = {
        status: 409,
        data: { errors: 'execution_conflict', message: 'Stale version' },
      };

      vi.spyOn(axios, 'put').mockRejectedValueOnce(conflictError);

      try {
        await saveBlueprintDraftSection('bp-123', 'journey', {
          revision_id: 'rev-456',
          content_version: 1,
          content: { journey: { phases: [], actors: [], activities: [] } },
        });
        expect.unreachable('Should have thrown 409 conflict');
      } catch (err: any) {
        expect(err.message).toBe('execution_conflict');
        expect(err.status).toBe(409);
        expect(err.response?.status).toBe(409);
      }
    });

    it('propagates 422 invalid_schema error with status and response intact', async () => {
      const validationError: any = new Error('invalid_schema');
      validationError.status = 422;
      validationError.response = {
        status: 422,
        data: { errors: 'invalid_schema', message: 'Schema validation failed' },
      };

      vi.spyOn(axios, 'put').mockRejectedValueOnce(validationError);

      try {
        await saveBlueprintDraftSection('bp-123', 'journey', {
          revision_id: 'rev-456',
          content_version: 1,
          content: { journey: null as any },
        });
        expect.unreachable('Should have thrown 422 validation');
      } catch (err: any) {
        expect(err.message).toBe('invalid_schema');
        expect(err.status).toBe(422);
      }
    });
  });

  describe('listBlueprints', () => {
    it('calls GET /quotation/v1/blueprints with all query params (quotationId, statuses, page, limit)', async () => {
      const controller = new AbortController();
      const spy = vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: { data: mockList, message: 'Success' },
      } as any);

      const result = await listBlueprints(
        {
          quotationId: 'q-123',
          statuses: ['pending', 'in_progress'],
          page: 2,
          limit: 10,
        },
        controller.signal
      );

      expect(spy).toHaveBeenCalledWith('/quotation/v1/blueprints', {
        params: {
          quotation_id: 'q-123',
          generation_status: 'pending,in_progress',
          page: 2,
          limit: 10,
        },
        signal: controller.signal,
      });
      expect(result).toEqual(mockList);
    });

    it('supports string quotationId for backward compatibility', async () => {
      const spy = vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: { data: mockList, message: 'Success' },
      } as any);

      const result = await listBlueprints('q-123');

      expect(spy).toHaveBeenCalledWith('/quotation/v1/blueprints', {
        params: { quotation_id: 'q-123' },
        signal: undefined,
      });
      expect(result).toEqual(mockList);
    });

    it('calls GET /quotation/v1/blueprints with empty params when no args provided', async () => {
      const spy = vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: { data: mockList, message: 'Success' },
      } as any);

      const result = await listBlueprints();

      expect(spy).toHaveBeenCalledWith('/quotation/v1/blueprints', {
        params: {},
        signal: undefined,
      });
      expect(result).toEqual(mockList);
    });
  });

  describe('Error handling & unwrap', () => {
    it('extracts safe error code from response.data.errors when data.data is null/undefined', async () => {
      vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: { data: null, errors: 'blueprint_not_found', message: 'Not found' },
      } as any);

      await expect(getBlueprint('bp-invalid')).rejects.toThrow('blueprint_not_found');
    });

    it('propagates wrapped axios error without mutating error status or response', async () => {
      const fakeAxiosError: any = new Error('blueprint_already_exists');
      fakeAxiosError.status = 409;
      fakeAxiosError.response = {
        status: 409,
        data: { errors: 'blueprint_already_exists', message: 'Conflict' },
      };

      vi.spyOn(axios, 'post').mockRejectedValueOnce(fakeAxiosError);

      try {
        await createBlueprint({
          idempotency_key: 'idem-1',
          quotation_id: 'q-1',
          source_quotation_revision_id: 'q-rev-1',
          title: 'BP Title',
          business_goals: ['Goal 1'],
          actors: ['Actor 1'],
          business_phases: ['Phase 1'],
        });
        expect.unreachable('Should have thrown');
      } catch (err: any) {
        expect(err.message).toBe('blueprint_already_exists');
        expect(err.status).toBe(409);
        expect(err.response?.data?.errors).toBe('blueprint_already_exists');
      }
    });
  });
});
