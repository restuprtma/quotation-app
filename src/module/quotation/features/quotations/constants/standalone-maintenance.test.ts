import type { StandaloneMaintenanceInput } from '../types';

import { it, expect, describe } from 'vitest';

import {
  formatHalfHours,
  retainerLineTotal,
  hourlyCostLineTotal,
  normalizeStandaloneMaintenance,
  MAX_STANDALONE_MAINTENANCE_MONEY,
  DEFAULT_STANDALONE_MAINTENANCE_FORM,
  calculateStandaloneMaintenanceDraftTotals,
} from './standalone-maintenance';

describe('standalone maintenance pure helpers', () => {
  describe('formatHalfHours', () => {
    it('formats half hours to indonesian decimal representation', () => {
      expect(formatHalfHours(0)).toBe('0');
      expect(formatHalfHours(1)).toBe('0,5');
      expect(formatHalfHours(2)).toBe('1');
      expect(formatHalfHours(3)).toBe('1,5');
      expect(formatHalfHours(4)).toBe('2');
      expect(formatHalfHours(16)).toBe('8');
      expect(formatHalfHours(25)).toBe('12,5');
    });

    it('handles negative or invalid values gracefully', () => {
      expect(formatHalfHours(-1)).toBe('0');
      expect(formatHalfHours(NaN)).toBe('0');
    });
  });

  describe('retainerLineTotal', () => {
    it('calculates monthly_rate * fte_quarters * period_months / 4', () => {
      // Nex Senior Web Programmer: 16_050_000 * 4 * 1 / 4 = 16_050_000
      expect(
        retainerLineTotal({
          name: 'Senior Web Programmer',
          monthly_rate: 16_050_000,
          fte_quarters: 4,
          period_months: 1,
        })
      ).toBe(16_050_000);

      // Nex Senior QA: 14_070_000 * 2 * 1 / 4 = 7_035_000
      expect(
        retainerLineTotal({
          name: 'Senior Quality Assurance',
          monthly_rate: 14_070_000,
          fte_quarters: 2,
          period_months: 1,
        })
      ).toBe(7_035_000);
    });

    it('returns null when product is not divisible by 4 (not whole rupiah)', () => {
      expect(
        retainerLineTotal({
          name: 'Test',
          monthly_rate: 15,
          fte_quarters: 1,
          period_months: 1,
        })
      ).toBeNull();
    });

    it('returns null when inputs are invalid or exceed safe integer', () => {
      expect(
        retainerLineTotal({
          name: 'Test',
          monthly_rate: -1,
          fte_quarters: 1,
          period_months: 1,
        })
      ).toBeNull();

      expect(
        retainerLineTotal({
          name: 'Test',
          monthly_rate: 10_000_000,
          fte_quarters: 5,
          period_months: 1,
        })
      ).toBeNull();

      expect(
        retainerLineTotal({
          name: 'Test',
          monthly_rate: MAX_STANDALONE_MAINTENANCE_MONEY + 1,
          fte_quarters: 4,
          period_months: 1,
        })
      ).toBeNull();
    });
  });

  describe('hourlyCostLineTotal', () => {
    it('returns quoted_line_total directly without applying divisor formula', () => {
      // Liputan6 Senior Mobile Programmer: quoted_line_total = 730_000
      expect(
        hourlyCostLineTotal({
          name: 'Senior Mobile Programmer',
          display_monthly_rate: 16_050_000,
          headcount: 1,
          hours_half_units: 16,
          quoted_line_total: 730_000,
        })
      ).toBe(730_000);

      // Liputan6 Senior QA: quoted_line_total = 140_000
      expect(
        hourlyCostLineTotal({
          name: 'Senior QA',
          display_monthly_rate: 12_500_000,
          headcount: 1,
          hours_half_units: 4,
          quoted_line_total: 140_000,
        })
      ).toBe(140_000);
    });

    it('returns null for negative or exceeding safe integer', () => {
      expect(
        hourlyCostLineTotal({
          name: 'Invalid',
          display_monthly_rate: 10_000_000,
          headcount: 1,
          hours_half_units: 2,
          quoted_line_total: -100,
        })
      ).toBeNull();

      expect(
        hourlyCostLineTotal({
          name: 'Invalid',
          display_monthly_rate: 10_000_000,
          headcount: 1,
          hours_half_units: 2,
          quoted_line_total: MAX_STANDALONE_MAINTENANCE_MONEY + 1,
        })
      ).toBeNull();
    });
  });

  describe('calculateStandaloneMaintenanceDraftTotals', () => {
    it('calculates exact Nex retainer totals', () => {
      const nexInput: StandaloneMaintenanceInput = {
        system_name: 'Aplikasi Nex Health',
        quotation_date: '2026-07-07',
        mode: 'retainer',
        tax_treatment: 'exclusive_ppn',
        retainer_items: [
          { name: 'Senior Web Programmer', monthly_rate: 16_050_000, fte_quarters: 4, period_months: 1 },
          { name: 'Senior Quality Assurance', monthly_rate: 14_070_000, fte_quarters: 2, period_months: 1 },
        ],
        defect_groups: [
          {
            title: '1. Detail Pasien',
            items: [
              {
                item_number: '1.1',
                priority: 'P0',
                function: 'Melihat riwayat medis',
                screen_flow: 'Pasien > Medical History',
                existing: 'Catatan registrasi awal',
                improvement: 'Seluruh riwayat SOAP',
                reference: 'Ref 1.01',
              },
            ],
          },
        ],
        show_discount_row: true,
        discount_amount: 0,
        payment_schedule: [
          {
            work_period: '13 Juli - 13 Agustus 2026',
            terms: 'Maintenance',
            invoice_date_label: '13 Agustus 2026',
            due_date_label: '27 Agustus 2026',
            nominal: 23_085_000,
          },
        ],
        rights_statements: [],
      };

      const totals = calculateStandaloneMaintenanceDraftTotals(nexInput);
      expect(totals.subtotal).toBe(23_085_000);
      expect(totals.discount_amount).toBe(0);
      expect(totals.total_investment).toBe(23_085_000);
      expect(totals.payment_total).toBe(23_085_000);
      expect(totals.is_balanced).toBe(true);
      expect(totals.payment_delta).toBe(0);
    });

    it('calculates exact Liputan6 hourly totals', () => {
      const liputan6Input: StandaloneMaintenanceInput = {
        system_name: 'Portal Berita Liputan6',
        quotation_date: '2026-07-10',
        mode: 'hourly_task',
        tax_treatment: 'not_stated',
        hourly_cost_items: [
          { name: 'Senior Mobile Programmer', display_monthly_rate: 16_050_000, headcount: 1, hours_half_units: 16, quoted_line_total: 730_000 },
          { name: 'Senior QA', display_monthly_rate: 12_500_000, headcount: 1, hours_half_units: 4, quoted_line_total: 140_000 },
        ],
        hourly_tasks: [
          { description: 'Perbaikan crash login', platform: 'Android', hours_half_units: 16 },
          { description: 'Regression testing', platform: 'QA Test', hours_half_units: 4 },
        ],
        show_discount_row: false,
        discount_amount: 0,
        payment_schedule: [
          {
            work_period: 'Support Juli 2026',
            terms: 'Pelunasan',
            invoice_date_label: '31 Juli 2026',
            due_date_label: '14 Agustus 2026',
            nominal: 870_000,
          },
        ],
        rights_statements: ['Source code dan modul merupakan hak milik bersama.'],
      };

      const totals = calculateStandaloneMaintenanceDraftTotals(liputan6Input);
      expect(totals.subtotal).toBe(870_000);
      expect(totals.discount_amount).toBe(0);
      expect(totals.total_investment).toBe(870_000);
      expect(totals.payment_total).toBe(870_000);
      expect(totals.is_balanced).toBe(true);
      expect(totals.payment_delta).toBe(0);
    });

    it('correctly calculates total investment with discount and payment delta', () => {
      const input: StandaloneMaintenanceInput = {
        system_name: 'Test App',
        quotation_date: '2026-09-08',
        mode: 'retainer',
        tax_treatment: 'exclusive_ppn',
        retainer_items: [
          { name: 'Developer', monthly_rate: 10_000_000, fte_quarters: 4, period_months: 1 },
        ],
        defect_groups: [],
        show_discount_row: true,
        discount_amount: 1_000_000,
        payment_schedule: [
          {
            work_period: 'Tahap 1',
            terms: 'DP',
            invoice_date_label: 'Now',
            due_date_label: 'Later',
            nominal: 5_000_000,
          },
        ],
      };

      const totals = calculateStandaloneMaintenanceDraftTotals(input);
      expect(totals.subtotal).toBe(10_000_000);
      expect(totals.discount_amount).toBe(1_000_000);
      expect(totals.total_investment).toBe(9_000_000);
      expect(totals.payment_total).toBe(5_000_000);
      expect(totals.is_balanced).toBe(false);
      expect(totals.payment_delta).toBe(4_000_000);
    });
  });

  describe('normalizeStandaloneMaintenance', () => {
    it('forces inactive mode arrays to empty array on retainer mode', () => {
      const mixed: StandaloneMaintenanceInput = {
        system_name: '  System A  ',
        quotation_date: ' 2026-09-08 ',
        mode: 'retainer',
        tax_treatment: 'exclusive_ppn',
        retainer_items: [
          { name: ' Dev 1 ', monthly_rate: 10_000_000, fte_quarters: 4, period_months: 1 },
        ],
        defect_groups: [
          {
            title: ' Group 1 ',
            items: [
              {
                item_number: ' 1.1 ',
                priority: 'P0',
                function: ' Func ',
                screen_flow: ' Screen ',
                existing: ' Exist ',
                improvement: ' Impr ',
                reference: ' Ref ',
              },
            ],
          },
        ],
        hourly_cost_items: [
          { name: ' Should be cleared ', display_monthly_rate: 5_000_000, headcount: 1, hours_half_units: 2, quoted_line_total: 100_000 },
        ],
        hourly_tasks: [
          { description: ' Should be cleared ', platform: ' Web ', hours_half_units: 2 },
        ],
        discount_amount: 0,
        show_discount_row: true,
        payment_schedule: [
          {
            work_period: ' Period 1 ',
            terms: ' Terms 1 ',
            invoice_date_label: ' Inv 1 ',
            due_date_label: ' Due 1 ',
            nominal: 10_000_000,
          },
        ],
        rights_statements: [' Statement 1 ', ' '],
      };

      const normalized = normalizeStandaloneMaintenance(mixed);
      expect(normalized.system_name).toBe('System A');
      expect(normalized.quotation_date).toBe('2026-09-08');
      expect(normalized.retainer_items?.[0].name).toBe('Dev 1');
      expect(normalized.defect_groups?.[0].title).toBe('Group 1');
      expect(normalized.defect_groups?.[0].items[0].item_number).toBe('1.1');
      expect(normalized.defect_groups?.[0].items[0].reference).toBe('Ref');
      expect(normalized.hourly_cost_items).toEqual([]);
      expect(normalized.hourly_tasks).toEqual([]);
      expect(normalized.payment_schedule[0].work_period).toBe('Period 1');
      expect(normalized.rights_statements).toEqual(['Statement 1']);
    });

    it('forces inactive mode arrays to empty array on hourly_task mode', () => {
      const mixed: StandaloneMaintenanceInput = {
        system_name: ' System B ',
        quotation_date: ' 2026-09-08 ',
        mode: 'hourly_task',
        tax_treatment: 'not_stated',
        retainer_items: [
          { name: ' Should be cleared ', monthly_rate: 10_000_000, fte_quarters: 4, period_months: 1 },
        ],
        defect_groups: [
          { title: ' Should be cleared ', items: [] },
        ],
        hourly_cost_items: [
          { name: ' Cost Item 1 ', display_monthly_rate: 5_000_000, headcount: 1, hours_half_units: 2, quoted_line_total: 100_000 },
        ],
        hourly_tasks: [
          { description: ' Task 1 ', platform: ' Mobile ', hours_half_units: 2 },
        ],
        discount_amount: 0,
        show_discount_row: false,
        payment_schedule: [
          {
            work_period: ' P ',
            terms: ' T ',
            invoice_date_label: ' I ',
            due_date_label: ' D ',
            nominal: 100_000,
          },
        ],
      };

      const normalized = normalizeStandaloneMaintenance(mixed);
      expect(normalized.retainer_items).toEqual([]);
      expect(normalized.defect_groups).toEqual([]);
      expect(normalized.hourly_cost_items?.[0].name).toBe('Cost Item 1');
      expect(normalized.hourly_tasks?.[0].description).toBe('Task 1');
      expect(normalized.hourly_tasks?.[0].platform).toBe('Mobile');
    });

    it('does not mutate input arrays and clones them deeply', () => {
      const originalRetainer = [
        { name: 'Dev 1', monthly_rate: 10_000_000, fte_quarters: 4, period_months: 1 },
      ];
      const originalPayment = [
        { work_period: 'P1', terms: 'T1', invoice_date_label: 'I1', due_date_label: 'D1', nominal: 10_000_000 },
      ];
      const originalRights = ['Right 1'];

      const input: StandaloneMaintenanceInput = {
        system_name: 'Test',
        quotation_date: '2026-09-08',
        mode: 'retainer',
        tax_treatment: 'exclusive_ppn',
        retainer_items: originalRetainer,
        defect_groups: [],
        show_discount_row: true,
        discount_amount: 0,
        payment_schedule: originalPayment,
        rights_statements: originalRights,
      };

      const normalized = normalizeStandaloneMaintenance(input);
      expect(normalized.retainer_items).not.toBe(originalRetainer);
      expect(normalized.payment_schedule).not.toBe(originalPayment);
      expect(normalized.rights_statements).not.toBe(originalRights);

      // Mutate original array afterwards
      originalRetainer.push({ name: 'Dev 2', monthly_rate: 5_000_000, fte_quarters: 2, period_months: 1 });
      expect(normalized.retainer_items?.length).toBe(1);
    });

    it('never inserts payments automatically', () => {
      const inputWithoutPayments: StandaloneMaintenanceInput = {
        system_name: 'Test',
        quotation_date: '2026-09-08',
        mode: 'retainer',
        tax_treatment: 'exclusive_ppn',
        retainer_items: [
          { name: 'Dev 1', monthly_rate: 10_000_000, fte_quarters: 4, period_months: 1 },
        ],
        defect_groups: [],
        show_discount_row: true,
        discount_amount: 0,
        payment_schedule: [],
      };

      const normalized = normalizeStandaloneMaintenance(inputWithoutPayments);
      expect(normalized.payment_schedule).toEqual([]);
    });
  });

  describe('DEFAULT_STANDALONE_MAINTENANCE_FORM', () => {
    it('has un-filled blank initial state ready for BA input', () => {
      expect(DEFAULT_STANDALONE_MAINTENANCE_FORM.mode).toBe('retainer');
      expect(DEFAULT_STANDALONE_MAINTENANCE_FORM.tax_treatment).toBe('exclusive_ppn');
      expect(DEFAULT_STANDALONE_MAINTENANCE_FORM.show_discount_row).toBe(true);
      expect(DEFAULT_STANDALONE_MAINTENANCE_FORM.retainer_items?.length).toBe(1);
      expect(DEFAULT_STANDALONE_MAINTENANCE_FORM.retainer_items?.[0].name).toBe('');
      expect(DEFAULT_STANDALONE_MAINTENANCE_FORM.defect_groups?.length).toBe(1);
      expect(DEFAULT_STANDALONE_MAINTENANCE_FORM.defect_groups?.[0].items.length).toBe(1);
      expect(DEFAULT_STANDALONE_MAINTENANCE_FORM.defect_groups?.[0].items[0].item_number).toBe('');
      expect(DEFAULT_STANDALONE_MAINTENANCE_FORM.payment_schedule.length).toBe(1);
      expect(DEFAULT_STANDALONE_MAINTENANCE_FORM.payment_schedule[0].work_period).toBe('');
    });
  });
});
