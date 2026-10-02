// @vitest-environment happy-dom
import type { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';

import { useMeetingExtraction } from './use-meeting-extraction';
import {
  retryMeetingExtraction,
  startMeetingExtraction,
  getMeetingExtractionStatus,
} from '../api/meeting-extraction';

vi.mock('../api/meeting-extraction', () => ({
  getMeetingExtractionStatus: vi.fn(),
  retryMeetingExtraction: vi.fn(),
  startMeetingExtraction: vi.fn(),
}));

const status = (state = 'queued') => ({
  run_id: 'r-1',
  quotation_id: 'q-1',
  status: state,
  current_phase: null,
  progress: { completed: 0, total: 1 },
  phases: [],
  failed_phase: null,
  error: null,
  needs_input: [],
  warnings: [],
});

async function flushQuery() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useMeetingExtraction', () => {
  let queryClient: QueryClient;
  let wrapper: (props: PropsWithChildren) => JSX.Element;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(getMeetingExtractionStatus).mockResolvedValue({
      notModified: false,
      data: status(),
      etag: '"etag-1"',
    });
    vi.mocked(retryMeetingExtraction).mockResolvedValue({
      quotation_id: 'q-1', run_id: 'r-1', status: 'queued', status_url: '/safe',
    });
    vi.mocked(startMeetingExtraction).mockResolvedValue({
      quotation_id: 'q-2', run_id: 'r-2', status: 'queued', status_url: '/safe',
    });
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  });

  afterEach(() => {
    queryClient.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('polls at 2 seconds, backs off to 5 seconds, and stops at a terminal status', async () => {
    renderHook(() => useMeetingExtraction({ quotationId: 'q-1', runId: 'r-1' }), { wrapper });
    await flushQuery();
    expect(getMeetingExtractionStatus).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(2_000); });
    expect(getMeetingExtractionStatus).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(getMeetingExtractionStatus).toHaveBeenCalledTimes(3);
    vi.mocked(getMeetingExtractionStatus).mockResolvedValueOnce({
      notModified: false, data: status('completed'), etag: '"etag-2"',
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(getMeetingExtractionStatus).toHaveBeenCalledTimes(4);
  });

  it('pauses while hidden or offline and resumes on visibilitychange and online', async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    renderHook(() => useMeetingExtraction({ quotationId: 'q-1', runId: 'r-1' }), { wrapper });
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(getMeetingExtractionStatus).not.toHaveBeenCalled();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    act(() => { window.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('online')); });
    await flushQuery();
    expect(getMeetingExtractionStatus).toHaveBeenCalledTimes(1);
  });

  it('reuses URL-supplied opaque IDs after remount and never accesses web storage', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    renderHook(() => useMeetingExtraction({ quotationId: 'q-1', runId: 'r-1' }), { wrapper });
    await flushQuery();
    expect(getMeetingExtractionStatus).toHaveBeenCalledWith('q-1', 'r-1', undefined);
    expect(getItem).not.toHaveBeenCalled();
  });

  it('keeps the ETag only in memory for conditional status requests', async () => {
    renderHook(() => useMeetingExtraction({ quotationId: 'q-1', runId: 'r-1' }), { wrapper });
    await flushQuery();
    expect(getMeetingExtractionStatus).toHaveBeenCalledWith('q-1', 'r-1', undefined);
    await act(async () => { await vi.advanceTimersByTimeAsync(2_000); });
    expect(getMeetingExtractionStatus).toHaveBeenLastCalledWith('q-1', 'r-1', '"etag-1"');
  });

  it('uses the original quotation and run IDs for retry', async () => {
    const { result } = renderHook(() => useMeetingExtraction({ quotationId: 'q-1', runId: 'r-1' }), { wrapper });
    await act(async () => { await result.current.retry(); });
    expect(retryMeetingExtraction).toHaveBeenCalledWith('q-1', 'r-1');
  });
});
