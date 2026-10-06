import { it, vi, expect, describe, beforeEach } from 'vitest';
// @vitest-environment happy-dom
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { ShareLinkDialog } from './share-link-dialog';

describe('ShareLinkDialog', () => {
  const eligibleRevisions = [
    { id: 'rev-1', revision_number: 1, publication_status: 'superseded' },
    { id: 'rev-2', revision_number: 2, publication_status: 'published' },
    { id: 'rev-3', revision_number: 3, publication_status: 'draft' }, // Draft must be filtered or disabled
  ];

  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      configurable: true,
      writable: true,
    });
  });

  it('renders dialog and only enables published or superseded revisions', () => {
    render(
      <ShareLinkDialog
        open
        onClose={vi.fn()}
        revisions={eligibleRevisions}
        onCreate={vi.fn().mockResolvedValue({ url: 'https://app.tuai.id/p/blueprint/tok123' })}
      />
    );

    expect(screen.getByText('Bagikan Blueprint')).toBeDefined();
    // Draft revision should not be in the selectable options
    expect(screen.queryByText(/Revisi 3 \(draft\)/i)).toBeNull();
  });

  it('displays generated URL and copy button after creation', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: 'link-1',
      label: 'Test Link',
      revision_number: 2,
      url: 'https://app.tuai.id/p/blueprint/secret-raw-token',
      created_at: new Date().toISOString(),
    });

    render(
      <ShareLinkDialog open onClose={vi.fn()} revisions={eligibleRevisions} onCreate={mockCreate} />
    );

    const submitBtn = screen.getByRole('button', { name: /Buat Tautan/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('https://app.tuai.id/p/blueprint/secret-raw-token')).toBeDefined();
    });

    // Check copy button
    const copyBtn = screen.getByRole('button', { name: /Salin/i });
    expect(copyBtn).toBeDefined();
    fireEvent.click(copyBtn);
    expect(mockWriteText).toHaveBeenCalledWith('https://app.tuai.id/p/blueprint/secret-raw-token');
  });

  it('calls onClose when Batal is clicked', () => {
    const mockClose = vi.fn();
    render(
      <ShareLinkDialog open onClose={mockClose} revisions={eligibleRevisions} onCreate={vi.fn()} />
    );

    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
