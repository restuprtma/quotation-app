// @vitest-environment happy-dom

import type { ClientSummary } from '../types';
import type { QuotationEntryState } from '../types/quotation-entry';

import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import idQuotation from 'src/locales/langs/id/quotation.json';

import { MeetingNotesForm } from './meeting-notes-form';

const mockClients: ClientSummary[] = [
  { id: 'client-1', name: 'PT Alpha Digital' },
  { id: 'client-2', name: 'CV Beta Solusi' },
];

function createTestI18n() {
  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    lng: 'id',
    fallbackLng: 'id',
    ns: ['quotation'],
    defaultNS: 'quotation',
    resources: {
      id: { quotation: idQuotation },
    },
    interpolation: { escapeValue: false },
  });
  return instance;
}

function renderForm(props: Partial<React.ComponentProps<typeof MeetingNotesForm>> = {}) {
  const i18nInstance = createTestI18n();
  const onSubmit = props.onSubmit ?? vi.fn();
  return {
    onSubmit,
    ...render(
      <I18nextProvider i18n={i18nInstance}>
        <ThemeProvider theme={createTheme()}>
          <MeetingNotesForm clients={mockClients} onSubmit={onSubmit} {...props} />
        </ThemeProvider>
      </I18nextProvider>
    ),
  };
}

describe('MeetingNotesForm', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders canonical identity fields and Indonesian labels without duplicate client inputs', () => {
    renderForm();

    expect(screen.getByRole('textbox', { name: /Judul Proyek \/ Subjek Proposal/i })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /Perusahaan \/ Organisasi Klien/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Attention \/ PIC Klien/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Catatan Meeting/i })).toBeTruthy();

    expect(screen.queryByLabelText('Nama Klien')).toBeNull();
    expect(screen.queryByLabelText('Nama Perusahaan')).toBeNull();
  });

  it('offers Auto and all eight schemes only when pipelineEnabled is true', () => {
    renderForm({ pipelineEnabled: true });

    expect(screen.getByRole('option', { name: 'Auto' })).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(9);
  });

  it('does not render a scheme selector or submit service_scheme for legacy callers', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    expect(screen.queryByLabelText(/Skema layanan/i)).toBeNull();
  });

  it('submits auto service_scheme only for pipeline callers', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit, pipelineEnabled: true });

    fireEvent.change(screen.getByRole('textbox', { name: /Judul Proyek \/ Subjek Proposal/i }), {
      target: { value: 'Pipeline quotation' },
    });
    const clientCombobox = screen.getByRole('combobox', {
      name: /Perusahaan \/ Organisasi Klien/i,
    });
    fireEvent.focus(clientCombobox);
    fireEvent.change(clientCombobox, { target: { value: 'Alpha' } });
    fireEvent.click(await screen.findByText('PT Alpha Digital'));
    fireEvent.change(screen.getByRole('textbox', { name: /Catatan Meeting/i }), {
      target: { value: 'Catatan meeting untuk pemrosesan pipeline quotation yang aman.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Buat Draf/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ service_scheme: 'auto' }));
    });
  });

  it('submits canonical payload with project_name, client_id, client_company_name, pic_name, and meeting_notes', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByRole('textbox', { name: /Judul Proyek \/ Subjek Proposal/i }), {
      target: { value: 'Portal Vendor Onboarding' },
    });

    const clientCombobox = screen.getByRole('combobox', {
      name: /Perusahaan \/ Organisasi Klien/i,
    });
    fireEvent.focus(clientCombobox);
    fireEvent.change(clientCombobox, { target: { value: 'Alpha' } });
    const option = await screen.findByText('PT Alpha Digital');
    fireEvent.click(option);

    fireEvent.change(screen.getByRole('textbox', { name: /Attention \/ PIC Klien/i }), {
      target: { value: 'Rani Rahmawati' },
    });

    fireEvent.change(screen.getByRole('textbox', { name: /Catatan Meeting/i }), {
      target: {
        value:
          'Klien membutuhkan portal onboarding vendor untuk integrasi ERP dan verifikasi dokumen legal.',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Buat Draf/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        project_name: 'Portal Vendor Onboarding',
        client_id: 'client-1',
        client_company_name: 'PT Alpha Digital',
        pic_name: 'Rani Rahmawati',
        meeting_notes:
          'Klien membutuhkan portal onboarding vendor untuk integrasi ERP dan verifikasi dokumen legal.',
      });
    });

    const submitCallArg = onSubmit.mock.calls[0][0];
    expect(submitCallArg).not.toHaveProperty('client_name');
    expect(submitCallArg).not.toHaveProperty('commercial_scheme');
  });

  it('validates required fields: project_name, client_id, and minimum meeting_notes length', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    fireEvent.click(screen.getByRole('button', { name: /Buat Draf/i }));

    expect(await screen.findByText('Judul proyek wajib diisi.')).toBeTruthy();
    expect(await screen.findByText('Perusahaan / Organisasi klien wajib dipilih.')).toBeTruthy();
    expect(await screen.findByText('Tambahkan minimal 20 karakter catatan meeting.')).toBeTruthy();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('supports creating a new client organization through dialog and selecting it', async () => {
    const newClient: ClientSummary = { id: 'client-new', name: 'PT Inovasi Solusindo' };
    const onCreateClient = vi.fn().mockResolvedValue(newClient);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderForm({ onCreateClient, onSubmit });

    const addBtn = screen.getByRole('button', { name: /\+ Tambah organisasi baru/i });
    fireEvent.click(addBtn);

    const dialogInput = await screen.findByLabelText(/Nama Organisasi/i);
    fireEvent.change(dialogInput, { target: { value: 'PT Inovasi Solusindo' } });
    fireEvent.click(screen.getByRole('button', { name: /Tambah/i }));

    await waitFor(() => {
      expect(onCreateClient).toHaveBeenCalledWith('PT Inovasi Solusindo');
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    fireEvent.change(screen.getByRole('textbox', { name: /Judul Proyek \/ Subjek Proposal/i }), {
      target: { value: 'Sistem Inventory Baru' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /Catatan Meeting/i }), {
      target: { value: 'Catatan rapat kickoff implementasi sistem inventory warehouse.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Buat Draf/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        project_name: 'Sistem Inventory Baru',
        client_id: 'client-new',
        client_company_name: 'PT Inovasi Solusindo',
        pic_name: undefined,
        meeting_notes: 'Catatan rapat kickoff implementasi sistem inventory warehouse.',
      });
    });
  });

  it('populates initial form values when controlled value prop is provided', () => {
    const initialValue: QuotationEntryState = {
      version: 1,
      project_name: 'E-Commerce Marketplace',
      client_id: 'client-2',
      client_company_name: 'CV Beta Solusi',
      pic_name: 'Budi Santoso',
      meeting_notes: 'Catatan meeting tersimpan dari sesi sebelumnya.',
    };

    renderForm({ value: initialValue });

    const projectInput = screen.getByRole('textbox', {
      name: /Judul Proyek \/ Subjek Proposal/i,
    }) as HTMLInputElement;
    const clientInput = screen.getByRole('combobox', {
      name: /Perusahaan \/ Organisasi Klien/i,
    }) as HTMLInputElement;
    const picInput = screen.getByRole('textbox', {
      name: /Attention \/ PIC Klien/i,
    }) as HTMLInputElement;
    const notesInput = screen.getByRole('textbox', {
      name: /Catatan Meeting/i,
    }) as HTMLInputElement;

    expect(projectInput.value).toBe('E-Commerce Marketplace');
    expect(clientInput.value).toBe('CV Beta Solusi');
    expect(picInput.value).toBe('Budi Santoso');
    expect(notesInput.value).toBe('Catatan meeting tersimpan dari sesi sebelumnya.');
  });

  it('notifies onChange callback when user types in form fields', async () => {
    const onChange = vi.fn();
    renderForm({ onChange });

    fireEvent.change(screen.getByRole('textbox', { name: /Judul Proyek \/ Subjek Proposal/i }), {
      target: { value: 'Aplikasi Kasir' },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 1,
          project_name: 'Aplikasi Kasir',
        })
      );
    });
  });

  it('triggers onOpenAdvanced with synced values without validating meeting notes min length', () => {
    const onOpenAdvanced = vi.fn();
    const onChange = vi.fn();

    renderForm({ onOpenAdvanced, onChange });

    fireEvent.change(screen.getByRole('textbox', { name: /Judul Proyek \/ Subjek Proposal/i }), {
      target: { value: 'Draft Cepat' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Pengaturan Lanjutan/i }));

    expect(onOpenAdvanced).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Tambahkan minimal 20 karakter catatan meeting.')).toBeNull();
  });

  it('protects against double submission and disables buttons while submitting', async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolveSubmit = res;
        })
    );

    renderForm({ onSubmit });

    fireEvent.change(screen.getByRole('textbox', { name: /Judul Proyek \/ Subjek Proposal/i }), {
      target: { value: 'Proyek Double Submit' },
    });
    const clientCombobox = screen.getByRole('combobox', {
      name: /Perusahaan \/ Organisasi Klien/i,
    });
    fireEvent.focus(clientCombobox);
    fireEvent.change(clientCombobox, { target: { value: 'Alpha' } });
    fireEvent.click(await screen.findByText('PT Alpha Digital'));

    fireEvent.change(screen.getByRole('textbox', { name: /Catatan Meeting/i }), {
      target: { value: 'Catatan meeting yang valid dan panjangnya mencukupi.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Buat Draf/i });
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('button', { name: /Membuat draf\.\.\./i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Membuat draf\.\.\./i })).toHaveProperty(
      'disabled',
      true
    );

    resolveSubmit();
  });

  it('renders backend issues alerts', () => {
    renderForm({
      issues: [
        {
          code: 'client_required',
          field: 'client',
          message: 'Klien belum valid',
          severity: 'blocking',
        },
        {
          code: 'budget_missing',
          field: 'budget',
          message: 'Budget belum diisi',
          severity: 'warning',
        },
      ],
    });

    expect(screen.getByText('client_required')).toBeTruthy();
    expect(screen.getByText(/Klien belum valid/)).toBeTruthy();
    expect(screen.getByText('budget_missing')).toBeTruthy();
    expect(screen.getByText(/Budget belum diisi/)).toBeTruthy();
  });

  it('renders backend issues alerts without leading colon when code is empty', () => {
    renderForm({
      issues: [
        { code: '', field: 'notes', message: 'Catatan belum dapat diproses', severity: 'blocking' },
      ],
    });

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Catatan belum dapat diproses');
    expect(alert.textContent).not.toContain(':');
  });
});
