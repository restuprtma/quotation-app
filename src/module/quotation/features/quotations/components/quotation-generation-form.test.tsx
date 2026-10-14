// @vitest-environment happy-dom
import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, cleanup, waitFor, fireEvent } from '@testing-library/react';

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

const defaultRateCards = {
  data: [{ id: 'rc-1', code: 'RC-DEV', is_active: true }],
  isLoading: false,
};

const mockUseActiveRateCards = vi.fn(() => defaultRateCards);

vi.mock('../hooks/use-active-rate-cards', () => ({
  useActiveRateCards: () => mockUseActiveRateCards(),
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
  mockUseActiveRateCards.mockReset();
  mockUseActiveRateCards.mockReturnValue(defaultRateCards);
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

describe('QuotationGenerationForm rate card selection', () => {
  it('includes custom rate cards (e.g. RC-AI-2026) without filtering them out', () => {
    mockUseActiveRateCards.mockReturnValue({
      data: [{ id: 'rc-ai', code: 'RC-AI-2026', name: 'AI Squad Rate Card', is_active: true }],
      isLoading: false,
    });

    render(
      <QuotationGenerationForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const rateCardInput = document.querySelector('input[name="rate_card_id"]') as HTMLInputElement;
    expect(rateCardInput.value).toBe('rc-ai');
  });

  it('places default rate card first and auto-selects it when multiple active rate cards exist', () => {
    mockUseActiveRateCards.mockReturnValue({
      data: [
        { id: 'rc-comm', code: 'RC-COMM', name: 'Commercial', is_active: true, is_default: false },
        { id: 'rc-ai', code: 'RC-AI-2026', name: 'AI Squad', is_active: true, is_default: true },
      ],
      isLoading: false,
    });

    render(
      <QuotationGenerationForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const rateCardInput = document.querySelector('input[name="rate_card_id"]') as HTMLInputElement;
    expect(rateCardInput.value).toBe('rc-ai');
  });
});

