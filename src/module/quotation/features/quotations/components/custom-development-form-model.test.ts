import { it, expect, describe } from 'vitest';

import {
  customDevelopmentSchema,
  customDevelopmentFormSchema,
  type CustomDevelopmentFormValues,
} from './custom-development-form-model';

describe('customDevelopmentFormSchema & customDevelopmentSchema', () => {
  const validKopiStudio24Values: CustomDevelopmentFormValues = {
    client_id: 'client-uuid-1',
    client_name: 'Budi Hartono',
    client_company_name: 'Kopi Studio24',
    subject: 'Penawaran Pembuatan Sistem POS & Kasir',
    solution_type: 'Web Application',
    commercial_scheme: 'custom_development',
    custom_development: {
      system_name: 'Sistem Kopi Studio24',
      quotation_date: '2026-07-15',
      development_table_mode: 'monthly_period',
      tax_treatment: 'exclusive_ppn',
      development_groups: [
        {
          title: 'Fase 1: Backend & Core Engine',
          items: [
            {
              name: 'Senior Backend Developer',
              display_rate: 15_000_000,
              headcount: 1,
              period_label: '1',
              quoted_line_total: 15_000_000,
            },
            {
              name: 'Frontend Developer',
              display_rate: 5_062_500,
              headcount: 1,
              period_label: '1',
              quoted_line_total: 5_062_500,
            },
          ],
        },
      ],
      discount_label: 'DISCOUNT',
      discount_amount: 2_062_500,
      show_discount_row: true,
      monthly_items: [
        {
          name: 'Venturo Cloud Mini',
          specification: 'Cloud Server Standard',
          unit_rate: 800_000,
          quantity: 1,
        },
        {
          name: 'Support',
          specification: '4 Jam Maintenance Support',
          unit_rate: 93_000,
          quantity: 4,
        },
        {
          name: 'WhatsApp Connect',
          specification: 'Integrasi Notifikasi WA',
          unit_rate: 100_000,
          quantity: 1,
        },
      ],
      monthly_notes: ['Biaya API Gemini ditandai out-of-pocket.'],
      module_groups: [
        {
          name: 'Modul Transaksi & Kasir',
          features: ['Pencatatan order dan invoice', 'Integrasi payment gateway'],
        },
      ],
      timeline_rows: [
        {
          description: 'Fase 1: Pengembangan dan Testing',
          timeline: '4 Minggu',
        },
      ],
      payment_schedule: [
        {
          work_period: 'Down Payment 50%',
          terms: 'Termin 1',
          invoice_date_label: 'Saat tanda tangan kontrak',
          due_date_label: 'H+7',
          component: 'development',
          nominal: 9_000_000,
        },
        {
          work_period: 'Pelunasan 50%',
          terms: 'Termin 2',
          invoice_date_label: 'Setelah serah terima',
          due_date_label: 'H+7',
          component: 'development',
          nominal: 9_000_000,
        },
        {
          work_period: 'Bulan 1',
          terms: 'Layanan Bulanan Cloud & Support',
          invoice_date_label: 'Awal bulan berjalan',
          due_date_label: 'H+7',
          component: 'monthly_recurring',
          nominal: 1_272_000,
        },
      ],
      rights_statements: ['Source code menjadi hak milik klien.'],
      limitation_codes: ['out_of_pocket', 'overtime', 'third_party', 'scope_change'],
      additional_limitations: ['Tidak termasuk lisensi software berbayar.'],
    },
  };

  const validEcoflowValues: CustomDevelopmentFormValues = {
    client_name: 'PT Ecoflow Indonesia',
    subject: 'Pembuatan Website Ecoflow',
    solution_type: 'Web Application',
    commercial_scheme: 'custom_development',
    custom_development: {
      system_name: 'Company Profile Ecoflow',
      quotation_date: '2026-07-25',
      development_table_mode: 'fixed_days',
      tax_treatment: 'exclusive_ppn',
      development_groups: [
        {
          title: 'Website 1: Landing Page',
          items: [
            {
              name: 'Frontend & Backend Developer',
              display_rate: null,
              headcount: 1,
              period_label: '15 Hari',
              quoted_line_total: 15_000_000,
            },
            {
              name: 'QA Tester (Included)',
              display_rate: null,
              headcount: 1,
              period_label: '15 Hari',
              quoted_line_total: null,
            },
          ],
        },
        {
          title: 'Website 2: Portal Klien',
          items: [
            {
              name: 'Fullstack Developer',
              display_rate: null,
              headcount: 1,
              period_label: '10 Hari',
              quoted_line_total: 10_000_000,
            },
          ],
        },
      ],
      discount_label: 'DISCOUNT DEVELOPMENT',
      discount_amount: 10_000_000,
      show_discount_row: true,
      module_groups: [
        {
          name: 'Fitur Landing Page',
          features: ['Katalog Produk', 'Kontak dan Form Inquiry'],
        },
      ],
      timeline_rows: [
        {
          description: 'Pengerjaan Website 1 dan 2',
          timeline: '25 Hari Kerja',
        },
      ],
      payment_schedule: [
        {
          work_period: 'Termin 1 (DP 50%)',
          terms: 'Down Payment',
          invoice_date_label: 'Saat tanda tangan kontrak',
          due_date_label: 'H+7',
          component: 'development',
          nominal: 7_500_000,
        },
        {
          work_period: 'Termin 2 (Pelunasan 50%)',
          terms: 'Pelunasan',
          invoice_date_label: 'Setelah live deployment',
          due_date_label: 'H+7',
          component: 'development',
          nominal: 7_500_000,
        },
      ],
      limitation_codes: ['out_of_pocket', 'overtime', 'third_party', 'scope_change'],
    },
  };

  it('validates a complete valid Kopi Studio24 form model', () => {
    const result = customDevelopmentFormSchema.safeParse(validKopiStudio24Values);
    expect(result.success).toBe(true);
  });

  it('validates a complete valid Ecoflow (fixed_days mode) form model', () => {
    const result = customDevelopmentFormSchema.safeParse(validEcoflowValues);
    expect(result.success).toBe(true);
  });

  describe('system_name and quotation_date validation', () => {
    it('rejects empty system_name', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        system_name: '   ',
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid quotation_date format', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        quotation_date: '15/07/2026',
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('development_groups validation', () => {
    it('requires at least one development group', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        development_groups: [],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('requires at least one item per group', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        development_groups: [{ title: 'Group 1', items: [] }],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects headcount less than 1 or greater than 100', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        development_groups: [
          {
            title: 'Group 1',
            items: [
              {
                name: 'Dev',
                headcount: 0,
                period_label: '1',
                quoted_line_total: 10_000_000,
              },
            ],
          },
        ],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects period_label longer than 50 characters', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        development_groups: [
          {
            title: 'Group 1',
            items: [
              {
                name: 'Dev',
                headcount: 1,
                period_label: 'A'.repeat(51),
                quoted_line_total: 10_000_000,
              },
            ],
          },
        ],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('requires at least one priced line globally (quoted_line_total > 0)', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        development_groups: [
          {
            title: 'Group 1',
            items: [
              {
                name: 'Dev',
                headcount: 1,
                period_label: '1',
                quoted_line_total: null,
              },
            ],
          },
        ],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.message.includes('priced'))
        ).toBe(true);
      }
    });

    it('in fixed_days mode, allows item with display_rate to preserve table-mode invariance', () => {
      const data = {
        ...validEcoflowValues.custom_development,
        development_groups: [
          {
            ...validEcoflowValues.custom_development.development_groups[0],
            items: [
              {
                ...validEcoflowValues.custom_development.development_groups[0].items[0],
                display_rate: 5_000_000,
              },
              validEcoflowValues.custom_development.development_groups[0].items[1],
            ],
          },
          validEcoflowValues.custom_development.development_groups[1],
        ],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.development_groups[0].items[0].display_rate).toBe(5_000_000);
      }
    });
  });

  describe('discount validation', () => {
    it('rejects discount_amount exceeding development subtotal', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        discount_amount: 30_000_000, // Subtotal is 20_062_500
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes('discount_amount'))
        ).toBe(true);
      }
    });

    it('rejects positive discount_amount when show_discount_row is false', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        discount_amount: 1_000_000,
        show_discount_row: false,
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes('show_discount_row'))
        ).toBe(true);
      }
    });
  });

  describe('monthly items and notes validation', () => {
    it('rejects monthly notes when monthly_items is empty', () => {
      const data = {
        ...validEcoflowValues.custom_development,
        monthly_items: [],
        monthly_notes: ['Catatan bulanan tanpa ada item bulanan'],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes('monthly_notes'))
        ).toBe(true);
      }
    });
  });

  describe('module groups validation', () => {
    it('rejects duplicate module group names (case-insensitive)', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        module_groups: [
          { name: 'Modul Transaksi', features: ['F1'] },
          { name: '  modul transaksi  ', features: ['F2'] },
        ],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes('module_groups'))
        ).toBe(true);
      }
    });

    it('rejects empty feature string within module group', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        module_groups: [
          { name: 'Modul 1', features: ['   '] },
        ],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('payment schedule reconciliation', () => {
    it('rejects when development payment rows do not sum to total_investment', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        payment_schedule: [
          {
            work_period: 'DP',
            terms: 'DP',
            invoice_date_label: 'SPK',
            due_date_label: 'H+7',
            component: 'development' as const,
            nominal: 10_000_000, // Total 10M, expected 18M
          },
          {
            work_period: 'Bulan 1',
            terms: 'Monthly',
            invoice_date_label: 'Bulan 1',
            due_date_label: 'H+7',
            component: 'monthly_recurring' as const,
            nominal: 1_272_000,
          },
        ],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes('payment_schedule'))
        ).toBe(true);
      }
    });

    it('requires at least one monthly recurring payment row with nominal matching monthly_total when monthly_items > 0', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        payment_schedule: [
          {
            work_period: 'Full',
            terms: 'Pelunasan',
            invoice_date_label: 'SPK',
            due_date_label: 'H+7',
            component: 'development' as const,
            nominal: 18_000_000,
          },
          // Missing monthly recurring payment row
        ],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes('payment_schedule'))
        ).toBe(true);
      }
    });

    it('rejects monthly recurring payment row when monthly_items is empty', () => {
      const data = {
        ...validEcoflowValues.custom_development,
        payment_schedule: [
          ...validEcoflowValues.custom_development.payment_schedule,
          {
            work_period: 'Bulan 1',
            terms: 'Monthly',
            invoice_date_label: 'Awal bulan',
            due_date_label: 'H+7',
            component: 'monthly_recurring' as const,
            nominal: 1_000_000,
          },
        ],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path.includes('payment_schedule'))
        ).toBe(true);
      }
    });
  });

  describe('limitations validation', () => {
    it('rejects duplicate limitation codes', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        limitation_codes: ['out_of_pocket', 'out_of_pocket'],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects duplicate additional limitations (case-insensitive after trim)', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        additional_limitations: [
          'Tidak termasuk domain.',
          '  tidak termasuk domain.  ',
        ],
      };
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('guarantees table-mode invariance when switching from monthly_period to fixed_days', () => {
      const data = {
        ...validKopiStudio24Values.custom_development,
        development_table_mode: 'fixed_days' as const,
      };
      expect(data.development_groups[0].items[0].display_rate).toBe(15_000_000);
      expect(data.development_groups[0].items[0].quoted_line_total).toBe(15_000_000);
      const result = customDevelopmentSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.development_table_mode).toBe('fixed_days');
        expect(result.data.development_groups[0].items[0].display_rate).toBe(15_000_000);
        expect(result.data.development_groups[0].items[0].quoted_line_total).toBe(15_000_000);
      }
    });
  });
});
