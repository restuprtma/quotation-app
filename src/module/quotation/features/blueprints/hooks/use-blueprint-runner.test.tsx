// @vitest-environment happy-dom
import type { ReactNode } from 'react';
import type { BlueprintDetail, BlueprintStatus, ProviderSection } from '../types';

import { act, waitFor, renderHook } from '@testing-library/react';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as api from '../api';
import { useBlueprintRunner } from './use-blueprint-runner';

const mockCompanyContext = {
  company: { id: 'company-1', name: 'Company 1' },
};

vi.mock('src/module/core/features/auth/hooks', () => ({
  useAuthContext: () => mockCompanyContext,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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

describe('useBlueprintRunner', () => {
  const mockStatus: BlueprintStatus = {
    blueprint_id: 'bp-123',
    revision_id: 'rev-1',
    title: 'Test Blueprint',
    generation_status: 'in_progress',
    publication_status: 'draft',
    completeness_status: 'incomplete',
    content_version: 1,
    sections: [
      { type: 'context', status: 'completed', attempts: 0, updated_at: '2026-09-17T10:00:00Z' },
      { type: 'journey', status: 'in_progress', attempts: 1, updated_at: '2026-09-17T10:00:00Z' },
      { type: 'architecture', status: 'pending', attempts: 0, updated_at: '2026-09-17T10:00:00Z' },
      { type: 'state_machine', status: 'pending', attempts: 0, updated_at: '2026-09-17T10:00:00Z' },
      { type: 'workflow', status: 'pending', attempts: 0, updated_at: '2026-09-17T10:00:00Z' },
      { type: 'wbs', status: 'pending', attempts: 0, updated_at: '2026-09-17T10:00:00Z' },
      {
        type: 'cross_validation',
        status: 'pending',
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
    content_json: {},
    validation_result: {},
    cross_validation_result: {},
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCompanyContext.company = { id: 'company-1', name: 'Company 1' };
    mockStatus.created_at = new Date().toISOString();
    mockStatus.updated_at = new Date().toISOString();
    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);
    vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetail);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('4.01: Double-click / StrictMode, six-stage completion, error stop, reopen GET-only, unmount / tenant switch', () => {
    it('double-click + StrictMode executes only one in-flight continue mutation', async () => {
      const def = deferred<BlueprintStatus>();
      const continueSpy = vi.spyOn(api, 'continueBlueprint').mockReturnValue(def.promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      // Simulate rapid double click
      let p1: Promise<void>;
      let p2: Promise<void>;
      act(() => {
        p1 = result.current.start();
        p2 = result.current.start();
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);

      // Resolve in-flight request
      await act(async () => {
        def.resolve({
          ...mockStatus,
          generation_status: 'completed',
          content_version: 7,
        });
        await p1;
        await p2;
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);
      expect(result.current.runnerState).toBe('completed');
    });

    it('executes six responses sequentially until completed and then stops', async () => {
      const stageStatuses: BlueprintStatus[] = [
        {
          ...mockStatus,
          content_version: 2,
          sections: mockStatus.sections.map((s) =>
            s.type === 'journey' ? { ...s, status: 'completed' } : s
          ),
        },
        {
          ...mockStatus,
          content_version: 3,
          sections: mockStatus.sections.map((s) =>
            s.type === 'architecture' ? { ...s, status: 'completed' } : s
          ),
        },
        {
          ...mockStatus,
          content_version: 4,
          sections: mockStatus.sections.map((s) =>
            s.type === 'state_machine' ? { ...s, status: 'completed' } : s
          ),
        },
        {
          ...mockStatus,
          content_version: 5,
          sections: mockStatus.sections.map((s) =>
            s.type === 'workflow' ? { ...s, status: 'completed' } : s
          ),
        },
        {
          ...mockStatus,
          content_version: 6,
          sections: mockStatus.sections.map((s) =>
            s.type === 'wbs' ? { ...s, status: 'completed' } : s
          ),
        },
        {
          ...mockStatus,
          content_version: 7,
          generation_status: 'completed',
          sections: mockStatus.sections.map((s) => ({ ...s, status: 'completed' })),
        },
      ];

      const continueSpy = vi.spyOn(api, 'continueBlueprint');
      stageStatuses.forEach((st) => continueSpy.mockResolvedValueOnce(st));

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      await act(async () => {
        await result.current.start();
      });

      expect(continueSpy).toHaveBeenCalledTimes(6);
      expect(result.current.runnerState).toBe('completed');
      expect(result.current.status?.generation_status).toBe('completed');
    });

    it('stops POST loop on error and sets state to idle without further POSTs', async () => {
      const continueSpy = vi
        .spyOn(api, 'continueBlueprint')
        .mockRejectedValueOnce(new Error('Network error'));
      const statusSpy = vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      await act(async () => {
        await result.current.start();
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);
      // Fetches status after error
      expect(statusSpy).toHaveBeenCalled();
      expect(result.current.runnerState).toBe('idle');
      expect(result.current.error).toBeDefined();
    });

    it('reopen/mount is GET-only and does not auto-POST mutations', async () => {
      const continueSpy = vi.spyOn(api, 'continueBlueprint');
      const statusSpy = vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);
      const detailSpy = vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetail);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      expect(statusSpy).toHaveBeenCalledWith('bp-123', expect.anything());
      expect(detailSpy).toHaveBeenCalledWith('bp-123', expect.anything());
      expect(continueSpy).not.toHaveBeenCalled();
    });

    it('unmount while continue is in-flight prevents dispatching next stage', async () => {
      const def = deferred<BlueprintStatus>();
      const continueSpy = vi.spyOn(api, 'continueBlueprint').mockReturnValue(def.promise);

      const { wrapper } = createWrapper();
      const { result, unmount } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      let runPromise: Promise<void>;
      act(() => {
        runPromise = result.current.start();
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);

      // Unmount while request in flight
      unmount();

      // Resolve stage 1
      await act(async () => {
        def.resolve({
          ...mockStatus,
          content_version: 2,
        });
        await runPromise;
      });

      // Assert no stage 2 was dispatched
      expect(continueSpy).toHaveBeenCalledTimes(1);
    });

    it('tenant switch while continue is in-flight prevents dispatching next stage to new tenant', async () => {
      const def = deferred<BlueprintStatus>();
      const continueSpy = vi.spyOn(api, 'continueBlueprint').mockReturnValue(def.promise);

      const { wrapper } = createWrapper();
      const { result, rerender } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      let runPromise: Promise<void>;
      act(() => {
        runPromise = result.current.start();
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);

      // Switch company
      mockCompanyContext.company = { id: 'company-2', name: 'Company 2' };
      rerender();

      // Resolve stage 1
      await act(async () => {
        def.resolve({
          ...mockStatus,
          content_version: 2,
        });
        await runPromise;
      });

      // Assert no stage 2 was dispatched
      expect(continueSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('4.02: Stop while provider pending, Stale response version guard & revision boundary', () => {
    it('stop while request is pending allows active request to finish but does not send next', async () => {
      const def = deferred<BlueprintStatus>();
      const continueSpy = vi.spyOn(api, 'continueBlueprint').mockReturnValue(def.promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      let runPromise: Promise<void>;
      act(() => {
        runPromise = result.current.start();
      });

      expect(result.current.runnerState).toBe('running');
      expect(continueSpy).toHaveBeenCalledTimes(1);

      // User clicks Stop
      act(() => {
        result.current.stop();
      });

      expect(result.current.runnerState).toBe('stopping');

      // Resolve in-flight request
      await act(async () => {
        def.resolve({
          ...mockStatus,
          content_version: 2,
          generation_status: 'in_progress',
        });
        await runPromise;
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);
      expect(result.current.runnerState).toBe('idle');
    });

    it('stale response with lower content_version does not replace newer cache', async () => {
      vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue({
        ...mockStatus,
        revision_id: 'rev-1',
        content_version: 3,
      });

      // Continue returns stale version 2
      vi.spyOn(api, 'continueBlueprint').mockResolvedValueOnce({
        ...mockStatus,
        revision_id: 'rev-1',
        content_version: 2,
        generation_status: 'completed',
      });

      const { wrapper, queryClient } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status?.content_version).toBe(3));

      await act(async () => {
        await result.current.start();
      });

      // Content version should remain 3, not downgraded to 2
      const cached = queryClient.getQueryData<BlueprintStatus>([
        'blueprints',
        'company-1',
        'status',
        'bp-123',
      ]);
      expect(cached?.content_version).toBe(3);
    });

    it('different revision does not compare content_version cross-revision and refetches authority', async () => {
      vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue({
        ...mockStatus,
        revision_id: 'rev-1',
        content_version: 5,
      });

      // Continue returns a new revision with version 1
      vi.spyOn(api, 'continueBlueprint').mockResolvedValueOnce({
        ...mockStatus,
        revision_id: 'rev-2',
        content_version: 1,
        generation_status: 'completed',
      });

      const { wrapper, queryClient } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status?.revision_id).toBe('rev-1'));

      await act(async () => {
        await result.current.start();
      });

      // New revision is accepted even though version 1 < 5
      const cached = queryClient.getQueryData<BlueprintStatus>([
        'blueprints',
        'company-1',
        'status',
        'bp-123',
      ]);
      expect(cached?.revision_id).toBe('rev-2');
      expect(cached?.content_version).toBe(1);
    });
  });

  describe('4.03 & 4.04: State machine, serial loop await, break conditions, error GET recovery', () => {
    it('awaits each continue before sending the next one', async () => {
      const def1 = deferred<BlueprintStatus>();
      const def2 = deferred<BlueprintStatus>();

      const continueSpy = vi
        .spyOn(api, 'continueBlueprint')
        .mockReturnValueOnce(def1.promise)
        .mockReturnValueOnce(def2.promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      let runPromise: Promise<void>;
      act(() => {
        runPromise = result.current.start();
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);

      // Stage 2 is NOT called yet
      expect(continueSpy).not.toHaveBeenCalledTimes(2);

      // Resolve stage 1
      await act(async () => {
        def1.resolve({ ...mockStatus, content_version: 2 });
      });

      // Now stage 2 should have been called
      expect(continueSpy).toHaveBeenCalledTimes(2);

      // Resolve stage 2 with completed
      await act(async () => {
        def2.resolve({ ...mockStatus, content_version: 3, generation_status: 'completed' });
        await runPromise;
      });

      expect(result.current.runnerState).toBe('completed');
    });

    it('breaks loop when status is already terminal', async () => {
      const continueSpy = vi.spyOn(api, 'continueBlueprint');
      vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue({
        ...mockStatus,
        generation_status: 'completed',
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status?.generation_status).toBe('completed'));
      expect(result.current.runnerState).toBe('completed');

      await act(async () => {
        await result.current.start();
      });

      expect(continueSpy).not.toHaveBeenCalled();
    });

    it('breaks loop on failed/partial_failed status returned from continue', async () => {
      const continueSpy = vi.spyOn(api, 'continueBlueprint').mockResolvedValueOnce({
        ...mockStatus,
        generation_status: 'partial_failed',
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      await act(async () => {
        await result.current.start();
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);
      expect(result.current.runnerState).toBe('idle');
    });

    it('fetches status on error / timeout and does not retry mutation automatically', async () => {
      const continueSpy = vi.spyOn(api, 'continueBlueprint').mockRejectedValueOnce({
        response: { status: 504, data: { errors: 'provider_timeout' } },
      });
      const statusSpy = vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      await act(async () => {
        await result.current.start();
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);
      expect(statusSpy).toHaveBeenCalled();
      expect(result.current.runnerState).toBe('idle');
    });
  });

  describe('4.05: Polling GET every 2000ms, cleanup on terminal / unmount / logout, Busy 409 GET-only', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('polls GET status every 2000ms while generating and stops when completed', async () => {
      const statusSpy = vi
        .spyOn(api, 'getBlueprintStatus')
        .mockResolvedValueOnce(mockStatus)
        .mockResolvedValueOnce({ ...mockStatus, content_version: 2 })
        .mockResolvedValueOnce({
          ...mockStatus,
          content_version: 3,
          generation_status: 'completed',
        });

      const { wrapper, queryClient } = createWrapper();
      const { result, rerender } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      // Initial fetch
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(statusSpy).toHaveBeenCalledTimes(1);
      expect(result.current.isPolling).toBe(true);

      // Advance 2000ms -> 2nd poll
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(statusSpy).toHaveBeenCalledTimes(2);

      // Advance 2000ms -> 3rd poll (now completed)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      rerender();
      const cached = queryClient.getQueryData<BlueprintStatus>([
        'blueprints',
        'company-1',
        'status',
        'bp-123',
      ]);
      expect(statusSpy).toHaveBeenCalledTimes(3);
      expect(cached?.generation_status).toBe('completed');
      expect(result.current.status?.generation_status).toBe('completed');
      expect(result.current.isPolling).toBe(false);

      // Advance further -> no more polls
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000);
      });
      expect(statusSpy).toHaveBeenCalledTimes(3);
    });

    it('cleans up polling timer on unmount', async () => {
      const statusSpy = vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

      const { wrapper } = createWrapper();
      const { unmount } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(statusSpy).toHaveBeenCalledTimes(1);

      unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000);
      });
      expect(statusSpy).toHaveBeenCalledTimes(1);
    });

    it('busy 409 error stops POST loop and transitions to GET-only polling', async () => {
      const busyError = {
        response: { status: 409, data: { errors: 'pipeline_busy' } },
      };
      const continueSpy = vi.spyOn(api, 'continueBlueprint').mockRejectedValueOnce(busyError);
      const statusSpy = vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      await act(async () => {
        await result.current.start();
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);
      expect(result.current.runnerState).toBe('idle');
      expect(result.current.isPolling).toBe(true);

      // Advance timers -> polling GET continues without POST
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(statusSpy).toHaveBeenCalled();
      expect(continueSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('4.06: Stale lease >5 min detection, Periksa & Pulihkan click, recovery_required handling', () => {
    it('detects stale lease when in_progress and server updated_at > 5 min', async () => {
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      const staleStatus: BlueprintStatus = {
        ...mockStatus,
        generation_status: 'in_progress',
        updated_at: sixMinutesAgo,
      };

      vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(staleStatus);
      vi.spyOn(api, 'getBlueprint').mockResolvedValue({
        ...mockDetail,
        status: staleStatus,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      expect(result.current.isStaleLease).toBe(true);
      expect(result.current.runnerState).toBe('recovery');
    });

    it('recover() calls continueBlueprint exactly once', async () => {
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      const staleStatus: BlueprintStatus = {
        ...mockStatus,
        generation_status: 'in_progress',
        updated_at: sixMinutesAgo,
      };

      vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(staleStatus);
      vi.spyOn(api, 'getBlueprint').mockResolvedValue({ ...mockDetail, status: staleStatus });

      const continueSpy = vi.spyOn(api, 'continueBlueprint').mockResolvedValueOnce({
        ...mockStatus,
        generation_status: 'in_progress',
        content_version: 2,
        updated_at: new Date().toISOString(),
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.isStaleLease).toBe(true));

      await act(async () => {
        await result.current.recover();
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);
      expect(result.current.status?.content_version).toBe(2);
    });

    it('recover() receiving recovery_required refetches status & detail and does NOT auto-retry', async () => {
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      const staleStatus: BlueprintStatus = {
        ...mockStatus,
        generation_status: 'in_progress',
        updated_at: sixMinutesAgo,
      };

      const recoveryError = {
        response: { status: 409, data: { errors: 'recovery_required' } },
      };

      vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(staleStatus);
      const detailSpy = vi
        .spyOn(api, 'getBlueprint')
        .mockResolvedValue({ ...mockDetail, status: staleStatus });
      const continueSpy = vi.spyOn(api, 'continueBlueprint').mockRejectedValueOnce(recoveryError);
      const retrySpy = vi.spyOn(api, 'retryBlueprintSection');

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.isStaleLease).toBe(true));

      await act(async () => {
        await result.current.recover();
      });

      expect(continueSpy).toHaveBeenCalledTimes(1);
      expect(detailSpy).toHaveBeenCalled();
      expect(result.current.runnerState).toBe('recovery');
      expect(retrySpy).not.toHaveBeenCalled();
    });
  });

  describe('4.07: Section Retry and Manual Operations', () => {
    it('retrySection calls retryBlueprintSection with specified section and updates status', async () => {
      const retrySpy = vi.spyOn(api, 'retryBlueprintSection').mockResolvedValueOnce({
        ...mockStatus,
        content_version: 2,
        sections: mockStatus.sections.map((s) =>
          s.type === 'journey' ? { ...s, status: 'in_progress', attempts: 2 } : s
        ),
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());

      await act(async () => {
        await result.current.retrySection('journey' as ProviderSection);
      });

      expect(retrySpy).toHaveBeenCalledWith('bp-123', 'journey');
      expect(result.current.status?.content_version).toBe(2);
    });

    it('refresh triggers manual refetch of status and detail', async () => {
      const statusSpy = vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);
      const detailSpy = vi.spyOn(api, 'getBlueprint').mockResolvedValue(mockDetail);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useBlueprintRunner('bp-123'), { wrapper });

      await waitFor(() => expect(result.current.status).toBeDefined());
      expect(statusSpy).toHaveBeenCalledTimes(1);
      expect(detailSpy).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refresh();
      });

      expect(statusSpy).toHaveBeenCalledTimes(2);
      expect(detailSpy).toHaveBeenCalledTimes(2);
    });
  });
});
