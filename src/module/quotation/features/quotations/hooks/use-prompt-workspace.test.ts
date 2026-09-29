import type { PromptPatchResponse } from '../types/prompt-first';

import { it, vi, expect, describe } from 'vitest';

import { createPromptWorkspaceMutationQueue } from './use-prompt-workspace';

function response(contentVersion: number, stateVersion: number): PromptPatchResponse {
  return {
    quotation_id: 'quotation-1',
    revision_id: 'revision-1',
    content_html: `<section>v${contentVersion}</section>`,
    content_version: contentVersion,
    state_version: stateVersion,
    prompt_state: {
      schema_version: 'prompt_quotation_v1',
      meeting_notes: 'notes',
      scope: [],
      team: [],
      issues: [],
      readiness: 'priceable',
    },
    issues: [],
    readiness: 'priceable',
    calculation: {
      total_before_discount: 10_000_000,
      additional_discount: 0,
      total_investment: 10_000_000,
      discount: 0,
      payments: [],
    },
  };
}

describe('prompt workspace mutation queue', () => {
  it('serializes patches and uses the versions returned by the prior patch', async () => {
    let resolveFirst!: (value: PromptPatchResponse) => void;
    let resolveSecond!: (value: PromptPatchResponse) => void;
    const mutate = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<PromptPatchResponse>((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<PromptPatchResponse>((resolve) => {
            resolveSecond = resolve;
          })
      );
    const onResponse = vi.fn();
    const queue = createPromptWorkspaceMutationQueue({
      quotationId: 'quotation-1',
      revisionId: 'revision-1',
      contentVersion: 2,
      stateVersion: 3,
      mutate,
      revise: vi.fn(),
      onResponse,
      onConflict: vi.fn(),
    });

    const first = queue.enqueue([{ type: 'set_duration_months', duration_months: 3 }]);
    const second = queue.enqueue([{ type: 'set_payment_pattern', payment_pattern: '50:50' }]);

    await Promise.resolve();
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][1]).toMatchObject({ content_version: 2, state_version: 3 });

    resolveFirst(response(3, 4));
    await first;
    await Promise.resolve();

    expect(mutate).toHaveBeenCalledTimes(2);
    expect(mutate.mock.calls[1][1]).toMatchObject({ content_version: 3, state_version: 4 });

    resolveSecond(response(4, 5));
    await second;
    expect(onResponse).toHaveBeenCalledTimes(2);
  });

  it('ignores a stale server response instead of regressing local versions', () => {
    const onResponse = vi.fn();
    const queue = createPromptWorkspaceMutationQueue({
      quotationId: 'quotation-1',
      revisionId: 'revision-1',
      contentVersion: 5,
      stateVersion: 6,
      mutate: vi.fn(),
      revise: vi.fn(),
      onResponse,
      onConflict: vi.fn(),
    });

    expect(queue.applyResponse(response(4, 5))).toBe(false);
    expect(onResponse).not.toHaveBeenCalled();
    expect(queue.versions()).toEqual({ contentVersion: 5, stateVersion: 6 });
  });

  it('reports a 409 conflict without replacing editor content', async () => {
    const onResponse = vi.fn();
    const onConflict = vi.fn();
    const conflict = Object.assign(new Error('conflict'), { response: { status: 409 } });
    const queue = createPromptWorkspaceMutationQueue({
      quotationId: 'quotation-1',
      revisionId: 'revision-1',
      contentVersion: 2,
      stateVersion: 3,
      mutate: vi.fn().mockRejectedValue(conflict),
      revise: vi.fn(),
      onResponse,
      onConflict,
    });

    await expect(queue.enqueue([{ type: 'set_discount_bps', discount_bps: 500 }])).rejects.toBe(
      conflict
    );
    expect(onConflict).toHaveBeenCalledWith(conflict);
    expect(onResponse).not.toHaveBeenCalled();
  });
});
