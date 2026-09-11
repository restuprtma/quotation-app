// @vitest-environment happy-dom
import { it, vi, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

import en from 'src/locales/langs/en/quotation.json';
import id from 'src/locales/langs/id/quotation.json';

import { CloudInfrastructureGenerationForm } from './cloud-infrastructure-generation-form';

const state = vi.hoisted(() => ({ successful: true, current: null as string | null, submitted: vi.fn() }));
vi.mock('src/locales', () => ({ useTranslate: () => ({ t: (key: string) => key }) }));
vi.mock('../hooks/use-clients', () => ({ useClients: () => ({ data: [] }) }));
vi.mock('../hooks/use-active-skills', () => ({ useActiveSkills: () => ({ data: [] }) }));
vi.mock('../hooks/use-active-rate-cards', () => ({ useActiveRateCards: () => ({ data: [] }) }));
vi.mock('../../rate-cards/hooks/use-rate-cards', () => ({ useRateCardDetail: () => ({ data: null, refetch: vi.fn() }) }));
vi.mock('../hooks/use-quotation-generation', () => ({ useCloudInfrastructurePreview: (payload: unknown) => {
  state.current = payload ? JSON.stringify(payload) : null;
  return { isSuccess: state.successful, isFetching: false, isDebouncing: false, currentFingerprint: state.current, successfulFingerprint: state.successful ? state.current : 'old' };
} }));
afterEach(() => { cleanup(); state.successful = true; state.submitted.mockClear(); });

function fill(name: string, value: string) { const input = document.querySelector(`[name="${name}"]`) as HTMLInputElement; fireEvent.change(input, { target: { value } }); fireEvent.blur(input); }
function fillValid() {
  fill('client_name', 'PIC'); fill('cloud_infrastructure.document_number', ' CTH/1 ');
  fill('cloud_infrastructure.package_items.0.name', ' VM ');
  for (const name of ['work_period', 'terms', 'invoice_date_label', 'due_date_label']) fill(`cloud_infrastructure.payment_schedule.0.${name}`, ' Bulan 1 ');
}

describe('cloud infrastructure generation form', () => {
  it('keeps Indonesian and English locale key paths parallel', () => {
    const paths = (value: object, prefix = ''): string[] => Object.entries(value).flatMap(([key, item]) => typeof item === 'object' ? paths(item, `${prefix}${key}.`) : [`${prefix}${key}`]).sort();
    expect(paths(id.cloudInfrastructure)).toEqual(paths(en.cloudInfrastructure));
  });
  it('submits normalized input only with a matching authoritative preview', async () => {
    const view = render(<CloudInfrastructureGenerationForm onSubmit={state.submitted} onCancel={vi.fn()} />);
    const submit = screen.getByRole('button', { name: 'cloudInfrastructure.actions.submit' });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    fillValid();
    await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(false));
    state.successful = false;
    view.rerender(<CloudInfrastructureGenerationForm onSubmit={state.submitted} onCancel={vi.fn()} />);
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    state.successful = true;
    view.rerender(<CloudInfrastructureGenerationForm onSubmit={state.submitted} onCancel={vi.fn()} />);
    fireEvent.click(submit);
    await waitFor(() => expect(state.submitted).toHaveBeenCalledOnce());
    expect(state.submitted.mock.calls[0][0].cloud_infrastructure.document_number).toBe('CTH/1');
    expect(state.submitted.mock.calls[0][0]).not.toHaveProperty('rate_card_id');
  });
  it('retains sibling activity values and never balances invoices automatically', async () => {
    render(<CloudInfrastructureGenerationForm onSubmit={state.submitted} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'cloudInfrastructure.actions.addScope' }));
    fill('cloud_infrastructure.scope_rows.0.sections.0.activities.0', 'First activity');
    fireEvent.click(screen.getByRole('button', { name: 'cloudInfrastructure.actions.addActivity' }));
    fill('cloud_infrastructure.scope_rows.0.sections.0.activities.1', 'Keep activity');
    fireEvent.click(screen.getByRole('button', { name: 'cloudInfrastructure.actions.removeActivity 1' }));
    expect((document.querySelector('[name="cloud_infrastructure.scope_rows.0.sections.0.activities.0"]') as HTMLInputElement).value).toBe('Keep activity');
    fill('cloud_infrastructure.package_items.0.unit_rate', '900000');
    expect((document.querySelector('[name="cloud_infrastructure.payment_schedule.0.nominal"]') as HTMLInputElement).value).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'cloudInfrastructure.actions.validate' }));
    await waitFor(() => expect(screen.getByRole('alert', { name: 'cloudInfrastructure.validation.title' })).toBe(document.activeElement));
  });
});
