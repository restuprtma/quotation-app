// @vitest-environment happy-dom

import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { PublishDialog } from './PublishDialog';

describe('PublishDialog', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders default info state when neither legal nor commercial is modified', () => {
    const onPublish = vi.fn();
    const onClose = vi.fn();

    render(
      <PublishDialog
        open
        onClose={onClose}
        onPublish={onPublish}
        legalModified={false}
        commercialModified={false}
      />
    );

    expect(screen.getByText('Publikasikan Quotation')).toBeTruthy();
    expect(
      screen.getByText(
        /Quotation yang dipublikasikan bersifat resmi dan immutable/i
      )
    ).toBeTruthy();

    expect(
      screen.queryByLabelText(/Saya mengonfirmasi perubahan pada klausul legal/i)
    ).toBeNull();
    expect(
      screen.queryByLabelText(/Saya mengonfirmasi perubahan nilai komersial/i)
    ).toBeNull();

    const publishBtn = screen.getByRole('button', { name: /^Publikasikan$/i }) as HTMLButtonElement;
    expect(publishBtn.disabled).toBe(false);

    fireEvent.click(publishBtn);
    expect(onPublish).toHaveBeenCalledWith({
      confirmLegalModified: false,
      confirmCommercialModified: false,
    });
  });

  it('renders legal modified warning and requires checkbox confirmation to enable publish', () => {
    const onPublish = vi.fn();
    const onClose = vi.fn();

    render(
      <PublishDialog
        open
        onClose={onClose}
        onPublish={onPublish}
        legalModified
        commercialModified={false}
      />
    );

    expect(
      screen.getByText(/Perubahan klausul legal terdeteksi. Harap konfirmasi sebelum mempublikasikan./i)
    ).toBeTruthy();

    const checkbox = screen.getByLabelText(
      /Saya mengonfirmasi perubahan pada klausul legal \/ pasal khusus./i
    ) as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox.checked).toBe(false);

    const publishBtn = screen.getByRole('button', { name: /^Publikasikan$/i }) as HTMLButtonElement;
    expect(publishBtn.disabled).toBe(true);

    // Checking the legal checkbox enables the button
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(publishBtn.disabled).toBe(false);

    fireEvent.click(publishBtn);
    expect(onPublish).toHaveBeenCalledWith({
      confirmLegalModified: true,
      confirmCommercialModified: false,
    });

    // Unchecking disables it again
    fireEvent.click(checkbox);
    expect(publishBtn.disabled).toBe(true);
  });

  it('renders commercial modified warning and requires checkbox confirmation to enable publish', () => {
    const onPublish = vi.fn();
    const onClose = vi.fn();

    render(
      <PublishDialog
        open
        onClose={onClose}
        onPublish={onPublish}
        legalModified={false}
        commercialModified
      />
    );

    expect(
      screen.getByText(
        /Perubahan komersial \/ harga manual terdeteksi. BA bertanggung jawab penuh atas perubahan harga ini./i
      )
    ).toBeTruthy();

    const checkbox = screen.getByLabelText(
      /Saya mengonfirmasi perubahan nilai komersial \/ harga manual./i
    ) as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox.checked).toBe(false);

    const publishBtn = screen.getByRole('button', { name: /^Publikasikan$/i }) as HTMLButtonElement;
    expect(publishBtn.disabled).toBe(true);

    // Check the box
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(publishBtn.disabled).toBe(false);

    fireEvent.click(publishBtn);
    expect(onPublish).toHaveBeenCalledWith({
      confirmLegalModified: false,
      confirmCommercialModified: true,
    });
  });

  it('requires both confirmations when both legal and commercial are modified', () => {
    const onPublish = vi.fn();
    const onClose = vi.fn();

    render(
      <PublishDialog
        open
        onClose={onClose}
        onPublish={onPublish}
        legalModified
        commercialModified
      />
    );

    const legalCheckbox = screen.getByLabelText(
      /Saya mengonfirmasi perubahan pada klausul legal \/ pasal khusus./i
    ) as HTMLInputElement;
    const commercialCheckbox = screen.getByLabelText(
      /Saya mengonfirmasi perubahan nilai komersial \/ harga manual./i
    ) as HTMLInputElement;
    const publishBtn = screen.getByRole('button', { name: /^Publikasikan$/i }) as HTMLButtonElement;

    expect(publishBtn.disabled).toBe(true);

    // Check only legal
    fireEvent.click(legalCheckbox);
    expect(publishBtn.disabled).toBe(true);

    // Check commercial too
    fireEvent.click(commercialCheckbox);
    expect(publishBtn.disabled).toBe(false);

    // Uncheck legal
    fireEvent.click(legalCheckbox);
    expect(publishBtn.disabled).toBe(true);

    // Recheck legal
    fireEvent.click(legalCheckbox);
    expect(publishBtn.disabled).toBe(false);

    fireEvent.click(publishBtn);
    expect(onPublish).toHaveBeenCalledWith({
      confirmLegalModified: true,
      confirmCommercialModified: true,
    });
  });

  it('disables cancel and publish buttons when isSubmitting is true', () => {
    const onPublish = vi.fn();
    const onClose = vi.fn();

    render(
      <PublishDialog
        open
        onClose={onClose}
        onPublish={onPublish}
        isSubmitting
        legalModified={false}
        commercialModified={false}
      />
    );

    const publishBtn = screen.getByRole('button', { name: /Publikasikan/i }) as HTMLButtonElement;
    const cancelBtn = screen.getByRole('button', { name: /Batal/i }) as HTMLButtonElement;

    expect(publishBtn.disabled).toBe(true);
    expect(cancelBtn.disabled).toBe(true);
  });

  it('calls onClose when cancel button is clicked', () => {
    const onPublish = vi.fn();
    const onClose = vi.fn();

    render(
      <PublishDialog
        open
        onClose={onClose}
        onPublish={onPublish}
        legalModified={false}
        commercialModified={false}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledOnce();
    expect(onPublish).not.toHaveBeenCalled();
  });

  it('displays revision number when revisionNumber prop is provided', () => {
    render(
      <PublishDialog
        open
        onClose={vi.fn()}
        onPublish={vi.fn()}
        revisionNumber={4}
      />
    );

    expect(screen.getByText('Revisi #4')).toBeTruthy();
  });
});
