import { it, vi, expect, describe, beforeEach } from 'vitest';

import axios from 'src/shared/lib/axios';

import { sharedBlueprintApi } from './index';

vi.mock('src/shared/lib/axios', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    default: {
      get: vi.fn(),
    },
  };
});

describe('sharedBlueprintApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls axios.get with /p/blueprint/:token and withoutAuthRefresh flag', async () => {
    const mockData = {
      title: 'Hospital Core System',
      revision_number: 1,
      completeness_status: 'complete',
      published_at: '2026-10-06T10:00:00Z',
      summary: 'Summary text',
      assumptions: ['Assumption 1'],
      open_questions: [],
      completeness_matrix: { journey: 'validated' },
      warnings: [],
    };

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        data: mockData,
        message: 'Success',
      },
    });

    const result = await sharedBlueprintApi.getShared('test-token-123');

    expect(axios.get).toHaveBeenCalledWith(
      '/p/blueprint/test-token-123',
      expect.objectContaining({ _skipAuthRefresh: true })
    );
    expect(result).toEqual(mockData);
  });

  it('throws an error if response data is missing', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        data: null,
        message: 'Blueprint not found',
        errors: 'Not found',
      },
    });

    await expect(sharedBlueprintApi.getShared('invalid-token')).rejects.toThrow('Not found');
  });
});
