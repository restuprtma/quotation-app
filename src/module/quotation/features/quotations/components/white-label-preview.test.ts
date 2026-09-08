import type { WhiteLabelPreviewResponse } from '../types';

import { it, expect, describe } from 'vitest';

import {
  toWhiteLabelPreviewRows,
  formatWhiteLabelCurrency,
  toWhiteLabelPreviewViewModel,
} from './white-label-preview';

describe('white-label-preview view-model', () => {
  const ponpesPreview: WhiteLabelPreviewResponse = {
    calculation: {
      license: [
        {
          name: 'Paket Lisensi Software POS Minimarket (White Label)',
          unit_rate: 35_000_000,
          quantity: 1,
          line_total: 35_000_000,
        },
      ],
      maintenance: [
        {
          name: 'Senior Web Programmer (Maintenance & Support)',
          monthly_rate: 16_170_000,
          fte_quarters: 2,
          period_months: 3,
          line_total: 24_255_000,
        },
      ],
      hosting: [
        {
          name: 'Shared Hosting Small',
          monthly_rate: 350_000,
          quantity: 1,
          period_months: 3,
          line_total: 1_050_000,
        },
      ],
      license_subtotal: 35_000_000,
      maintenance_subtotal: 24_255_000,
      hosting_subtotal: 1_050_000,
      maintenance_hosting_subtotal: 25_305_000,
      total_investment: 60_305_000,
      license_payment_total: 35_000_000,
      maintenance_hosting_payment_total: 25_305_000,
      payment_total: 60_305_000,
    },
    resolved_profile: {
      tax_treatment: 'not_stated',
      tax_clause_text: '',
      show_maintenance_hosting: true,
      show_scope_timeline: true,
      show_rights: false,
      sections: [
        { number: 1, code: 'white_label_cost', title: 'Biaya White Label' },
        { number: 2, code: 'maintenance_hosting', title: 'Biaya Maintenance & Hosting' },
        { number: 3, code: 'scope_timeline', title: 'Lingkup Pekerjaan & Timeline' },
        { number: 4, code: 'payment', title: 'Pembayaran' },
        { number: 5, code: 'limitations', title: 'Batasan dan Pengecualian' },
      ],
    },
  };

  const licenseOnlyPreview: WhiteLabelPreviewResponse = {
    calculation: {
      license: [
        {
          name: 'Software License Standard Core',
          unit_rate: 50_000_000,
          quantity: 1,
          line_total: 50_000_000,
        },
      ],
      maintenance: [],
      hosting: [],
      license_subtotal: 50_000_000,
      maintenance_subtotal: 0,
      hosting_subtotal: 0,
      maintenance_hosting_subtotal: 0,
      total_investment: 50_000_000,
      license_payment_total: 50_000_000,
      maintenance_hosting_payment_total: 0,
      payment_total: 50_000_000,
    },
    resolved_profile: {
      tax_treatment: 'exclusive_ppn',
      tax_clause_text:
        'Seluruh rincian biaya belum termasuk PPN sesuai regulasi perpajakan yang berlaku di Indonesia.',
      show_maintenance_hosting: false,
      show_scope_timeline: false,
      show_rights: false,
      sections: [
        { number: 1, code: 'white_label_cost', title: 'Biaya White Label' },
        { number: 2, code: 'payment', title: 'Pembayaran' },
        { number: 3, code: 'limitations', title: 'Batasan dan Pengecualian' },
      ],
    },
  };

  const rightsExplicitPreview: WhiteLabelPreviewResponse = {
    calculation: {
      license: [
        {
          name: 'Enterprise License',
          unit_rate: 100_000_000,
          quantity: 1,
          line_total: 100_000_000,
        },
      ],
      license_subtotal: 100_000_000,
      maintenance_subtotal: 0,
      hosting_subtotal: 0,
      maintenance_hosting_subtotal: 0,
      total_investment: 100_000_000,
      license_payment_total: 100_000_000,
      maintenance_hosting_payment_total: 0,
      payment_total: 100_000_000,
    },
    resolved_profile: {
      tax_treatment: 'inclusive_ppn',
      tax_clause_text:
        'Total investasi telah termasuk PPN sesuai nilai yang disepakati dalam quotation ini.',
      show_maintenance_hosting: false,
      show_scope_timeline: false,
      show_rights: true,
      sections: [
        { number: 1, code: 'white_label_cost', title: 'Biaya White Label' },
        { number: 2, code: 'payment', title: 'Pembayaran' },
        { number: 3, code: 'limitations', title: 'Batasan dan Pengecualian' },
      ],
    },
  };

  it('transforms Ponpes preview into 60.305.000 total, 5 sections, and matching subtotals', () => {
    const vm = toWhiteLabelPreviewViewModel(ponpesPreview);
    const rows = toWhiteLabelPreviewRows(ponpesPreview);

    expect(vm.licenseSubtotal).toBe(35_000_000);
    expect(vm.maintenanceSubtotal).toBe(24_255_000);
    expect(vm.hostingSubtotal).toBe(1_050_000);
    expect(vm.maintenanceHostingSubtotal).toBe(25_305_000);
    expect(vm.totalInvestment).toBe(60_305_000);
    expect(vm.paymentTotal).toBe(60_305_000);
    expect(vm.licensePaymentTotal).toBe(35_000_000);
    expect(vm.maintenanceHostingPaymentTotal).toBe(25_305_000);

    expect(vm.showMaintenanceHosting).toBe(true);
    expect(vm.showScopeTimeline).toBe(true);
    expect(vm.showRights).toBe(false);
    expect(vm.visibleSections).toHaveLength(5);
    expect(vm.sectionTitles).toEqual([
      'Biaya White Label',
      'Biaya Maintenance & Hosting',
      'Lingkup Pekerjaan & Timeline',
      'Pembayaran',
      'Batasan dan Pengecualian',
    ]);

    expect(rows.totalInvestment).toBe(60_305_000);
    expect(rows.licenseItems).toHaveLength(1);
    expect(rows.maintenanceItems).toHaveLength(1);
    expect(rows.hostingItems).toHaveLength(1);
  });

  it('transforms license-only preview into 50.000.000 total, 3 sections, and no maintenance/scope', () => {
    const vm = toWhiteLabelPreviewViewModel(licenseOnlyPreview);

    expect(vm.licenseSubtotal).toBe(50_000_000);
    expect(vm.maintenanceHostingSubtotal).toBe(0);
    expect(vm.totalInvestment).toBe(50_000_000);
    expect(vm.paymentTotal).toBe(50_000_000);
    expect(vm.showMaintenanceHosting).toBe(false);
    expect(vm.showScopeTimeline).toBe(false);
    expect(vm.showRights).toBe(false);
    expect(vm.visibleSections).toHaveLength(3);
    expect(vm.sectionTitles).toEqual([
      'Biaya White Label',
      'Pembayaran',
      'Batasan dan Pengecualian',
    ]);
  });

  it('handles rights-explicit preview with show_rights true and tax clause text', () => {
    const vm = toWhiteLabelPreviewViewModel(rightsExplicitPreview);

    expect(vm.showRights).toBe(true);
    expect(vm.resolvedProfile.tax_treatment).toBe('inclusive_ppn');
    expect(vm.resolvedProfile.tax_clause_text).toContain('telah termasuk PPN');
  });

  it('formats IDR currency deterministically without decimal drift', () => {
    expect(formatWhiteLabelCurrency(60_305_000)).toContain('60.305.000');
    expect(formatWhiteLabelCurrency(35_000_000)).toContain('35.000.000');
    expect(formatWhiteLabelCurrency(0)).toContain('0');
  });
});
