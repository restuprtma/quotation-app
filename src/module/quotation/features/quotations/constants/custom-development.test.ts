import type { ActiveSkill, ClientSummary, CustomDevelopmentInput } from '../types';
import type { CustomDevelopmentFormValues } from '../components/custom-development-form-model';

import { it, expect, describe } from 'vitest';

import { applyEntryIdentityToSchemeDefaults } from '../utils/quotation-entry-state';
import {
  normalizeCustomDevelopment,
  toCustomDevelopmentPayload,
  MAX_CUSTOM_DEVELOPMENT_MONEY,
  createDefaultCustomDevelopmentValues,
  CUSTOM_DEVELOPMENT_LIMITATION_OPTIONS,
  CUSTOM_DEVELOPMENT_TABLE_MODE_OPTIONS,
  calculateCustomDevelopmentDraftTotals,
  CUSTOM_DEVELOPMENT_TAX_TREATMENT_OPTIONS,
  DEFAULT_CUSTOM_DEVELOPMENT_LIMITATION_CODES,
  CUSTOM_DEVELOPMENT_PAYMENT_COMPONENT_OPTIONS,
} from './custom-development';

describe('custom-development constants & pure helpers', () => {
  const sampleKopiStudio24Input: CustomDevelopmentInput = {
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
    limitation_codes: ['out_of_pocket', 'overtime', 'third_party', 'scope_change'],
  };

  const sampleAssessmentOnlineInput: CustomDevelopmentInput = {
    system_name: 'Assessment Online - Tes Kognitif',
    quotation_date: '2026-07-20',
    development_table_mode: 'monthly_period',
    tax_treatment: 'exclusive_ppn',
    development_groups: [
      {
        title: 'Pengembangan Sistem Assessment',
        items: [
          {
            name: 'Developer',
            display_rate: 6_685_000,
            headcount: 1,
            period_label: '1',
            quoted_line_total: 6_685_000,
          },
          {
            name: 'Quality Assurance',
            display_rate: 2_005_500,
            headcount: 1,
            period_label: '1',
            quoted_line_total: 2_005_500,
          },
          {
            name: 'Hosting & Domain',
            display_rate: 200_000,
            headcount: 1,
            period_label: '12',
            quoted_line_total: 2_400_000,
          },
        ],
      },
    ],
    discount_label: 'DISCOUNT',
    discount_amount: 1_090_500,
    show_discount_row: true,
    module_groups: [
      {
        name: 'Modul Tes Kognitif',
        features: ['Modul Soal dan Jawaban', 'Scoring Otomatis'],
      },
    ],
    timeline_rows: [
      {
        description: 'Pengembangan & UAT',
        timeline: '2 Bulan',
      },
    ],
    payment_schedule: [
      {
        work_period: 'Termin 1 (DP 50%)',
        terms: 'Down Payment',
        invoice_date_label: 'Saat kontrak disepakati',
        due_date_label: 'H+7',
        component: 'development',
        nominal: 5_000_000,
      },
      {
        work_period: 'Termin 2 (Pelunasan 50%)',
        terms: 'Pelunasan',
        invoice_date_label: 'Setelah UAT selesai',
        due_date_label: 'H+7',
        component: 'development',
        nominal: 5_000_000,
      },
    ],
    limitation_codes: ['out_of_pocket', 'overtime', 'third_party', 'scope_change'],
  };

  const sampleEcoflowInput: CustomDevelopmentInput = {
    system_name: 'Company Profile Ecoflow',
    quotation_date: '2026-07-25',
    development_table_mode: 'fixed_days',
    tax_treatment: 'exclusive_ppn',
    development_groups: [
      {
        title: 'Website 1: Landing Page & Katalog',
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
        title: 'Website 2: Portal Klien & Admin',
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
  };

  describe('constants & options', () => {
    it('defines expected constants and catalog options', () => {
      expect(MAX_CUSTOM_DEVELOPMENT_MONEY).toBe(9_000_000_000_000_000);
      expect(CUSTOM_DEVELOPMENT_TABLE_MODE_OPTIONS).toHaveLength(3);
      expect(CUSTOM_DEVELOPMENT_TAX_TREATMENT_OPTIONS).toHaveLength(3);
      expect(CUSTOM_DEVELOPMENT_PAYMENT_COMPONENT_OPTIONS).toHaveLength(2);
      expect(CUSTOM_DEVELOPMENT_LIMITATION_OPTIONS).toHaveLength(4);
      expect(DEFAULT_CUSTOM_DEVELOPMENT_LIMITATION_CODES).toEqual([
        'out_of_pocket',
        'overtime',
        'third_party',
        'scope_change',
      ]);
    });
  });

  describe('calculateCustomDevelopmentDraftTotals', () => {
    it('calculates benchmark Kopi Studio24 totals correctly', () => {
      const totals = calculateCustomDevelopmentDraftTotals(sampleKopiStudio24Input);

      expect(totals.development_subtotal).toBe(20_062_500);
      expect(totals.discount_amount).toBe(2_062_500);
      expect(totals.total_investment).toBe(18_000_000);
      expect(totals.monthly_total).toBe(1_272_000);
      expect(totals.development_payment_total).toBe(18_000_000);
      expect(totals.development_delta).toBe(0);
      expect(totals.monthly_rows_valid).toBe(true);
      expect(totals.is_balanced).toBe(true);
    });

    it('calculates benchmark Assessment Online totals correctly (11_090_500 - 1_090_500 = 10_000_000)', () => {
      const totals = calculateCustomDevelopmentDraftTotals(sampleAssessmentOnlineInput);

      expect(totals.development_subtotal).toBe(11_090_500);
      expect(totals.discount_amount).toBe(1_090_500);
      expect(totals.total_investment).toBe(10_000_000);
      expect(totals.monthly_total).toBe(0);
      expect(totals.development_payment_total).toBe(10_000_000);
      expect(totals.development_delta).toBe(0);
      expect(totals.monthly_rows_valid).toBe(true);
      expect(totals.is_balanced).toBe(true);
    });

    it('calculates benchmark Ecoflow totals correctly (25_000_000 - 10_000_000 = 15_000_000)', () => {
      const totals = calculateCustomDevelopmentDraftTotals(sampleEcoflowInput);

      expect(totals.development_subtotal).toBe(25_000_000);
      expect(totals.discount_amount).toBe(10_000_000);
      expect(totals.total_investment).toBe(15_000_000);
      expect(totals.monthly_total).toBe(0);
      expect(totals.development_payment_total).toBe(15_000_000);
      expect(totals.development_delta).toBe(0);
      expect(totals.monthly_rows_valid).toBe(true);
      expect(totals.is_balanced).toBe(true);
    });

    it('ignores nil / null line total in subtotal (included QA)', () => {
      const totals = calculateCustomDevelopmentDraftTotals(sampleEcoflowInput);
      // Group 1 has 15_000_000 and null; Group 2 has 10_000_000 -> subtotal 25_000_000
      expect(totals.development_subtotal).toBe(25_000_000);
    });

    it('marks is_balanced as false on payment mismatch / delta != 0', () => {
      const unbalancedInput: CustomDevelopmentInput = {
        ...sampleAssessmentOnlineInput,
        payment_schedule: [
          {
            work_period: 'Termin 1 (DP)',
            terms: 'Down Payment',
            invoice_date_label: 'Saat SPK',
            due_date_label: 'H+7',
            component: 'development',
            nominal: 4_000_000, // Total 4M instead of 10M
          },
        ],
      };

      const totals = calculateCustomDevelopmentDraftTotals(unbalancedInput);
      expect(totals.development_payment_total).toBe(4_000_000);
      expect(totals.development_delta).toBe(6_000_000);
      expect(totals.is_balanced).toBe(false);
    });

    it('marks monthly_rows_valid and is_balanced as false when monthly total > 0 but no recurring payment row', () => {
      const missingMonthlyPaymentInput: CustomDevelopmentInput = {
        ...sampleKopiStudio24Input,
        payment_schedule: sampleKopiStudio24Input.payment_schedule.filter(
          (p) => p.component === 'development'
        ),
      };

      const totals = calculateCustomDevelopmentDraftTotals(missingMonthlyPaymentInput);
      expect(totals.monthly_total).toBe(1_272_000);
      expect(totals.monthly_rows_valid).toBe(false);
      expect(totals.is_balanced).toBe(false);
    });

    it('marks monthly_rows_valid and is_balanced as false when recurring row exists but monthly total is 0', () => {
      const unexpectedMonthlyPaymentInput: CustomDevelopmentInput = {
        ...sampleAssessmentOnlineInput,
        payment_schedule: [
          ...sampleAssessmentOnlineInput.payment_schedule,
          {
            work_period: 'Bulan 1',
            terms: 'Monthly',
            invoice_date_label: 'Awal bulan',
            due_date_label: 'H+7',
            component: 'monthly_recurring',
            nominal: 500_000,
          },
        ],
      };

      const totals = calculateCustomDevelopmentDraftTotals(unexpectedMonthlyPaymentInput);
      expect(totals.monthly_total).toBe(0);
      expect(totals.monthly_rows_valid).toBe(false);
      expect(totals.is_balanced).toBe(false);
    });

    it('marks is_balanced as false on overflow exceeding MAX_CUSTOM_DEVELOPMENT_MONEY or Number.MAX_SAFE_INTEGER', () => {
      const overflowInput: CustomDevelopmentInput = {
        ...sampleAssessmentOnlineInput,
        development_groups: [
          {
            title: 'Overflow Group',
            items: [
              {
                name: 'Massive Item',
                display_rate: null,
                headcount: 1,
                period_label: '1',
                quoted_line_total: 9_000_000_000_000_001,
              },
            ],
          },
        ],
      };

      const totals = calculateCustomDevelopmentDraftTotals(overflowInput);
      expect(totals.is_balanced).toBe(false);

      const unsafeIntegerInput: CustomDevelopmentInput = {
        ...sampleAssessmentOnlineInput,
        development_groups: [
          {
            title: 'Unsafe Group',
            items: [
              {
                name: 'Unsafe Item',
                display_rate: null,
                headcount: 1,
                period_label: '1',
                quoted_line_total: Number.MAX_SAFE_INTEGER + 10,
              },
            ],
          },
        ],
      };

      const unsafeTotals = calculateCustomDevelopmentDraftTotals(unsafeIntegerInput);
      expect(unsafeTotals.is_balanced).toBe(false);
    });
  });

  describe('normalizeCustomDevelopment', () => {
    it('trims strings, preserves order/casing, filters empty features, rights, and notes', () => {
      const unnormalized: CustomDevelopmentInput = {
        system_name: '  Sistem Kopi Studio24  ',
        quotation_date: '  2026-07-15  ',
        development_table_mode: 'monthly_period',
        tax_treatment: 'exclusive_ppn',
        development_groups: [
          {
            title: '  Fase 1: Core  ',
            items: [
              {
                name: '  Dev  ',
                display_rate: 15_000_000,
                headcount: 1,
                period_label: '  1 Bulan  ',
                quoted_line_total: 15_000_000,
              },
            ],
          },
        ],
        discount_label: '  DISCOUNT PROMO  ',
        discount_amount: 1_000_000,
        show_discount_row: true,
        monthly_items: [
          {
            name: '  Cloud Hosting  ',
            specification: '  2 vCPU  ',
            unit_rate: 500_000,
            quantity: 1,
          },
        ],
        monthly_notes: ['  Catatan 1  ', '   ', 'Catatan 2'],
        module_groups: [
          {
            name: '  Modul Transaksi  ',
            features: ['  Fitur A  ', '   ', 'Fitur B'],
          },
        ],
        timeline_rows: [
          {
            description: '  Pengerjaan  ',
            timeline: '  1 Bulan  ',
          },
        ],
        payment_schedule: [
          {
            work_period: '  DP 100%  ',
            terms: '  Termin 1  ',
            invoice_date_label: '  Saat SPK  ',
            due_date_label: '  H+7  ',
            component: 'development',
            nominal: 14_000_000,
          },
        ],
        rights_statements: ['  Hak cipta  ', '   '],
        limitation_codes: ['out_of_pocket', 'overtime'],
        additional_limitations: ['  Tidak termasuk domain  ', '   '],
      };

      const normalized = normalizeCustomDevelopment(unnormalized);

      expect(normalized.system_name).toBe('Sistem Kopi Studio24');
      expect(normalized.quotation_date).toBe('2026-07-15');
      expect(normalized.discount_label).toBe('DISCOUNT PROMO');
      expect(normalized.development_groups[0].title).toBe('Fase 1: Core');
      expect(normalized.development_groups[0].items[0].name).toBe('Dev');
      expect(normalized.development_groups[0].items[0].period_label).toBe('1 Bulan');
      expect(normalized.monthly_items?.[0].name).toBe('Cloud Hosting');
      expect(normalized.monthly_items?.[0].specification).toBe('2 vCPU');
      expect(normalized.monthly_notes).toEqual(['Catatan 1', 'Catatan 2']);
      expect(normalized.module_groups[0].name).toBe('Modul Transaksi');
      expect(normalized.module_groups[0].features).toEqual(['Fitur A', 'Fitur B']);
      expect(normalized.timeline_rows[0].description).toBe('Pengerjaan');
      expect(normalized.timeline_rows[0].timeline).toBe('1 Bulan');
      expect(normalized.payment_schedule[0].work_period).toBe('DP 100%');
      expect(normalized.payment_schedule[0].terms).toBe('Termin 1');
      expect(normalized.payment_schedule[0].invoice_date_label).toBe('Saat SPK');
      expect(normalized.payment_schedule[0].due_date_label).toBe('H+7');
      expect(normalized.rights_statements).toEqual(['Hak cipta']);
      expect(normalized.additional_limitations).toEqual(['Tidak termasuk domain']);
    });
  });

  describe('toCustomDevelopmentPayload', () => {
    it('does not send legacy fields, sets commercial_scheme: custom_development, and cleans undefined', () => {
      const formValues: CustomDevelopmentFormValues = {
        client_id: 'client-123',
        client_name: '  Budi Direktur  ',
        client_company_name: '  PT Usaha Bersama  ',
        subject: '  Penawaran Software  ',
        solution_type: 'Web Application',
        commercial_scheme: 'custom_development',
        custom_development: sampleAssessmentOnlineInput,
      };

      const skills: ActiveSkill[] = [
        {
          id: 'skill-uuid-1',
          name: 'Quotation Specialist',
          command: '/quotation',
          is_active: true,
        },
      ];

      const payload = toCustomDevelopmentPayload(formValues, skills[0], skills);

      expect(payload.commercial_scheme).toBe('custom_development');
      expect(payload.client_name).toBe('Budi Direktur');
      expect(payload.client_company_name).toBe('PT Usaha Bersama');
      expect(payload.subject).toBe('Penawaran Software');
      expect(payload.solution_type).toBe('Web Application');
      expect(payload.skill_id).toBe('skill-uuid-1');

      if (payload.commercial_scheme === 'custom_development') {
        expect(payload.custom_development.system_name).toBe('Assessment Online - Tes Kognitif');
      }

      // Check legacy fields are absent / not sent
      expect((payload as any).rate_card_id).toBeUndefined();
      expect((payload as any).budget_maximum).toBeUndefined();
      expect((payload as any).project_duration_months).toBeUndefined();
      expect((payload as any).dedicated_squad).toBeUndefined();
      expect((payload as any).subscription_saas).toBeUndefined();
      expect((payload as any).white_label).toBeUndefined();
      expect((payload as any).standalone_maintenance).toBeUndefined();
    });

    it('sets client_company_name to undefined when blank or empty', () => {
      const formValues: CustomDevelopmentFormValues = {
        client_id: '',
        client_name: 'Budi',
        client_company_name: '   ',
        subject: 'Penawaran',
        solution_type: 'Web Application',
        commercial_scheme: 'custom_development',
        custom_development: sampleAssessmentOnlineInput,
      };

      const payload = toCustomDevelopmentPayload(formValues, null, []);
      expect(payload.client_id).toBeUndefined();
      expect(payload.client_company_name).toBeUndefined();
    });
  });

  describe('createDefaultCustomDevelopmentValues', () => {
    it('creates sensible defaults with today date and client info', () => {
      const mockClient: ClientSummary = {
        id: 'client-1',
        name: 'Client Corp',
      };
      const defaults = createDefaultCustomDevelopmentValues('2026-09-09', mockClient);

      expect(defaults.commercial_scheme).toBe('custom_development');
      expect(defaults.client_id).toBe('client-1');
      expect(defaults.client_company_name).toBe('Client Corp');
      expect(defaults.custom_development.quotation_date).toBe('2026-09-09');
      expect(defaults.custom_development.development_table_mode).toBe('monthly_period');
      expect(defaults.custom_development.tax_treatment).toBe('not_stated');
      expect(defaults.custom_development.development_groups).toHaveLength(1);
      expect(defaults.custom_development.limitation_codes).toEqual([
        'out_of_pocket',
        'overtime',
        'third_party',
        'scope_change',
      ]);
    });

    it('merges entry identity into default custom development values', () => {
      const base = createDefaultCustomDevelopmentValues('2026-09-09');
      const withEntry = applyEntryIdentityToSchemeDefaults(base, {
        project_name: 'Custom ERP Enterprise',
        client_id: 'client-cd-1',
        client_company_name: 'PT Kreasi Unggul',
        pic_name: 'Bambang Sudibyo',
      });

      expect(withEntry.subject).toBe('Custom ERP Enterprise');
      expect(withEntry.client_id).toBe('client-cd-1');
      expect(withEntry.client_company_name).toBe('PT Kreasi Unggul');
      expect(withEntry.client_name).toBe('Bambang Sudibyo');
    });
  });
});
