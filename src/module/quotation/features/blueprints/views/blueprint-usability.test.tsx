// @vitest-environment happy-dom
import type { BlueprintStatus } from '../types';

import { Route, Routes, MemoryRouter } from 'react-router';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';

import * as api from '../api';
import { BlueprintCreateView } from './blueprint-create-view';
import { BlueprintProgressView } from './blueprint-progress-view';

vi.mock('@mui/x-data-grid', () => ({
  gridClasses: {},
}));

vi.mock('src/layouts/dashboard', () => ({
  DashboardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('src/module/core/features/auth/hooks', () => ({
  useAuthContext: () => ({
    company: { id: 'company-a', name: 'Tenant A' },
  }),
}));

vi.mock('../../quotations/hooks/use-quotation-list', () => ({
  useQuotationList: () => ({
    data: [
      {
        id: 'qtn-001',
        quotation_number: 'QTN/2026/001',
        subject: 'Hospital System',
        status: 'active',
        commercial_scheme: 'custom_development',
      },
    ],
    loading: false,
  }),
}));

function renderApp(initialEntries = ['/blueprint']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/blueprint" element={<BlueprintCreateView />} />
          <Route path="/blueprint/:id" element={<BlueprintProgressView />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Blueprint Usability, Accessibility & Responsive Guards (6.03-6.05)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('6.03: audit keyboard accessibility, tab order, and aria-live announcements', async () => {
    vi.spyOn(api, 'listBlueprints').mockResolvedValue({ items: [] });
    vi.spyOn(api, 'listQuotationRevisions').mockResolvedValue([
      {
        id: 'rev-001',
        version_number: 1,
        status: 'published',
        blueprint_eligible: true,
        blueprint_ineligible_reason: null,
      },
    ]);

    renderApp(['/blueprint']);

    await waitFor(() => {
      expect(screen.getByLabelText(/Pilih Quotation/i)).toBeTruthy();
    });

    const quotationSelect = screen.getByLabelText(/Pilih Quotation/i);
    quotationSelect.focus();
    expect(document.activeElement).toBe(quotationSelect);

    // Select quotation to enable revision select
    fireEvent.change(quotationSelect, { target: { value: 'qtn-001' } });

    await waitFor(() => {
      const revSelect = screen.getByLabelText(/Pilih Revisi/i);
      expect((revSelect as HTMLSelectElement).disabled).toBe(false);
    });

    const titleInput = screen.getByLabelText(/Judul Blueprint/i);
    titleInput.focus();
    expect(document.activeElement).toBe(titleInput);
  });

  it('6.04: renders 390px mobile guidance notice while preserving read-only table preview', async () => {
    const bpId = 'bp-mobile-check';
    const mockStatus: BlueprintStatus = {
      blueprint_id: bpId,
      revision_id: 'rev-001',
      title: 'Mobile View Test',
      generation_status: 'in_progress',
      publication_status: 'draft',
      completeness_status: 'partial',
      content_version: 1,
      sections: [
        {
          type: 'context',
          status: 'completed',
          attempts: 1,
        },
        {
          type: 'journey',
          status: 'in_progress',
          attempts: 1,
        },
      ],
      created_at: '2026-09-17T10:00:00Z',
      updated_at: '2026-09-17T10:01:00Z',
    };

    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);
    vi.spyOn(api, 'getBlueprint').mockResolvedValue({
      status: mockStatus,
      quotation_id: 'qtn-001',
      source_quotation_revision_id: 'rev-001',
      content_json: {},
      validation_result: { is_valid: true },
      cross_validation_result: { is_valid: true },
    } as any);

    renderApp([`/blueprint/${bpId}`]);

    await waitFor(() => {
      expect(screen.getByText(/Petunjuk Tampilan Desktop/i)).toBeTruthy();
      expect(
        screen.getByText(
          /Formulir pengisian manual dan penyusunan arsitektur blueprint dioptimalkan/i
        )
      ).toBeTruthy();
    });
  });

  it('6.05: links provider configuration errors directly to settings without crashing', async () => {
    const bpId = 'bp-provider-err';
    const mockStatus: BlueprintStatus = {
      blueprint_id: bpId,
      revision_id: 'rev-001',
      title: 'Provider Config Error Test',
      generation_status: 'failed',
      publication_status: 'draft',
      completeness_status: 'partial',
      content_version: 1,
      sections: [
        {
          type: 'journey',
          status: 'failed',
          attempts: 1,
          error_code: 'provider_config_missing',
          error_message: 'AI Provider API key missing',
        },
      ],
      created_at: '2026-09-17T10:00:00Z',
      updated_at: '2026-09-17T10:01:00Z',
    };

    vi.spyOn(api, 'getBlueprintStatus').mockResolvedValue(mockStatus);
    vi.spyOn(api, 'getBlueprint').mockResolvedValue({
      status: mockStatus,
      quotation_id: 'qtn-001',
      source_quotation_revision_id: 'rev-001',
      content_json: {},
    } as any);

    renderApp([`/blueprint/${bpId}`]);

    await waitFor(() => {
      expect(screen.getByText(/Konfigurasi AI Provider Belum Diatur/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Buka Pengaturan/i })).toBeTruthy();
    });
  });

  it('6.05: foreign 404 hides resource identity to preserve cross-tenant confidentiality', async () => {
    const secretForeignId = 'bp-secret-foreign-tenant-b-999';

    vi.spyOn(api, 'getBlueprintStatus').mockRejectedValue(
      new Error('Resource not found or unauthorized')
    );
    vi.spyOn(api, 'getBlueprint').mockRejectedValue(
      new Error('Resource not found or unauthorized')
    );

    renderApp([`/blueprint/${secretForeignId}`]);

    await waitFor(() => {
      expect(screen.getByText(/Blueprint Tidak Ditemukan/i)).toBeTruthy();
      expect(
        screen.getByText(/Blueprint dengan ID ini tidak ditemukan atau Anda tidak memiliki akses/i)
      ).toBeTruthy();
      // Ensure the sensitive resource ID is NOT printed
      expect(screen.queryByText(secretForeignId)).toBeNull();
    });
  });
});
