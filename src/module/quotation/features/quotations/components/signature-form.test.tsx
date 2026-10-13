import { it, vi, expect, describe, afterEach } from 'vitest';
// @vitest-environment happy-dom
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';

import { SignatureForm } from './signature-form';

afterEach(() => {
  cleanup();
});

expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () =>
        pass
          ? 'expected element not to be in document'
          : 'expected element to be in document',
    };
  },
});

vi.mock('src/shared/ui/iconify', () => ({
  Iconify: ({ icon, ...props }: any) => <span data-testid={`icon-${icon}`} {...props} />,
}));

vi.mock('./signature-canvas', () => ({
  SignatureCanvas: ({ onChange, disabled }: any) => (
    <div data-testid="mock-signature-canvas">
      <button
        type="button"
        data-testid="mock-draw-sig"
        disabled={disabled}
        onClick={() =>
          onChange(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII='
          )
        }
      >
        Draw
      </button>
      <button
        type="button"
        data-testid="mock-clear-sig"
        disabled={disabled}
        onClick={() => onChange(null)}
      >
        Clear
      </button>
    </div>
  ),
}));

vi.mock('src/locales', () => ({
  useTranslate: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'public.signerName': 'Full Name',
        'public.signerEmail': 'Email Address',
        'public.consentLabel': 'I confirm and agree to this quotation.',
        'public.submitSignature': 'Sign Quotation',
        'public.signing': 'Signing...',
        'public.signatureRequired': 'Please draw your signature',
      };
      return translations[key] || key;
    },
  }),
}));

describe('SignatureForm Streamlined', () => {
  it('renders read-only client info and signature pad without name/email inputs', () => {
    render(
      <SignatureForm
        clientPic="Bapak Reza Mahardika"
        clientCompany="PT Cakrawala Pangan Sejahtera"
        onSubmit={vi.fn()}
      />
    );

    // Verify info is displayed
    expect(screen.getByText(/Bapak Reza Mahardika/i)).toBeInTheDocument();
    expect(screen.getByText(/PT Cakrawala Pangan Sejahtera/i)).toBeInTheDocument();

    // Verify no text input for name or email
    expect(screen.queryByLabelText(/Signer Name|Full Name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Signer Email|Email Address/i)).not.toBeInTheDocument();

    // Verify consent checkbox and submit button exist
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Tanda Tangani Quotation|Sign Quotation/i })
    ).toBeInTheDocument();
  });

  it('requires signature data and consent to submit', async () => {
    const handleSubmit = vi.fn();
    render(
      <SignatureForm
        clientPic="Bapak Reza Mahardika"
        clientCompany="PT Cakrawala Pangan Sejahtera"
        onSubmit={handleSubmit}
      />
    );

    fireEvent.click(screen.getByLabelText(/I confirm and agree/i));

    // Submit without drawing signature
    fireEvent.click(screen.getByRole('button', { name: /Sign Quotation/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please draw your signature/i)).toBeDefined();
    });
    expect(handleSubmit).not.toHaveBeenCalled();

    // Now draw signature
    fireEvent.click(screen.getByTestId('mock-draw-sig'));
    fireEvent.click(screen.getByRole('button', { name: /Sign Quotation/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        signature_data:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII=',
        consent: true,
      });
    });
  });

  it('disables controls while submitting', () => {
    const handleSubmit = vi.fn();
    render(
      <SignatureForm
        clientPic="Bapak Reza Mahardika"
        clientCompany="PT Cakrawala Pangan Sejahtera"
        onSubmit={handleSubmit}
        isSubmitting
      />
    );

    expect(screen.getByRole('checkbox')).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: /Signing.../i })).toHaveProperty('disabled', true);
  });
});
