// @vitest-environment happy-dom

import type { MeetingExtractionStatus } from '../types/meeting-extraction';

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MeetingExtractionProgressCard } from './meeting-extraction-progress-card';

const status: MeetingExtractionStatus = {
  quotation_id: 'q-1',
  run_id: 'r-1',
  status: 'processing',
  current_phase: 'extracting',
  progress: { completed: 1, total: 4 },
  phases: [],
  failed_phase: null,
  error: null,
  needs_input: [],
  warnings: [],
};

describe('MeetingExtractionProgressCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T10:00:00.000Z'));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows safe needs-input labels but never the server message', () => {
    render(
      <MeetingExtractionProgressCard
        status={{
          ...status,
          status: 'needs_input',
          needs_input: [{ code: 'REQUIRED', field: 'team_size', message: 'provider raw secret' }],
        }}
      />
    );

    expect(screen.getByText('Jumlah tim')).toBeTruthy();
    expect(screen.queryByText(/provider raw secret/i)).toBeNull();
  });

  it('disables retry before retry_after and preserves the retry action after it is due', () => {
    const retry = vi.fn();
    render(
      <MeetingExtractionProgressCard
        status={{
          ...status,
          status: 'waiting_rate_limit',
          error: { code: 'AI_BUDGET_EXHAUSTED', message: 'provider raw', retryable: true, retry_after: 60 },
        }}
        onRetry={retry}
      />
    );

    expect(screen.getByRole('button', { name: /coba lagi/i })).toHaveProperty('disabled', true);
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole('button', { name: /coba lagi/i })).toHaveProperty('disabled', false);
  });

  it.each(['failed', 'needs_input', 'needs_review', 'completed'])(
    'renders %s without raw server text',
    (terminalStatus) => {
      render(
        <MeetingExtractionProgressCard
          status={{
            ...status,
            status: terminalStatus,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'api key Authorization provider raw',
              retryable: true,
              retry_after: null,
            },
            needs_input: [
              { code: 'REQUIRED', field: 'scope', message: 'api key Authorization provider raw' },
            ],
            warnings: [
              { code: 'WARNING', field: 'payment', message: 'api key Authorization provider raw' },
            ],
          }}
        />
      );

      expect(screen.queryByText(/api key|authorization|provider raw/i)).toBeNull();
      cleanup();
    }
  );
});
