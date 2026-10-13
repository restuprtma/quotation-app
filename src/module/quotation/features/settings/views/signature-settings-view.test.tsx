// @vitest-environment happy-dom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignatureSettingsView } from './signature-settings-view';
import { SignatureStampPreview } from '../components/signature-stamp-preview';

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
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

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
    mockToastError.mockReset();
    mockToastSuccess.mockReset();
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

  it('rejects non-PNG file upload with error toast', () => {
    render(<SignatureSettingsView />);
    const uploadTab = screen.getByText(/Unggah PNG/i);
    fireEvent.click(uploadTab);

    const fileInput = screen
      .getByTestId('signature-file-upload')
      .querySelector('input[type="file"]')!;
    const file = new File(['fake content'], 'sig.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockToastError).toHaveBeenCalledWith('Berkas harus berupa gambar berformat PNG');
  });

  it('rejects files larger than 2MB with error toast', () => {
    render(<SignatureSettingsView />);
    const stampInput = screen
      .getByTestId('stamp-file-upload')
      .querySelector('input[type="file"]')!;
    const bigFile = new File(['x'], 'stamp.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 3 * 1024 * 1024 });
    fireEvent.change(stampInput, { target: { files: [bigFile] } });

    expect(mockToastError).toHaveBeenCalledWith('Ukuran berkas melebihi batas maksimal 2MB');
  });
});

describe('SignatureStampPreview', () => {
  it('renders preview with correct overlay elements and order', () => {
    render(
      <SignatureStampPreview
        directorName="Test Director"
        directorTitle="Test Title"
        directorSignatureData="data:image/png;base64,sig"
        companyStampData="data:image/png;base64,stamp"
      />
    );

    const sigImg = screen.getByTestId('preview-director-signature');
    const stampImg = screen.getByTestId('preview-company-stamp');

    expect(sigImg).toBeInTheDocument();
    expect(stampImg).toBeInTheDocument();
    expect(sigImg.getAttribute('src')).toBe('data:image/png;base64,sig');
    expect(stampImg.getAttribute('src')).toBe('data:image/png;base64,stamp');
  });
});
