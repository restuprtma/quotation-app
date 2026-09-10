import { it, expect, describe } from 'vitest';

import {
  isTalentOutsourcingSubmitReady,
  toTalentOutsourcingPreviewViewModel,
} from './talent-outsourcing-preview';

const preview: any = {
  calculation: {
    engagement_mode: 'manpower_supply',
    total_before_tax: 608240000,
    dpp_amount: 557553333,
    tax_amount: 66906400,
    grand_total: 675146400,
    payment_total: 675146400,
  },
  resolved_profile: {
    show_non_personnel: true,
    show_preparation: false,
    show_preparation_discount: false,
    sections: [],
  },
};
describe('talent outsourcing preview', () => {
  it('maps server authoritative response', () =>
    expect(toTalentOutsourcingPreviewViewModel(preview)).toMatchObject({
      engagementMode: 'manpower_supply',
      grandTotal: 675146400,
      showNonPersonnel: true,
    }));
  it('only enables submit for current successful preview', () => {
    expect(
      isTalentOutsourcingSubmitReady({
        isValid: true,
        hasPreview: true,
        isFetching: false,
        isDebouncing: false,
        hasError: false,
        previewMatchesInput: true,
      })
    ).toBe(true);
    expect(
      isTalentOutsourcingSubmitReady({
        isValid: true,
        hasPreview: true,
        isFetching: true,
        isDebouncing: false,
        hasError: false,
        previewMatchesInput: true,
      })
    ).toBe(false);
  });
});
