import type { StandaloneMaintenancePreviewResponse } from '../types';

import { it, expect, describe } from 'vitest';

import { isStandaloneMaintenanceSubmitReady } from './standalone-maintenance-generation-form';
import {
  toStandaloneMaintenancePreviewRows,
  formatStandaloneMaintenanceCurrency,
  toStandaloneMaintenancePreviewViewModel,
} from './standalone-maintenance-preview';

describe('standalone-maintenance-preview view-model and submit gate', () => {
  const nexRetainerPreview: StandaloneMaintenancePreviewResponse = {
    calculation: {
      mode: 'retainer',
      retainer: [
        {
          name: 'Senior Web Programmer',
          monthly_rate: 16_050_000,
          fte_quarters: 4,
          period_months: 1,
          line_total: 16_050_000,
        },
        {
          name: 'Senior Quality Assurance',
          monthly_rate: 14_070_000,
          fte_quarters: 2,
          period_months: 1,
          line_total: 7_035_000,
        },
      ],
      subtotal: 23_085_000,
      discount_amount: 0,
      total_investment: 23_085_000,
      payment_total: 23_085_000,
    },
    resolved_profile: {
      mode: 'retainer',
      tax_treatment: 'exclusive_ppn',
      tax_clause_text:
        'Seluruh rincian biaya belum termasuk PPN sesuai regulasi perpajakan yang berlaku di Indonesia.',
      show_discount_row: true,
      show_rights: false,
      sections: [
        { number: 1, code: 'maintenance_cost', title: 'Biaya Maintenance' },
        { number: 2, code: 'maintenance_scope', title: 'Lingkup Pekerjaan & Timeline' },
        { number: 3, code: 'payment', title: 'Pembayaran' },
        { number: 4, code: 'limitations', title: 'Batasan dan Pengecualian' },
      ],
    },
  };

  const liputan6HourlyPreview: StandaloneMaintenancePreviewResponse = {
    calculation: {
      mode: 'hourly_task',
      hourly: [
        {
          name: 'Senior Mobile Programmer',
          display_monthly_rate: 16_050_000,
          headcount: 1,
          hours_half_units: 16,
          quoted_line_total: 730_000,
          line_total: 730_000,
        },
        {
          name: 'Senior QA',
          display_monthly_rate: 12_500_000,
          headcount: 1,
          hours_half_units: 4,
          quoted_line_total: 140_000,
          line_total: 140_000,
        },
      ],
      subtotal: 870_000,
      discount_amount: 0,
      total_investment: 870_000,
      payment_total: 870_000,
    },
    resolved_profile: {
      mode: 'hourly_task',
      tax_treatment: 'not_stated',
      tax_clause_text: '',
      show_discount_row: false,
      show_rights: false,
      sections: [
        { number: 1, code: 'development_cost', title: 'Biaya Development' },
        { number: 2, code: 'maintenance_scope', title: 'Lingkup Pekerjaan & Timeline' },
        { number: 3, code: 'payment', title: 'Pembayaran' },
        { number: 4, code: 'limitations', title: 'Batasan dan Pengecualian' },
      ],
    },
  };

  const hourlyWithRightsPreview: StandaloneMaintenancePreviewResponse = {
    calculation: {
      mode: 'hourly_task',
      hourly: [
        {
          name: 'Senior Mobile Programmer',
          display_monthly_rate: 16_050_000,
          headcount: 1,
          hours_half_units: 16,
          quoted_line_total: 730_000,
          line_total: 730_000,
        },
      ],
      subtotal: 730_000,
      discount_amount: 0,
      total_investment: 730_000,
      payment_total: 730_000,
    },
    resolved_profile: {
      mode: 'hourly_task',
      tax_treatment: 'inclusive_ppn',
      tax_clause_text: 'Total investasi telah termasuk PPN.',
      show_discount_row: false,
      show_rights: true,
      sections: [
        { number: 1, code: 'development_cost', title: 'Biaya Development' },
        { number: 2, code: 'maintenance_scope', title: 'Lingkup Pekerjaan & Timeline' },
        { number: 3, code: 'payment', title: 'Pembayaran' },
        { number: 4, code: 'rights', title: 'Hak Para Pihak' },
        { number: 5, code: 'limitations', title: 'Batasan dan Pengecualian' },
      ],
    },
  };

  it('transforms Nex Health preview into 23.085.000 total, 4 sections, and matching lines', () => {
    const vm = toStandaloneMaintenancePreviewViewModel(nexRetainerPreview);
    const rows = toStandaloneMaintenancePreviewRows(nexRetainerPreview);

    expect(vm.mode).toBe('retainer');
    expect(vm.subtotal).toBe(23_085_000);
    expect(vm.discountAmount).toBe(0);
    expect(vm.totalInvestment).toBe(23_085_000);
    expect(vm.paymentTotal).toBe(23_085_000);
    expect(vm.paymentDelta).toBe(0);
    expect(vm.isBalanced).toBe(true);

    expect(vm.retainerItems).toHaveLength(2);
    expect(vm.retainerItems[0].line_total).toBe(16_050_000);
    expect(vm.retainerItems[1].line_total).toBe(7_035_000);
    expect(vm.hourlyItems).toHaveLength(0);

    expect(vm.visibleSections).toHaveLength(4);
    expect(vm.sectionTitles).toEqual([
      'Biaya Maintenance',
      'Lingkup Pekerjaan & Timeline',
      'Pembayaran',
      'Batasan dan Pengecualian',
    ]);
    expect(rows.totalInvestment).toBe(23_085_000);
  });

  it('transforms Liputan6 hourly preview into 870.000 total with Biaya Development section', () => {
    const vm = toStandaloneMaintenancePreviewViewModel(liputan6HourlyPreview);

    expect(vm.mode).toBe('hourly_task');
    expect(vm.subtotal).toBe(870_000);
    expect(vm.totalInvestment).toBe(870_000);
    expect(vm.paymentTotal).toBe(870_000);
    expect(vm.paymentDelta).toBe(0);
    expect(vm.isBalanced).toBe(true);

    expect(vm.hourlyItems).toHaveLength(2);
    expect(vm.hourlyItems[0].line_total).toBe(730_000);
    expect(vm.hourlyItems[1].line_total).toBe(140_000);
    expect(vm.retainerItems).toHaveLength(0);

    expect(vm.visibleSections[0].title).toBe('Biaya Development');
    expect(vm.visibleSections[0].code).toBe('development_cost');
  });

  it('switches section title between Biaya Maintenance (retainer) and Biaya Development (hourly)', () => {
    const nexVm = toStandaloneMaintenancePreviewViewModel(nexRetainerPreview);
    const liputan6Vm = toStandaloneMaintenancePreviewViewModel(liputan6HourlyPreview);

    expect(nexVm.sectionTitles[0]).toBe('Biaya Maintenance');
    expect(liputan6Vm.sectionTitles[0]).toBe('Biaya Development');
  });

  it('inserts Hak Para Pihak section when show_rights is true', () => {
    const vm = toStandaloneMaintenancePreviewViewModel(hourlyWithRightsPreview);

    expect(vm.showRights).toBe(true);
    expect(vm.visibleSections).toHaveLength(5);
    expect(vm.sectionTitles).toEqual([
      'Biaya Development',
      'Lingkup Pekerjaan & Timeline',
      'Pembayaran',
      'Hak Para Pihak',
      'Batasan dan Pengecualian',
    ]);
  });

  it('contains no Gantt, Hiring, or Kick-off text across sections and items', () => {
    const allPreviews = [nexRetainerPreview, liputan6HourlyPreview, hourlyWithRightsPreview];

    for (const preview of allPreviews) {
      const vm = toStandaloneMaintenancePreviewViewModel(preview);
      for (const section of vm.visibleSections) {
        expect(section.title.toLowerCase()).not.toContain('gantt');
        expect(section.title.toLowerCase()).not.toContain('hiring');
        expect(section.title.toLowerCase()).not.toContain('kickoff');
        expect(section.title.toLowerCase()).not.toContain('kick-off');
        expect(section.code.toLowerCase()).not.toContain('gantt');
        expect(section.code.toLowerCase()).not.toContain('hiring');
      }
    }
  });

  it('formats IDR currency deterministically without fractional cents', () => {
    expect(formatStandaloneMaintenanceCurrency(23_085_000)).toContain('23.085.000');
    expect(formatStandaloneMaintenanceCurrency(870_000)).toContain('870.000');
    expect(formatStandaloneMaintenanceCurrency(0)).toContain('0');
  });

  describe('isStandaloneMaintenanceSubmitReady gate', () => {
    const baseDraftTotals = {
      mode: 'retainer' as const,
      subtotal: 23_085_000,
      discount_amount: 0,
      total_investment: 23_085_000,
      payment_total: 23_085_000,
      payment_delta: 0,
      is_balanced: true,
    };

    it('enables submit when valid, matching, balanced, and idle', () => {
      const ready = isStandaloneMaintenanceSubmitReady({
        isValid: true,
        isDebouncing: false,
        isFetching: false,
        error: null,
        preview: nexRetainerPreview,
        draftTotals: baseDraftTotals,
        currentMode: 'retainer',
      });
      expect(ready).toBe(true);
    });

    it('disables submit when debouncing or fetching', () => {
      expect(
        isStandaloneMaintenanceSubmitReady({
          isValid: true,
          isDebouncing: true,
          isFetching: false,
          error: null,
          preview: nexRetainerPreview,
          draftTotals: baseDraftTotals,
          currentMode: 'retainer',
        })
      ).toBe(false);

      expect(
        isStandaloneMaintenanceSubmitReady({
          isValid: true,
          isDebouncing: false,
          isFetching: true,
          error: null,
          preview: nexRetainerPreview,
          draftTotals: baseDraftTotals,
          currentMode: 'retainer',
        })
      ).toBe(false);
    });

    it('disables submit when error occurs', () => {
      expect(
        isStandaloneMaintenanceSubmitReady({
          isValid: true,
          isDebouncing: false,
          isFetching: false,
          error: new Error('Network error'),
          preview: nexRetainerPreview,
          draftTotals: baseDraftTotals,
          currentMode: 'retainer',
        })
      ).toBe(false);
    });

    it('disables submit when preview response is stale (mode or total mismatch)', () => {
      // Stale mode: form is hourly, preview is retainer
      expect(
        isStandaloneMaintenanceSubmitReady({
          isValid: true,
          isDebouncing: false,
          isFetching: false,
          error: null,
          preview: nexRetainerPreview,
          draftTotals: { ...baseDraftTotals, mode: 'hourly_task' },
          currentMode: 'hourly_task',
        })
      ).toBe(false);

      // Stale total: preview has 23.085.000, draft has 25.000.000
      expect(
        isStandaloneMaintenanceSubmitReady({
          isValid: true,
          isDebouncing: false,
          isFetching: false,
          error: null,
          preview: nexRetainerPreview,
          draftTotals: {
            ...baseDraftTotals,
            subtotal: 25_000_000,
            total_investment: 25_000_000,
            payment_total: 25_000_000,
          },
          currentMode: 'retainer',
        })
      ).toBe(false);
    });

    it('disables submit when backend delta is non-zero (unbalanced)', () => {
      const unbalancedPreview: StandaloneMaintenancePreviewResponse = {
        ...nexRetainerPreview,
        calculation: {
          ...nexRetainerPreview.calculation,
          payment_total: 20_000_000,
        },
      };

      expect(
        isStandaloneMaintenanceSubmitReady({
          isValid: true,
          isDebouncing: false,
          isFetching: false,
          error: null,
          preview: unbalancedPreview,
          draftTotals: {
            ...baseDraftTotals,
            payment_total: 20_000_000,
            payment_delta: 3_085_000,
            is_balanced: false,
          },
          currentMode: 'retainer',
        })
      ).toBe(false);
    });
  });
});
