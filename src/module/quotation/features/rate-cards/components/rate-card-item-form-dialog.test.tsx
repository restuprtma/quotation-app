// @vitest-environment happy-dom
import type { RateCardItem } from '../types';

import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

import { RateCardItemFormDialog } from './rate-card-item-form-dialog';

afterEach(cleanup);

vi.mock('src/shared/ui/iconify', () => ({
  Iconify: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

vi.mock('src/locales', () => ({
  useTranslate: (ns?: string) => ({
    t: (key: string, options?: any) => {
      const dict: Record<string, string> = {
        'itemDialog.createTitle': 'Tambah Posisi Baru',
        'itemDialog.editTitle': 'Edit Posisi',
        'itemDialog.displayNameLabel': 'Nama Posisi',
        'itemDialog.roleLabel': 'Pengenal Role (Slug)',
        'itemDialog.disciplineLabel': 'Disiplin',
        'itemDialog.seniorityLabel': 'Senioritas',
        'itemDialog.termTypeLabel': 'Durasi Kerja',
        'itemDialog.amountPerMonthLabel': 'Tarif Bulanan',
        'itemDialog.advancedCostTitle': 'Rincian Biaya Lanjutan',
        'itemDialog.advancedCostSubtitle': 'Komponen breakdown 5 biaya',
        'breakdown.title': 'Rincian 5 Komponen Biaya',
        'negotiation.title': 'Batas Negosiasi',
        'preparation.title': 'Biaya Persiapan & Rekrutmen',
        'terms.shortTerm': 'Jangka Pendek (< 6 bln)',
        'terms.longTerm': 'Jangka Panjang (>= 6 bln)',
        'actions.cancel': 'Batal',
        'actions.add': 'Tambah',
        'actions.save': 'Simpan',
      };
      return dict[key] || options?.defaultValue || key;
    },
  }),
}));

const mockItem: RateCardItem = {
  id: 'item-101',
  rate_card_id: 'rc-1',
  role: 'backend_programmer',
  display_name: 'Senior Backend Specialist',
  seniority: 'senior',
  discipline: 'ENGINEERING',
  term_type: 'long_term',
  amount_per_month: 25000000,
  base_salary: 18000000,
  tech_lead_fee: 2500000,
  ai_rnd_fee: 1000000,
  workspace_fee: 1000000,
  management_fee: 2500000,
  daily_rate: 1136364,
  hourly_rate: 144509,
  education_requirement: 'S1',
  experience_requirement: '> 5 years',
  published_rate: 25000000,
  max_discount_pct: 10,
  floor_rate: 22500000,
  kickoff_fee: 1000000,
  recruitment_fee: 2000000,
  onboarding_fee: 3000000,
  total_hiring_fee: 6000000,
};

describe('RateCardItemFormDialog', () => {
  it('renders with defaults when open', () => {
    render(
      <RateCardItemFormDialog
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Title should be Create Title
    expect(screen.getByText('Tambah Posisi Baru')).toBeDefined();

    // Check display name and role inputs are empty
    const nameInput = screen.getByTestId('item-display-name') as HTMLInputElement;
    expect(nameInput.value).toBe('');

    const roleInput = screen.getByTestId('item-role') as HTMLInputElement;
    expect(roleInput.value).toBe('');

    const amountInput = screen.getByTestId('item-amount-per-month') as HTMLInputElement;
    expect(amountInput.value).toBe('');

    // Cancel and submit buttons rendered
    expect(screen.getByRole('button', { name: /batal/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /tambah/i })).toBeDefined();
  });

  it('submitting form with displayName, seniority, amount_per_month emits payload with auto-slugified role', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <RateCardItemFormDialog
        open
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    const nameInput = screen.getByTestId('item-display-name');
    const amountInput = screen.getByTestId('item-amount-per-month');

    // Enter displayName: "AI Engineer" and amount: 15000000
    fireEvent.change(nameInput, { target: { value: 'AI Engineer' } });
    fireEvent.change(amountInput, { target: { value: '15000000' } });

    // Submit the form
    const submitBtn = screen.getByRole('button', { name: /tambah/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'ai_engineer',
        display_name: 'AI Engineer',
        seniority: 'senior',
        discipline: 'ENGINEERING',
        term_type: 'long_term',
        amount_per_month: 15000000,
      })
    );

    expect(handleClose).toHaveBeenCalled();
  });

  it('populates initialData when provided for edit mode', () => {
    render(
      <RateCardItemFormDialog
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={mockItem}
      />
    );

    // Title should be Edit Title
    expect(screen.getByText('Edit Posisi')).toBeDefined();

    // Check pre-populated fields
    const nameInput = screen.getByTestId('item-display-name') as HTMLInputElement;
    expect(nameInput.value).toBe(mockItem.display_name);

    const roleInput = screen.getByTestId('item-role') as HTMLInputElement;
    expect(roleInput.value).toBe(mockItem.role);

    const amountInput = screen.getByTestId('item-amount-per-month') as HTMLInputElement;
    expect(amountInput.value).toBe(String(mockItem.amount_per_month));

    // Save button rendered instead of Tambah
    expect(screen.getByRole('button', { name: /simpan/i })).toBeDefined();
  });

  it('allows custom role slug instead of auto-generated if provided', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <RateCardItemFormDialog
        open
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const nameInput = screen.getByTestId('item-display-name');
    const roleInput = screen.getByTestId('item-role');
    const amountInput = screen.getByTestId('item-amount-per-month');

    fireEvent.change(nameInput, { target: { value: 'Senior AI Specialist' } });
    fireEvent.change(roleInput, { target: { value: 'custom_ai_expert' } });
    fireEvent.change(amountInput, { target: { value: '20000000' } });

    const submitBtn = screen.getByRole('button', { name: /tambah/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'custom_ai_expert',
        display_name: 'Senior AI Specialist',
        amount_per_month: 20000000,
      })
    );
  });
});
