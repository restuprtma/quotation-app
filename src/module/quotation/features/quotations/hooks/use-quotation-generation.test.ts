import type {
  GenerateQuotationPayload,
  SubscriptionSaaSPreviewResponse,
  CustomDevelopmentPreviewResponse,
  StandaloneMaintenancePreviewResponse,
} from '../types';

import { it, vi, expect, describe } from 'vitest';

import axios, { endpoints } from 'src/shared/lib/axios';

import {
  previewSubscriptionSaaS,
  previewCustomDevelopment,
  previewStandaloneMaintenance,
} from '../api/generation';
import {
  useSubscriptionSaaSPreview,
  useCustomDevelopmentPreview,
  useStandaloneMaintenancePreview,
  SUBSCRIPTION_SAAS_PREVIEW_QUERY_KEY,
  CUSTOM_DEVELOPMENT_PREVIEW_QUERY_KEY,
  normalizeSubscriptionSaaSPreviewPayload,
  STANDALONE_MAINTENANCE_PREVIEW_QUERY_KEY,
  normalizeCustomDevelopmentPreviewPayload,
  normalizeStandaloneMaintenancePreviewPayload,
} from './use-quotation-generation';

describe('Subscription SaaS preview API & hook', () => {
  const samplePayload: GenerateQuotationPayload = {
    skill_id: 'skill-uuid-1',
    client_id: 'client-uuid-1',
    client_name: 'Client',
    subject: 'Subject',
    solution_type: 'Web Application',
    commercial_scheme: 'subscription_saas',
    subscription_saas: {
      product_name: 'App SaaS',
      quotation_date: '2026-09-07',
      section_layout: 'subscription_development',
      billing_cycle: 'monthly',
      tax_treatment: 'not_stated',
      initial_term_months: 12,
      auto_renewal: false,
      price_periods: [
        {
          label: 'Subscription 12 bulan',
          start_month_offset: 0,
          duration_months: 12,
          monthly_rate: 1_000_000,
        },
      ],
      one_time_items: [],
      payment_schedule: [
        {
          work_period: 'Bulan 1-12',
          start_month_offset: 0,
          covered_months: 12,
          invoice_date_label: 'Saat SPK',
          due_date_label: 'H+14',
          nominal: 12_000_000,
        },
      ],
      is_partnership: false,
    },
  };

  it('configures the subscriptionPreview endpoint correctly', () => {
    expect((endpoints as any).quotation?.quotations?.subscriptionPreview).toBe(
      '/quotation/v1/quotations/preview/subscription-saas'
    );
  });

  it('defines the query key matching the specification', () => {
    expect(SUBSCRIPTION_SAAS_PREVIEW_QUERY_KEY).toEqual([
      'quotation',
      'subscription-saas-preview',
    ]);
  });

  describe('normalizeSubscriptionSaaSPreviewPayload', () => {
    it('returns null when payload is null or not subscription_saas', () => {
      expect(normalizeSubscriptionSaaSPreviewPayload(null)).toBeNull();
      expect(normalizeSubscriptionSaaSPreviewPayload(undefined)).toBeNull();

      const dedicatedPayload = {
        commercial_scheme: 'dedicated_squad',
      } as unknown as GenerateQuotationPayload;
      expect(normalizeSubscriptionSaaSPreviewPayload(dedicatedPayload)).toBeNull();
    });

    it('normalizes valid subscription_saas payload and clones arrays', () => {
      const normalized = normalizeSubscriptionSaaSPreviewPayload(samplePayload);
      expect(normalized).not.toBeNull();
      expect(normalized?.commercial_scheme).toBe('subscription_saas');
      expect(normalized?.subscription_saas.product_name).toBe('App SaaS');
      expect(normalized?.subscription_saas.price_periods).not.toBe(
        samplePayload.subscription_saas.price_periods
      );
    });
  });

  describe('previewSubscriptionSaaS API function', () => {
    it('calls axios.post with endpoint and returns unwrapped data', async () => {
      const mockResponse: SubscriptionSaaSPreviewResponse = {
        calculation: {
          price_periods: [
            {
              label: 'Subscription 12 bulan',
              start_month_offset: 0,
              duration_months: 12,
              monthly_rate: 1_000_000,
              subtotal: 12_000_000,
            },
          ],
          one_time_items: [],
          recurring_total: 12_000_000,
          one_time_total: 0,
          total_contract: 12_000_000,
          payments: samplePayload.subscription_saas.payment_schedule,
        },
        resolved_profile: {
          section_layout: 'subscription_development',
          billing_cycle: 'monthly',
          tax_treatment: 'not_stated',
          legal_catalog_version: 'subscription_saas_legal_v1',
        },
        visible_sections: [
          { number: 1, code: 'commercial', title: 'Biaya Subscription' },
          { number: 2, code: 'payment', title: 'Pembayaran' },
        ],
      };

      const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: mockResponse,
          message: 'Preview calculated successfully',
        },
      });

      const abortController = new AbortController();
      const result = await previewSubscriptionSaaS(samplePayload, abortController.signal);

      expect(postSpy).toHaveBeenCalledWith(
        '/quotation/v1/quotations/preview/subscription-saas',
        samplePayload,
        { signal: abortController.signal }
      );
      expect(result.calculation.total_contract).toBe(12_000_000);
      expect(result.resolved_profile.legal_catalog_version).toBe('subscription_saas_legal_v1');
    });

    it('throws when API returns an error envelope', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          errors: 'Subscription SaaS input is invalid',
        },
      });

      await expect(previewSubscriptionSaaS(samplePayload)).rejects.toThrow(
        'Subscription SaaS input is invalid'
      );
    });
  });

  describe('useSubscriptionSaaSPreview hook definition', () => {
    it('is exported as a function', () => {
      expect(typeof useSubscriptionSaaSPreview).toBe('function');
    });
  });
});

describe('Standalone Maintenance preview API & hook', () => {
  const sampleStandalonePayload: GenerateQuotationPayload = {
    skill_id: 'skill-uuid-1',
    client_id: 'client-uuid-1',
    client_name: 'Client',
    subject: 'Subject',
    solution_type: 'Web Application',
    commercial_scheme: 'standalone_maintenance',
    standalone_maintenance: {
      system_name: 'Aplikasi Nex Health',
      quotation_date: '2026-07-07',
      mode: 'retainer',
      tax_treatment: 'exclusive_ppn',
      retainer_items: [
        { name: 'Senior Web Programmer', monthly_rate: 16_050_000, fte_quarters: 4, period_months: 1 },
      ],
      defect_groups: [
        {
          title: 'Detail Pasien',
          items: [
            {
              item_number: '1.1',
              priority: 'P0',
              function: 'Medical history',
              screen_flow: 'Detail',
              existing: 'Registrasi',
              improvement: 'SOAP',
            },
          ],
        },
      ],
      show_discount_row: true,
      discount_amount: 0,
      payment_schedule: [
        {
          work_period: 'Bulan 1',
          terms: 'Maintenance',
          invoice_date_label: '13 Agustus 2026',
          due_date_label: '27 Agustus 2026',
          nominal: 16_050_000,
        },
      ],
      rights_statements: [],
    },
  };

  it('configures the standaloneMaintenancePreview endpoint correctly', () => {
    expect((endpoints as any).quotation?.quotations?.standaloneMaintenancePreview).toBe(
      '/quotation/v1/quotations/preview/standalone-maintenance'
    );
  });

  it('defines the query key matching the specification', () => {
    expect(STANDALONE_MAINTENANCE_PREVIEW_QUERY_KEY).toEqual([
      'quotation',
      'standalone-maintenance-preview',
    ]);
  });

  describe('normalizeStandaloneMaintenancePreviewPayload', () => {
    it('returns null when payload is null or not standalone_maintenance', () => {
      expect(normalizeStandaloneMaintenancePreviewPayload(null)).toBeNull();
      expect(normalizeStandaloneMaintenancePreviewPayload(undefined)).toBeNull();

      const dedicatedPayload = {
        commercial_scheme: 'dedicated_squad',
      } as unknown as GenerateQuotationPayload;
      expect(normalizeStandaloneMaintenancePreviewPayload(dedicatedPayload)).toBeNull();
    });

    it('normalizes valid standalone_maintenance payload and clones arrays', () => {
      const normalized = normalizeStandaloneMaintenancePreviewPayload(sampleStandalonePayload);
      expect(normalized).not.toBeNull();
      expect(normalized?.commercial_scheme).toBe('standalone_maintenance');
      expect(normalized?.standalone_maintenance.system_name).toBe('Aplikasi Nex Health');
      expect(normalized?.standalone_maintenance.retainer_items).not.toBe(
        sampleStandalonePayload.standalone_maintenance.retainer_items
      );
    });
  });

  describe('previewStandaloneMaintenance API function', () => {
    it('calls axios.post with endpoint and returns unwrapped data', async () => {
      const mockResponse: StandaloneMaintenancePreviewResponse = {
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
          ],
          subtotal: 16_050_000,
          discount_amount: 0,
          total_investment: 16_050_000,
          payment_total: 16_050_000,
        },
        resolved_profile: {
          mode: 'retainer',
          tax_treatment: 'exclusive_ppn',
          tax_clause_text: 'Biaya di atas belum termasuk PPN.',
          show_discount_row: true,
          show_rights: false,
          sections: [
            { number: 1, code: 'cost', title: 'Biaya Maintenance' },
            { number: 2, code: 'defect', title: 'Matriks Defect' },
            { number: 3, code: 'payment', title: 'Jadwal Pembayaran' },
          ],
        },
      };

      const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: mockResponse,
          message: 'Standalone maintenance preview calculated successfully',
        },
      });

      const abortController = new AbortController();
      const result = await previewStandaloneMaintenance(sampleStandalonePayload, abortController.signal);

      expect(postSpy).toHaveBeenCalledWith(
        '/quotation/v1/quotations/preview/standalone-maintenance',
        sampleStandalonePayload,
        { signal: abortController.signal }
      );
      expect(result.calculation.total_investment).toBe(16_050_000);
      expect(result.resolved_profile.mode).toBe('retainer');
    });

    it('throws when API returns an error envelope', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          errors: 'Standalone maintenance input is invalid',
        },
      });

      await expect(previewStandaloneMaintenance(sampleStandalonePayload)).rejects.toThrow(
        'Standalone maintenance input is invalid'
      );
    });
  });

  describe('useStandaloneMaintenancePreview hook definition', () => {
    it('is exported as a function', () => {
      expect(typeof useStandaloneMaintenancePreview).toBe('function');
    });
  });
});

describe('Custom Development preview API & hook', () => {
  const sampleCustomDevPayload: GenerateQuotationPayload = {
    skill_id: 'skill-uuid-1',
    client_id: 'client-uuid-1',
    client_name: 'Client',
    subject: 'Subject',
    solution_type: 'Web Application',
    commercial_scheme: 'custom_development',
    custom_development: {
      system_name: 'Sistem Kopi Studio24',
      quotation_date: '2026-07-15',
      development_table_mode: 'monthly_period',
      tax_treatment: 'exclusive_ppn',
      development_groups: [
        {
          title: 'Fase 1',
          items: [
            {
              name: 'Senior Dev',
              display_rate: 15_000_000,
              headcount: 1,
              period_label: '1',
              quoted_line_total: 15_000_000,
            },
          ],
        },
      ],
      discount_label: 'DISCOUNT',
      discount_amount: 1_000_000,
      show_discount_row: true,
      monthly_items: [
        {
          name: 'Cloud Hosting',
          specification: 'Standard',
          unit_rate: 1_000_000,
          quantity: 1,
        },
      ],
      module_groups: [
        {
          name: 'Modul 1',
          features: ['Fitur 1'],
        },
      ],
      timeline_rows: [
        {
          description: 'Pengerjaan',
          timeline: '1 Bulan',
        },
      ],
      payment_schedule: [
        {
          work_period: 'Termin 1',
          terms: 'DP',
          invoice_date_label: 'Saat SPK',
          due_date_label: 'H+7',
          component: 'development',
          nominal: 14_000_000,
        },
        {
          work_period: 'Bulan 1',
          terms: 'Hosting',
          invoice_date_label: 'Awal Bulan',
          due_date_label: 'H+7',
          component: 'monthly_recurring',
          nominal: 1_000_000,
        },
      ],
      limitation_codes: ['out_of_pocket', 'overtime'],
    },
  };

  it('configures the customDevelopmentPreview endpoint correctly', () => {
    expect((endpoints as any).quotation?.quotations?.customDevelopmentPreview).toBe(
      '/quotation/v1/quotations/preview/custom-development'
    );
  });

  it('defines the query key matching the specification', () => {
    expect(CUSTOM_DEVELOPMENT_PREVIEW_QUERY_KEY).toEqual([
      'quotation',
      'custom-development-preview',
    ]);
  });

  describe('normalizeCustomDevelopmentPreviewPayload', () => {
    it('returns null when payload is null or not custom_development', () => {
      expect(normalizeCustomDevelopmentPreviewPayload(null)).toBeNull();
      expect(normalizeCustomDevelopmentPreviewPayload(undefined)).toBeNull();

      const dedicatedPayload = {
        commercial_scheme: 'dedicated_squad',
      } as unknown as GenerateQuotationPayload;
      expect(normalizeCustomDevelopmentPreviewPayload(dedicatedPayload)).toBeNull();
    });

    it('normalizes valid custom_development payload and clones arrays', () => {
      const normalized = normalizeCustomDevelopmentPreviewPayload(sampleCustomDevPayload);
      expect(normalized).not.toBeNull();
      expect(normalized?.commercial_scheme).toBe('custom_development');
      expect(normalized?.custom_development.system_name).toBe('Sistem Kopi Studio24');
      expect(normalized?.custom_development.development_groups).not.toBe(
        sampleCustomDevPayload.custom_development.development_groups
      );
    });
  });

  describe('previewCustomDevelopment API function', () => {
    it('calls axios.post with endpoint and returns unwrapped data', async () => {
      const mockResponse: CustomDevelopmentPreviewResponse = {
        calculation: {
          development_subtotal: 15_000_000,
          discount_amount: 1_000_000,
          total_investment: 14_000_000,
          monthly_total: 1_000_000,
          development_payment_total: 14_000_000,
          monthly_payment_rows: 1,
          development_lines: [
            {
              group_index: 0,
              item_index: 0,
              name: 'Senior Dev',
              display_rate: 15_000_000,
              headcount: 1,
              period_label: '1',
              quoted_line_total: 15_000_000,
            },
          ],
          monthly_lines: [
            {
              name: 'Cloud Hosting',
              specification: 'Standard',
              unit_rate: 1_000_000,
              quantity: 1,
              line_total: 1_000_000,
            },
          ],
        },
        resolved_profile: {
          show_monthly: true,
          show_rights: false,
          sections: [
            { number: 1, title: 'Biaya Pengembangan', component: 'development_table' },
            { number: 2, title: 'Biaya Bulanan', component: 'monthly_table' },
          ],
          rate_header: 'Rate Bulanan',
          period_header: 'Bulan',
          show_rate_column: true,
          tax_disclaimer: 'Belum termasuk PPN',
        },
      };

      const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: mockResponse,
          message: 'Custom development preview calculated successfully',
        },
      });

      const abortController = new AbortController();
      const result = await previewCustomDevelopment(sampleCustomDevPayload, abortController.signal);

      expect(postSpy).toHaveBeenCalledWith(
        '/quotation/v1/quotations/preview/custom-development',
        sampleCustomDevPayload,
        { signal: abortController.signal }
      );
      expect(result.calculation.total_investment).toBe(14_000_000);
      expect(result.resolved_profile.show_monthly).toBe(true);
    });

    it('throws when API returns an error envelope', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          errors: 'Custom development input is invalid',
        },
      });

      await expect(previewCustomDevelopment(sampleCustomDevPayload)).rejects.toThrow(
        'Custom development input is invalid'
      );
    });
  });

  describe('useCustomDevelopmentPreview hook definition', () => {
    it('is exported as a function', () => {
      expect(typeof useCustomDevelopmentPreview).toBe('function');
    });
  });
});


