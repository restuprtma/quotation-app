// @vitest-environment happy-dom

import { toast } from 'sonner';
import { MemoryRouter } from 'react-router';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

import { QuotationEditorView } from './quotation-editor-view';
import { publishQuotation, createQuotationRevision } from '../api/lifecycle';

const { quotationDetail } = vi.hoisted(() => ({
  quotationDetail: {
    quotation_id: 'quotation-1',
    company_id: 'company-1',
    client_id: 'client-1',
    quotation_number: 'QT-001',
    subject: 'Snapshot-backed quotation',
    status: 'draft',
    revision_id: 'revision-1',
    created_at: '2026-09-28T00:00:00Z',
    updated_at: '2026-09-28T00:00:00Z',
    generation_status: 'completed',
    content_version: 1,
    content_html: '<p>Draft</p>',
    prompt_state: { readiness: 'ready' },
    prompt_state_version: 1,
    catalog_roles: [
      {
        rate_item_id: 'backend-item',
        role: 'backend_programmer',
        display_name: 'Backend Programmer',
        seniority: 'senior',
        term_type: 'monthly',
      },
      {
        rate_item_id: 'frontend-item',
        role: 'frontend_programmer',
        display_name: 'Frontend Programmer',
        seniority: 'senior',
        term_type: 'monthly',
      },
    ],
  },
}));

vi.mock('src/locales', () => ({ useTranslate: () => ({ t: (key: string) => key }) }));
vi.mock('src/layouts/dashboard', () => ({
  DashboardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('src/shared/ui/iconify', () => ({
  Iconify: () => null,
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }));

const mockRefetch = vi.fn();
vi.mock('../hooks/use-quotation-draft', () => ({
  useQuotationDraft: () => ({
    data: quotationDetail,
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  }),
}));
vi.mock('../hooks/use-draft-save', () => ({
  useSaveDraft: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useRegenerateQuotation: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock('../hooks/use-prompt-workspace', () => ({
  usePromptWorkspace: () => ({ isPending: false, patch: vi.fn(), revise: vi.fn() }),
}));

vi.mock('../api/lifecycle', () => ({
  publishQuotation: vi.fn(),
  createQuotationRevision: vi.fn(),
}));

vi.mock('../../rate-cards/hooks/use-rate-cards', () => ({
  useRateCards: () => {
    throw new Error('The editor must not query rate cards');
  },
  useRateCardDetail: () => {
    throw new Error('The editor must not query rate-card details');
  },
}));

vi.mock('../components/quotation-editor', () => ({ QuotationEditor: () => <div /> }));
vi.mock('../components/regenerate-dialog', () => ({ RegenerateDialog: () => null }));
vi.mock('../components/legal-unlock-dialog', () => ({ LegalUnlockDialog: () => null }));
vi.mock('../components/quotation-readiness', () => ({ QuotationReadiness: () => null }));
vi.mock('../components/prompt-commercial-lock', () => ({ PromptCommercialLock: () => null }));
vi.mock('../components/prompt-revision-box', () => ({ PromptRevisionBox: () => null }));
vi.mock('../components/prompt-workspace-panel', () => ({
  PromptWorkspacePanel: ({ catalogRoles }: { catalogRoles: Array<{ display_name: string }> }) => (
    <div>{catalogRoles.map((role) => role.display_name).join(', ')}</div>
  ),
}));

describe('QuotationEditorView', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    quotationDetail.status = 'draft';
  });

  afterEach(() => {
    cleanup();
  });

  it('uses catalog roles from the quotation detail without querying rate cards', async () => {
    render(
      <MemoryRouter>
        <QuotationEditorView id="quotation-1" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Backend Programmer/)).toBeTruthy());
    expect(screen.getByText(/Frontend Programmer/)).toBeTruthy();
  });

  it('renders Publikasikan button in draft mode, opens PublishDialog, and publishes', async () => {
    vi.mocked(publishQuotation).mockResolvedValueOnce({ status: 'published' });

    render(
      <MemoryRouter>
        <QuotationEditorView id="quotation-1" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /^Publikasikan$/i })).toBeTruthy());
    const publishBtn = screen.getByRole('button', { name: /^Publikasikan$/i });
    expect((publishBtn as HTMLButtonElement).disabled).toBe(false);

    // Open PublishDialog
    fireEvent.click(publishBtn);

    await waitFor(() => expect(screen.getByText('Publikasikan Quotation')).toBeTruthy());

    // Inside dialog, click publish
    const dialogPublishBtns = screen.getAllByRole('button', { name: /^Publikasikan$/i });
    const dialogConfirmBtn = dialogPublishBtns[dialogPublishBtns.length - 1];
    fireEvent.click(dialogConfirmBtn);

    await waitFor(() => {
      expect(publishQuotation).toHaveBeenCalledWith('quotation-1', {
        revision_id: 'revision-1',
        content_version: 1,
        confirm_legal_modified: false,
        confirm_commercial_modified: false,
      });
      expect(toast.success).toHaveBeenCalledWith('Quotation berhasil dipublikasikan!');
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('renders Buat Revisi Baru button when quotation is published, and creates revision on click', async () => {
    quotationDetail.status = 'published';
    vi.mocked(createQuotationRevision).mockResolvedValueOnce({
      id: 'revision-2',
      quotation_id: 'quotation-1',
      revision_number: 2,
      publication_status: 'draft',
      content_version: 1,
    });

    render(
      <MemoryRouter>
        <QuotationEditorView id="quotation-1" />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Buat Revisi Baru/i })).toBeTruthy()
    );

    const createRevBtn = screen.getByRole('button', { name: /Buat Revisi Baru/i });
    fireEvent.click(createRevBtn);

    await waitFor(() => {
      expect(createQuotationRevision).toHaveBeenCalledWith('quotation-1');
      expect(toast.success).toHaveBeenCalledWith('Revisi baru berhasil dibuat');
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
