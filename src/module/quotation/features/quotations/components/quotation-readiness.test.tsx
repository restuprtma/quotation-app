// @vitest-environment happy-dom

import { it, expect, describe, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import { QuotationReadiness } from './quotation-readiness';

describe('QuotationReadiness', () => {
  afterEach(cleanup);

  it('labels a final-ready draft for review without exposing a share action', () => {
    render(<QuotationReadiness readiness="ready_for_final" />);

    expect(screen.getByText('Ready for review and finalization')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /share|publish/i })).toBeNull();
  });

  it('explains that incomplete drafts need information and priceable drafts still need confirmation', () => {
    const { rerender } = render(<QuotationReadiness readiness="incomplete" />);
    expect(
      screen.getByText('More information is required before this quotation can be finalized.')
    ).toBeTruthy();

    rerender(<QuotationReadiness readiness="priceable" />);
    expect(
      screen.getByText(
        'Initial price is available; review remaining assumptions before finalization.'
      )
    ).toBeTruthy();
  });
});
