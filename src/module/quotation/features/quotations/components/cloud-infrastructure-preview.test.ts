// @vitest-environment happy-dom
import type { CloudInfrastructurePreviewResponse } from '../types';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CloudInfrastructurePreview } from './cloud-infrastructure-preview';

vi.mock('src/locales', () => ({ useTranslate: () => ({ t: (key: string) => key }) }));
afterEach(cleanup);
describe('cloud infrastructure preview', () => {
  it('announces pending and stale states without fabricating amounts', () => {
    const view = render(createElement(CloudInfrastructurePreview, { isLoading: true, isStale: true }));
    expect(screen.getByText('cloudInfrastructure.preview.loading')).toBeTruthy();
    expect(view.container.querySelector('[aria-live="polite"]')).toBeTruthy();
    view.rerender(createElement(CloudInfrastructurePreview, { isLoading: false, isStale: true }));
    expect(screen.getByText('cloudInfrastructure.preview.stale')).toBeTruthy();
    expect(screen.queryByText(/Rp/)).toBeNull();
  });
  it('shows authoritative amounts and distinguishes scheduled invoices from a contract total', () => {
    const data = { calculation: { packages: [{ name: 'Server', line_total: 900000 }], monthly_subtotal: 900000, setup_subtotal: 0, scheduled_recurring_total: 1800000 }, resolved_profile: { sections: [{ number: 1, title: 'Biaya Venturo Cloud' }] } } as CloudInfrastructurePreviewResponse;
    render(createElement(CloudInfrastructurePreview, { data, isLoading: false, isStale: false }));
    expect(screen.getByText(/monthlySubtotal/).textContent).toContain('900.000');
    expect(screen.getByText(/scheduledRecurringTotal/).textContent).toContain('1.800.000');
    expect(screen.getByText('cloudInfrastructure.scheduledRecurringExplanation')).toBeTruthy();
    expect(screen.queryByText(/setupSubtotal/)).toBeNull();
  });
});
