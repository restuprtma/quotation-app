// @vitest-environment happy-dom
import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

import { QuotationGenerationForm } from './quotation-generation-form';

vi.mock('src/locales', () => ({
  useTranslate: () => ({ t: (key: string) => key }),
}));

vi.mock('../hooks/use-clients', () => ({
  useClients: () => ({ data: [{ id: 'client-1', name: 'Existing Client' }] }),
}));

vi.mock('../hooks/use-active-skills', () => ({
  useActiveSkills: () => ({ data: [] }),
}));

vi.mock('../hooks/use-active-rate-cards', () => ({
  useActiveRateCards: () => ({
    data: [{ id: 'rc-1', code: 'RC-DEV', is_active: true }],
    isLoading: false,
  }),
}));

vi.mock('../hooks/use-quotation-generation', () => ({
  useDedicatedSquadPreview: () => ({
    data: null,
    isFetching: false,
    isDebouncing: false,
    error: null,
  }),
}));

afterEach(() => {
  cleanup();
});

describe('QuotationGenerationForm entry identity integration', () => {
  it('pre-fills entryIdentity and does not auto-select clients[0]', () => {
    render(
      <QuotationGenerationForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        entryIdentity={{
          project_name: 'Dedicated Development Squad',
          client_id: 'client-custom-1',
          client_company_name: 'PT Kustom Mandiri',
          pic_name: 'Pak Mandiri',
        }}
      />
    );

    const subjectInput = document.querySelector('input[name="subject"]') as HTMLInputElement;
    expect(subjectInput.value).toBe('Dedicated Development Squad');

    const clientNameInput = document.querySelector('input[name="client_name"]') as HTMLInputElement;
    expect(clientNameInput.value).toBe('Pak Mandiri');
  });

  it('calls onEntryIdentityChange when identity fields change', async () => {
    const onEntryIdentityChange = vi.fn();

    render(
      <QuotationGenerationForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        entryIdentity={{
          project_name: 'Initial Project',
          client_id: '',
          client_company_name: '',
          pic_name: 'Initial PIC',
        }}
        onEntryIdentityChange={onEntryIdentityChange}
      />
    );

    const subjectInput = document.querySelector('input[name="subject"]') as HTMLInputElement;
    fireEvent.change(subjectInput, { target: { value: 'Updated Project Name' } });

    await waitFor(() => {
      expect(onEntryIdentityChange).toHaveBeenCalledWith(
        expect.objectContaining({
          project_name: 'Updated Project Name',
        })
      );
    });
  });
});
