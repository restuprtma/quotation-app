// @vitest-environment happy-dom
import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, cleanup, waitFor, fireEvent } from '@testing-library/react';

import { SubscriptionSaaSGenerationForm } from './subscription-saas-generation-form';

vi.mock('src/locales', () => ({
  useTranslate: () => ({ t: (key: string) => key }),
}));

vi.mock('../hooks/use-clients', () => ({
  useClients: () => ({ data: [{ id: 'client-1', name: 'Existing Client' }] }),
}));

vi.mock('../hooks/use-active-skills', () => ({
  useActiveSkills: () => ({ data: [] }),
}));

vi.mock('../hooks/use-quotation-generation', () => ({
  useSubscriptionSaaSPreview: () => ({
    data: null,
    isFetching: false,
    isDebouncing: false,
    error: null,
  }),
}));

afterEach(() => {
  cleanup();
});

describe('SubscriptionSaaSGenerationForm entry identity integration', () => {
  it('pre-fills entryIdentity and does not auto-select clients[0]', () => {
    render(
      <SubscriptionSaaSGenerationForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        entryIdentity={{
          project_name: 'SaaS HR Portal',
          client_id: 'client-saas-1',
          client_company_name: 'PT Cloud Solutions',
          pic_name: 'Bpk. Hendra',
        }}
      />
    );

    const subjectInput = document.querySelector('input[name="subject"]') as HTMLInputElement;
    expect(subjectInput.value).toBe('SaaS HR Portal');

    const clientNameInput = document.querySelector('input[name="client_name"]') as HTMLInputElement;
    expect(clientNameInput.value).toBe('Bpk. Hendra');
  });

  it('calls onEntryIdentityChange when identity fields change', async () => {
    const onEntryIdentityChange = vi.fn();

    render(
      <SubscriptionSaaSGenerationForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        entryIdentity={{
          project_name: 'Initial SaaS',
          client_id: '',
          client_company_name: '',
          pic_name: 'Initial PIC',
        }}
        onEntryIdentityChange={onEntryIdentityChange}
      />
    );

    const subjectInput = document.querySelector('input[name="subject"]') as HTMLInputElement;
    fireEvent.change(subjectInput, { target: { value: 'Updated SaaS Project' } });

    await waitFor(() => {
      expect(onEntryIdentityChange).toHaveBeenCalledWith(
        expect.objectContaining({
          project_name: 'Updated SaaS Project',
        })
      );
    });
  });
});
