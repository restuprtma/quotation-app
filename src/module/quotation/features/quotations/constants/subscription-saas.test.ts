import type { ActiveSkill, ClientSummary } from '../types';

import { it, expect, describe } from 'vitest';

import { applyEntryIdentityToSchemeDefaults } from '../utils/quotation-entry-state';
import {
  buildPaymentRowSkeletons,
  normalizeSubscriptionSaaS,
  toSubscriptionSaaSPayload,
  syncFeatureGroupsForLayout,
  MAX_SUBSCRIPTION_SAFE_AMOUNT,
  calculatePaymentScheduleTotal,
  createDefaultSubscriptionSaaSValues,
} from './subscription-saas';

describe('subscription-saas constants & pure helpers', () => {
  const today = '2026-09-07';
  const mockClient: ClientSummary = {
    id: 'client-uuid-1234',
    name: 'PT Percetakan Nusantara',
  };

  describe('createDefaultSubscriptionSaaSValues', () => {
    it('creates default Hubung-compatible values: 12 months, monthly, 1 price period, ownership code capable, non-partnership', () => {
      const values = createDefaultSubscriptionSaaSValues(today, mockClient);

      expect(values.client_id).toBe('client-uuid-1234');
      expect(values.client_company_name).toBe('PT Percetakan Nusantara');
      expect(values.client_name).toBe('Pimpinan Perusahaan');
      expect(values.commercial_scheme).toBe('subscription_saas');

      const saas = values.subscription_saas;
      expect(saas.quotation_date).toBe(today);
      expect(saas.initial_term_months).toBe(12);
      expect(saas.billing_cycle).toBe('monthly');
      expect(saas.section_layout).toBe('subscription_development');
      expect(saas.tax_treatment).toBe('not_stated');
      expect(saas.auto_renewal).toBe(false);
      expect(saas.is_partnership).toBe(false);
      expect(saas.rights_clause_code).toBe('');

      expect(saas.price_periods).toHaveLength(1);
      expect(saas.price_periods[0]).toEqual({
        label: 'Subscription 12 bulan',
        start_month_offset: 0,
        duration_months: 12,
        monthly_rate: 0,
      });

      expect(saas.one_time_items).toEqual([]);
      expect(saas.payment_schedule).toEqual([]);
      expect(saas.feature_groups).toEqual([]);
    });

    it('merges entry identity into default subscription saas values', () => {
      const base = createDefaultSubscriptionSaaSValues(today);
      const withEntry = applyEntryIdentityToSchemeDefaults(base, {
        project_name: 'SaaS HRIS Perusahaan',
        client_id: 'client-saas-1',
        client_company_name: 'PT Digital Solusi',
        pic_name: 'Siti Aminah',
      });

      expect(withEntry.subject).toBe('SaaS HRIS Perusahaan');
      expect(withEntry.client_id).toBe('client-saas-1');
      expect(withEntry.client_company_name).toBe('PT Digital Solusi');
      expect(withEntry.client_name).toBe('Siti Aminah');
    });
  });

  describe('buildPaymentRowSkeletons', () => {
    it('builds 12 monthly rows for 12 months initial term with contiguous offsets', () => {
      const rows = buildPaymentRowSkeletons(12, 'monthly');
      expect(rows).toHaveLength(12);

      rows.forEach((row, index) => {
        expect(row.work_period).toBe(`Bulan ${index + 1}`);
        expect(row.start_month_offset).toBe(index);
        expect(row.covered_months).toBe(1);
        expect(row.invoice_date_label).toBe('');
        expect(row.due_date_label).toBe('');
        expect(row.nominal).toBe(0);
      });
    });

    it('builds 4 quarterly rows for 12 months initial term', () => {
      const rows = buildPaymentRowSkeletons(12, 'quarterly');
      expect(rows).toHaveLength(4);

      expect(rows[0]).toEqual({
        work_period: 'Bulan 1-3',
        start_month_offset: 0,
        covered_months: 3,
        invoice_date_label: '',
        due_date_label: '',
        nominal: 0,
      });
      expect(rows[1].work_period).toBe('Bulan 4-6');
      expect(rows[1].start_month_offset).toBe(3);
      expect(rows[1].covered_months).toBe(3);

      expect(rows[2].work_period).toBe('Bulan 7-9');
      expect(rows[2].start_month_offset).toBe(6);
      expect(rows[2].covered_months).toBe(3);

      expect(rows[3].work_period).toBe('Bulan 10-12');
      expect(rows[3].start_month_offset).toBe(9);
      expect(rows[3].covered_months).toBe(3);
    });

    it('builds 1 yearly row for 12 months initial term', () => {
      const rows = buildPaymentRowSkeletons(12, 'yearly');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        work_period: 'Tahun 1',
        start_month_offset: 0,
        covered_months: 12,
        invoice_date_label: '',
        due_date_label: '',
        nominal: 0,
      });
    });

    it('handles non-divisible term: quarterly 14 months produces [3,3,3,3,2] coverage', () => {
      const rows = buildPaymentRowSkeletons(14, 'quarterly');
      expect(rows).toHaveLength(5);

      const coverages = rows.map((r) => r.covered_months);
      expect(coverages).toEqual([3, 3, 3, 3, 2]);

      const offsets = rows.map((r) => r.start_month_offset);
      expect(offsets).toEqual([0, 3, 6, 9, 12]);

      expect(rows[4].work_period).toBe('Bulan 13-14');
      expect(rows[4].covered_months).toBe(2);
      expect(rows[4].start_month_offset).toBe(12);
    });
  });

  describe('calculatePaymentScheduleTotal', () => {
    it('calculates integer total correctly', () => {
      const payments = [
        { nominal: 3_750_000 },
        { nominal: 3_750_000 },
        { nominal: 3_750_000 },
        { nominal: 3_750_000 },
      ];
      expect(calculatePaymentScheduleTotal(payments)).toBe(15_000_000);
    });

    it('rejects negative numbers', () => {
      expect(() => calculatePaymentScheduleTotal([{ nominal: -100 }])).toThrow(
        /Invalid payment nominal/
      );
    });

    it('rejects non-integer / floating-point numbers', () => {
      expect(() => calculatePaymentScheduleTotal([{ nominal: 1000.5 }])).toThrow(
        /Invalid payment nominal/
      );
    });

    it('rejects unsafe integers exceeding Number.MAX_SAFE_INTEGER', () => {
      expect(() =>
        calculatePaymentScheduleTotal([{ nominal: Number.MAX_SAFE_INTEGER + 10 }])
      ).toThrow();
    });

    it('rejects total exceeding MAX_SUBSCRIPTION_SAFE_AMOUNT', () => {
      expect(() =>
        calculatePaymentScheduleTotal([{ nominal: MAX_SUBSCRIPTION_SAFE_AMOUNT }, { nominal: 1 }])
      ).toThrow(/exceeds safe limit/);
    });
  });

  describe('syncFeatureGroupsForLayout', () => {
    it('auto-adds one feature group when switching to development_maintenance with empty groups', () => {
      const groups = syncFeatureGroupsForLayout('development_maintenance', []);
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBeTruthy();
      expect(groups[0].features.length).toBeGreaterThan(0);
    });

    it('preserves existing feature groups when layout is development_maintenance', () => {
      const existing = [{ name: 'Custom Module', features: ['Feature 1'] }];
      const groups = syncFeatureGroupsForLayout('development_maintenance', existing);
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe('Custom Module');
      expect(groups[0].features).toEqual(['Feature 1']);
    });

    it('does not auto-add feature groups when layout is subscription_development', () => {
      const groups = syncFeatureGroupsForLayout('subscription_development', []);
      expect(groups).toEqual([]);
    });
  });

  describe('normalizeSubscriptionSaaS', () => {
    it('deep-clones all nested arrays', () => {
      const original = {
        product_name: ' SaaS App ',
        quotation_date: '2026-09-07',
        section_layout: 'subscription_development' as const,
        billing_cycle: 'monthly' as const,
        tax_treatment: 'not_stated' as const,
        initial_term_months: 12,
        auto_renewal: false,
        price_periods: [
          {
            label: ' Period 1 ',
            start_month_offset: 0,
            duration_months: 12,
            monthly_rate: 1_000_000,
          },
        ],
        one_time_items: [{ name: ' Setup ', amount: 500_000 }],
        payment_schedule: [
          {
            work_period: ' Bulan 1 ',
            start_month_offset: 0,
            covered_months: 1,
            invoice_date_label: ' Saat SPK ',
            due_date_label: ' H+14 ',
            nominal: 1_500_000,
          },
        ],
        feature_groups: [{ name: ' Group 1 ', features: [' Feature A ', ''] }],
        rights_clause_code: 'venturo_software_ownership_v1',
        is_partnership: true,
        income_sharing: {
          venturo_share_bps: 5_000,
          partner_share_bps: 5_000,
          eligible_revenue_description: ' Penjualan mitra ',
          settlement_business_days: 30,
          prohibit_unilateral_discount: true,
        },
      };

      const normalized = normalizeSubscriptionSaaS(original);

      expect(normalized.product_name).toBe('SaaS App');
      expect(normalized.price_periods[0].label).toBe('Period 1');
      expect(normalized.one_time_items?.[0].name).toBe('Setup');
      expect(normalized.payment_schedule[0].work_period).toBe('Bulan 1');
      expect(normalized.feature_groups?.[0].name).toBe('Group 1');
      expect(normalized.feature_groups?.[0].features).toEqual(['Feature A']);

      // Assert deep-clone independence
      expect(normalized.price_periods).not.toBe(original.price_periods);
      expect(normalized.one_time_items).not.toBe(original.one_time_items);
      expect(normalized.payment_schedule).not.toBe(original.payment_schedule);
      expect(normalized.feature_groups).not.toBe(original.feature_groups);
      expect(normalized.feature_groups?.[0].features).not.toBe(original.feature_groups[0].features);

      // Mutate original and assert normalized is unaffected
      original.price_periods[0].label = 'Mutated';
      original.price_periods.push({
        label: 'Period 2',
        start_month_offset: 12,
        duration_months: 12,
        monthly_rate: 2_000_000,
      });
      expect(normalized.price_periods).toHaveLength(1);
      expect(normalized.price_periods[0].label).toBe('Period 1');
    });

    it('removes income_sharing when is_partnership is switched to false', () => {
      const input = {
        product_name: 'Test',
        quotation_date: '2026-09-07',
        section_layout: 'subscription_development' as const,
        billing_cycle: 'monthly' as const,
        tax_treatment: 'not_stated' as const,
        initial_term_months: 12,
        auto_renewal: false,
        price_periods: [
          { label: 'P1', start_month_offset: 0, duration_months: 12, monthly_rate: 100_000 },
        ],
        payment_schedule: [
          {
            work_period: 'Bulan 1',
            start_month_offset: 0,
            covered_months: 12,
            invoice_date_label: '',
            due_date_label: '',
            nominal: 1_200_000,
          },
        ],
        is_partnership: false,
        income_sharing: {
          venturo_share_bps: 5_000,
          partner_share_bps: 5_000,
          eligible_revenue_description: 'Desc',
          settlement_business_days: 30,
          prohibit_unilateral_discount: true,
        },
      };

      const normalized = normalizeSubscriptionSaaS(input);
      expect(normalized.is_partnership).toBe(false);
      expect(normalized.income_sharing).toBeUndefined();
    });
  });

  describe('toSubscriptionSaaSPayload', () => {
    it('converts form values to GenerateQuotationPayload with subscription_saas scheme and resolved skill_id', () => {
      const formValues = createDefaultSubscriptionSaaSValues(today, mockClient);
      formValues.subject = 'SaaS Proposal';
      formValues.subscription_saas.product_name = 'Enterprise SaaS';

      const skills: ActiveSkill[] = [
        { id: 'skill-uuid-1', name: 'Master', command: '/quotation', is_active: true },
      ];

      const payload = toSubscriptionSaaSPayload(formValues, null, skills);

      expect(payload.commercial_scheme).toBe('subscription_saas');
      if (payload.commercial_scheme !== 'subscription_saas') return;

      expect(payload.skill_id).toBe('skill-uuid-1');
      expect(payload.client_id).toBe('client-uuid-1234');
      expect(payload.client_company_name).toBe('PT Percetakan Nusantara');
      expect(payload.subject).toBe('SaaS Proposal');
      expect(payload.subscription_saas.product_name).toBe('Enterprise SaaS');
    });
  });
});
