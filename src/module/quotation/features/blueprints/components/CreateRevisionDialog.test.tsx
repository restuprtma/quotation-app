// @vitest-environment happy-dom
import { vi, it, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { CreateRevisionDialog, type QuotationRevisionSelectOption } from './CreateRevisionDialog';

describe('CreateRevisionDialog', () => {
  afterEach(() => {
    cleanup();
  });

  const mockQuotationRevisions: QuotationRevisionSelectOption[] = [
    { id: 'qrev-1', version_number: 1, status: 'published' },
    { id: 'qrev-2', version_number: 2, status: 'published' },
  ];

  it('renders title and defaults to clone mode', () => {
    render(
      <CreateRevisionDialog
        open
        onClose={vi.fn()}
        onCreateRevision={vi.fn()}
        quotationRevisions={mockQuotationRevisions}
      />
    );

    expect(screen.getByText('Buat Revisi Blueprint')).toBeTruthy();
    expect(screen.getByText('Klon Revisi Aktif')).toBeTruthy();
    expect(screen.getByText('Generate Ulang dari Quotation')).toBeTruthy();

    const cloneRadio = screen.getByRole('radio', { name: /Klon Revisi Aktif/i });
    expect((cloneRadio as HTMLInputElement).checked).toBe(true);

    const regenRadio = screen.getByRole('radio', { name: /Generate Ulang dari Quotation/i });
    expect((regenRadio as HTMLInputElement).checked).toBe(false);

    // Dropdown should not be visible when clone mode is active
    expect(screen.queryByLabelText(/Revisi Quotation Sumber/i)).toBeNull();
  });

  it('submits with mode clone when clone is selected', () => {
    const handleCreateRevision = vi.fn();

    render(
      <CreateRevisionDialog
        open
        onClose={vi.fn()}
        onCreateRevision={handleCreateRevision}
        quotationRevisions={mockQuotationRevisions}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Buat Revisi' });
    fireEvent.click(submitButton);

    expect(handleCreateRevision).toHaveBeenCalledWith({
      mode: 'clone',
      sourceQuotationRevId: undefined,
    });
  });

  it('shows revision select when regenerate_from_source is selected and submits chosen revision', () => {
    const handleCreateRevision = vi.fn();

    render(
      <CreateRevisionDialog
        open
        onClose={vi.fn()}
        onCreateRevision={handleCreateRevision}
        quotationRevisions={mockQuotationRevisions}
        currentSourceQuotationRevId="qrev-1"
      />
    );

    const regenRadio = screen.getByRole('radio', { name: /Generate Ulang dari Quotation/i });
    fireEvent.click(regenRadio);
    expect((regenRadio as HTMLInputElement).checked).toBe(true);

    // The dropdown for source quotation revision is now visible
    const select = screen.getByLabelText(/Revisi Quotation Sumber/i);
    expect(select).toBeTruthy();

    // Verify it defaulted to currentSourceQuotationRevId ("qrev-1")
    expect((select as HTMLSelectElement).value).toBe('qrev-1');

    // Change to qrev-2
    fireEvent.change(select, { target: { value: 'qrev-2' } });
    expect((select as HTMLSelectElement).value).toBe('qrev-2');

    const submitButton = screen.getByRole('button', { name: 'Buat Revisi' });
    fireEvent.click(submitButton);

    expect(handleCreateRevision).toHaveBeenCalledWith({
      mode: 'regenerate_from_source',
      sourceQuotationRevId: 'qrev-2',
    });
  });

  it('disables buttons when isSubmitting is true', () => {
    render(
      <CreateRevisionDialog
        open
        onClose={vi.fn()}
        onCreateRevision={vi.fn()}
        quotationRevisions={mockQuotationRevisions}
        isSubmitting
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Buat Revisi' });
    const cancelButton = screen.getByRole('button', { name: 'Batal' });

    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    expect((cancelButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('calls onClose when Batal is clicked', () => {
    const handleClose = vi.fn();

    render(<CreateRevisionDialog open onClose={handleClose} onCreateRevision={vi.fn()} />);

    const cancelButton = screen.getByRole('button', { name: 'Batal' });
    fireEvent.click(cancelButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
