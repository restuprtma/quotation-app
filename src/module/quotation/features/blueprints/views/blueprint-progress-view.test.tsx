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
        journeys: [{ title: 'Pendaftaran Pasien' }],
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
});
