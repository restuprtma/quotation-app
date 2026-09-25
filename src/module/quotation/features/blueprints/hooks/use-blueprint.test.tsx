// @vitest-environment happy-dom
import type { ReactNode } from 'react';
import type { BlueprintDetail, BlueprintStatus, BlueprintListResponse } from '../types';

import { waitFor, renderHook } from '@testing-library/react';
import { it, vi, expect, describe, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as api from '../api';
import {
  useBlueprintList,
  useCreateBlueprint,
  useBlueprintDetail,
  useBlueprintStatus,
  useContinueBlueprint,
  useRetryBlueprintSection,
  useCompleteBlueprintSection,
} from './use-blueprint';

const mockCompanyContext = {
  company: { id: 'company-1', name: 'Company 1' },
};

vi.mock('src/module/core/features/auth/hooks', () => ({
  useAuthContext: () => mockCompanyContext,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('use-blueprint hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCompanyContext.company = { id: 'company-1', name: 'Company 1' };
  });

  const mockStatus: BlueprintStatus = {
    blueprint_id: 'bp-123',
    revision_id: 'rev-456',
    title: 'Test Blueprint',
    generation_status: 'pending',
    publication_status: 'draft',
    completeness_status: 'incomplete',
    content_version: 1,
    sections: [],
    created_at: '2026-09-17T10:00:00Z',
    updated_at: '2026-09-17T10:00:00Z',
  };

  const mockDetail: BlueprintDetail = {
    status: mockStatus,
    quotation_id: 'q-123',
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

  describe('useBlueprintDetail', () => {
    it('fetches blueprint detail when id is provided', async () => {
      vi.spyOn(api, 'getBlueprint').mockResolvedValueOnce(mockDetail);

      const { result } = renderHook(() => useBlueprintDetail('bp-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockDetail);
    });

    it('does not fetch when id is null or enabled is false', () => {
      const spy = vi.spyOn(api, 'getBlueprint');

      const { result } = renderHook(() => useBlueprintDetail(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('useBlueprintStatus', () => {
    it('fetches blueprint status when id is provided', async () => {
      vi.spyOn(api, 'getBlueprintStatus').mockResolvedValueOnce(mockStatus);

      const { result } = renderHook(() => useBlueprintStatus('bp-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockStatus);
    });
  });

  describe('useBlueprintList', () => {
    it('fetches blueprint list with string quotation filter', async () => {
      vi.spyOn(api, 'listBlueprints').mockResolvedValueOnce(mockList);

      const { result } = renderHook(() => useBlueprintList('q-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockList);
      expect(api.listBlueprints).toHaveBeenCalledWith(
        {
          quotationId: 'q-123',
          statuses: undefined,
          page: 1,
          limit: 20,
        },
        expect.any(AbortSignal)
      );
    });

    it('fetches blueprint list with object params including statuses, page, and limit', async () => {
      vi.spyOn(api, 'listBlueprints').mockResolvedValueOnce(mockList);

      const { result } = renderHook(
        () =>
          useBlueprintList({
            quotationId: 'q-456',
            statuses: ['in_progress', 'pending'],
            page: 2,
            limit: 10,
          }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockList);
      expect(api.listBlueprints).toHaveBeenCalledWith(
        {
          quotationId: 'q-456',
          statuses: ['in_progress', 'pending'],
          page: 2,
          limit: 10,
        },
        expect.any(AbortSignal)
      );
    });
  });

  describe('Tenant isolation & Company switch', () => {
    it('isolates cache by company id so company switch does not return old tenant cache', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      mockCompanyContext.company = { id: 'company-A', name: 'Company A' };
      vi.spyOn(api, 'getBlueprint').mockResolvedValueOnce({
        ...mockDetail,
        quotation_id: 'tenant-A-quotation',
      });

      const { result: hookA } = renderHook(() => useBlueprintDetail('bp-123'), { wrapper });
      await waitFor(() => expect(hookA.current.isSuccess).toBe(true));
      expect(hookA.current.data?.quotation_id).toBe('tenant-A-quotation');

      // Switch company to company-B
      mockCompanyContext.company = { id: 'company-B', name: 'Company B' };
      vi.spyOn(api, 'getBlueprint').mockResolvedValueOnce({
        ...mockDetail,
        quotation_id: 'tenant-B-quotation',
      });

      const { result: hookB } = renderHook(() => useBlueprintDetail('bp-123'), { wrapper });
      await waitFor(() => expect(hookB.current.data?.quotation_id).toBe('tenant-B-quotation'));
    });
  });

  describe('Mutations with retry: false', () => {
    it('useCreateBlueprint executes createBlueprint with retry: false', async () => {
      vi.spyOn(api, 'createBlueprint').mockResolvedValueOnce(mockStatus);

      const { result } = renderHook(() => useCreateBlueprint(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        idempotency_key: 'idem-1',
        quotation_id: 'q-1',
        source_quotation_revision_id: 'rev-1',
        title: 'Title',
        business_goals: ['Goal 1'],
        actors: ['Actor 1'],
        business_phases: ['Phase 1'],
      });

      expect(api.createBlueprint).toHaveBeenCalled();
    });

    it('useContinueBlueprint executes continueBlueprint with retry: false', async () => {
      vi.spyOn(api, 'continueBlueprint').mockResolvedValueOnce(mockStatus);

      const { result } = renderHook(() => useContinueBlueprint(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('bp-123');
      expect(api.continueBlueprint).toHaveBeenCalledWith('bp-123');
    });

    it('useRetryBlueprintSection executes retryBlueprintSection with retry: false', async () => {
      vi.spyOn(api, 'retryBlueprintSection').mockResolvedValueOnce(mockStatus);

      const { result } = renderHook(() => useRetryBlueprintSection(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ id: 'bp-123', section: 'journey' });
      expect(api.retryBlueprintSection).toHaveBeenCalledWith('bp-123', 'journey');
    });

    it('useCompleteBlueprintSection executes completeBlueprintSection with retry: false', async () => {
      vi.spyOn(api, 'completeBlueprintSection').mockResolvedValueOnce(mockStatus);

      const { result } = renderHook(() => useCompleteBlueprintSection(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'bp-123',
        section: 'journey',
        input: { revision_id: 'rev-1', content_version: 1, content: {} },
      });
      expect(api.completeBlueprintSection).toHaveBeenCalledWith('bp-123', 'journey', {
        revision_id: 'rev-1',
        content_version: 1,
        content: {},
      });
    });
  });
});
