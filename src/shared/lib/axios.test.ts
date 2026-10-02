import { describe, expect, it } from 'vitest';

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
});
