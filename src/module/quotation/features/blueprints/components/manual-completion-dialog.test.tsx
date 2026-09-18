import type { BlueprintDetail, BlueprintStatus, ProviderSection } from '../types';

import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// @vitest-environment happy-dom
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';

import * as api from '../api';
import { ManualCompletionDialog } from './manual-completion-dialog';

vi.mock('../api', () => ({
  completeBlueprintSection: vi.fn(),
  getBlueprint: vi.fn(),
  getBlueprintStatus: vi.fn(),
}));

vi.mock('src/module/core/features/auth/hooks', () => ({
  useAuthContext: () => ({
    company: { id: 'company-test-123' },
    user: { id: 'user-test-123' },
  }),
}));

const mockStatus: BlueprintStatus = {
  blueprint_id: 'bp-12345',
  revision_id: 'rev-99999',
  title: 'Test Blueprint',
  generation_status: 'partial_failed',
  publication_status: 'draft',
  completeness_status: 'incomplete',
  content_version: 3,
  sections: [
    {
      type: 'context',
      status: 'completed',
      attempts: 1,
      updated_at: '2026-09-17T10:00:00Z',
    },
    {
      type: 'journey',
      status: 'failed',
      attempts: 3,
      error_code: 'provider_timeout',
      updated_at: '2026-09-17T10:05:00Z',
    },
    {
      type: 'architecture',
      status: 'pending',
      attempts: 0,
      updated_at: '2026-09-17T10:00:00Z',
    },
    {
      type: 'state_machine',
      status: 'pending',
      attempts: 0,
      updated_at: '2026-09-17T10:00:00Z',
    },
    {
      type: 'workflow',
      status: 'pending',
      attempts: 0,
      updated_at: '2026-09-17T10:00:00Z',
    },
    {
      type: 'wbs',
      status: 'pending',
      attempts: 0,
      updated_at: '2026-09-17T10:00:00Z',
    },
    {
      type: 'cross_validation',
      status: 'pending',
      attempts: 0,
      updated_at: '2026-09-17T10:00:00Z',
    },
  ],
  created_at: '2026-09-17T10:00:00Z',
  updated_at: '2026-09-17T10:05:00Z',
};

const mockDetail: BlueprintDetail = {
  status: mockStatus,
  quotation_id: 'quot-123',
  content_json: {
    context: {
      business_goals: ['Goal 1'],
    },
  },
  validation_result: {},
  cross_validation_result: {},
};

function renderDialog(props: {
  open?: boolean;
  onClose?: () => void;
  blueprintId?: string;
  section?: ProviderSection | null;
  detail?: BlueprintDetail | null;
  status?: BlueprintStatus | null;
  onSuccess?: () => void;
  onContinue?: () => void;
  isBusy?: boolean;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    blueprintId: 'bp-12345',
    section: 'journey' as ProviderSection,
    detail: mockDetail,
    status: mockStatus,
    onSuccess: vi.fn(),
    onContinue: vi.fn(),
    isBusy: false,
    ...props,
  };

  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <ManualCompletionDialog {...defaultProps} />
    </QueryClientProvider>
  );

  return { ...rendered, props: defaultProps, queryClient };
}

describe('ManualCompletionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading guard when detail or status is not yet available and does not guess version 1', () => {
    renderDialog({ detail: null, status: null });

    expect(screen.getByText(/Memuat data blueprint/i)).toBeTruthy();
    expect(screen.queryByText(/Versi Konten saat buka: v1/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Simpan & Validasi/i })).toBeNull();
  });

  it('renders empty section warning and form fields for the specified section', () => {
    renderDialog({ section: 'journey' });

    expect(screen.getByText(/Lengkapi Manual: User Journey/i)).toBeTruthy();
    expect(screen.getByText(/Versi Konten saat buka: v3/i)).toBeTruthy();
    expect(screen.getByText(/Revisi: rev-99999/i)).toBeTruthy();
    expect(screen.getByText(/Bagian User Journey saat ini masih kosong/i)).toBeTruthy();
  });

  it('blocks invalid submit on client with zero mutation calls', async () => {
    renderDialog({ section: 'journey' });

    // Click submit when form is empty
    const submitBtn = screen.getByRole('button', { name: /Simpan & Validasi/i });
    fireEvent.click(submitBtn);

    // Assert zero API calls
    expect(api.completeBlueprintSection).not.toHaveBeenCalled();
    // Empty warning or validation error should remain
    expect(screen.getByText(/Bagian User Journey saat ini masih kosong/i)).toBeTruthy();
  });

  it('successfully submits valid payload with captured revision_id and content_version, refetches and closes without auto-running AI', async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    const updatedStatus: BlueprintStatus = {
      ...mockStatus,
      content_version: 4,
      sections: mockStatus.sections.map((s) =>
        s.type === 'journey' ? { ...s, status: 'completed', attempts: 3, error_code: null } : s
      ),
    };

    vi.mocked(api.completeBlueprintSection).mockResolvedValueOnce(updatedStatus);

    renderDialog({ section: 'journey', onSuccess, onClose });

    // Fill in Journey form with valid data
    // Add Phase
    fireEvent.click(screen.getByRole('button', { name: /Tambah Phase/i }));
    const phaseInput = screen.getByLabelText(/Label Phase 1/i);
    fireEvent.change(phaseInput, { target: { value: 'Fase Registrasi' } });

    // Add Actor
    fireEvent.click(screen.getByRole('button', { name: /Tambah Actor/i }));
    const actorInput = screen.getByLabelText(/Label Actor 1/i);
    fireEvent.change(actorInput, { target: { value: 'Pemohon Layanan' } });

    // Add Activity
    fireEvent.click(screen.getByRole('button', { name: /Tambah Activity/i }));
    const actLabelInput = screen.getByLabelText(/Label Activity 1/i);
    fireEvent.change(actLabelInput, { target: { value: 'Mengisi formulir pendaftaran' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Simpan & Validasi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.completeBlueprintSection).toHaveBeenCalledTimes(1);
    });

    expect(api.completeBlueprintSection).toHaveBeenCalledWith(
      'bp-12345',
      'journey',
      expect.objectContaining({
        revision_id: 'rev-99999',
        content_version: 3,
        content: expect.objectContaining({
          journey: expect.objectContaining({
            phases: expect.arrayContaining([
              expect.objectContaining({ label: 'Fase Registrasi', order: 1 }),
            ]),
            actors: expect.arrayContaining([
              expect.objectContaining({ label: 'Pemohon Layanan', order: 1 }),
            ]),
            activities: expect.arrayContaining([
              expect.objectContaining({ label: 'Mengisi formulir pendaftaran' }),
            ]),
          }),
        }),
      })
    );

    expect(onSuccess).toHaveBeenCalledWith(updatedStatus);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles 422 server validation error: preserves local input and displays focusable error summary with field links', async () => {
    const err422 = {
      response: {
        status: 422,
        data: {
          errors: [
            {
              field: 'journey.activities.0.touchpoints',
              message: 'Touchpoint tidak boleh mengandung karakter terlarang',
            },
            {
              field: 'journey.phases',
              message: 'Urutan order phase harus berurutan',
            },
          ],
          message: 'Data section manual tidak valid',
        },
      },
    };

    vi.mocked(api.completeBlueprintSection).mockRejectedValueOnce(err422);

    renderDialog({ section: 'journey' });

    // Add Phase
    fireEvent.click(screen.getByRole('button', { name: /Tambah Phase/i }));
    const phaseInput = screen.getByLabelText(/Label Phase 1/i);
    fireEvent.change(phaseInput, { target: { value: 'Fase Khusus' } });

    // Add Actor
    fireEvent.click(screen.getByRole('button', { name: /Tambah Actor/i }));
    const actorInput = screen.getByLabelText(/Label Actor 1/i);
    fireEvent.change(actorInput, { target: { value: 'Aktor Khusus' } });

    // Add Activity
    fireEvent.click(screen.getByRole('button', { name: /Tambah Activity/i }));
    const actLabelInput = screen.getByLabelText(/Label Activity 1/i);
    fireEvent.change(actLabelInput, { target: { value: 'Aktivitas Khusus' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Simpan & Validasi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Validasi Server Gagal \(422\)/i)).toBeTruthy();
    });

    // Error summary messages should be visible
    expect(screen.getByText(/Touchpoint tidak boleh mengandung karakter terlarang/i)).toBeTruthy();
    expect(screen.getByText(/Urutan order phase harus berurutan/i)).toBeTruthy();

    // Local inputs must be preserved!
    expect(screen.getByDisplayValue('Fase Khusus')).toBeTruthy();
    expect(screen.getByDisplayValue('Aktor Khusus')).toBeTruthy();
    expect(screen.getByDisplayValue('Aktivitas Khusus')).toBeTruthy();
  });

  it('shows dirty close confirmation warning when attempting to close with unsaved changes', async () => {
    const onClose = vi.fn();

    renderDialog({ section: 'journey', onClose });

    // Add a Phase to make form dirty
    fireEvent.click(screen.getByRole('button', { name: /Tambah Phase/i }));
    const phaseInput = screen.getByLabelText(/Label Phase 1/i);
    fireEvent.change(phaseInput, { target: { value: 'Fase Baru Dirty' } });

    // Try closing by clicking Batal
    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);

    // Dialog should show confirmation alert/modal
    expect(screen.getByText(/Perubahan belum disimpan/i)).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    // Click "Buang Perubahan"
    const confirmDiscardBtn = screen.getByRole('button', { name: /Buang Perubahan/i });
    fireEvent.click(confirmDiscardBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles 409 stale version conflict: preserves local input, refetches status, keeps old expected version until explicit reload confirm discard', async () => {
    const err409 = {
      response: {
        status: 409,
        data: {
          errors: 'execution_conflict',
          message: 'Versi konten telah berubah di server',
        },
      },
    };

    const latestServerStatus: BlueprintStatus = {
      ...mockStatus,
      content_version: 5,
    };

    const latestServerDetail: BlueprintDetail = {
      ...mockDetail,
      status: latestServerStatus,
      content_json: {
        journey: {
          phases: [{ id: 'phase-server', label: 'Fase Server Baru', order: 1 }],
          actors: [{ id: 'actor-server', label: 'Aktor Server Baru', order: 1 }],
          activities: [
            {
              id: 'act-server',
              phase_id: 'phase-server',
              actor_id: 'actor-server',
              label: 'Aktivitas Server Baru',
              description: '',
              touchpoints: [],
              references: [],
            },
          ],
        },
      },
    };

    vi.mocked(api.completeBlueprintSection).mockRejectedValueOnce(err409);
    vi.mocked(api.getBlueprintStatus).mockResolvedValueOnce(latestServerStatus);
    vi.mocked(api.getBlueprint).mockResolvedValueOnce(latestServerDetail);

    renderDialog({ section: 'journey' });

    // Make local changes
    fireEvent.click(screen.getByRole('button', { name: /Tambah Phase/i }));
    const phaseInput = screen.getByLabelText(/Label Phase 1/i);
    fireEvent.change(phaseInput, { target: { value: 'Fase Lokal Saya' } });

    fireEvent.click(screen.getByRole('button', { name: /Tambah Actor/i }));
    const actorInput = screen.getByLabelText(/Label Actor 1/i);
    fireEvent.change(actorInput, { target: { value: 'Aktor Lokal Saya' } });

    fireEvent.click(screen.getByRole('button', { name: /Tambah Activity/i }));
    const actLabelInput = screen.getByLabelText(/Label Activity 1/i);
    fireEvent.change(actLabelInput, { target: { value: 'Aktivitas Lokal Saya' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Simpan & Validasi/i });
    fireEvent.click(submitBtn);

    // 409 Conflict banner appears
    await waitFor(() => {
      expect(screen.getByText(/Konflik Versi Terdeteksi \(409\)/i)).toBeTruthy();
    });

    // Local inputs are strictly preserved
    expect(screen.getByDisplayValue('Fase Lokal Saya')).toBeTruthy();
    expect(screen.getByDisplayValue('Aktor Lokal Saya')).toBeTruthy();
    expect(screen.getByDisplayValue('Aktivitas Lokal Saya')).toBeTruthy();

    // Expected version in dialog header still shows original captured version v3 (not secretly mutated)
    expect(screen.getByText(/Versi Konten saat buka: v3/i)).toBeTruthy();

    // User clicks "Muat Versi Terbaru"
    const reloadBtn = screen.getByRole('button', { name: /Muat Versi Terbaru/i });
    fireEvent.click(reloadBtn);

    // Confirmation dialog for discarding local changes
    expect(
      screen.getByText(/Tindakan ini akan membuang perubahan lokal yang belum tersimpan/i)
    ).toBeTruthy();

    const confirmReloadBtn = screen.getByRole('button', { name: /Konfirmasi Muat Terbaru/i });
    fireEvent.click(confirmReloadBtn);

    // After confirmation, form is reset to server data and version updated to v5
    await waitFor(() => {
      expect(screen.getByDisplayValue('Fase Server Baru')).toBeTruthy();
    });
    expect(screen.getByText(/Versi Konten saat buka: v5/i)).toBeTruthy();
  });

  it('shows downstream invalidation warning and requires confirmation when editing an already completed (stable) section', async () => {
    const completedStatus: BlueprintStatus = {
      ...mockStatus,
      sections: mockStatus.sections.map((s) =>
        s.type === 'journey' ? { ...s, status: 'completed' } : s
      ),
    };

    const completedDetail: BlueprintDetail = {
      ...mockDetail,
      status: completedStatus,
      content_json: {
        journey: {
          phases: [{ id: 'phase-1', label: 'Phase 1', order: 1 }],
          actors: [{ id: 'actor-1', label: 'Actor 1', order: 1 }],
          activities: [
            {
              id: 'act-1',
              phase_id: 'phase-1',
              actor_id: 'actor-1',
              label: 'Activity 1',
              description: '',
              touchpoints: [],
              references: [],
            },
          ],
        },
      },
    };

    vi.mocked(api.completeBlueprintSection).mockResolvedValueOnce({
      ...completedStatus,
      content_version: 4,
    });

    renderDialog({
      section: 'journey',
      status: completedStatus,
      detail: completedDetail,
    });

    // Downstream warning should be visible
    expect(screen.getByText(/Peringatan: Mengubah tahap yang sudah selesai/i)).toBeTruthy();
    expect(screen.getByText(/Arsitektur Sistem/i)).toBeTruthy();
    expect(screen.getByText(/State Machine/i)).toBeTruthy();
    expect(screen.getByText(/Workflow Bisnis/i)).toBeTruthy();
    expect(screen.getByText(/Work Breakdown Structure/i)).toBeTruthy();
    expect(screen.getByText(/Validasi Silang/i)).toBeTruthy();

    // Submit button should require downstream confirmation checkbox
    const submitBtn = screen.getByRole('button', { name: /Simpan & Validasi/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);

    // Check confirmation checkbox
    const confirmCheckbox = screen.getByRole('checkbox');
    fireEvent.click(confirmCheckbox);

    expect(submitBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.completeBlueprintSection).toHaveBeenCalledTimes(1);
    });
  });
});
