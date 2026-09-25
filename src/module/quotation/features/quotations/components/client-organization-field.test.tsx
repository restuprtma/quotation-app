// @vitest-environment happy-dom

import type { ClientSummary } from '../types';

import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import { ClientOrganizationField } from './client-organization-field';

const mockClients: ClientSummary[] = [
  { id: 'client-1', name: 'PT Alpha Digital' },
  { id: 'client-2', name: 'CV Beta Solusi' },
  { id: 'client-3', name: 'Gamma Corp' },
];

function renderField(props: Partial<React.ComponentProps<typeof ClientOrganizationField>> = {}) {
  const onChange = props.onChange ?? vi.fn();
  return {
    onChange,
    ...render(
      <ThemeProvider theme={createTheme()}>
        <ClientOrganizationField
          label="Klien / Organisasi"
          options={mockClients}
          onChange={onChange}
          {...props}
        />
      </ThemeProvider>
    ),
  };
}

describe('ClientOrganizationField', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders autocomplete with options and filters case-insensitively', async () => {
    renderField();

    const input = screen.getByRole('combobox');
    expect(input).toBeTruthy();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'beta' } });

    expect(await screen.findByText('CV Beta Solusi')).toBeTruthy();
    expect(screen.queryByText('PT Alpha Digital')).toBeNull();
  });

  it('calls onChange when an existing option is selected', async () => {
    const { onChange } = renderField();

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Alpha' } });

    const option = await screen.findByText('PT Alpha Digital');
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith({
      id: 'client-1',
      name: 'PT Alpha Digital',
    });
  });

  it('displays the selected value when passed in props', () => {
    renderField({ value: mockClients[0] });

    const input = screen.getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('PT Alpha Digital');
  });

  it('renders "+ Tambah organisasi baru" button and opens creation dialog on click', async () => {
    renderField();

    const addBtn = screen.getByRole('button', { name: /\+ Tambah organisasi baru/i });
    expect(addBtn).toBeTruthy();

    fireEvent.click(addBtn);

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tambah Organisasi Baru' })).toBeTruthy();
    expect(screen.getByLabelText(/Nama Organisasi/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Batal/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Tambah/i })).toBeTruthy();
  });

  it('submits new organization creation, calls onChange with new client, and closes dialog', async () => {
    const newClient: ClientSummary = {
      id: 'client-new',
      name: 'PT Inovasi Mandiri',
    };
    const onCreate = vi.fn().mockResolvedValue(newClient);
    const { onChange } = renderField({ onCreate });

    const addBtn = screen.getByRole('button', { name: /\+ Tambah organisasi baru/i });
    fireEvent.click(addBtn);

    const dialogInput = await screen.findByLabelText(/Nama Organisasi/i);
    fireEvent.change(dialogInput, { target: { value: 'PT Inovasi Mandiri' } });

    const submitBtn = screen.getByRole('button', { name: /Tambah/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith('PT Inovasi Mandiri');
      expect(onChange).toHaveBeenCalledWith(newClient);
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('submits new organization on Enter key inside dialog input', async () => {
    const newClient: ClientSummary = {
      id: 'client-enter',
      name: 'PT Enter Jaya',
    };
    const onCreate = vi.fn().mockResolvedValue(newClient);
    const { onChange } = renderField({ onCreate });

    fireEvent.click(screen.getByRole('button', { name: /\+ Tambah organisasi baru/i }));

    const dialogInput = await screen.findByLabelText(/Nama Organisasi/i);
    fireEvent.change(dialogInput, { target: { value: 'PT Enter Jaya' } });
    fireEvent.keyDown(dialogInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith('PT Enter Jaya');
      expect(onChange).toHaveBeenCalledWith(newClient);
    });
  });

  it('closes dialog on Batal button without submitting', async () => {
    const onCreate = vi.fn();
    renderField({ onCreate });

    fireEvent.click(screen.getByRole('button', { name: /\+ Tambah organisasi baru/i }));
    expect(await screen.findByRole('dialog')).toBeTruthy();

    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('closes dialog on Escape key without submitting', async () => {
    const onCreate = vi.fn();
    renderField({ onCreate });

    fireEvent.click(screen.getByRole('button', { name: /\+ Tambah organisasi baru/i }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeTruthy();

    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('keeps dialog open, preserves user input, and shows error message on creation failure', async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error('Nama organisasi sudah terdaftar'));
    renderField({ onCreate });

    fireEvent.click(screen.getByRole('button', { name: /\+ Tambah organisasi baru/i }));

    const dialogInput = (await screen.findByLabelText(/Nama Organisasi/i)) as HTMLInputElement;
    fireEvent.change(dialogInput, { target: { value: 'PT Alpha Digital' } });

    const submitBtn = screen.getByRole('button', { name: /Tambah/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Nama organisasi sudah terdaftar')).toBeTruthy();
    });

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(dialogInput.value).toBe('PT Alpha Digital');
  });

  it('keeps add button enabled and functional when loadError is present', () => {
    renderField({
      options: [],
      loadError: new Error('Failed to load clients'),
    });

    const addBtn = screen.getByRole('button', { name: /\+ Tambah organisasi baru/i });
    expect(addBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(addBtn);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('disables add button when disabled prop is true', () => {
    renderField({ disabled: true });

    const addBtn = screen.getByRole('button', { name: /\+ Tambah organisasi baru/i });
    expect(addBtn.hasAttribute('disabled')).toBe(true);

    const input = screen.getByRole('combobox');
    expect(input.hasAttribute('disabled')).toBe(true);
  });
});
