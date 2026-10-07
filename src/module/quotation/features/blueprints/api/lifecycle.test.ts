import { it, vi, expect, describe, beforeEach } from 'vitest';

import axios, { endpoints } from 'src/shared/lib/axios';

import {
  publishBlueprint,
  deleteBlueprintDraft,
  createBlueprintRevision,
  type PublishBlueprintRequest,
  type BlueprintRevisionResponse,
  type CreateBlueprintRevisionRequest,
} from './lifecycle';

describe('Blueprint Lifecycle API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('endpoints configuration', () => {
    it('endpoints.quotation.blueprints.publish builds the correct publish URL', () => {
      const id = 'bp-12345';
      expect(endpoints.quotation.blueprints.publish(id)).toBe(
        '/quotation/v1/blueprints/bp-12345/publish'
      );
    });

    it('endpoints.quotation.blueprints.revisions builds the correct revisions URL', () => {
      const id = 'bp-12345';
      expect(endpoints.quotation.blueprints.revisions(id)).toBe(
        '/quotation/v1/blueprints/bp-12345/revisions'
      );
    });

    it('endpoints.quotation.blueprints.deleteDraft builds the correct delete draft URL', () => {
      const id = 'bp-12345';
      expect(endpoints.quotation.blueprints.deleteDraft(id)).toBe(
        '/quotation/v1/blueprints/bp-12345/draft'
      );
    });
  });

  describe('publishBlueprint', () => {
    const blueprintId = 'blueprint-uuid-1';
    const payload: PublishBlueprintRequest = {
      revision_id: 'rev-uuid-1',
      confirm_partial: true,
      warning_codes: ['WARN_EMPTY_SECTION'],
    };

    it('successfully calls publish endpoint and unwraps response data', async () => {
      const mockPost = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: { status: 'published' },
          message: 'Blueprint published successfully',
        },
      });

      const result = await publishBlueprint(blueprintId, payload);

      expect(mockPost).toHaveBeenCalledWith(
        '/quotation/v1/blueprints/blueprint-uuid-1/publish',
        payload
      );
      expect(result).toEqual({ status: 'published' });
    });

    it('throws error when envelope response has null data', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: null,
          message: 'Cannot publish incomplete blueprint without confirmation',
        },
      });

      await expect(publishBlueprint(blueprintId, payload)).rejects.toThrow(
        'Cannot publish incomplete blueprint without confirmation'
      );
    });

    it('throws error when envelope response has errors object with detail', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: null,
          errors: { detail: ['Validation failed for workflow section'] },
        },
      });

      await expect(publishBlueprint(blueprintId, payload)).rejects.toThrow(
        'Validation failed for workflow section'
      );
    });

    it('propagates rejection when axios.post rejects', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Network error'));

      await expect(publishBlueprint(blueprintId, payload)).rejects.toThrow('Network error');
    });
  });

  describe('createBlueprintRevision', () => {
    const blueprintId = 'blueprint-uuid-2';
    const mockRevision: BlueprintRevisionResponse = {
      id: 'revision-uuid-2',
      blueprint_id: blueprintId,
      revision_number: 2,
      publication_status: 'draft',
      completeness_status: 'complete',
    };

    it('successfully calls revisions endpoint with clone mode and unwraps data', async () => {
      const req: CreateBlueprintRevisionRequest = {
        mode: 'clone',
      };
      const mockPost = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: mockRevision,
          message: 'Blueprint revision created successfully',
        },
      });

      const result = await createBlueprintRevision(blueprintId, req);

      expect(mockPost).toHaveBeenCalledWith(
        '/quotation/v1/blueprints/blueprint-uuid-2/revisions',
        req
      );
      expect(result).toEqual(mockRevision);
    });

    it('successfully calls revisions endpoint without payload when req is omitted', async () => {
      const mockPost = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: mockRevision,
          message: 'Blueprint revision created successfully',
        },
      });

      const result = await createBlueprintRevision(blueprintId);

      expect(mockPost).toHaveBeenCalledWith(
        '/quotation/v1/blueprints/blueprint-uuid-2/revisions',
        undefined
      );
      expect(result).toEqual(mockRevision);
    });

    it('throws error when envelope response has null data and string error', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: null,
          errors: 'Draft revision already exists for this blueprint',
        },
      });

      await expect(createBlueprintRevision(blueprintId)).rejects.toThrow(
        'Draft revision already exists for this blueprint'
      );
    });

    it('propagates rejection when axios.post rejects', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Server unavailable'));

      await expect(createBlueprintRevision(blueprintId)).rejects.toThrow('Server unavailable');
    });
  });

  describe('deleteBlueprintDraft', () => {
    const blueprintId = 'blueprint-uuid-3';

    it('successfully calls deleteDraft endpoint', async () => {
      const mockDelete = vi.spyOn(axios, 'delete').mockResolvedValueOnce({
        data: {
          data: { status: 'deleted' },
          message: 'Blueprint draft deleted successfully',
        },
      });

      await deleteBlueprintDraft(blueprintId);

      expect(mockDelete).toHaveBeenCalledWith('/quotation/v1/blueprints/blueprint-uuid-3/draft');
    });

    it('throws error when envelope response contains errors', async () => {
      vi.spyOn(axios, 'delete').mockResolvedValueOnce({
        data: {
          errors: 'Cannot delete published blueprint revision',
        },
      });

      await expect(deleteBlueprintDraft(blueprintId)).rejects.toThrow(
        'Cannot delete published blueprint revision'
      );
    });

    it('propagates rejection when axios.delete rejects', async () => {
      vi.spyOn(axios, 'delete').mockRejectedValueOnce(new Error('Forbidden'));

      await expect(deleteBlueprintDraft(blueprintId)).rejects.toThrow('Forbidden');
    });
  });
});
