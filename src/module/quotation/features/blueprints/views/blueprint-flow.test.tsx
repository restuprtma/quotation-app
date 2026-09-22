// @vitest-environment happy-dom
import type { BlueprintDetail, BlueprintStatus, QuotationRevisionOption } from '../types';

import { Route, Routes, MemoryRouter } from 'react-router';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within, waitFor, cleanup, fireEvent } from '@testing-library/react';

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
    company: { id: 'company-test-1', name: 'Company Test' },
  }),
}));

vi.mock('../../quotations/hooks/use-quotation-list', () => ({
  useQuotationList: () => ({
    data: [
      {
        id: 'qtn-001',
        quotation_number: 'QTN/2026/001',
        subject: 'Hospital Management System',
        status: 'active',
        commercial_scheme: 'custom_development',
      },
    ],
    loading: false,
  }),
}));

function renderFlowApp(initialEntries = ['/blueprint']) {
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

describe('Blueprint End-to-End Flow Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockRevisions: QuotationRevisionOption[] = [
    {
      id: 'rev-001',
      version_number: 1,
      status: 'published',
      blueprint_eligible: true,
      blueprint_ineligible_reason: null,
    },
  ];

  it('Flow A: create -> progress -> fail -> retry -> complete', async () => {
    // 1. Setup API mocks
    vi.spyOn(api, 'listBlueprints').mockResolvedValue({ items: [] });
    vi.spyOn(api, 'listQuotationRevisions').mockResolvedValue(mockRevisions);

    const bpId = 'bp-flow-auto-1';

    let currentStatus: BlueprintStatus = {
      blueprint_id: bpId,
      revision_id: 'rev-001',
      title: 'Hospital Core Blueprint Flow',
      generation_status: 'pending',
      publication_status: 'draft',
      completeness_status: 'incomplete',
      content_version: 1,
      sections: [
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
          status: 'pending',
          attempts: 0,
          started_at: null,
          completed_at: null,
          updated_at: '2026-09-17T10:00:00Z',
        },
        {
          type: 'architecture',
          status: 'pending',
          attempts: 0,
          started_at: null,
          completed_at: null,
          updated_at: '2026-09-17T10:00:00Z',
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
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockDetail: BlueprintDetail = {
      status: currentStatus,
      quotation_id: 'qtn-001',
      source_quotation_revision_id: 'rev-001',
      content_json: {
        journey: {
          phases: [{ id: 'phase-1', label: 'Pendaftaran', order: 1 }],
          actors: [{ id: 'actor-1', label: 'Pasien', order: 1 }],
          activities: [
            {
              id: 'act-1',
              phase_id: 'phase-1',
              actor_id: 'actor-1',
              label: 'Registrasi Online',
              description: 'Pasien mendaftar antrean',
              touchpoints: ['Web Portal'],
              references: [],
            },
          ],
        },
      },
      validation_result: {
        is_valid: true,
        coverage_score: 95,
        errors: [],
        warnings: [],
      },
      cross_validation_result: {
        is_valid: true,
        inconsistencies: [],
      },
    };

    vi.spyOn(api, 'createBlueprint').mockImplementation(async () => currentStatus);
    vi.spyOn(api, 'getBlueprintStatus').mockImplementation(async () => currentStatus);
    vi.spyOn(api, 'getBlueprint').mockImplementation(async () => ({
      ...mockDetail,
      status: currentStatus,
    }));

    // Continue implementation: First time journey fails, then on retry it succeeds and completes
    let continueCallCount = 0;
    vi.spyOn(api, 'continueBlueprint').mockImplementation(async () => {
      continueCallCount += 1;
      if (continueCallCount === 1) {
        // Stage fails on first attempt
        currentStatus = {
          ...currentStatus,
          generation_status: 'partial_failed',
          sections: currentStatus.sections.map((s) =>
            s.type === 'journey'
              ? {
                  ...s,
                  status: 'failed',
                  attempts: 1,
                  error_code: 'RATE_LIMIT',
                  updated_at: new Date().toISOString(),
                }
              : s
          ),
        };
        return currentStatus;
      }

      // Subsequent continues succeed all the way to completed
      currentStatus = {
        ...currentStatus,
        generation_status: 'completed',
        completeness_status: 'complete',
        sections: currentStatus.sections.map((s) => ({
          ...s,
          status: 'completed',
          attempts: 1,
          completed_at: new Date().toISOString(),
        })),
      };
      return currentStatus;
    });

    vi.spyOn(api, 'retryBlueprintSection').mockImplementation(async (_id, sec) => {
      if (sec === 'journey') {
        currentStatus = {
          ...currentStatus,
          generation_status: 'in_progress',
          updated_at: new Date().toISOString(),
          sections: currentStatus.sections.map((s) =>
            s.type === 'journey'
              ? {
                  ...s,
                  status: 'in_progress',
                  attempts: 2,
                  error_code: null,
                  updated_at: new Date().toISOString(),
                }
              : s
          ),
        };
      }
      return currentStatus;
    });

    // 2. Render Create View
    renderFlowApp(['/blueprint']);

    // 3. Fill form
    await waitFor(() => {
      expect(screen.getByLabelText(/Pilih Quotation/i)).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText(/Pilih Quotation/i), {
      target: { value: 'qtn-001' },
    });

    await waitFor(() => {
      expect(screen.getByText(/v1 \(published\)/i)).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/Pilih Revisi/i), {
      target: { value: 'rev-001' },
    });

    fireEvent.change(screen.getByLabelText(/Judul Blueprint/i), {
      target: { value: 'Hospital Core Blueprint Flow' },
    });
    fireEvent.change(screen.getByLabelText(/Tujuan Bisnis 1/i), {
      target: { value: 'Automate queue system' },
    });
    fireEvent.change(screen.getByLabelText(/Aktor 1/i), {
      target: { value: 'Patient' },
    });
    fireEvent.change(screen.getByLabelText(/Fase Bisnis 1/i), {
      target: { value: 'Registration' },
    });

    // 4. Submit form
    const createBtn = screen.getByRole('button', { name: /Buat Blueprint/i });
    fireEvent.click(createBtn);

    // 5. Verify navigation to Progress View
    await waitFor(() => {
      expect(screen.getByText('Hospital Core Blueprint Flow')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Mulai Generasi/i })).toBeTruthy();
    });

    // 6. Click "Mulai Generasi"
    const startBtn = screen.getByRole('button', { name: /Mulai Generasi/i });
    fireEvent.click(startBtn);

    // 7. Verify failure on journey section occurs and "Coba Lagi" button appears
    await waitFor(() => {
      expect(screen.getByText('RATE_LIMIT')).toBeTruthy();
      expect(screen.getAllByRole('button', { name: /Coba Lagi/i }).length).toBeGreaterThanOrEqual(1);
    });

    // 8. Click "Coba Lagi" (Retry)
    const retryBtns = screen.getAllByRole('button', { name: /Coba Lagi/i });
    fireEvent.click(retryBtns[0]);

    // 9. Click "Lanjutkan Generasi" once available
    await waitFor(() => {
      const continueBtn = screen.getByRole('button', { name: /Lanjutkan Generasi/i });
      expect(continueBtn).toBeTruthy();
      fireEvent.click(continueBtn);
    });

    // 10. Verify completion
    await waitFor(() => {
      expect(screen.getByText(/Generasi Selesai/i)).toBeTruthy();
      expect(screen.getByText(/Pendaftaran/i)).toBeTruthy();
      expect(screen.getByText(/Registrasi Online/i)).toBeTruthy();
    });
  }, 25000);

  it('Flow B: progress -> fail -> manual completion -> explicit continue -> complete', async () => {
    const bpId = 'bp-flow-manual-2';

    let currentStatus: BlueprintStatus = {
      blueprint_id: bpId,
      revision_id: 'rev-001',
      title: 'Manual Recovery Flow Test',
      generation_status: 'partial_failed',
      publication_status: 'draft',
      completeness_status: 'incomplete',
      content_version: 1,
      sections: [
        {
          type: 'journey',
          status: 'failed',
          attempts: 3,
          error_code: 'provider_timeout',
          error_message: 'AI Provider timeout',
        },
        {
          type: 'architecture',
          status: 'pending',
          attempts: 0,
          started_at: null,
          completed_at: null,
          updated_at: '2026-09-17T10:00:00Z',
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
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let currentDetail: BlueprintDetail = {
      status: currentStatus,
      quotation_id: 'qtn-001',
      source_quotation_revision_id: 'rev-001',
      content_json: {},
      validation_result: {
        is_valid: true,
        coverage_score: 80,
        errors: [],
        warnings: [],
      },
      cross_validation_result: {
        is_valid: true,
        inconsistencies: [],
      },
    };

    vi.spyOn(api, 'getBlueprintStatus').mockImplementation(async () => currentStatus);
    vi.spyOn(api, 'getBlueprint').mockImplementation(async () => ({
      ...currentDetail,
      status: currentStatus,
    }));

    vi.spyOn(api, 'completeBlueprintSection').mockImplementation(async (_id, sec, input) => {
      expect(sec).toBe('journey');
      expect(input.revision_id).toBe('rev-001');
      expect(input.content_version).toBe(1);

      // Section is now manually completed and validated
      currentStatus = {
        ...currentStatus,
        content_version: 2,
        generation_status: 'in_progress',
        updated_at: new Date().toISOString(),
        sections: currentStatus.sections.map((s) =>
          s.type === 'journey'
            ? {
                ...s,
                status: 'completed',
                attempts: 3,
                error_code: null,
                completed_at: new Date().toISOString(),
              }
            : s
        ),
      };

      currentDetail = {
        ...currentDetail,
        status: currentStatus,
        content_json: {
          journey: (input.content as any).journey,
        },
      };

      return currentStatus;
    });

    vi.spyOn(api, 'continueBlueprint').mockImplementation(async () => {
      currentStatus = {
        ...currentStatus,
        generation_status: 'completed',
        completeness_status: 'complete',
        sections: currentStatus.sections.map((s) => ({
          ...s,
          status: 'completed',
          attempts: 1,
          completed_at: new Date().toISOString(),
        })),
      };
      return currentStatus;
    });

    // 1. Render Progress View directly
    renderFlowApp([`/blueprint/${bpId}`]);

    // 2. Verify failed journey stage and "Lengkapi Manual" button (attempts=3, cannot retry)
    await waitFor(() => {
      expect(screen.getByText('Manual Recovery Flow Test')).toBeTruthy();
      expect(screen.queryByRole('button', { name: /Coba Lagi/i })).toBeNull();
      expect(screen.getByRole('button', { name: /Lengkapi Manual/i })).toBeTruthy();
    });

    // 3. Click "Lengkapi Manual"
    fireEvent.click(screen.getByRole('button', { name: /Lengkapi Manual/i }));

    // 4. Verify ManualCompletionDialog opens
    await waitFor(() => {
      expect(screen.getByText(/Lengkapi Manual: User Journey/i)).toBeTruthy();
    });

    // 5. Fill journey fields
    // Add Phase
    const addPhaseBtn = screen.getByRole('button', { name: /Tambah Phase/i });
    fireEvent.click(addPhaseBtn);

    const phaseLabelInput = screen.getByLabelText(/Label Phase 1/i);
    fireEvent.change(phaseLabelInput, { target: { value: 'Discovery & Consultation' } });

    // Add Actor
    const addActorBtn = screen.getByRole('button', { name: /Tambah Actor/i });
    fireEvent.click(addActorBtn);

    const actorLabelInput = screen.getByLabelText(/Label Actor 1/i);
    fireEvent.change(actorLabelInput, { target: { value: 'Hospital Administrator' } });

    // Add Activity
    const addActBtn = screen.getByRole('button', { name: /Tambah Activity/i });
    fireEvent.click(addActBtn);

    const actLabelInput = screen.getByLabelText(/Label Activity 1/i);
    fireEvent.change(actLabelInput, { target: { value: 'Schedule Consultation' } });

    const actDescInput = screen.getByLabelText(/Deskripsi Activity 1/i);
    fireEvent.change(actDescInput, {
      target: { value: 'Admin schedules initial consultation appointment' },
    });

    // 6. Submit manual form
    const saveBtn = screen.getByRole('button', { name: /Simpan & Validasi/i });
    fireEvent.click(saveBtn);

    // 7. Verify dialog closes and explicit "Lanjutkan Generasi" prompt alert appears
    await waitFor(() => {
      expect(screen.getByText(/Tahap Berhasil Dilengkapi/i)).toBeTruthy();
      expect(screen.getAllByText(/Lanjutkan Generasi/i).length).toBeGreaterThan(0);
    });

    // 8. Click explicit "Lanjutkan Generasi" from the alert
    const successAlert = screen.getByText(/Tahap Berhasil Dilengkapi/i).closest('.MuiAlert-root');
    expect(successAlert).toBeTruthy();
    const explicitContinueBtn = within(successAlert as HTMLElement).getByRole('button', {
      name: /Lanjutkan Generasi/i,
    });
    fireEvent.click(explicitContinueBtn);

    // 9. Verify runner completes full generation
    await waitFor(() => {
      expect(screen.getByText(/Generasi Selesai/i)).toBeTruthy();
      expect(screen.getByText(/Discovery & Consultation/i)).toBeTruthy();
    });
  }, 25000);
});
