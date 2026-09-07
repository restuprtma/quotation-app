import type { SubscriptionSaaSPreviewResponse } from '../types';

import { it, expect, describe } from 'vitest';

import {
  toSubscriptionPreviewRows,
  formatSubscriptionCurrency,
  toSubscriptionPreviewViewModel,
} from './subscription-saas-preview';

describe('subscription-saas-preview view-model', () => {
  const percetakanPreview: SubscriptionSaaSPreviewResponse = {
    calculation: {
      recurring_total: 15_000_000,
      one_time_total: 0,
      total_contract: 15_000_000,
      price_periods: [
        {
          label: 'Subscription 12 bulan',
          start_month_offset: 0,
          duration_months: 12,
          monthly_rate: 1_250_000,
          subtotal: 15_000_000,
        },
      ],
      payments: [
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
    },
    resolved_profile: {
      section_layout: 'subscription_development',
      billing_cycle: 'quarterly',
      tax_treatment: 'not_stated',
      rights_clause_code: 'venturo_software_ownership_v1',
      rights_clause_text: 'Aplikasi dan source code merupakan milik Venturo.',
      income_sharing_text:
        'Pendapatan dari Penjualan dari referensi mitra dibagi sebesar 50% untuk Venturo dan 50% untuk Mitra. Pembayaran diselesaikan paling lambat 30 hari kerja. Diskon tidak dapat diberikan secara sepihak.',
      legal_catalog_version: 'subscription_saas_legal_v1',
    },
    visible_sections: [
      {
        number: 1,
        code: 'subscription_pricing',
        title: 'Biaya Subscription dan Development Aplikasi',
      },
      { number: 2, code: 'payment_schedule', title: 'Pembayaran' },
      { number: 3, code: 'rights', title: 'Hak Para Pihak' },
      { number: 4, code: 'boundaries', title: 'Batasan dan Pengecualian' },
    ],
  };

  const annualPreviewWithoutRights: SubscriptionSaaSPreviewResponse = {
    calculation: {
      recurring_total: 30_000_000,
      one_time_total: 0,
      total_contract: 30_000_000,
      price_periods: [
        {
          label: 'Tahun 1 - Development',
          start_month_offset: 0,
          duration_months: 12,
          monthly_rate: 1_000_000,
          subtotal: 12_000_000,
        },
        {
          label: 'Tahun 2 - Maintenance',
          start_month_offset: 12,
          duration_months: 12,
          monthly_rate: 1_500_000,
          subtotal: 18_000_000,
        },
      ],
      payments: [
        {
          work_period: 'Tahun 1',
          start_month_offset: 0,
          covered_months: 12,
          invoice_date_label: 'Saat kontrak',
          due_date_label: 'H+14',
          nominal: 12_000_000,
        },
        {
          work_period: 'Tahun 2',
          start_month_offset: 12,
          covered_months: 12,
          invoice_date_label: 'Awal tahun kedua',
          due_date_label: 'H+14',
          nominal: 18_000_000,
        },
      ],
    },
    resolved_profile: {
      section_layout: 'development_maintenance',
      billing_cycle: 'yearly',
      tax_treatment: 'exclusive_ppn',
      tax_clause_text: 'Harga belum termasuk PPN.',
      rights_clause_code: '',
      rights_clause_text: '',
      income_sharing_text: '',
      legal_catalog_version: 'subscription_saas_legal_v1',
      has_features: true,
    },
    visible_sections: [
      {
        number: 1,
        code: 'development_maintenance_pricing',
        title: 'Biaya Development & Maintenance',
      },
      { number: 2, code: 'features', title: 'List Features' },
      { number: 3, code: 'payment_schedule', title: 'Pembayaran' },
      { number: 4, code: 'boundaries', title: 'Batasan dan Pengecualian' },
    ],
  };

  it('transforms Percetakan preview into 15 million total, 4 payments, and rights section', () => {
    const vm = toSubscriptionPreviewViewModel(percetakanPreview);
    const rows = toSubscriptionPreviewRows(percetakanPreview);

    expect(vm.totalContract).toBe(15_000_000);
    expect(vm.recurringTotal).toBe(15_000_000);
    expect(vm.oneTimeTotal).toBe(0);
    expect(vm.payments).toHaveLength(4);
    expect(vm.hasRightsSection).toBe(true);
    expect(vm.sectionTitles).toContain('Hak Para Pihak');
    expect(rows.totalContract).toBe(15_000_000);
    expect(rows.payments).toHaveLength(4);
    expect(rows.hasRightsSection).toBe(true);
  });

  it('transforms annual preview without rights into 30 million total, 2 payments, and no rights section', () => {
    const vm = toSubscriptionPreviewViewModel(annualPreviewWithoutRights);

    expect(vm.totalContract).toBe(30_000_000);
    expect(vm.recurringTotal).toBe(30_000_000);
    expect(vm.payments).toHaveLength(2);
    expect(vm.hasRightsSection).toBe(false);
    expect(vm.hasFeaturesSection).toBe(true);
    expect(vm.sectionTitles).not.toContain('Hak Para Pihak');
    expect(vm.sectionTitles).toContain('List Features');
  });

  it('formats IDR currency deterministically without decimal drift', () => {
    expect(formatSubscriptionCurrency(15_000_000)).toContain('15.000.000');
    expect(formatSubscriptionCurrency(0)).toContain('0');
  });
});
