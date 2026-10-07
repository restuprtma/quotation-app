// @vitest-environment happy-dom
import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { it, vi, expect, describe, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as api from '../api/prompt-first';
import * as generationApi from '../api/generation';
import {
  usePromptClients,
  usePromptQuotation,
  useCreatePromptClient,
} from './use-prompt-quotation';

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

describe('usePromptQuotation hook suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('usePromptClients calls getClients and caches results', async () => {
    const { wrapper } = createWrapper();
    const mockClients = [
      { id: '40000000-0000-0000-0000-000000000001', name: 'PT Alpha Tech' },
      { id: '40000000-0000-0000-0000-000000000002', name: 'PT Beta Corp' },
    ];
    const getClientsSpy = vi.spyOn(generationApi, 'getClients').mockResolvedValueOnce(mockClients);

    const { result } = renderHook(() => usePromptClients(), { wrapper });

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getClientsSpy).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockClients);
  });

  it('useCreatePromptClient invokes createClientOrganization and updates cache', async () => {
    const { queryClient, wrapper } = createWrapper();
    const existingClients = [{ id: '40000000-0000-0000-0000-000000000001', name: 'PT Alpha Tech' }];
    queryClient.setQueryData(['quotation', 'clients'], existingClients);

    const newClient = {
      id: '40000000-0000-0000-0000-000000000003',
      name: 'PT Gamma Solusi',
    };
    const createSpy = vi
      .spyOn(generationApi, 'createClientOrganization')
      .mockResolvedValueOnce(newClient);

    const { result } = renderHook(() => useCreatePromptClient(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('PT Gamma Solusi');
    });

    expect(createSpy).toHaveBeenCalledWith('PT Gamma Solusi');
    const cached = queryClient.getQueryData<any[]>(['quotation', 'clients']);
    expect(cached).toHaveLength(2);
    expect(cached).toContainEqual(newClient);
  });

  it('usePromptQuotation submits canonical identity payload with generated idempotency_key', async () => {
    const { wrapper } = createWrapper();
    const mockDraftResponse: any = {
      quotation_id: '60000000-0000-0000-0000-000000000001',
      revision_id: '70000000-0000-0000-0000-000000000001',
      quotation_number: 'QUO-2026-0001',
      content_html: '<article>Draft</article>',
      content_version: 1,
      state_version: 1,
      prompt_state: {} as any,
      issues: [
        {
          code: 'scope.empty',
          field: 'scope',
          message: 'no scope item',
          severity: 'warning' as const,
        },
      ],
      readiness: 'incomplete',
      idempotent_replay: false,
    };

    const createSpy = vi.spyOn(api, 'createMeetingDraft').mockResolvedValueOnce({
      quotation_id: mockDraftResponse.quotation_id,
      revision_id: mockDraftResponse.revision_id,
      quotation_number: mockDraftResponse.quotation_number,
      generation_status: 'pending',
      idempotent_replay: false,
    });
    const processSpy = vi
      .spyOn(api, 'processMeetingDraft')
      .mockResolvedValueOnce(mockDraftResponse);

    const { result } = renderHook(() => usePromptQuotation(), { wrapper });

    const payload = {
      project_name: 'Canonical Project',
      client_id: '40000000-0000-0000-0000-000000000001',
      client_company_name: 'PT Canonical Org',
      pic_name: 'Rani Wijaya',
      meeting_notes: 'Meeting notes content',
    };

    let response: any;
    await act(async () => {
      response = await result.current.mutateAsync(payload);
    });

    expect(createSpy).toHaveBeenCalledTimes(1);
    const sentPayload = createSpy.mock.calls[0][0];
    expect(sentPayload.project_name).toBe('Canonical Project');
    expect(sentPayload.client_id).toBe('40000000-0000-0000-0000-000000000001');
    expect(sentPayload.client_company_name).toBe('PT Canonical Org');
    expect(sentPayload.pic_name).toBe('Rani Wijaya');
    expect(sentPayload.client_name).toBeUndefined();
    expect(sentPayload.meeting_notes).toBe('Meeting notes content');
    expect(sentPayload.idempotency_key).toBeDefined();
    expect(typeof sentPayload.idempotency_key).toBe('string');

    expect(processSpy).toHaveBeenCalledWith(
      mockDraftResponse.quotation_id,
      expect.any(AbortSignal)
    );

    expect(response).toEqual(mockDraftResponse);
    expect(result.current.issues).toEqual(mockDraftResponse.issues);
  });

  it('usePromptQuotation keeps the same idempotency key for identical fingerprint and generates a new key when changed', async () => {
    const { wrapper } = createWrapper();
    const mockDraftResponse: any = {
      quotation_id: '60000000-0000-0000-0000-000000000001',
      revision_id: '70000000-0000-0000-0000-000000000001',
      quotation_number: 'QUO-2026-0001',
      content_html: '',
      content_version: 1,
      state_version: 1,
      prompt_state: {} as any,
      issues: [],
      readiness: 'incomplete',
      idempotent_replay: false,
    };

    const createSpy = vi.spyOn(api, 'createMeetingDraft').mockResolvedValue({
      quotation_id: mockDraftResponse.quotation_id,
      revision_id: mockDraftResponse.revision_id,
      quotation_number: mockDraftResponse.quotation_number,
      generation_status: 'pending',
      idempotent_replay: false,
    });
    vi.spyOn(api, 'processMeetingDraft').mockResolvedValue(mockDraftResponse);

    const { result } = renderHook(() => usePromptQuotation(), { wrapper });

    const payload1 = {
      project_name: 'Project 1',
      meeting_notes: 'Notes 1',
    };

    await act(async () => {
      await result.current.mutateAsync(payload1);
    });

    const key1 = createSpy.mock.calls[0][0].idempotency_key;

    // Retry with exact same payload
    await act(async () => {
      await result.current.mutateAsync(payload1);
    });

    const key2 = createSpy.mock.calls[1][0].idempotency_key;
    expect(key2).toBe(key1);

    // Modify payload
    const payload2 = {
      project_name: 'Project 2',
      meeting_notes: 'Notes 2',
    };

    await act(async () => {
      await result.current.mutateAsync(payload2);
    });

    const key3 = createSpy.mock.calls[2][0].idempotency_key;
    expect(key3).not.toBe(key1);
  });

  it('usePromptQuotation populates issues on API error', async () => {
    const { wrapper } = createWrapper();
    const apiError: any = new Error('invalid_request');
    apiError.response = {
      data: {
        data: {
          issues: [
            {
              code: 'client_company.missing',
              field: 'client_company',
              message: 'client company is required',
              severity: 'blocking',
            },
          ],
        },
      },
    };

    vi.spyOn(api, 'createMeetingDraft').mockRejectedValueOnce(apiError);

    const { result } = renderHook(() => usePromptQuotation(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({ meeting_notes: 'Short note' });
      } catch {
        // Expected mutation error
      }
    });

    expect(result.current.issues).toEqual([
      {
        code: 'client_company.missing',
        field: 'client_company',
        message: 'client company is required',
        severity: 'blocking',
      },
    ]);
  });

  it('creates a durable pipeline draft without invoking legacy meeting processing', async () => {
    const { wrapper } = createWrapper();
    const createSpy = vi.spyOn(api, 'createMeetingDraft').mockResolvedValueOnce({
      quotation_id: '60000000-0000-0000-0000-000000000001',
      revision_id: '70000000-0000-0000-0000-000000000001',
      quotation_number: 'QUO-2026-0001',
      generation_status: 'pending',
      idempotent_replay: false,
    });
    const processSpy = vi.spyOn(api, 'processMeetingDraft');
    const { result } = renderHook(() => usePromptQuotation(), { wrapper });

    await act(async () => {
      await result.current.createPipelineDraft({
        project_name: 'Pipeline project',
        meeting_notes: 'Pipeline meeting notes stay in request memory only.',
      });
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        meeting_notes: 'Pipeline meeting notes stay in request memory only.',
      }),
      expect.any(AbortSignal)
    );
    expect(processSpy).not.toHaveBeenCalled();
  });
});
