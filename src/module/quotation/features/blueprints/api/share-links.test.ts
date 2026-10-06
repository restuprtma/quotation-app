import { it, vi, expect, describe, beforeEach } from 'vitest';

import axios, { endpoints } from 'src/shared/lib/axios';

import { listShareLinks, createShareLink, revokeShareLink } from './share-links';

describe('Blueprint Share Links API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('endpoints configuration', () => {
    it('endpoints.quotation.blueprints.shareLinks builds the correct URL', () => {
      const id = 'bp-12345';
      expect(endpoints.quotation.blueprints.shareLinks(id)).toBe(
        '/quotation/v1/blueprints/bp-12345/share-links'
      );
    });

    it('endpoints.quotation.blueprints.revokeShareLink builds the correct URL', () => {
      const bpId = 'bp-12345';
      const linkId = 'link-999';
      expect(endpoints.quotation.blueprints.revokeShareLink(bpId, linkId)).toBe(
        '/quotation/v1/blueprints/bp-12345/share-links/link-999'
      );
    });
  });

  describe('createShareLink', () => {
    const blueprintId = 'bp-123';
    const payload = {
      blueprint_revision_id: 'rev-1',
      label: 'Programmer Access',
    };

    it('successfully posts to share links endpoint and unwraps response data', async () => {
      const mockResponseData = {
        id: 'link-1',
        label: 'Programmer Access',
        revision_number: 1,
        url: 'https://app.tuai.id/p/blueprint/secret-raw-token',
        created_at: '2026-10-06T10:00:00Z',
      };

      const mockPost = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: mockResponseData,
          message: 'Share link created successfully',
        },
      });

      const result = await createShareLink(blueprintId, payload);

      expect(mockPost).toHaveBeenCalledWith('/quotation/v1/blueprints/bp-123/share-links', payload);
      expect(result).toEqual(mockResponseData);
    });

    it('throws error when response data is undefined or errors present', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: null,
          message: 'Creation failed',
          errors: 'Failed to create share link',
        },
      });

      await expect(createShareLink(blueprintId, payload)).rejects.toThrow(
        'Failed to create share link'
      );
    });
  });

  describe('listShareLinks', () => {
    const blueprintId = 'bp-123';

    it('successfully gets share links and unwraps response data', async () => {
      const mockList = [
        {
          id: 'link-1',
          label: 'Team Link',
          revision_number: 1,
          blueprint_revision_id: 'rev-1',
          created_at: '2026-10-06T10:00:00Z',
          revoked_at: null,
          last_accessed_at: null,
          is_revoked: false,
        },
      ];

      const mockGet = vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          data: mockList,
          message: 'Success',
        },
      });

      const result = await listShareLinks(blueprintId);

      expect(mockGet).toHaveBeenCalledWith('/quotation/v1/blueprints/bp-123/share-links');
      expect(result).toEqual(mockList);
    });
  });

  describe('revokeShareLink', () => {
    const blueprintId = 'bp-123';
    const linkId = 'link-1';

    it('successfully calls delete on the revoke endpoint', async () => {
      const mockDelete = vi.spyOn(axios, 'delete').mockResolvedValueOnce({
        data: { message: 'Share link revoked successfully' },
      });

      await revokeShareLink(blueprintId, linkId);

      expect(mockDelete).toHaveBeenCalledWith('/quotation/v1/blueprints/bp-123/share-links/link-1');
    });
  });
});
