import { it, vi, expect, describe, afterEach } from 'vitest';

import axios from 'src/shared/lib/axios';

import {
  retryMeetingExtraction,
  startMeetingExtraction,
  getMeetingExtractionStatus,
} from './meeting-extraction';

describe('meeting extraction API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends only the documented start payload and reads the safe start projection', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        data: { quotation_id: 'q-1', run_id: 'r-1', status: 'queued', status_url: '/safe' },
      },
    } as any);

    await expect(
      startMeetingExtraction('q-1', { service_scheme: 'auto', meeting_notes: 'notes' })
    ).resolves.toMatchObject({ quotation_id: 'q-1', run_id: 'r-1' });
    expect(post).toHaveBeenCalledWith('/quotation/v1/quotations/q-1/meeting-extraction', {
      service_scheme: 'auto',
      meeting_notes: 'notes',
    });
  });

  it('returns unchanged status for 304 and carries the response ETag', async () => {
    vi.spyOn(axios, 'get').mockResolvedValueOnce({ status: 304, headers: {}, data: {} } as any);

    await expect(getMeetingExtractionStatus('q-1', 'r-1', '"etag"')).resolves.toEqual({
      notModified: true,
    });
    expect(axios.get).toHaveBeenCalledWith('/quotation/v1/quotations/q-1/meeting-extraction/r-1', {
      headers: { 'If-None-Match': '"etag"' },
      validateStatus: expect.any(Function),
    });
  });

  it('uses the run-specific retry endpoint', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { data: { quotation_id: 'q-1', run_id: 'r-1', status: 'queued', status_url: '/safe' } },
    } as any);

    await retryMeetingExtraction('q-1', 'r-1');

    expect(post).toHaveBeenCalledWith(
      '/quotation/v1/quotations/q-1/meeting-extraction/r-1/retry',
      {}
    );
  });
});
