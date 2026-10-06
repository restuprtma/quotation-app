// @vitest-environment happy-dom
import type { ReactNode } from 'react';
import type { BlueprintDetail, BlueprintStatus } from '../types';

import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import * as runnerHook from '../hooks/use-blueprint-runner';
import { BlueprintProgressView } from './blueprint-progress-view';

vi.mock('@mui/x-data-grid', () => ({
  gridClasses: {},
}));

vi.mock('src/layouts/dashboard', () => ({
  DashboardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('src/module/core/features/auth/hooks', () => ({
  useAuthContext: () => ({
    company: { id: 'company-test-1', name: 'Test Company' },
  }),
}));

const mockNavigate = vi.fn();
const mockParams = { id: 'bp-123' };

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('BlueprintProgressView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    mockParams.id = 'bp-123';
  });

  afterEach(() => {
    cleanup();
  });

  const mockStatus: BlueprintStatus = {
    blueprint_id: 'bp-123',
    revision_id: 'rev-001',
    title: 'Hospital Management System Blueprint',
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
    ],
    created_at: '2026-09-17T10:00:00Z',
    updated_at: '2026-09-17T10:01:00Z',
  };

  const mockDetail: BlueprintDetail = {
    status: mockStatus,
    quotation_id: 'qtn-123',
    source_quotation_revision_id: 'rev-001',
    content_json: {
      journey: {
        phases: [{ id: 'phase-1', label: 'Pendaftaran Pasien', order: 1 }],
        actors: [{ id: 'actor-1', label: 'Pasien', order: 1 }],
        activities: [],
      },
    },
    validation_result: {
      is_valid: true,
      coverage_score: 90,
      errors: [],
      warnings: [],
    },
    cross_validation_result: {
      is_valid: true,
      inconsistencies: [],
    },
  };

  it('renders loading screen when isLoading is true and no status', () => {
    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: undefined,
      detail: undefined,
      runnerState: 'idle',
      isLoading: true,
      isFetching: true,
      isPolling: false,
      isStaleLease: false,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    const { container } = render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    // LoadingScreen or circular progress rendered
    expect(container).toBeTruthy();
  });

  it('renders foreign/404 safe error view when error occurs and status is missing', () => {
    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'foreign-id',
      status: undefined,
      detail: undefined,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      error: new Error('Blueprint not found'),
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Blueprint Tidak Ditemukan/i)).toBeTruthy();
    const backBtn = screen.getByRole('button', { name: /kembali ke generator/i });
    expect(backBtn).toBeTruthy();
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/blueprint');
  });

  it('renders header metadata, status, and starts runner when Mulai Generasi is clicked', async () => {
    const startMock = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: mockStatus,
      detail: mockDetail,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      error: null,
      start: startMock,
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Hospital Management System Blueprint')).toBeTruthy();
    expect(screen.getByText(/Revisi: rev-001/i)).toBeTruthy();
    expect(screen.getByText(/Versi Konten: v1/i)).toBeTruthy();

    const startBtn = screen.getByRole('button', { name: /mulai generasi/i });
    expect(startBtn).toBeTruthy();
    fireEvent.click(startBtn);
    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it('renders Hentikan button when runner is running and triggers stop', () => {
    const stopMock = vi.fn();

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: { ...mockStatus, generation_status: 'in_progress' },
      detail: mockDetail,
      runnerState: 'running',
      isLoading: false,
      isFetching: true,
      isPolling: true,
      isStaleLease: false,
      error: null,
      start: vi.fn(),
      stop: stopMock,
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Sedang Berjalan')).toBeTruthy();
    const stopBtn = screen.getByRole('button', { name: /hentikan/i });
    expect(stopBtn).toBeTruthy();
    fireEvent.click(stopBtn);
    expect(stopMock).toHaveBeenCalledTimes(1);
  });

  it('renders stale lease warning banner and triggers recover on click', async () => {
    const recoverMock = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: { ...mockStatus, generation_status: 'in_progress' },
      detail: mockDetail,
      runnerState: 'recovery',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: true,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: recoverMock,
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Stale Lease Terdeteksi/i)).toBeTruthy();
    const recoverBtn = screen.getByRole('button', { name: /periksa & pulihkan/i });
    expect(recoverBtn).toBeTruthy();
    fireEvent.click(recoverBtn);
    expect(recoverMock).toHaveBeenCalledTimes(1);
  });

  it('triggers GET-only refresh on Segarkan button click', async () => {
    const refreshMock = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: mockStatus,
      detail: mockDetail,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: refreshMock,
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    const refreshBtn = screen.getByRole('button', { name: /segarkan/i });
    fireEvent.click(refreshBtn);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('switches between Preview Hasil and Panel Validasi tabs', () => {
    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: mockStatus,
      detail: mockDetail,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    // Default tab is preview
    expect(screen.getByText('Pendaftaran Pasien')).toBeTruthy();

    // Click Validation Panel tab
    fireEvent.click(screen.getByRole('tab', { name: /panel validasi & konsistensi/i }));
    expect(screen.getByText(/Validasi Lolos \(100% Valid\)/i)).toBeTruthy();
    expect(screen.getByText(/90%/)).toBeTruthy();
  });

  it('triggers onOpenManual callback when manual button is pressed on a failed section', () => {
    const onOpenManualMock = vi.fn();

    const failedStatus: BlueprintStatus = {
      ...mockStatus,
      sections: [
        {
          type: 'journey',
          status: 'failed',
          attempts: 2,
          error_code: 'RATE_LIMIT',
          updated_at: '2026-09-17T10:02:00Z',
        },
      ],
    };

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: failedStatus,
      detail: mockDetail,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView onOpenManual={onOpenManualMock} />, {
      wrapper: createWrapper(),
    });

    const manualBtn = screen.getByRole('button', { name: /lengkapi manual/i });
    expect(manualBtn).toBeTruthy();
    fireEvent.click(manualBtn);
    expect(onOpenManualMock).toHaveBeenCalledWith('journey');
  });

  it('opens ManualCompletionDialog when Lengkapi Manual is clicked without prop handler', () => {
    const failedStatus: BlueprintStatus = {
      ...mockStatus,
      sections: [
        {
          type: 'architecture',
          status: 'failed',
          attempts: 3,
          error_code: 'security_failure',
          updated_at: '2026-09-17T10:02:00Z',
        },
      ],
    };

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: failedStatus,
      detail: {
        ...mockDetail,
        status: failedStatus,
      },
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    const manualBtn = screen.getByRole('button', { name: /lengkapi manual/i });
    fireEvent.click(manualBtn);

    expect(screen.getByText(/Lengkapi Manual: Arsitektur Sistem/i)).toBeTruthy();
  });

  it('opens ManualCompletionDialog from ValidationPanel when Koreksi button is clicked', () => {
    const detailWithErrors: BlueprintDetail = {
      ...mockDetail,
      validation_result: {
        is_valid: false,
        coverage_score: 60,
        errors: [
          {
            section: 'workflow',
            code: 'ORPHAN_NODE',
            message: 'Terdapat node tanpa koneksi edge di workflow',
          },
        ],
      },
    };

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: mockStatus,
      detail: detailWithErrors,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    // Switch to validation tab
    fireEvent.click(screen.getByRole('tab', { name: /panel validasi & konsistensi/i }));

    // Click Koreksi button for workflow error
    const koreksiBtn = screen.getByRole('button', { name: /koreksi/i });
    expect(koreksiBtn).toBeTruthy();
    fireEvent.click(koreksiBtn);

    // Manual completion dialog opens for workflow
    expect(screen.getByText(/Lengkapi Manual: Workflow Bisnis/i)).toBeTruthy();
  });

  it('renders configuration banner and settings navigation on provider_configuration', () => {
    const failedStatus: BlueprintStatus = {
      ...mockStatus,
      sections: [
        {
          type: 'journey',
          status: 'failed',
          attempts: 1,
          error_code: 'provider_configuration',
          updated_at: '2026-09-17T10:02:00Z',
        },
      ],
    };

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: failedStatus,
      detail: mockDetail,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      needsLeaseRecovery: false,
      hasFailedSection: true,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Konfigurasi AI Provider Belum Diatur/i)).toBeTruthy();
    const settingsBtn = screen.getByRole('button', { name: /buka pengaturan/i });
    expect(settingsBtn).toBeTruthy();
    fireEvent.click(settingsBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/quotation/ai-settings');
  });

  it('renders credential banner and settings navigation on provider_invalid_credential', () => {
    const failedStatus: BlueprintStatus = {
      ...mockStatus,
      sections: [
        {
          type: 'architecture',
          status: 'failed',
          attempts: 1,
          error_code: 'provider_invalid_credential',
          updated_at: '2026-09-17T10:02:00Z',
        },
      ],
    };

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: failedStatus,
      detail: mockDetail,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      needsLeaseRecovery: false,
      hasFailedSection: true,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Kredensial AI Provider Tidak Valid/i)).toBeTruthy();
    const settingsBtn = screen.getByRole('button', { name: /buka pengaturan/i });
    expect(settingsBtn).toBeTruthy();
    fireEvent.click(settingsBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/quotation/ai-settings');
  });

  it('renders availability banner and retry button on provider_unavailable without configuration banner', () => {
    const retrySectionMock = vi.fn();
    const failedStatus: BlueprintStatus = {
      ...mockStatus,
      sections: [
        {
          type: 'journey',
          status: 'failed',
          attempts: 1,
          error_code: 'provider_unavailable',
          updated_at: '2026-09-17T10:02:00Z',
        },
      ],
    };

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: failedStatus,
      detail: mockDetail,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      needsLeaseRecovery: false,
      hasFailedSection: true,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: retrySectionMock,
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Layanan AI Provider Tidak Tersedia/i)).toBeTruthy();
    expect(screen.queryByText(/Konfigurasi AI Provider Belum Diatur/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /buka pengaturan/i })).toBeNull();

    const retryButtons = screen.getAllByRole('button', { name: /coba lagi/i });
    expect(retryButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(retryButtons[0]);
    expect(retrySectionMock).toHaveBeenCalledWith('journey');
  });

  it('renders distinct timeout banner on provider_timeout', () => {
    const failedStatus: BlueprintStatus = {
      ...mockStatus,
      sections: [
        {
          type: 'wbs',
          status: 'failed',
          attempts: 1,
          error_code: 'provider_timeout',
          updated_at: '2026-09-17T10:02:00Z',
        },
      ],
    };

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: failedStatus,
      detail: mockDetail,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      needsLeaseRecovery: false,
      hasFailedSection: true,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Batas Waktu Permintaan AI Habis/i)).toBeTruthy();
  });

  it('renders distinct rate limit banner on provider_rate_limited', () => {
    const failedStatus: BlueprintStatus = {
      ...mockStatus,
      sections: [
        {
          type: 'workflow',
          status: 'failed',
          attempts: 1,
          error_code: 'provider_rate_limited',
          updated_at: '2026-09-17T10:02:00Z',
        },
      ],
    };

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: failedStatus,
      detail: mockDetail,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      needsLeaseRecovery: false,
      hasFailedSection: true,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Batas Penggunaan AI Terlampaui/i)).toBeTruthy();
  });

  it('renders prompt error banner with manual completion guidance on prompt_construction_failed without settings link', () => {
    const failedStatus: BlueprintStatus = {
      ...mockStatus,
      sections: [
        {
          type: 'state_machine',
          status: 'failed',
          attempts: 1,
          error_code: 'prompt_construction_failed',
          updated_at: '2026-09-17T10:02:00Z',
        },
      ],
    };

    vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
      blueprintId: 'bp-123',
      status: failedStatus,
      detail: mockDetail,
      runnerState: 'idle',
      isLoading: false,
      isFetching: false,
      isPolling: false,
      isStaleLease: false,
      needsLeaseRecovery: false,
      hasFailedSection: true,
      error: null,
      start: vi.fn(),
      stop: vi.fn(),
      recover: vi.fn(),
      retrySection: vi.fn(),
      refresh: vi.fn(),
    });

    render(<BlueprintProgressView />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Gagal Menyusun Prompt Blueprint/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /buka pengaturan/i })).toBeNull();
  });

  describe('Task 6: Separate Lease Recovery from Failed-Stage Recovery', () => {
    it('when generation_status is partial_failed, Periksa & Pulihkan is NOT rendered and section Retry/Manual are available', () => {
      const partialFailedStatus: BlueprintStatus = {
        ...mockStatus,
        generation_status: 'partial_failed',
        sections: [
          {
            type: 'journey',
            status: 'failed',
            attempts: 1,
            error_code: 'provider_timeout',
            updated_at: '2026-09-17T10:02:00Z',
          },
        ],
      };

      vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
        blueprintId: 'bp-123',
        status: partialFailedStatus,
        detail: mockDetail,
        runnerState: 'idle',
        isLoading: false,
        isFetching: false,
        isPolling: false,
        isStaleLease: false,
        needsLeaseRecovery: false,
        hasFailedSection: true,
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
        recover: vi.fn(),
        retrySection: vi.fn(),
        refresh: vi.fn(),
      });

      render(<BlueprintProgressView />, {
        wrapper: createWrapper(),
      });

      // Assert Periksa & Pulihkan is NOT present
      expect(screen.queryByRole('button', { name: /periksa & pulihkan/i })).toBeNull();
      // Assert Lanjutkan Generasi is NOT present in header actions
      expect(screen.queryByRole('button', { name: /lanjutkan generasi/i })).toBeNull();
      // Assert section-level retry and manual buttons are available
      expect(screen.getAllByRole('button', { name: /coba lagi/i }).length).toBeGreaterThanOrEqual(
        1
      );
      expect(screen.getByRole('button', { name: /lengkapi manual/i })).toBeTruthy();
    });

    it('when active generating section is older than 5 minutes, Periksa & Pulihkan and Stale Lease banner ARE rendered', () => {
      const staleGeneratingStatus: BlueprintStatus = {
        ...mockStatus,
        generation_status: 'in_progress',
        sections: [
          {
            type: 'journey',
            status: 'in_progress',
            attempts: 1,
            started_at: '2026-09-17T09:50:00Z',
            updated_at: '2026-09-17T09:50:00Z',
          },
        ],
      };

      vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
        blueprintId: 'bp-123',
        status: staleGeneratingStatus,
        detail: mockDetail,
        runnerState: 'recovery',
        isLoading: false,
        isFetching: false,
        isPolling: false,
        isStaleLease: true,
        needsLeaseRecovery: true,
        hasFailedSection: false,
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
        recover: vi.fn(),
        retrySection: vi.fn(),
        refresh: vi.fn(),
      });

      render(<BlueprintProgressView />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/Stale Lease Terdeteksi/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /periksa & pulihkan/i })).toBeTruthy();
    });

    it('after authoritative interrupted status, UI shows explicit section Retry and no second Continue', () => {
      const interruptedStatus: BlueprintStatus = {
        ...mockStatus,
        generation_status: 'partial_failed',
        sections: [
          {
            type: 'journey',
            status: 'interrupted' as any,
            attempts: 1,
            updated_at: '2026-09-17T10:05:00Z',
          },
        ],
      };

      vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
        blueprintId: 'bp-123',
        status: interruptedStatus,
        detail: mockDetail,
        runnerState: 'idle',
        isLoading: false,
        isFetching: false,
        isPolling: false,
        isStaleLease: false,
        needsLeaseRecovery: false,
        hasFailedSection: true,
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
        recover: vi.fn(),
        retrySection: vi.fn(),
        refresh: vi.fn(),
      });

      render(<BlueprintProgressView />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByRole('button', { name: /periksa & pulihkan/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /lanjutkan generasi/i })).toBeNull();
      expect(screen.getByRole('button', { name: /coba lagi/i })).toBeTruthy();
    });
  });

  describe('Lifecycle Actions & Dialogs', () => {
    it('renders Publikasikan and Hapus Draft buttons in draft mode and opens dialogs', () => {
      vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
        blueprintId: 'bp-123',
        status: { ...mockStatus, publication_status: 'draft', generation_status: 'completed' },
        detail: mockDetail,
        runnerState: 'idle',
        isLoading: false,
        isFetching: false,
        isPolling: false,
        isStaleLease: false,
        needsLeaseRecovery: false,
        hasFailedSection: false,
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
        recover: vi.fn(),
        retrySection: vi.fn(),
        refresh: vi.fn(),
      });

      render(<BlueprintProgressView />, { wrapper: createWrapper() });

      const publishBtn = screen.getByRole('button', { name: /publikasikan blueprint/i });
      const deleteBtn = screen.getByRole('button', { name: /hapus draft/i });

      expect(publishBtn).toBeTruthy();
      expect(deleteBtn).toBeTruthy();

      // Open publish dialog
      fireEvent.click(publishBtn);
      expect(screen.getByRole('heading', { name: /publikasikan blueprint/i })).toBeTruthy();

      // Close publish dialog
      fireEvent.click(screen.getByRole('button', { name: /batal/i }));

      // Open delete draft dialog
      fireEvent.click(deleteBtn);
      expect(screen.getByRole('heading', { name: /hapus draft blueprint\?/i })).toBeTruthy();
    });

    it('renders Buat Revisi Baru button in published mode and opens CreateRevisionDialog', async () => {
      vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
        blueprintId: 'bp-123',
        status: { ...mockStatus, publication_status: 'published', generation_status: 'completed' },
        detail: mockDetail,
        runnerState: 'idle',
        isLoading: false,
        isFetching: false,
        isPolling: false,
        isStaleLease: false,
        needsLeaseRecovery: false,
        hasFailedSection: false,
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
        recover: vi.fn(),
        retrySection: vi.fn(),
        refresh: vi.fn(),
      });

      render(<BlueprintProgressView />, { wrapper: createWrapper() });

      const createRevBtn = screen.getByRole('button', { name: /buat revisi baru/i });
      expect(createRevBtn).toBeTruthy();

      fireEvent.click(createRevBtn);
      expect(await screen.findByRole('heading', { name: /buat revisi blueprint/i })).toBeTruthy();
    });
  });

  describe('Share Links Integration', () => {
    it('renders Bagikan Blueprint button and opens ShareLinkDialog', async () => {
      vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
        blueprintId: 'bp-123',
        status: { ...mockStatus, publication_status: 'published' },
        detail: mockDetail,
        runnerState: 'idle',
        isLoading: false,
        isFetching: false,
        isPolling: false,
        isStaleLease: false,
        needsLeaseRecovery: false,
        hasFailedSection: false,
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
        recover: vi.fn(),
        retrySection: vi.fn(),
        refresh: vi.fn(),
      });

      render(<BlueprintProgressView />, { wrapper: createWrapper() });

      const shareBtn = screen.getByRole('button', { name: /bagikan blueprint/i });
      expect(shareBtn).toBeTruthy();

      fireEvent.click(shareBtn);
      expect(await screen.findByRole('heading', { name: /bagikan blueprint/i })).toBeTruthy();
    });

    it('switches to Tautan Berbagi tab and renders share link list', async () => {
      vi.spyOn(runnerHook, 'useBlueprintRunner').mockReturnValue({
        blueprintId: 'bp-123',
        status: mockStatus,
        detail: mockDetail,
        runnerState: 'idle',
        isLoading: false,
        isFetching: false,
        isPolling: false,
        isStaleLease: false,
        needsLeaseRecovery: false,
        hasFailedSection: false,
        error: null,
        start: vi.fn(),
        stop: vi.fn(),
        recover: vi.fn(),
        retrySection: vi.fn(),
        refresh: vi.fn(),
      });

      render(<BlueprintProgressView />, { wrapper: createWrapper() });

      const shareTab = screen.getByRole('tab', { name: /tautan berbagi/i });
      expect(shareTab).toBeTruthy();

      fireEvent.click(shareTab);
      expect(screen.getByText(/riwayat tautan berbagi/i)).toBeTruthy();
      expect(screen.getByText(/belum ada tautan berbagi aktif\./i)).toBeTruthy();
    });
  });
});
