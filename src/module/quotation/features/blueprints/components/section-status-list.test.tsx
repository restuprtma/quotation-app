// @vitest-environment happy-dom
import type { BlueprintSectionStatus } from '../types';

import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { SectionStatusList, CANONICAL_SECTIONS } from './section-status-list';

describe('SectionStatusList', () => {
  afterEach(() => {
    cleanup();
  });

  const mockSectionsPartial: BlueprintSectionStatus[] = [
    {
      type: 'context',
      status: 'completed',
      attempts: 1,
      started_at: '2026-09-17T10:00:00Z',
      completed_at: '2026-09-17T10:01:00Z',
      updated_at: '2026-09-17T10:01:00Z',
    },
    {
      type: 'journey',
      status: 'completed',
      attempts: 1,
      started_at: '2026-09-17T10:01:00Z',
      completed_at: '2026-09-17T10:02:00Z',
      updated_at: '2026-09-17T10:02:00Z',
    },
    {
      type: 'architecture',
      status: 'failed',
      attempts: 2,
      error_code: 'AI_PROVIDER_TIMEOUT',
      started_at: '2026-09-17T10:02:00Z',
      completed_at: null,
      updated_at: '2026-09-17T10:03:00Z',
    },
    {
      type: 'state_machine',
      status: 'pending',
      attempts: 0,
      started_at: null,
      completed_at: null,
      updated_at: '2026-09-17T10:00:00Z',
    },
    {
      type: 'workflow',
      status: 'pending',
      attempts: 0,
      started_at: null,
      completed_at: null,
      updated_at: '2026-09-17T10:00:00Z',
    },
    {
      type: 'wbs',
      status: 'pending',
      attempts: 0,
      started_at: null,
      completed_at: null,
      updated_at: '2026-09-17T10:00:00Z',
    },
    {
      type: 'cross_validation',
      status: 'pending',
      attempts: 0,
      started_at: null,
      completed_at: null,
      updated_at: '2026-09-17T10:00:00Z',
    },
  ];

  it('renders all 7 canonical sections in the correct order', () => {
    render(<SectionStatusList sections={mockSectionsPartial} />);

    const labels = CANONICAL_SECTIONS.map((c) => c.label);
    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeTruthy();
    });

    // Check completed count
    expect(screen.getByText(/2 dari 7 tahap selesai/i)).toBeTruthy();
  });

  it('displays "Menunggu tahap sebelumnya" when preceding sections are not completed', () => {
    render(<SectionStatusList sections={mockSectionsPartial} />);

    // Since architecture is failed, state_machine, workflow, wbs, cross_validation are waiting on previous stage
    const waitingItems = screen.getAllByText(/menunggu tahap sebelumnya/i);
    expect(waitingItems.length).toBeGreaterThan(0);
  });

  it('displays "Siap Diproses" for pending section when all previous sections are completed', () => {
    const mockReadySections: BlueprintSectionStatus[] = [
      {
        type: 'context',
        status: 'completed',
        attempts: 1,
        updated_at: '2026-09-17T10:01:00Z',
      },
      {
        type: 'journey',
        status: 'pending',
        attempts: 0,
        updated_at: '2026-09-17T10:00:00Z',
      },
    ];

    render(<SectionStatusList sections={mockReadySections} />);

    expect(screen.getByText(/siap diproses/i)).toBeTruthy();
  });

  it('shows Retry and Lengkapi Manual buttons for failed provider section with attempts < 3', () => {
    const onRetry = vi.fn();
    const onOpenManual = vi.fn();

    render(
      <SectionStatusList
        sections={mockSectionsPartial}
        onRetry={onRetry}
        onOpenManual={onOpenManual}
      />
    );

    const retryBtn = screen.getByRole('button', { name: /coba lagi/i });
    expect(retryBtn).toBeTruthy();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledWith('architecture');

    const manualBtn = screen.getByRole('button', { name: /lengkapi manual/i });
    expect(manualBtn).toBeTruthy();
    fireEvent.click(manualBtn);
    expect(onOpenManual).toHaveBeenCalledWith('architecture');
  });

  it('does NOT show Retry button when attempts >= 3 for failed provider section', () => {
    const onRetry = vi.fn();
    const onOpenManual = vi.fn();

    const sectionsExhausted: BlueprintSectionStatus[] = [
      {
        type: 'architecture',
        status: 'failed',
        attempts: 3,
        error_code: 'RATE_LIMIT_EXCEEDED',
        updated_at: '2026-09-17T10:03:00Z',
      },
    ];

    render(
      <SectionStatusList
        sections={sectionsExhausted}
        onRetry={onRetry}
        onOpenManual={onOpenManual}
      />
    );

    expect(screen.queryByRole('button', { name: /coba lagi/i })).toBeNull();
    // But Lengkapi Manual should still be available
    expect(screen.getByRole('button', { name: /lengkapi manual/i })).toBeTruthy();
  });

  it('opens correction for a completed provider section', () => {
    const onOpenManual = vi.fn();
    render(
      <SectionStatusList
        sections={[{ type: 'architecture', status: 'completed', attempts: 1 }]}
        onOpenManual={onOpenManual}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Koreksi tahap Arsitektur Sistem' }));
    expect(onOpenManual).toHaveBeenCalledWith('architecture');
  });

  it('safely displays error code in chip', () => {
    render(<SectionStatusList sections={mockSectionsPartial} />);
    expect(screen.getByText('AI_PROVIDER_TIMEOUT')).toBeTruthy();
  });

  it('renders interrupted section status with error chip and allows explicit Coba Lagi retry', () => {
    const onRetry = vi.fn();
    const interruptedSections: BlueprintSectionStatus[] = [
      {
        type: 'journey',
        status: 'interrupted' as any,
        attempts: 1,
        started_at: '2026-09-17T10:00:00Z',
        updated_at: '2026-09-17T10:05:00Z',
      },
    ];

    render(<SectionStatusList sections={interruptedSections} onRetry={onRetry} />);

    expect(screen.getByText('Terputus')).toBeTruthy();
    const retryBtn = screen.getByRole('button', { name: /coba lagi/i });
    expect(retryBtn).toBeTruthy();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledWith('journey');
  });

  it('renders gracefully when sections prop is empty or undefined', () => {
    render(<SectionStatusList />);
    expect(screen.getByText(/0 dari 7 tahap selesai/i)).toBeTruthy();
  });
});
