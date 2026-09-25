// @vitest-environment happy-dom
import type { ReactNode } from 'react';
import type { BlueprintListResponse } from '../types';

import { Route, Routes, MemoryRouter } from 'react-router';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';

import * as api from '../api';
import { BlueprintListView } from './blueprint-list-view';

vi.mock('src/layouts/dashboard', () => ({
  DashboardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCompanyContext = {
  company: { id: 'company-1', name: 'Company 1' },
};

vi.mock('src/module/core/features/auth/hooks', () => ({
  useAuthContext: () => mockCompanyContext,
}));

function createWrapper(initialEntries = ['/blueprint/process']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/blueprint/process" element={children} />
          <Route path="/blueprint/list" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('BlueprintListView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    mockCompanyContext.company = { id: 'company-1', name: 'Company 1' };
  });

  afterEach(() => {
    cleanup();
  });

  const mockProcessList: BlueprintListResponse = {
    items: [
      {
        blueprint_id: 'bp-proc-1',
        quotation_id: 'q-1',
        title: 'Running Process Blueprint',
        generation_status: 'in_progress',
        updated_at: '2026-09-17T10:00:00Z',
      },
      {
        blueprint_id: 'bp-proc-2',
        quotation_id: 'q-2',
        title: 'Failed Process Blueprint',
        generation_status: 'failed',
        updated_at: '2026-09-17T11:00:00Z',
      },
    ],
    total: 2,
    page: 1,
    limit: 20,
    total_pages: 1,
  };

  const mockCompletedList: BlueprintListResponse = {
    items: [
      {
        blueprint_id: 'bp-comp-1',
        quotation_id: 'q-3',
        title: 'Completed Final Blueprint',
        generation_status: 'completed',
        updated_at: '2026-09-17T12:00:00Z',
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
    total_pages: 1,
  };

  it('renders process mode with correct headers, items, and filters', async () => {
    const listSpy = vi.spyOn(api, 'listBlueprints').mockResolvedValue(mockProcessList);

    render(<BlueprintListView mode="process" />, {
      wrapper: createWrapper(['/blueprint/process']),
    });

    expect(screen.getByText('Proses Blueprint')).toBeDefined();
    expect(
      screen.getByText(
        'Pantau dan lanjutkan generasi blueprint arsitektur yang sedang berjalan atau membutuhkan pemulihan.'
      )
    ).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Running Process Blueprint')).toBeDefined();
      expect(screen.getByText('Failed Process Blueprint')).toBeDefined();
    });

    expect(listSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statuses: ['pending', 'in_progress', 'partial_failed', 'failed'],
        page: 1,
        limit: 20,
      }),
      expect.any(AbortSignal)
    );
  });

  it('renders completed mode with correct headers, items, and filters', async () => {
    const listSpy = vi.spyOn(api, 'listBlueprints').mockResolvedValue(mockCompletedList);

    render(<BlueprintListView mode="completed" />, {
      wrapper: createWrapper(['/blueprint/list']),
    });

    expect(screen.getByText('Daftar Blueprint')).toBeDefined();
    expect(
      screen.getByText('Daftar blueprint arsitektur sistem yang telah selesai dibuat.')
    ).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Completed Final Blueprint')).toBeDefined();
      expect(screen.getByText('Selesai')).toBeDefined();
    });

    expect(listSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statuses: ['completed'],
        page: 1,
        limit: 20,
      }),
      expect.any(AbortSignal)
    );
  });

  it('renders mode-specific empty message when list is empty', async () => {
    vi.spyOn(api, 'listBlueprints').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      total_pages: 0,
    });

    render(<BlueprintListView mode="process" />, {
      wrapper: createWrapper(['/blueprint/process']),
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          'Tidak ada proses blueprint yang sedang berjalan atau membutuhkan pemulihan.'
        )
      ).toBeDefined();
    });
  });

  it('parses page and limit from URL search params', async () => {
    const listSpy = vi.spyOn(api, 'listBlueprints').mockResolvedValue({
      items: [],
      total: 30,
      page: 2,
      limit: 10,
      total_pages: 3,
    });

    render(<BlueprintListView mode="completed" />, {
      wrapper: createWrapper(['/blueprint/list?page=2&limit=10']),
    });

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        }),
        expect.any(AbortSignal)
      );
    });
  });

  it('navigates to create page on Buat Blueprint button click', async () => {
    vi.spyOn(api, 'listBlueprints').mockResolvedValue(mockCompletedList);

    render(<BlueprintListView mode="completed" />, {
      wrapper: createWrapper(['/blueprint/list']),
    });

    const createBtn = screen.getByRole('button', { name: /Buat Blueprint/i });
    fireEvent.click(createBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/blueprint');
  });
});
