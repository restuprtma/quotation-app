// @vitest-environment happy-dom
import type { ReactNode } from 'react';
import type { BlueprintDetail, BlueprintStatus, SaveBlueprintSectionDraftRequest } from '../types';

import { renderHook } from '@testing-library/react';
import { it, vi, expect, describe, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as api from '../api';
import { parseBundlePartial } from '../types';
import { useBlueprintDraftSave } from './use-blueprint-draft-save';

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
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useBlueprintDraftSave hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCompanyContext.company = { id: 'company-1', name: 'Company 1' };
  });

  const mockStatus: BlueprintStatus = {
    blueprint_id: 'bp-123',
    revision_id: 'rev-456',
    title: 'Test Blueprint',
    generation_status: 'in_progress',
    publication_status: 'draft',
    completeness_status: 'partial',
    content_version: 1,
    sections: [
      {
        type: 'journey',
        status: 'pending',
        attempts: 0,
        updated_at: '2026-09-18T10:00:00Z',
      },
    ],
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-18T10:00:00Z',
  };

  const initialDetail: BlueprintDetail = {
    status: mockStatus,
    quotation_id: 'q-123',
    content_json: {
      journey: {
        phases: [{ id: 'phase-1', label: 'Initial Phase', order: 1 }],
        actors: [{ id: 'actor-1', label: 'Initial Actor', order: 1 }],
        activities: [],
      },
    },
    validation_result: {},
    cross_validation_result: {},
  };

  const savedDetail: BlueprintDetail = {
    status: {
      ...mockStatus,
      content_version: 2,
      sections: [
        {
          type: 'journey',
          status: 'manual_edit',
          attempts: 0,
          updated_at: '2026-09-18T14:00:00Z',
        },
      ],
    },
    quotation_id: 'q-123',
    content_json: {
      journey: {
        phases: [
          { id: 'phase-1', label: 'Initial Phase', order: 1 },
          { id: 'phase-2', label: 'Second Phase', order: 2 },
        ],
        actors: [{ id: 'actor-1', label: 'Initial Actor', order: 1 }],
        activities: [],
      },
    },
    validation_result: {
      journey: {
        valid: false,
        issues: [
          {
            code: 'WARN_EMPTY_ACTIVITIES',
            severity: 'warning',
            section: 'journey',
            path: 'journey.activities',
            message: 'Belum ada aktivitas pada phase-2',
            blocking: false,
          },
        ],
      },
    },
    cross_validation_result: {},
  };

  const validPayload: SaveBlueprintSectionDraftRequest<{ journey: any }> = {
    revision_id: 'rev-456',
    content_version: 1,
    content: {
      journey: {
        phases: [
          { id: 'phase-1', label: 'Initial Phase', order: 1 },
          { id: 'phase-2', label: 'Second Phase', order: 2 },
        ],
        actors: [{ id: 'actor-1', label: 'Initial Actor', order: 1 }],
        activities: [],
      },
    },
  };

  it('successfully saves draft and updates detail query cache with canonical server response', async () => {
    const { queryClient, wrapper } = createWrapper();

    queryClient.setQueryData(['blueprints', 'company-1', 'detail', 'bp-123'], initialDetail);
    queryClient.setQueryData(['blueprints', 'company-1', 'status', 'bp-123'], initialDetail.status);

    const spy = vi.spyOn(api, 'saveBlueprintDraftSection').mockResolvedValueOnce(savedDetail);

    const { result } = renderHook(() => useBlueprintDraftSave('bp-123', 'journey'), { wrapper });

    const response = await result.current.mutateAsync(validPayload);

    expect(spy).toHaveBeenCalledWith('bp-123', 'journey', validPayload);
    expect(response).toEqual(savedDetail);

    // Verify cache updated with canonical response
    const cachedDetail = queryClient.getQueryData<BlueprintDetail>([
      'blueprints',
      'company-1',
      'detail',
      'bp-123',
    ]);
    expect(cachedDetail?.status.content_version).toBe(2);
    expect(cachedDetail?.status.sections[0].status).toBe('manual_edit');
    expect(cachedDetail?.content_json.journey?.phases).toHaveLength(2);
  });

  it('preserves local buffer and cache on 409 conflict error without auto-retry', async () => {
    const { queryClient, wrapper } = createWrapper();

    queryClient.setQueryData(['blueprints', 'company-1', 'detail', 'bp-123'], initialDetail);

    const conflictError: any = new Error('execution_conflict');
    conflictError.status = 409;
    conflictError.response = {
      status: 409,
      data: { errors: 'execution_conflict', message: 'Version conflict' },
    };

    const spy = vi.spyOn(api, 'saveBlueprintDraftSection').mockRejectedValueOnce(conflictError);

    const { result } = renderHook(() => useBlueprintDraftSave('bp-123', 'journey'), { wrapper });

    await expect(result.current.mutateAsync(validPayload)).rejects.toThrow('execution_conflict');

    // Only called once (no auto-retry)
    expect(spy).toHaveBeenCalledTimes(1);

    // Query cache must NOT be corrupted or overwritten
    const cachedDetail = queryClient.getQueryData<BlueprintDetail>([
      'blueprints',
      'company-1',
      'detail',
      'bp-123',
    ]);
    expect(cachedDetail?.status.content_version).toBe(1);
    expect(cachedDetail).toEqual(initialDetail);
  });

  it('preserves local buffer on 422 invalid_schema without corrupting cache and without auto-retry', async () => {
    const { queryClient, wrapper } = createWrapper();

    queryClient.setQueryData(['blueprints', 'company-1', 'detail', 'bp-123'], initialDetail);

    const schemaError: any = new Error('invalid_schema');
    schemaError.status = 422;
    schemaError.response = {
      status: 422,
      data: { errors: 'invalid_schema', message: 'Shape validation failed' },
    };

    const spy = vi.spyOn(api, 'saveBlueprintDraftSection').mockRejectedValueOnce(schemaError);

    const { result } = renderHook(() => useBlueprintDraftSave('bp-123', 'journey'), { wrapper });

    await expect(result.current.mutateAsync(validPayload)).rejects.toThrow('invalid_schema');

    expect(spy).toHaveBeenCalledTimes(1);
    const cachedDetail = queryClient.getQueryData<BlueprintDetail>([
      'blueprints',
      'company-1',
      'detail',
      'bp-123',
    ]);
    expect(cachedDetail).toEqual(initialDetail);
  });

  it('isolates cache by company context id', async () => {
    const { queryClient, wrapper } = createWrapper();

    mockCompanyContext.company = { id: 'tenant-alpha', name: 'Tenant Alpha' };
    vi.spyOn(api, 'saveBlueprintDraftSection').mockResolvedValueOnce(savedDetail);

    const { result } = renderHook(() => useBlueprintDraftSave('bp-123', 'journey'), { wrapper });
    await result.current.mutateAsync(validPayload);

    // Check that cache was set under 'tenant-alpha'
    const alphaCache = queryClient.getQueryData<BlueprintDetail>([
      'blueprints',
      'tenant-alpha',
      'detail',
      'bp-123',
    ]);
    expect(alphaCache).toBeDefined();

    // Check that another tenant has no cache entry
    const betaCache = queryClient.getQueryData<BlueprintDetail>([
      'blueprints',
      'tenant-beta',
      'detail',
      'bp-123',
    ]);
    expect(betaCache).toBeUndefined();
  });

  it('parseBundlePartial safely extracts and type-guards content_json without runtime errors', () => {
    expect(parseBundlePartial(null)).toEqual({});
    expect(parseBundlePartial(undefined)).toEqual({});
    expect(parseBundlePartial('invalid string')).toEqual({});

    const partialRaw = {
      schema_version: '1.0',
      title: 'Demo Blueprint',
      journey: {
        phases: [{ id: 'phase-1', label: 'Phase 1', order: 1 }],
        actors: [],
        activities: [],
      },
      unexpected_key: 'should_be_ignored_by_guard',
    };

    const parsed = parseBundlePartial(partialRaw);
    expect(parsed.schema_version).toBe('1.0');
    expect(parsed.title).toBe('Demo Blueprint');
    expect(parsed.journey?.phases).toHaveLength(1);
    expect((parsed as any).unexpected_key).toBeUndefined();
  });
});
