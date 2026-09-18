// @vitest-environment happy-dom
import type { ReactNode } from 'react';
import type { QuotationOption, BlueprintStatus, QuotationRevisionOption } from '../types';

import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';

import * as api from '../api';
import { BlueprintSourceForm } from './blueprint-source-form';

const mockCompanyContext = {
  company: { id: 'company-1', name: 'Company 1' },
};

vi.mock('src/module/core/features/auth/hooks', () => ({
  useAuthContext: () => mockCompanyContext,
}));

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

describe('BlueprintSourceForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCompanyContext.company = { id: 'company-1', name: 'Company 1' };
  });

  afterEach(() => {
    cleanup();
  });

  const mockQuotations: QuotationOption[] = [
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
  ];

  const mockRevisionsQ1: QuotationRevisionOption[] = [
    {
      id: 'rev-1',
      version_number: 1,
      status: 'draft',
      blueprint_eligible: true,
      blueprint_ineligible_reason: null,
    },
    {
      id: 'rev-2',
      version_number: 2,
      status: 'published',
      blueprint_eligible: true,
      blueprint_ineligible_reason: null,
    },
    {
      id: 'rev-3',
      version_number: 3,
      status: 'superseded',
      blueprint_eligible: true,
      blueprint_ineligible_reason: null,
    },
    {
      id: 'rev-4',
      version_number: 4,
      status: 'draft',
      blueprint_eligible: false,
      blueprint_ineligible_reason: 'revision content is blank',
    },
  ];

  const mockStatus: BlueprintStatus = {
    blueprint_id: 'bp-123',
    revision_id: 'rev-1',
    title: 'Hospital Management System Blueprint',
    generation_status: 'pending',
    publication_status: 'draft',
    completeness_status: 'incomplete',
    content_version: 1,
    sections: [],
    created_at: '2026-09-17T10:00:00Z',
    updated_at: '2026-09-17T10:00:00Z',
  };

  it('renders form and handles required validation errors on empty submit', async () => {
    render(<BlueprintSourceForm quotations={mockQuotations} />, { wrapper: createWrapper() });

    const submitBtn = screen.getByRole('button', { name: /buat blueprint/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/quotation is required/i)).toBeTruthy();
      expect(screen.getByText(/title cannot be empty/i)).toBeTruthy();
    });
  });

  it('resets revision when switching quotation rapidly from Q1 to Q2', async () => {
    vi.spyOn(api, 'listQuotationRevisions').mockImplementation(async (qid) => {
      if (qid === 'q-1') return mockRevisionsQ1;
      if (qid === 'q-2') {
        return [
          {
            id: 'rev-q2-1',
            version_number: 1,
            status: 'draft',
            blueprint_eligible: true,
            blueprint_ineligible_reason: null,
          },
        ];
      }
      return [];
    });

    render(<BlueprintSourceForm quotations={mockQuotations} />, {
      wrapper: createWrapper(),
    });

    // Select Q1
    const quotationSelect = screen.getByLabelText(/pilih quotation/i);
    fireEvent.change(quotationSelect, { target: { value: 'q-1' } });

    await waitFor(() => {
      expect(screen.getByText(/v1 \(draft\)/i)).toBeTruthy();
    });

    // Select Revision 1
    const revisionSelect = screen.getByLabelText(/pilih revisi/i);
    fireEvent.change(revisionSelect, { target: { value: 'rev-1' } });
    expect((revisionSelect as HTMLSelectElement).value).toBe('rev-1');

    // Switch to Q2
    fireEvent.change(quotationSelect, { target: { value: 'q-2' } });

    // Revision should be reset
    await waitFor(() => {
      expect((revisionSelect as HTMLSelectElement).value).toBe('');
      expect(screen.getByText(/v1 \(draft\)/i)).toBeTruthy();
    });
  });

  it('disables ineligible revision and displays reason', async () => {
    vi.spyOn(api, 'listQuotationRevisions').mockResolvedValueOnce(mockRevisionsQ1);

    render(<BlueprintSourceForm quotations={mockQuotations} initialQuotationId="q-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/v4 \(draft\) - revision content is blank/i)).toBeTruthy();
    });

    const optIneligible = screen.getByText(
      /v4 \(draft\) - revision content is blank/i
    ) as HTMLOptionElement;
    expect(optIneligible.disabled).toBe(true);
  });

  it('allows selecting eligible draft, published, and superseded revisions', async () => {
    vi.spyOn(api, 'listQuotationRevisions').mockResolvedValueOnce(mockRevisionsQ1);

    render(<BlueprintSourceForm quotations={mockQuotations} initialQuotationId="q-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/v1 \(draft\)/i)).toBeTruthy();
      expect(screen.getByText(/v2 \(published\)/i)).toBeTruthy();
      expect(screen.getByText(/v3 \(superseded\)/i)).toBeTruthy();
    });

    const optDraft = screen.getByText(/v1 \(draft\)/i) as HTMLOptionElement;
    const optPublished = screen.getByText(/v2 \(published\)/i) as HTMLOptionElement;
    const optSuperseded = screen.getByText(/v3 \(superseded\)/i) as HTMLOptionElement;

    expect(optDraft.disabled).toBe(false);
    expect(optPublished.disabled).toBe(false);
    expect(optSuperseded.disabled).toBe(false);
  });

  it('shows confirmation/warning for invalid or foreign prefill', async () => {
    vi.spyOn(api, 'listQuotationRevisions').mockResolvedValueOnce([]);

    render(
      <BlueprintSourceForm quotations={mockQuotations} initialQuotationId="foreign-quotation-id" />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/quotation sumber dari deep link tidak ditemukan/i)).toBeTruthy();
    });
  });

  it('reuses idempotency key on identical retry and generates new key on changed payload', async () => {
    vi.spyOn(api, 'listQuotationRevisions').mockImplementation(async (qid) => {
      if (qid === 'q-1') return mockRevisionsQ1;
      return [];
    });
    const createSpy = vi.spyOn(api, 'createBlueprint');

    // First attempt fails with network error
    createSpy.mockRejectedValueOnce(new Error('Network error'));
    // Second attempt succeeds
    createSpy.mockResolvedValueOnce(mockStatus);

    render(<BlueprintSourceForm quotations={mockQuotations} />, {
      wrapper: createWrapper(),
    });

    // Select quotation and revision
    const quotationSelect = screen.getByLabelText(/pilih quotation/i);
    fireEvent.change(quotationSelect, { target: { value: 'q-1' } });

    await waitFor(() => {
      expect(screen.getByText(/v1 \(draft\)/i)).toBeTruthy();
    });

    const revisionSelect = screen.getByLabelText(/pilih revisi/i);
    fireEvent.change(revisionSelect, { target: { value: 'rev-1' } });

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/judul blueprint/i), {
      target: { value: 'Hospital Blueprint' },
    });
    fireEvent.change(screen.getByLabelText(/tujuan bisnis 1/i), {
      target: { value: 'Improve care' },
    });
    fireEvent.change(screen.getByLabelText(/aktor 1/i), {
      target: { value: 'Doctor' },
    });
    fireEvent.change(screen.getByLabelText(/fase bisnis 1/i), {
      target: { value: 'Registration' },
    });

    const submitBtn = screen.getByRole('button', { name: /buat blueprint/i });

    // Submit attempt 1
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    const firstKey = createSpy.mock.calls[0][0].idempotency_key;
    expect(firstKey).toBeDefined();

    // Submit attempt 2 (identical retry after error)
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(2);
    });

    const secondKey = createSpy.mock.calls[1][0].idempotency_key;
    expect(secondKey).toBe(firstKey); // Same key reused!

    // Now modify payload
    fireEvent.change(screen.getByLabelText(/judul blueprint/i), {
      target: { value: 'Hospital Blueprint Modified' },
    });

    createSpy.mockResolvedValueOnce(mockStatus);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(3);
    });

    const thirdKey = createSpy.mock.calls[2][0].idempotency_key;
    expect(thirdKey).not.toBe(firstKey); // New key generated because payload changed!
  });

  it('handles 409 duplicate blueprint error with open existing action', async () => {
    vi.spyOn(api, 'listQuotationRevisions').mockImplementation(async (qid) => {
      if (qid === 'q-1') return mockRevisionsQ1;
      return [];
    });
    const onDuplicateFound = vi.fn();

    const conflictError: any = new Error('blueprint_already_exists');
    conflictError.status = 409;
    conflictError.response = {
      status: 409,
      data: { errors: 'blueprint_already_exists' },
    };
    vi.spyOn(api, 'createBlueprint').mockRejectedValueOnce(conflictError);

    render(
      <BlueprintSourceForm quotations={mockQuotations} onDuplicateFound={onDuplicateFound} />,
      { wrapper: createWrapper() }
    );

    const quotationSelect = screen.getByLabelText(/pilih quotation/i);
    fireEvent.change(quotationSelect, { target: { value: 'q-1' } });

    await waitFor(() => {
      expect(screen.getByText(/v1 \(draft\)/i)).toBeTruthy();
    });

    const revisionSelect = screen.getByLabelText(/pilih revisi/i);
    fireEvent.change(revisionSelect, { target: { value: 'rev-1' } });

    fireEvent.change(screen.getByLabelText(/judul blueprint/i), {
      target: { value: 'Hospital Blueprint' },
    });
    fireEvent.change(screen.getByLabelText(/tujuan bisnis 1/i), {
      target: { value: 'Improve care' },
    });
    fireEvent.change(screen.getByLabelText(/aktor 1/i), {
      target: { value: 'Doctor' },
    });
    fireEvent.change(screen.getByLabelText(/fase bisnis 1/i), {
      target: { value: 'Registration' },
    });

    fireEvent.click(screen.getByRole('button', { name: /buat blueprint/i }));

    await waitFor(() => {
      expect(screen.getByText(/blueprint untuk quotation ini sudah ada/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /buka blueprint yang ada/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /buka blueprint yang ada/i }));
    expect(onDuplicateFound).toHaveBeenCalledWith('q-1');
  });
});
