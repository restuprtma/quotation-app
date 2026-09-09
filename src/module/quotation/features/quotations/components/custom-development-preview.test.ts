import type { CustomDevelopmentPreviewResponse } from '../types';

import { it, expect, describe } from 'vitest';

import {
  toCustomDevelopmentPreviewRows,
  isCustomDevelopmentSubmitReady,
  formatCustomDevelopmentCurrency,
  toCustomDevelopmentPreviewViewModel,
} from './custom-development-preview';

describe('custom-development-preview view-model and submit gate', () => {
  const kopiStudioPreviewWithoutRights: CustomDevelopmentPreviewResponse = {
    calculation: {
      development_subtotal: 20_062_500,
      discount_amount: 2_062_500,
      total_investment: 18_000_000,
      monthly_total: 1_272_000,
      development_payment_total: 18_000_000,
      monthly_payment_rows: 1,
      development_lines: [
        {
          group_index: 0,
          item_index: 0,
          name: 'Senior Backend Developer',
          display_rate: 15_000_000,
          headcount: 1,
          period_label: '1',
          quoted_line_total: 15_000_000,
        },
        {
          group_index: 0,
          item_index: 1,
          name: 'Frontend Developer',
          display_rate: 5_062_500,
          headcount: 1,
          period_label: '1',
          quoted_line_total: 5_062_500,
        },
      ],
      monthly_lines: [
        {
          name: 'Venturo Cloud Mini',
          specification: 'Cloud Server Standard',
          unit_rate: 800_000,
          quantity: 1,
          line_total: 800_000,
        },
        {
          name: 'Support',
          specification: '4 Jam Maintenance Support',
          unit_rate: 93_000,
          quantity: 4,
          line_total: 372_000,
        },
        {
          name: 'WhatsApp Connect',
          specification: 'Integrasi Notifikasi WA',
          unit_rate: 100_000,
          quantity: 1,
          line_total: 100_000,
        },
      ],
    },
    resolved_profile: {
      show_monthly: true,
      show_rights: false,
      sections: [
        { number: 1, title: 'Biaya Development', component: 'development' },
        { number: 2, title: 'Biaya Monthly', component: 'monthly' },
        { number: 3, title: 'Lingkup Pekerjaan & Timeline', component: 'scope' },
        { number: 4, title: 'Pembayaran', component: 'payment' },
        { number: 5, title: 'Batasan dan Pengecualian', component: 'limitations' },
      ],
      rate_header: 'Rate (Monthly)',
      period_header: 'Period (Month)',
      show_rate_column: true,
      tax_disclaimer:
        'Seluruh rincian biaya belum termasuk PPN sesuai regulasi perpajakan yang berlaku di Indonesia.',
    },
  };

  const kopiStudioPreviewWithRights: CustomDevelopmentPreviewResponse = {
    ...kopiStudioPreviewWithoutRights,
    resolved_profile: {
      ...kopiStudioPreviewWithoutRights.resolved_profile,
      show_rights: true,
      sections: [
        { number: 1, title: 'Biaya Development', component: 'development' },
        { number: 2, title: 'Biaya Monthly', component: 'monthly' },
        { number: 3, title: 'Lingkup Pekerjaan & Timeline', component: 'scope' },
        { number: 4, title: 'Pembayaran', component: 'payment' },
        { number: 5, title: 'Hak Cipta & Lisensi', component: 'rights' },
        { number: 6, title: 'Batasan dan Pengecualian', component: 'limitations' },
      ],
    },
  };

  const assessmentOnlinePreview: CustomDevelopmentPreviewResponse = {
    calculation: {
      development_subtotal: 10_000_000,
      discount_amount: 0,
      total_investment: 10_000_000,
      monthly_total: 0,
      development_payment_total: 10_000_000,
      monthly_payment_rows: 0,
      development_lines: [
        {
          group_index: 0,
          item_index: 0,
          name: 'Fullstack Developer',
          display_rate: 10_000_000,
          headcount: 1,
          period_label: '1 Bulan',
          quoted_line_total: 10_000_000,
        },
      ],
      monthly_lines: [],
    },
    resolved_profile: {
      show_monthly: false,
      show_rights: false,
      sections: [
        { number: 1, title: 'Biaya Development', component: 'development' },
        { number: 2, title: 'Lingkup Pekerjaan & Timeline', component: 'scope' },
        { number: 3, title: 'Pembayaran', component: 'payment' },
        { number: 4, title: 'Batasan dan Pengecualian', component: 'limitations' },
      ],
      rate_header: 'Rate (Monthly)',
      period_header: 'Period (Month)',
      show_rate_column: true,
      tax_disclaimer: '',
    },
  };

  const ecoflowPreview: CustomDevelopmentPreviewResponse = {
    calculation: {
      development_subtotal: 15_000_000,
      discount_amount: 0,
      total_investment: 15_000_000,
      monthly_total: 0,
      development_payment_total: 15_000_000,
      monthly_payment_rows: 0,
      development_lines: [
        {
          group_index: 0,
          item_index: 0,
          name: 'Lead Developer',
          display_rate: 15_000_000,
          headcount: 1,
          period_label: '1',
          quoted_line_total: 15_000_000,
        },
        {
          group_index: 0,
          item_index: 1,
          name: 'Quality Assurance',
          display_rate: null,
          headcount: 1,
          period_label: '2 Minggu',
          quoted_line_total: null, // Included resource
        },
      ],
      monthly_lines: [],
    },
    resolved_profile: {
      show_monthly: false,
      show_rights: false,
      sections: [
        { number: 1, title: 'Biaya Development', component: 'development' },
        { number: 2, title: 'Lingkup Pekerjaan & Timeline', component: 'scope' },
        { number: 3, title: 'Pembayaran', component: 'payment' },
        { number: 4, title: 'Batasan dan Pengecualian', component: 'limitations' },
      ],
      rate_header: 'Rate (Monthly)',
      period_header: 'Period (Month)',
      show_rate_column: true,
      tax_disclaimer: '',
    },
  };

  it('transforms Kopi Studio preview without rights into 5 sections, total Rp18.000.000, and monthly Rp1.272.000', () => {
    const vm = toCustomDevelopmentPreviewViewModel(kopiStudioPreviewWithoutRights);
    const rows = toCustomDevelopmentPreviewRows(kopiStudioPreviewWithoutRights);

    expect(vm.developmentSubtotal).toBe(20_062_500);
    expect(vm.discountAmount).toBe(2_062_500);
    expect(vm.totalInvestment).toBe(18_000_000);
    expect(vm.monthlyTotal).toBe(1_272_000);
    expect(vm.developmentPaymentTotal).toBe(18_000_000);
    expect(vm.monthlyPaymentRows).toBe(1);
    expect(vm.developmentDelta).toBe(0);
    expect(vm.isBalanced).toBe(true);
    expect(vm.showMonthly).toBe(true);
    expect(vm.showRights).toBe(false);

    expect(vm.visibleSections).toHaveLength(5);
    expect(vm.sectionTitles).toEqual([
      'Biaya Development',
      'Biaya Monthly',
      'Lingkup Pekerjaan & Timeline',
      'Pembayaran',
      'Batasan dan Pengecualian',
    ]);
    expect(rows.totalInvestment).toBe(18_000_000);
  });

  it('transforms Kopi Studio preview with rights into 6 sections including Hak Cipta & Lisensi', () => {
    const vm = toCustomDevelopmentPreviewViewModel(kopiStudioPreviewWithRights);

    expect(vm.showRights).toBe(true);
    expect(vm.visibleSections).toHaveLength(6);
    expect(vm.sectionTitles).toEqual([
      'Biaya Development',
      'Biaya Monthly',
      'Lingkup Pekerjaan & Timeline',
      'Pembayaran',
      'Hak Cipta & Lisensi',
      'Batasan dan Pengecualian',
    ]);
  });

  it('transforms Assessment Online preview into development total Rp10.000.000, no monthly section', () => {
    const vm = toCustomDevelopmentPreviewViewModel(assessmentOnlinePreview);

    expect(vm.developmentSubtotal).toBe(10_000_000);
    expect(vm.discountAmount).toBe(0);
    expect(vm.totalInvestment).toBe(10_000_000);
    expect(vm.monthlyTotal).toBe(0);
    expect(vm.showMonthly).toBe(false);
    expect(vm.monthlyLines).toHaveLength(0);

    expect(vm.visibleSections).toHaveLength(4);
    expect(vm.sectionTitles).toEqual([
      'Biaya Development',
      'Lingkup Pekerjaan & Timeline',
      'Pembayaran',
      'Batasan dan Pengecualian',
    ]);
  });

  it('transforms Ecoflow preview into 4 sections without monthly, total Rp15.000.000, and asserts included QA row has null total', () => {
    const vm = toCustomDevelopmentPreviewViewModel(ecoflowPreview);

    expect(vm.totalInvestment).toBe(15_000_000);
    expect(vm.showMonthly).toBe(false);
    expect(vm.visibleSections).toHaveLength(4);

    expect(vm.developmentLines).toHaveLength(2);
    expect(vm.developmentLines[0].name).toBe('Lead Developer');
    expect(vm.developmentLines[0].quoted_line_total).toBe(15_000_000);

    // QA row is included resource (null quoted_line_total)
    expect(vm.developmentLines[1].name).toBe('Quality Assurance');
    expect(vm.developmentLines[1].quoted_line_total).toBeNull();
    expect(vm.developmentLines[1].display_rate).toBeNull();
  });

  it('formats IDR currency deterministically', () => {
    expect(formatCustomDevelopmentCurrency(18_000_000)).toContain('18.000.000');
    expect(formatCustomDevelopmentCurrency(1_272_000)).toContain('1.272.000');
    expect(formatCustomDevelopmentCurrency(0)).toContain('0');
    expect(formatCustomDevelopmentCurrency(null)).toBe('-');
    expect(formatCustomDevelopmentCurrency(undefined)).toBe('-');
  });

  describe('isCustomDevelopmentSubmitReady gate', () => {
    const baseDraftTotals = {
      development_subtotal: 20_062_500,
      discount_amount: 2_062_500,
      total_investment: 18_000_000,
      monthly_total: 1_272_000,
      development_payment_total: 18_000_000,
      development_delta: 0,
      monthly_rows_valid: true,
      is_balanced: true,
    };

    it('enables submit when form is valid, idle, and preview matches draft totals', () => {
      const ready = isCustomDevelopmentSubmitReady({
        isValid: true,
        isDebouncing: false,
        isFetching: false,
        error: null,
        preview: kopiStudioPreviewWithoutRights,
        draftTotals: baseDraftTotals,
      });
      expect(ready).toBe(true);
    });

    it('disables submit when form is invalid', () => {
      const ready = isCustomDevelopmentSubmitReady({
        isValid: false,
        isDebouncing: false,
        isFetching: false,
        error: null,
        preview: kopiStudioPreviewWithoutRights,
        draftTotals: baseDraftTotals,
      });
      expect(ready).toBe(false);
    });

    it('disables submit when debouncing or fetching', () => {
      expect(
        isCustomDevelopmentSubmitReady({
          isValid: true,
          isDebouncing: true,
          isFetching: false,
          error: null,
          preview: kopiStudioPreviewWithoutRights,
          draftTotals: baseDraftTotals,
        })
      ).toBe(false);

      expect(
        isCustomDevelopmentSubmitReady({
          isValid: true,
          isDebouncing: false,
          isFetching: true,
          error: null,
          preview: kopiStudioPreviewWithoutRights,
          draftTotals: baseDraftTotals,
        })
      ).toBe(false);
    });

    it('disables submit when error is present', () => {
      expect(
        isCustomDevelopmentSubmitReady({
          isValid: true,
          isDebouncing: false,
          isFetching: false,
          error: new Error('Preview failed'),
          preview: kopiStudioPreviewWithoutRights,
          draftTotals: baseDraftTotals,
        })
      ).toBe(false);
    });

    it('disables submit when preview calculation total differs from draftTotals', () => {
      expect(
        isCustomDevelopmentSubmitReady({
          isValid: true,
          isDebouncing: false,
          isFetching: false,
          error: null,
          preview: kopiStudioPreviewWithoutRights,
          draftTotals: {
            ...baseDraftTotals,
            total_investment: 20_000_000,
          },
        })
      ).toBe(false);

      expect(
        isCustomDevelopmentSubmitReady({
          isValid: true,
          isDebouncing: false,
          isFetching: false,
          error: null,
          preview: kopiStudioPreviewWithoutRights,
          draftTotals: {
            ...baseDraftTotals,
            monthly_total: 2_000_000,
          },
        })
      ).toBe(false);
    });

    it('disables submit when development payment has non-zero delta', () => {
      expect(
        isCustomDevelopmentSubmitReady({
          isValid: true,
          isDebouncing: false,
          isFetching: false,
          error: null,
          preview: kopiStudioPreviewWithoutRights,
          draftTotals: {
            ...baseDraftTotals,
            development_delta: 1_000_000,
            is_balanced: false,
          },
        })
      ).toBe(false);
    });

    it('disables submit when monthly rows are invalid', () => {
      expect(
        isCustomDevelopmentSubmitReady({
          isValid: true,
          isDebouncing: false,
          isFetching: false,
          error: null,
          preview: kopiStudioPreviewWithoutRights,
          draftTotals: {
            ...baseDraftTotals,
            monthly_rows_valid: false,
            is_balanced: false,
          },
        })
      ).toBe(false);
    });
  });
});
