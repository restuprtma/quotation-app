import { it, expect, describe } from 'vitest';

import {
  subscriptionSaaSSchema,
  subscriptionSaaSFormSchema,
} from './subscription-saas-form-model';

describe('subscriptionSaaSSchema & subscriptionSaaSFormSchema', () => {
  const validHubungInput = {
    product_name: 'Hubung SaaS',
    quotation_date: '2026-09-07',
    section_layout: 'subscription_development' as const,
    billing_cycle: 'monthly' as const,
    tax_treatment: 'not_stated' as const,
    initial_term_months: 12,
    auto_renewal: true,
    price_periods: [
      {
        label: 'Subscription 12 bulan',
        start_month_offset: 0,
        duration_months: 12,
        monthly_rate: 1_000_000,
      },
    ],
    one_time_items: [],
    payment_schedule: Array.from({ length: 12 }, (_, i) => ({
      work_period: `Bulan ${i + 1}`,
      start_month_offset: i,
      covered_months: 1,
      invoice_date_label: 'Saat penandatanganan',
      due_date_label: 'H+14',
      nominal: 1_000_000,
    })),
    feature_groups: [],
    rights_clause_code: 'venturo_software_ownership_v1' as const,
    is_partnership: false,
  };

  const validPercetakanInput = {
    product_name: 'Subscription AI Percetakan',
    quotation_date: '2026-08-01',
    section_layout: 'subscription_development' as const,
    billing_cycle: 'quarterly' as const,
    tax_treatment: 'not_stated' as const,
    initial_term_months: 12,
    auto_renewal: false,
    price_periods: [
      {
        label: 'Subscription 12 bulan',
        start_month_offset: 0,
        duration_months: 12,
        monthly_rate: 1_250_000,
      },
    ],
    one_time_items: [],
    payment_schedule: [
      {
        work_period: 'Agustus-Oktober 2026',
        start_month_offset: 0,
        covered_months: 3,
        invoice_date_label: 'Saat SPK',
        due_date_label: 'H+14',
        nominal: 3_750_000,
      },
      {
        work_period: 'November 2026-Januari 2027',
        start_month_offset: 3,
        covered_months: 3,
        invoice_date_label: '1 Okt 2026',
        due_date_label: '15 Okt 2026',
        nominal: 3_750_000,
      },
      {
        work_period: 'Februari-April 2027',
        start_month_offset: 6,
        covered_months: 3,
        invoice_date_label: '1 Jan 2027',
        due_date_label: '15 Jan 2027',
        nominal: 3_750_000,
      },
      {
        work_period: 'Mei-Juli 2027',
        start_month_offset: 9,
        covered_months: 3,
        invoice_date_label: '1 Apr 2027',
        due_date_label: '15 Apr 2027',
        nominal: 3_750_000,
      },
    ],
    feature_groups: [],
    rights_clause_code: 'venturo_software_ownership_v1' as const,
    is_partnership: true,
    income_sharing: {
      venturo_share_bps: 5_000,
      partner_share_bps: 5_000,
      eligible_revenue_description: 'Penjualan dari referensi mitra',
      settlement_business_days: 30,
      prohibit_unilateral_discount: true,
    },
  };

  it('validates a valid Hubung quotation structure', () => {
    const result = subscriptionSaaSSchema.safeParse(validHubungInput);
    expect(result.success).toBe(true);
  });

  it('validates a valid Percetakan partnership quotation structure', () => {
    const result = subscriptionSaaSSchema.safeParse(validPercetakanInput);
    expect(result.success).toBe(true);
  });

  it('validates full form schema with client and metadata', () => {
    const fullForm = {
      client_id: 'client-1',
      client_name: 'Budi Santoso',
      client_company_name: 'PT Percetakan Nusantara',
      subject: 'Penawaran Layanan SaaS',
      solution_type: 'Web Application',
      commercial_scheme: 'subscription_saas' as const,
      subscription_saas: validPercetakanInput,
    };

    const result = subscriptionSaaSFormSchema.safeParse(fullForm);
    expect(result.success).toBe(true);
  });

  describe('price coverage validations', () => {
    it('fails when price_periods is empty', () => {
      const invalid = { ...validHubungInput, price_periods: [] };
      const result = subscriptionSaaSSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path[0] === 'price_periods')).toBe(true);
      }
    });

    it('fails when price period duration does not sum to initial_term_months', () => {
      const invalid = {
        ...validHubungInput,
        price_periods: [
          {
            label: 'Period 1',
            start_month_offset: 0,
            duration_months: 6,
            monthly_rate: 1_000_000,
          },
        ],
      };
      const result = subscriptionSaaSSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path[0] === 'price_periods')).toBe(true);
      }
    });

    it('fails when price period offsets have a gap', () => {
      const invalid = {
        ...validHubungInput,
        price_periods: [
          { label: 'P1', start_month_offset: 0, duration_months: 6, monthly_rate: 1_000_000 },
          { label: 'P2', start_month_offset: 7, duration_months: 6, monthly_rate: 1_000_000 },
        ],
      };
      const result = subscriptionSaaSSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const offsetIssue = result.error.issues.find(
          (i) => i.path[0] === 'price_periods' && i.path[1] === 1 && i.path[2] === 'start_month_offset'
        );
        expect(offsetIssue).toBeDefined();
      }
    });
  });

  describe('payment schedule & cycle validations', () => {
    it('fails when payment nominal total does not reconcile with total contract', () => {
      const invalid = {
        ...validHubungInput,
        // 12 months * 1.000.000 = 12.000.000, but payment total is 11.000.000
        payment_schedule: validHubungInput.payment_schedule.map((row, idx) =>
          idx === 0 ? { ...row, nominal: 0 } : row
        ),
      };
      const result = subscriptionSaaSSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path[0] === 'payment_schedule')).toBe(true);
      }
    });

    it('accounts for one-time items in total contract reconciliation', () => {
      const withOneTime = {
        ...validHubungInput,
        one_time_items: [{ name: 'Implementation', amount: 2_000_000 }],
        // 12M + 2M = 14M, but payments sum to 12M
      };
      const failResult = subscriptionSaaSSchema.safeParse(withOneTime);
      expect(failResult.success).toBe(false);

      // Now update payments to sum to 14M
      const fixedPayments = withOneTime.payment_schedule.map((row, idx) =>
        idx === 0 ? { ...row, nominal: 3_000_000 } : row
      );
      const successResult = subscriptionSaaSSchema.safeParse({
        ...withOneTime,
        payment_schedule: fixedPayments,
      });
      expect(successResult.success).toBe(true);
    });

    it('fails when monthly billing cycle row has covered_months != 1', () => {
      const invalid = {
        ...validHubungInput,
        payment_schedule: [
          {
            work_period: 'Bulan 1-2',
            start_month_offset: 0,
            covered_months: 2,
            invoice_date_label: '',
            due_date_label: '',
            nominal: 2_000_000,
          },
          ...validHubungInput.payment_schedule.slice(2).map((r) => ({ ...r })),
        ],
      };
      const result = subscriptionSaaSSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const cycleIssue = result.error.issues.find(
          (i) => i.path[0] === 'payment_schedule' && i.path[2] === 'covered_months'
        );
        expect(cycleIssue).toBeDefined();
      }
    });

    it('fails when quarterly billing cycle intermediate row has covered_months != 3', () => {
      const invalid = {
        ...validPercetakanInput,
        payment_schedule: [
          { ...validPercetakanInput.payment_schedule[0], covered_months: 2 },
          { ...validPercetakanInput.payment_schedule[1], start_month_offset: 2, covered_months: 4 },
          validPercetakanInput.payment_schedule[2],
          validPercetakanInput.payment_schedule[3],
        ],
      };
      const result = subscriptionSaaSSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path[0] === 'payment_schedule')).toBe(true);
      }
    });
  });

  describe('section layout & feature groups validations', () => {
    it('fails when development_maintenance layout has empty feature_groups', () => {
      const invalid = {
        ...validHubungInput,
        section_layout: 'development_maintenance' as const,
        feature_groups: [],
      };
      const result = subscriptionSaaSSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fgIssue = result.error.issues.find((i) => i.path[0] === 'feature_groups');
        expect(fgIssue).toBeDefined();
      }
    });

    it('passes when development_maintenance layout has at least one feature group', () => {
      const valid = {
        ...validHubungInput,
        section_layout: 'development_maintenance' as const,
        feature_groups: [{ name: 'Core', features: ['Auth', 'Dashboard'] }],
      };
      const result = subscriptionSaaSSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('partnership & income sharing validations', () => {
    it('fails when is_partnership is true but income_sharing is missing', () => {
      const invalid = {
        ...validPercetakanInput,
        is_partnership: true,
        income_sharing: undefined,
      };
      const result = subscriptionSaaSSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'income_sharing');
        expect(issue).toBeDefined();
      }
    });

    it('fails when income sharing shares do not total 10000 basis points', () => {
      const invalid = {
        ...validPercetakanInput,
        income_sharing: {
          ...validPercetakanInput.income_sharing,
          venturo_share_bps: 6_000,
          partner_share_bps: 3_000, // totals 9000 != 10000
        },
      };
      const result = subscriptionSaaSSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'income_sharing');
        expect(issue).toBeDefined();
      }
    });

    it('fails when is_partnership is false but income_sharing is provided', () => {
      const invalid = {
        ...validHubungInput,
        is_partnership: false,
        income_sharing: {
          venturo_share_bps: 5_000,
          partner_share_bps: 5_000,
          eligible_revenue_description: 'Not applicable',
          settlement_business_days: 30,
          prohibit_unilateral_discount: true,
        },
      };
      const result = subscriptionSaaSSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'income_sharing');
        expect(issue).toBeDefined();
      }
    });
  });
});
