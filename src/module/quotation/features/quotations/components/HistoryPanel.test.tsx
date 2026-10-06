// @vitest-environment happy-dom

import type { ReactNode } from 'react';

import { MemoryRouter } from 'react-router';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

import { HistoryPanel } from './HistoryPanel';
import { getQuotationHistory, type QuotationRevisionHistoryItem } from '../api/lifecycle';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

vi.mock('src/locales', () => ({
  useTranslate: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        history_title: 'Riwayat Revisi',
        history_empty: 'Belum ada riwayat revisi',
        status_published: 'Diterbitkan',
        status_draft: 'Draf',
        status_superseded: 'Usang',
        active_published: 'Publikasi Aktif',
        current_revision: 'Saat Ini',
        signed_badge: 'Ditandatangani',
        'editor.legalModifiedBadge': 'Legal Modified',
        'editor.commercialModifiedBadge': 'Commercial Modified',
      };
      return translations[key] ?? fallback ?? key;
    },
  }),
}));

vi.mock('src/shared/ui/iconify', () => ({
  Iconify: () => null,
}));

vi.mock('../api/lifecycle', () => ({
  getQuotationHistory: vi.fn(),
}));

describe('HistoryPanel', () => {
  const mockHistory: QuotationRevisionHistoryItem[] = [
    {
      id: 'rev-2',
      revision_number: 2,
      publication_status: 'published',
      is_signed: true,
      legal_content_modified: true,
      commercial_content_modified: true,
      created_at: '2026-10-02T10:00:00Z',
      published_at: '2026-10-02T11:00:00Z',
      signed_at: '2026-10-02T12:00:00Z',
      rate_card_version: '1.2.0',
      legal_template_version: '2.0.0',
      prompt_version: '3.1.0',
    },
    {
      id: 'rev-1',
      revision_number: 1,
      publication_status: 'superseded',
      is_signed: false,
      legal_content_modified: false,
      commercial_content_modified: false,
      created_at: '2026-10-01T08:00:00Z',
      published_at: '2026-10-01T09:00:00Z',
      rate_card_version: '1.0.0',
      legal_template_version: '1.0.0',
      prompt_version: '1.0.0',
    },
  ];

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders history items with revision numbers, status badges, and active published indicator', () => {
    const handleClose = vi.fn();

    render(
      <HistoryPanel
        open
        onClose={handleClose}
        history={mockHistory}
        activePublishedRevisionId="rev-2"
        currentRevisionId="rev-2"
      />,
      { wrapper: createWrapper() }
    );

    // Title
    expect(screen.getByText('Riwayat Revisi')).toBeTruthy();

    // Revision numbers
    expect(screen.getByText('Revisi #2')).toBeTruthy();
    expect(screen.getByText('Revisi #1')).toBeTruthy();

    // Status badges
    expect(screen.getByText('Diterbitkan')).toBeTruthy();
    expect(screen.getByText('Usang')).toBeTruthy();

    // Active published indicator
    expect(screen.getByText('Publikasi Aktif')).toBeTruthy();

    // Current revision indicator
    expect(screen.getByText('Saat Ini')).toBeTruthy();

    // Signed badge
    expect(screen.getByText('Ditandatangani')).toBeTruthy();

    // Modification chips
    expect(screen.getByText('Legal Modified')).toBeTruthy();
    expect(screen.getByText('Commercial Modified')).toBeTruthy();

    // Version chips
    expect(screen.getByText('Rate Card: v1.2.0')).toBeTruthy();
    expect(screen.getByText('Template: v2.0.0')).toBeTruthy();
    expect(screen.getByText('Prompt: v3.1.0')).toBeTruthy();

    // Timestamps
    expect(screen.getAllByText(/Dibuat:/).length).toBe(2);
    expect(screen.getAllByText(/Dipublikasikan:/).length).toBe(2);
    expect(screen.getByText(/Ditandatangani:/)).toBeTruthy();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();

    render(<HistoryPanel open onClose={handleClose} history={mockHistory} />, {
      wrapper: createWrapper(),
    });

    const closeBtn = screen.getByRole('button', { name: /close history panel/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('displays empty state when history is empty', () => {
    render(<HistoryPanel open onClose={vi.fn()} history={[]} />, { wrapper: createWrapper() });

    expect(screen.getByText('Belum ada riwayat revisi')).toBeTruthy();
  });

  it('fetches history using getQuotationHistory when history prop is not provided', async () => {
    vi.mocked(getQuotationHistory).mockResolvedValueOnce(mockHistory);

    render(
      <HistoryPanel
        open
        onClose={vi.fn()}
        quotationId="quo-123"
        activePublishedRevisionId="rev-2"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(getQuotationHistory).toHaveBeenCalledWith('quo-123');
      expect(screen.getByText('Revisi #2')).toBeTruthy();
    });
  });
});
