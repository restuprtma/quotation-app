import { it, expect, describe } from 'vitest';

import {
  standaloneMaintenanceSchema,
  standaloneMaintenanceFormSchema,
} from './standalone-maintenance-form-model';

describe('standaloneMaintenanceSchema & form validation', () => {
  const validNexRetainerInput = {
    system_name: 'Aplikasi Nex Health',
    quotation_date: '2026-07-07',
    mode: 'retainer' as const,
    tax_treatment: 'exclusive_ppn' as const,
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
            priority: 'P0' as const,
            function: 'Melihat riwayat medis',
            screen_flow: 'Pasien > Medical History',
            existing: 'Catatan registrasi awal',
            improvement: 'Seluruh riwayat SOAP',
            reference: 'Ref 1.01',
          },
        ],
      },
    ],
    hourly_cost_items: [],
    hourly_tasks: [],
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

  const validLiputan6HourlyInput = {
    system_name: 'Portal Berita Liputan6',
    quotation_date: '2026-07-10',
    mode: 'hourly_task' as const,
    tax_treatment: 'not_stated' as const,
    retainer_items: [],
    defect_groups: [],
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

  describe('valid payloads', () => {
    it('accepts valid Nex retainer quotation', () => {
      const result = standaloneMaintenanceSchema.safeParse(validNexRetainerInput);
      expect(result.success).toBe(true);
    });

    it('accepts valid Liputan6 hourly quotation', () => {
      const result = standaloneMaintenanceSchema.safeParse(validLiputan6HourlyInput);
      expect(result.success).toBe(true);
    });

    it('accepts duplicate reference across defect items', () => {
      const input = {
        ...validNexRetainerInput,
        defect_groups: [
          {
            title: 'Group 1',
            items: [
              {
                item_number: '1.1',
                priority: 'P0' as const,
                function: 'F1',
                screen_flow: 'S1',
                existing: 'E1',
                improvement: 'I1',
                reference: 'REF-SAME',
              },
              {
                item_number: '1.2',
                priority: 'P1' as const,
                function: 'F2',
                screen_flow: 'S2',
                existing: 'E2',
                improvement: 'I2',
                reference: 'REF-SAME',
              },
            ],
          },
        ],
      };
      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('mode matrix and limits validation', () => {
    it('rejects hourly_cost_items when in retainer mode', () => {
      const input = {
        ...validNexRetainerInput,
        hourly_cost_items: [
          { name: 'Extra', display_monthly_rate: 10_000_000, headcount: 1, hours_half_units: 2, quoted_line_total: 100_000 },
        ],
      };
      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('hourly_cost_items'))).toBe(true);
      }
    });

    it('rejects hourly_tasks when in retainer mode', () => {
      const input = {
        ...validNexRetainerInput,
        hourly_tasks: [
          { description: 'Extra task', platform: 'Web', hours_half_units: 2 },
        ],
      };
      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('hourly_tasks'))).toBe(true);
      }
    });

    it('rejects retainer_items when in hourly_task mode', () => {
      const input = {
        ...validLiputan6HourlyInput,
        retainer_items: [
          { name: 'Extra', monthly_rate: 10_000_000, fte_quarters: 4, period_months: 1 },
        ],
      };
      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('retainer_items'))).toBe(true);
      }
    });

    it('rejects defect_groups when in hourly_task mode', () => {
      const input = {
        ...validLiputan6HourlyInput,
        defect_groups: [
          { title: 'Extra group', items: [] },
        ],
      };
      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('defect_groups'))).toBe(true);
      }
    });

    it('rejects empty retainer items in retainer mode', () => {
      const input = {
        ...validNexRetainerInput,
        retainer_items: [],
      };
      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects empty defect groups in retainer mode', () => {
      const input = {
        ...validNexRetainerInput,
        defect_groups: [],
      };
      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects empty hourly cost items in hourly_task mode', () => {
      const input = {
        ...validLiputan6HourlyInput,
        hourly_cost_items: [],
      };
      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects empty hourly tasks in hourly_task mode', () => {
      const input = {
        ...validLiputan6HourlyInput,
        hourly_tasks: [],
      };
      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('cross-field .superRefine validations', () => {
    it('rejects duplicate defect item numbers and points to the duplicate item field', () => {
      const input = {
        ...validNexRetainerInput,
        defect_groups: [
          {
            title: 'Group 1',
            items: [
              {
                item_number: '1.1',
                priority: 'P0' as const,
                function: 'F1',
                screen_flow: 'S1',
                existing: 'E1',
                improvement: 'I1',
              },
            ],
          },
          {
            title: 'Group 2',
            items: [
              {
                item_number: ' 1.1 ', // duplicate after trim
                priority: 'P1' as const,
                function: 'F2',
                screen_flow: 'S2',
                existing: 'E2',
                improvement: 'I2',
              },
            ],
          },
        ],
      };

      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const duplicateIssue = result.error.issues.find(
          (i) => i.message.includes('Duplicate item number')
        );
        expect(duplicateIssue).toBeDefined();
        expect(duplicateIssue?.path).toEqual(['defect_groups', 1, 'items', 0, 'item_number']);
      }
    });

    it('rejects non-whole rupiah retainer line calculation with path to retainer row', () => {
      const input = {
        ...validNexRetainerInput,
        retainer_items: [
          { name: 'Dev', monthly_rate: 15, fte_quarters: 1, period_months: 1 }, // 15 * 1 * 1 = 15 % 4 !== 0
        ],
        payment_schedule: [
          { work_period: 'P', terms: 'T', invoice_date_label: 'I', due_date_label: 'D', nominal: 3 },
        ],
      };

      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const wholeRupiahIssue = result.error.issues.find(
          (i) => i.message.includes('whole rupiah')
        );
        expect(wholeRupiahIssue).toBeDefined();
        expect(wholeRupiahIssue?.path).toEqual(['retainer_items', 0]);
      }
    });

    it('rejects discount exceeding subtotal with path to discount_amount', () => {
      const input = {
        ...validNexRetainerInput,
        discount_amount: 23_085_001,
      };

      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const discountIssue = result.error.issues.find(
          (i) => i.path.includes('discount_amount')
        );
        expect(discountIssue).toBeDefined();
      }
    });

    it('rejects positive discount when show_discount_row is false', () => {
      const input = {
        ...validNexRetainerInput,
        discount_amount: 1_000_000,
        show_discount_row: false,
        payment_schedule: [
          { work_period: 'P', terms: 'T', invoice_date_label: 'I', due_date_label: 'D', nominal: 22_085_000 },
        ],
      };

      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const discountIssue = result.error.issues.find(
          (i) => i.path.includes('discount_amount')
        );
        expect(discountIssue).toBeDefined();
      }
    });

    it('rejects payment schedule mismatch with path to payment_schedule', () => {
      const input = {
        ...validNexRetainerInput,
        payment_schedule: [
          {
            work_period: 'Tahap 1',
            terms: 'DP',
            invoice_date_label: 'Now',
            due_date_label: 'Later',
            nominal: 20_000_000, // Subtotal 23_085_000 - 0 = 23_085_000 !== 20_000_000
          },
        ],
      };

      const result = standaloneMaintenanceSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paymentIssue = result.error.issues.find(
          (i) => i.path.includes('payment_schedule') && i.message.includes('must equal total investment')
        );
        expect(paymentIssue).toBeDefined();
        expect(paymentIssue?.path).toEqual(['payment_schedule']);
      }
    });
  });

  describe('standaloneMaintenanceFormSchema', () => {
    it('validates complete top-level form values', () => {
      const formValues = {
        client_name: 'Budi Santoso',
        subject: 'Quotation Maintenance Aplikasi',
        solution_type: 'Web Application',
        commercial_scheme: 'standalone_maintenance' as const,
        standalone_maintenance: validNexRetainerInput,
      };

      const result = standaloneMaintenanceFormSchema.safeParse(formValues);
      expect(result.success).toBe(true);
    });

    it('rejects if commercial_scheme is not standalone_maintenance', () => {
      const formValues = {
        client_name: 'Budi Santoso',
        subject: 'Quotation Maintenance Aplikasi',
        solution_type: 'Web Application',
        commercial_scheme: 'white_label' as any,
        standalone_maintenance: validNexRetainerInput,
      };

      const result = standaloneMaintenanceFormSchema.safeParse(formValues);
      expect(result.success).toBe(false);
    });
  });
});
