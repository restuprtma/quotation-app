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

const mockQuotationEditor = vi.fn();
vi.mock('../components/quotation-editor', () => ({
  QuotationEditor: (props: any) => {
    mockQuotationEditor(props);
    return <div data-testid="quotation-editor" data-disabled={props.disabled} />;
  },
}));
vi.mock('../components/HistoryPanel', () => ({
  HistoryPanel: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="mock-history-panel">
        <span>Riwayat Revisi Mock</span>
        <button onClick={onClose}>Close History</button>
      </div>
    ) : null,
}));
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
    delete (quotationDetail as any).public_token;
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

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Publikasikan$/i })).toBeTruthy()
    );
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

  it('renders Riwayat button in header toolbar and opens HistoryPanel on click', async () => {
    render(
      <MemoryRouter>
        <QuotationEditorView id="quotation-1" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /^history$/i })).toBeTruthy());

    // Before clicking, history panel is not open
    expect(screen.queryByTestId('mock-history-panel')).toBeNull();

    // Click Riwayat button
    fireEvent.click(screen.getByRole('button', { name: /^history$/i }));

    // Now history panel is open
    expect(screen.getByTestId('mock-history-panel')).toBeTruthy();
  });

  it('enforces read-only guard when quotation status is published', async () => {
    quotationDetail.status = 'published';

    render(
      <MemoryRouter>
        <QuotationEditorView id="quotation-1" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('read_only_notice')).toBeTruthy());

    // QuotationEditor receives disabled=true
    expect(mockQuotationEditor).toHaveBeenCalledWith(expect.objectContaining({ disabled: true }));

    // Save Draft button is disabled
    const saveDraftBtn = screen.getByRole('button', { name: /editor\.saveDraft/i });
    expect((saveDraftBtn as HTMLButtonElement).disabled).toBe(true);

    // Regenerate button is disabled
    const regenBtn = screen.getByRole('button', { name: /editor\.regenerate/i });
    expect((regenBtn as HTMLButtonElement).disabled).toBe(true);

    // Buat Revisi Baru is displayed, not Publikasikan
    expect(screen.getByRole('button', { name: /Buat Revisi Baru/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Publikasikan$/i })).toBeNull();
  });

  it('enforces read-only guard when quotation has superseded publication_status', async () => {
    quotationDetail.status = 'draft';
    (quotationDetail as any).publication_status = 'superseded';

    render(
      <MemoryRouter>
        <QuotationEditorView id="quotation-1" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('read_only_notice')).toBeTruthy());

    // QuotationEditor receives disabled=true
    expect(mockQuotationEditor).toHaveBeenCalledWith(expect.objectContaining({ disabled: true }));

    // Save Draft button is disabled
    const saveDraftBtn = screen.getByRole('button', { name: /editor\.saveDraft/i });
    expect((saveDraftBtn as HTMLButtonElement).disabled).toBe(true);

    delete (quotationDetail as any).publication_status;
  });

  it('renders Copy Public Link and Open Link buttons when quotation is published (read-only)', async () => {
    quotationDetail.status = 'published';
    (quotationDetail as any).public_token = 'pub-token-abc-123';

    render(
      <MemoryRouter>
        <QuotationEditorView id="quotation-1" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /Salin Link Publik|Copy Public Link|editor\.copyPublicLink/i,
        })
      ).toBeDefined();
    });
    expect(
      screen.getByRole('button', {
        name: /Buka Link Publik|Open Public Link|editor\.openPublicLink/i,
      })
    ).toBeDefined();
  });

  it('copies public link and opens public link on button click', async () => {
    quotationDetail.status = 'published';
    (quotationDetail as any).public_token = 'pub-token-abc-123';

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
      writable: true,
    });
    const openMock = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <MemoryRouter>
        <QuotationEditorView id="quotation-1" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /Salin Link Publik|Copy Public Link|editor\.copyPublicLink/i,
        })
      ).toBeDefined();
    });

    const copyBtn = screen.getByRole('button', {
      name: /Salin Link Publik|Copy Public Link|editor\.copyPublicLink/i,
    });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/p/q/pub-token-abc-123`
      );
      expect(toast.success).toHaveBeenCalledWith('editor.publicLinkCopied');
    });

    const openBtn = screen.getByRole('button', {
      name: /Buka Link Publik|Open Public Link|editor\.openPublicLink/i,
    });
    fireEvent.click(openBtn);

    expect(openMock).toHaveBeenCalledWith(
      `${window.location.origin}/p/q/pub-token-abc-123`,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('does not render public link buttons when quotation is published but public_token is absent', async () => {
    quotationDetail.status = 'published';
    delete (quotationDetail as any).public_token;

    render(
      <MemoryRouter>
        <QuotationEditorView id="quotation-1" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Buat Revisi Baru/i })).toBeTruthy();
    });

    expect(
      screen.queryByRole('button', {
        name: /Salin Link Publik|Copy Public Link|editor\.copyPublicLink/i,
      })
    ).toBeNull();
    expect(
      screen.queryByRole('button', {
        name: /Buka Link Publik|Open Public Link|editor\.openPublicLink/i,
      })
    ).toBeNull();
  });

  it('enforces read-only guard and renders public link buttons when quotation status is signed', async () => {
    quotationDetail.status = 'signed';
    (quotationDetail as any).public_token = 'pub-token-signed-123';

    render(
      <MemoryRouter>
        <QuotationEditorView id="quotation-1" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('read_only_notice')).toBeTruthy());

    // QuotationEditor receives disabled=true
    expect(mockQuotationEditor).toHaveBeenCalledWith(expect.objectContaining({ disabled: true }));

    // Save Draft button is disabled
    const saveDraftBtn = screen.getByRole('button', { name: /editor\.saveDraft/i });
    expect((saveDraftBtn as HTMLButtonElement).disabled).toBe(true);

    // Public link buttons are displayed
    expect(
      screen.getByRole('button', {
        name: /Salin Link Publik|Copy Public Link|editor\.copyPublicLink/i,
      })
    ).toBeDefined();
    expect(
      screen.getByRole('button', {
        name: /Buka Link Publik|Open Public Link|editor\.openPublicLink/i,
      })
    ).toBeDefined();
  });

  it('shows error toast when copying public link fails', async () => {
    quotationDetail.status = 'published';
    (quotationDetail as any).public_token = 'pub-token-abc-123';

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
      configurable: true,
      writable: true,
    });

    render(
      <MemoryRouter>
        <QuotationEditorView id="quotation-1" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /Salin Link Publik|Copy Public Link|editor\.copyPublicLink/i,
        })
      ).toBeDefined();
    });

    const copyBtn = screen.getByRole('button', {
      name: /Salin Link Publik|Copy Public Link|editor\.copyPublicLink/i,
    });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('editor.copyFailed');
    });
  });
});
