// @vitest-environment happy-dom
import type { ReactNode } from 'react';
import type { BlueprintStatus, BlueprintListResponse, QuotationRevisionOption } from '../types';

import { Route, Routes, MemoryRouter } from 'react-router';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';

import * as api from '../api';
import { BlueprintCreateView } from './blueprint-create-view';

vi.mock('@mui/x-data-grid', () => ({
  gridClasses: {},
}));

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

vi.mock('../../quotations/hooks/use-quotation-list', () => ({
  useQuotationList: () => ({
    data: [
      {
        id: 'q-1',
        quotation_number: 'QTN/2026/001',
        subject: 'Hospital Management System',
        status: 'active',
        commercial_scheme: 'custom_development',
      },
      {
        id: 'q-2',
        quotation_number: 'QTN/2026/002',
        subject: 'E-Commerce Platform',
        status: 'active',
        commercial_scheme: 'custom_development',
      },
    ],
    loading: false,
  }),
}));

function createWrapper(initialEntries = ['/blueprint']) {
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
          <Route path="/blueprint" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('BlueprintCreateView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    mockCompanyContext.company = { id: 'company-1', name: 'Company 1' };
  });

  afterEach(() => {
    cleanup();
  });

  const mockBlueprintListPopulated: BlueprintListResponse = {
    items: [
      {
        blueprint_id: 'bp-100',
        quotation_id: 'q-1',
        title: 'Hospital Core Blueprint',
        generation_status: 'completed',
        updated_at: '2026-09-17T09:00:00Z',
      },
    ],
    total: 1,
    page: 1,
    limit: 1,
    total_pages: 1,
  };

  const mockRevisionsQ1: QuotationRevisionOption[] = [
    {
      id: 'rev-1',
      version_number: 1,
      status: 'published',
      blueprint_eligible: true,
      blueprint_ineligible_reason: null,
    },
  ];

  it('renders header and create form', async () => {
    render(<BlueprintCreateView />, { wrapper: createWrapper() });

    expect(screen.getByText('Blueprint Generator')).toBeDefined();
    expect(
      screen.getByText(
        'Buat dan kelola blueprint arsitektur sistem dari quotation yang telah disetujui.'
      )
    ).toBeDefined();
    expect(screen.getByLabelText(/Pilih Quotation/i)).toBeDefined();
  });

  it('passes initial query parameters from search params to form', async () => {
    vi.spyOn(api, 'listQuotationRevisions').mockResolvedValue(mockRevisionsQ1);

    render(<BlueprintCreateView />, {
      wrapper: createWrapper(['/blueprint?quotation_id=q-1&revision_id=rev-1']),
    });

    await waitFor(() => {
      const qSelect = screen.getByLabelText(/Pilih Quotation/i);
      expect((qSelect as HTMLSelectElement).value).toBe('q-1');
    });
  });

  it('handles duplicate 409 by calling listBlueprints and navigating to existing blueprint', async () => {
    const listSpy = vi.spyOn(api, 'listBlueprints').mockResolvedValue(mockBlueprintListPopulated);

    vi.spyOn(api, 'listQuotationRevisions').mockImplementation(async (qid) => {
      if (qid === 'q-1') return mockRevisionsQ1;
      return [];
    });

    const conflictError: any = new Error('blueprint_already_exists');
    conflictError.status = 409;
    conflictError.response = {
      status: 409,
      data: { errors: 'blueprint_already_exists' },
    };
    vi.spyOn(api, 'createBlueprint').mockRejectedValue(conflictError);

    render(<BlueprintCreateView />, {
      wrapper: createWrapper(['/blueprint?quotation_id=q-1&revision_id=rev-1']),
    });

    await waitFor(() => {
      const qSelect = screen.getByLabelText(/Pilih Quotation/i);
      expect((qSelect as HTMLSelectElement).value).toBe('q-1');
    });

    await waitFor(() => {
      expect(screen.getByText(/v1 \(published\)/i)).toBeTruthy();
    });

    const revSelect = screen.getByLabelText(/Pilih Revisi/i);
    fireEvent.change(revSelect, { target: { value: 'rev-1' } });

    fireEvent.change(screen.getByLabelText(/Judul Blueprint/i), {
      target: { value: 'Hospital Blueprint' },
    });
    fireEvent.change(screen.getByLabelText(/Tujuan Bisnis 1/i), {
      target: { value: 'Improve care' },
    });
    fireEvent.change(screen.getByLabelText(/Aktor 1/i), {
      target: { value: 'Doctor' },
    });
    fireEvent.change(screen.getByLabelText(/Fase Bisnis 1/i), {
      target: { value: 'Registration' },
    });

    const submitBtn = screen.getByRole('button', { name: /Buat Blueprint/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Blueprint untuk quotation ini sudah ada/i)).toBeDefined();
    });

    const openExistingBtn = screen.getByRole('button', { name: /Buka Blueprint yang Ada/i });
    fireEvent.click(openExistingBtn);

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith({
        quotationId: 'q-1',
        page: 1,
        limit: 1,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/blueprint/bp-100');
    });
  });

  it('navigates to /blueprint/:id on successful blueprint creation', async () => {
    vi.spyOn(api, 'listQuotationRevisions').mockImplementation(async (qid) => {
      if (qid === 'q-1') return mockRevisionsQ1;
      return [];
    });

    const mockStatus: BlueprintStatus = {
      blueprint_id: 'bp-999',
      revision_id: 'rev-1',
      title: 'Newly Created Blueprint',
      generation_status: 'pending',
      publication_status: 'draft',
      completeness_status: 'incomplete',
      content_version: 1,
      sections: [],
      created_at: '2026-09-17T10:00:00Z',
      updated_at: '2026-09-17T10:00:00Z',
    };

    vi.spyOn(api, 'createBlueprint').mockResolvedValue(mockStatus);

    render(<BlueprintCreateView />, {
      wrapper: createWrapper(['/blueprint?quotation_id=q-1&revision_id=rev-1']),
    });

    await waitFor(() => {
      const qSelect = screen.getByLabelText(/Pilih Quotation/i);
      expect((qSelect as HTMLSelectElement).value).toBe('q-1');
    });

    await waitFor(() => {
      expect(screen.getByText(/v1 \(published\)/i)).toBeTruthy();
    });

    const revSelect = screen.getByLabelText(/Pilih Revisi/i);
    fireEvent.change(revSelect, { target: { value: 'rev-1' } });

    fireEvent.change(screen.getByLabelText(/Judul Blueprint/i), {
      target: { value: 'Newly Created Blueprint' },
    });
    fireEvent.change(screen.getByLabelText(/Tujuan Bisnis 1/i), {
      target: { value: 'Improve health' },
    });
    fireEvent.change(screen.getByLabelText(/Aktor 1/i), {
      target: { value: 'Patient' },
    });
    fireEvent.change(screen.getByLabelText(/Fase Bisnis 1/i), {
      target: { value: 'Consultation' },
    });

    const submitBtn = screen.getByRole('button', { name: /Buat Blueprint/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/blueprint/bp-999');
    });
  });
});
