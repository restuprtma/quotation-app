// @vitest-environment happy-dom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignatureSettingsView } from './signature-settings-view';

afterEach(cleanup);

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

const mockMutateAsync = vi.fn();

vi.mock('../hooks/use-signature-settings', () => ({
  useSignatureSettings: () => ({
    data: {
      director_name: 'Yulianto Frandi',
      director_title: 'Direksi Venturo Pro',
      director_signature_data: '',
      company_stamp_data: '',
      is_configured: false,
    },
    isLoading: false,
  }),
  useUpdateSignatureSettings: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('SignatureSettingsView', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({});
  });

  it('renders director name, canvas/upload tabs, and stamp upload sections', () => {
    render(<SignatureSettingsView />);
    expect(screen.getByText(/Tanda Tangan & Stempel Perusahaan/i)).toBeInTheDocument();
    expect(screen.getByText(/Gambar Langsung/i)).toBeInTheDocument();
    expect(screen.getByText(/Unggah PNG/i)).toBeInTheDocument();
    expect(screen.getByText(/Stempel Perusahaan/i)).toBeInTheDocument();
  });

  it('allows tab switching between canvas and upload modes', () => {
    render(<SignatureSettingsView />);
    const uploadTab = screen.getByText(/Unggah PNG/i);
    fireEvent.click(uploadTab);
    expect(screen.getByTestId('signature-file-upload')).toBeInTheDocument();

    const canvasTab = screen.getByText(/Gambar Langsung/i);
    fireEvent.click(canvasTab);
    expect(screen.getByTestId('signature-canvas-container')).toBeInTheDocument();
  });

  it('renders live preview section with director info', () => {
    render(<SignatureSettingsView />);
    expect(screen.getByTestId('signature-stamp-preview')).toBeInTheDocument();
    expect(screen.getByText(/Yulianto Frandi/i)).toBeInTheDocument();
    expect(screen.getByText(/Direksi Venturo Pro/i)).toBeInTheDocument();
  });

  it('submits updated settings on save button click', async () => {
    render(<SignatureSettingsView />);
    const saveButton = screen.getByRole('button', { name: /Simpan Pengaturan/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        director_name: 'Yulianto Frandi',
        director_title: 'Direksi Venturo Pro',
        director_signature_data: '',
        company_stamp_data: '',
      });
    });
  });
});
