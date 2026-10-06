import { it, expect, describe } from 'vitest';

import { toSafeApiError } from './axios';

function makeAxiosError({ data, Authorization }: { data: unknown; Authorization: string }) {
  return {
    isAxiosError: true,
    message: 'provider error with MEETING NOTES SECRET',
    config: { data: 'MEETING NOTES SECRET', headers: { Authorization } },
    request: { Authorization },
    response: { status: 500, data, headers: { Authorization } },
  };
}

describe('toSafeApiError', () => {
  it('removes notes, authorization, config, request, and raw provider body', () => {
    const safe = toSafeApiError(
      makeAxiosError({ data: 'MEETING NOTES SECRET', Authorization: 'Bearer key' })
    );

    expect(JSON.stringify(safe)).not.toMatch(/SECRET|Bearer|key|config|request/i);
    expect(safe).toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'Unable to process the request.',
      status: 500,
      retryAfter: null,
    });
    expect(safe).not.toHaveProperty('response');
    expect(safe).not.toHaveProperty('config');
    expect(safe).not.toHaveProperty('request');
  });

  it('preserves a known legacy meeting extraction code', () => {
    const safe = toSafeApiError(
      makeAxiosError({
        data: {
          data: null,
          message: 'Unable to process quotation draft',
          errors: { detail: ['invalid_extraction.malformed_json'] },
        },
        Authorization: 'Bearer key',
      })
    );
    expect(safe.code).toBe('invalid_extraction.malformed_json');
    expect(safe).not.toHaveProperty('response');
    expect(JSON.stringify(safe)).not.toContain('Bearer key');
  });

  it('falls back to INTERNAL_ERROR for unknown code or malicious detail', () => {
    const safe = toSafeApiError(
      makeAxiosError({
        data: {
          errors: { detail: ['<script>alert(1)</script>'] },
        },
        Authorization: 'Bearer key',
      })
    );
    expect(safe.code).toBe('INTERNAL_ERROR');
    expect(safe.message).toBe('Unable to process the request.');
    expect(JSON.stringify(safe)).not.toContain('<script>');
  });

  it('preserves known async top-level code', () => {
    const safe = toSafeApiError(
      makeAxiosError({
        data: {
          code: 'MEETING_NOTES_CHANGED',
          message: 'Ignored raw message',
          retry_after: 5,
        },
        Authorization: 'Bearer key',
      })
    );
    expect(safe.code).toBe('MEETING_NOTES_CHANGED');
    expect(safe.message).toBe('Meeting notes changed. Start a new extraction.');
    expect(safe.retryAfter).toBe(5);
  });

  it('preserves candidate from string errors field if known', () => {
    const safe = toSafeApiError(
      makeAxiosError({
        data: {
          errors: 'provider_timeout',
        },
        Authorization: 'Bearer key',
      })
    );
    expect(safe.code).toBe('provider_timeout');
    expect(safe.message).toBe('AI provider timed out.');
  });
});
