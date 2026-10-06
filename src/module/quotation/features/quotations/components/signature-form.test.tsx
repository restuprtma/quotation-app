// @vitest-environment happy-dom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { SignatureForm } from './signature-form';

afterEach(() => {
  cleanup();
});

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

describe('SignatureForm', () => {
  it('renders all form fields and submit button', () => {
    const handleSubmit = vi.fn();
    render(<SignatureForm onSubmit={handleSubmit} />);

    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/I confirm and agree/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign Quotation/i })).toBeDefined();
  });

  it('validates required fields before submitting', async () => {
    const handleSubmit = vi.fn();
    render(<SignatureForm onSubmit={handleSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /Sign Quotation/i }));

    await waitFor(() => {
      expect(screen.getByText(/Full Name is required/i)).toBeDefined();
      expect(screen.getByText(/Email Address is required/i)).toBeDefined();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('requires signature data and consent to submit', async () => {
    const handleSubmit = vi.fn();
    render(<SignatureForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'budi@example.com' },
    });
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
        signer_name: 'Budi Santoso',
        signer_email: 'budi@example.com',
        signature_data:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII=',
        consent: true,
      });
    });
  });

  it('disables controls while submitting', () => {
    const handleSubmit = vi.fn();
    render(<SignatureForm onSubmit={handleSubmit} isSubmitting />);

    expect(screen.getByLabelText(/Full Name/i)).toHaveProperty('disabled', true);
    expect(screen.getByLabelText(/Email Address/i)).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: /Signing.../i })).toHaveProperty('disabled', true);
  });
});
