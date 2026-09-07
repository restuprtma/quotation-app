import type { GenerateQuotationPayload, SubscriptionSaaSPreviewResponse } from '../types';

import { it, vi, expect, describe } from 'vitest';

import axios, { endpoints } from 'src/shared/lib/axios';

import { previewSubscriptionSaaS } from '../api/generation';
import {
  useSubscriptionSaaSPreview,
  SUBSCRIPTION_SAAS_PREVIEW_QUERY_KEY,
  normalizeSubscriptionSaaSPreviewPayload,
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
