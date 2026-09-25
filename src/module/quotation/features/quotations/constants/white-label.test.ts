import type { ActiveSkill, ClientSummary, WhiteLabelInput } from '../types';

import { it, expect, describe } from 'vitest';

import {
  FTE_OPTIONS,
  hostingLineTotal,
  licenseLineTotal,
  LIMITATION_OPTIONS,
  normalizeWhiteLabel,
  toWhiteLabelPayload,
  maintenanceLineTotal,
  TAX_TREATMENT_OPTIONS,
  DEFAULT_LIMITATION_CODES,
  PAYMENT_COMPONENT_OPTIONS,
  MAX_WHITE_LABEL_SAFE_AMOUNT,
  createDefaultWhiteLabelValues,
  calculateWhiteLabelDraftTotals,
} from './white-label';
import { applyEntryIdentityToSchemeDefaults } from '../utils/quotation-entry-state';

describe('white-label constants & pure helpers', () => {
  const today = '2026-09-08';
  const mockClient: ClientSummary = {
    id: 'client-uuid-ponpes-1',
    name: 'Ponpes Al Hidayat 5',
  };

  const samplePonpesInput: WhiteLabelInput = {
    product_name: 'POS Minimarket',
    quotation_date: '2026-09-08',
    tax_treatment: 'not_stated',
    license_items: [
      {
        name: 'Lisensi Software POS Minimarket',
        unit_rate: 35_000_000,
        quantity: 1,
      },
    ],
    maintenance_items: [
      {
        name: 'Maintenance & Support Operasional',
        monthly_rate: 8_085_000,
        fte_quarters: 2, // 0.5 FTE
        period_months: 6,
      },
    ],
    hosting_items: [
      {
        name: 'Cloud Hosting & Server',
        monthly_rate: 175_000,
        quantity: 1,
        period_months: 6,
      },
    ],
    module_groups: [
      {
        name: 'Master Data & Inventori',
        features: ['Katalog Barang', 'Stok Opname'],
      },
      {
        name: 'Kasir POS & Transaksi',
        features: ['Point of Sale Kasir', 'Cetak Struk Thermal'],
      },
    ],
    timeline_rows: [
      {
        description: 'Instalasi & Konfigurasi Server',
        timeline: 'Minggu 1',
      },
      {
        description: 'Migrasi Master Data & Pelatihan Kasir',
        timeline: 'Minggu 2',
      },
    ],
    payment_schedule: [
      {
        work_period: 'Tahap 1',
        terms: 'Uang Muka Lisensi (DP 50%)',
        invoice_date_label: 'Saat penandatanganan SPK',
        due_date_label: 'H+7 setelah invoice',
        component: 'license',
        nominal: 17_500_000,
      },
      {
        work_period: 'Tahap 2',
        terms: 'Pelunasan Lisensi (50%)',
        invoice_date_label: 'Setelah serah terima sistem',
        due_date_label: 'H+7 setelah invoice',
        component: 'license',
        nominal: 17_500_000,
      },
      ...Array.from({ length: 6 }, (_, i) => ({
        work_period: `Bulan ${i + 1}`,
        terms: 'Retainer Maintenance & Hosting Bulanan',
        invoice_date_label: `Awal bulan ${i + 1}`,
        due_date_label: 'H+14 setelah invoice',
        component: 'maintenance_hosting' as const,
        nominal: 4_217_500,
      })),
    ],
    rights_statements: [],
    limitation_codes: ['out_of_pocket', 'overtime', 'third_party', 'scope_change'],
  };

  describe('constants & options', () => {
    it('defines safe amount limit matching backend', () => {
      expect(MAX_WHITE_LABEL_SAFE_AMOUNT).toBe(9_000_000_000_000_000);
    });

    it('defines tax treatment options', () => {
      expect(TAX_TREATMENT_OPTIONS).toEqual([
        { value: 'not_stated', label: 'Tidak Dicantumkan' },
        { value: 'exclusive_ppn', label: 'Belum Termasuk PPN' },
        { value: 'inclusive_ppn', label: 'Sudah Termasuk PPN' },
      ]);
    });

    it('defines FTE options for quarters 1 to 4', () => {
      expect(FTE_OPTIONS).toEqual([
        { value: 1, label: '0,25 FTE' },
        { value: 2, label: '0,5 FTE' },
        { value: 3, label: '0,75 FTE' },
        { value: 4, label: '1 FTE' },
      ]);
    });

    it('defines payment component options', () => {
      expect(PAYMENT_COMPONENT_OPTIONS).toEqual([
        { value: 'license', label: 'Lisensi' },
        { value: 'maintenance_hosting', label: 'Maintenance & Hosting' },
      ]);
    });

    it('defines 4 limitation options and default codes', () => {
      expect(LIMITATION_OPTIONS).toHaveLength(4);
      expect(DEFAULT_LIMITATION_CODES).toEqual([
        'out_of_pocket',
        'overtime',
        'third_party',
        'scope_change',
      ]);
    });
  });

  describe('createDefaultWhiteLabelValues', () => {
    it('creates default White Label form values with 1 license item Rp0, empty optional arrays, tax not_stated, and 4 limitation codes', () => {
      const values = createDefaultWhiteLabelValues(today, mockClient);

      expect(values.client_id).toBe('client-uuid-ponpes-1');
      expect(values.client_company_name).toBe('Ponpes Al Hidayat 5');
      expect(values.client_name).toBe('Pimpinan Perusahaan');
      expect(values.solution_type).toBe('Web Application');
      expect(values.commercial_scheme).toBe('white_label');

      const wl = values.white_label;
      expect(wl.product_name).toBe('');
      expect(wl.quotation_date).toBe(today);
      expect(wl.tax_treatment).toBe('not_stated');
      expect(wl.license_items).toEqual([{ name: '', unit_rate: 0, quantity: 1 }]);
      expect(wl.maintenance_items).toEqual([]);
      expect(wl.hosting_items).toEqual([]);
      expect(wl.module_groups).toEqual([]);
      expect(wl.timeline_rows).toEqual([]);
      expect(wl.payment_schedule).toEqual([]);
      expect(wl.rights_statements).toEqual([]);
      expect(wl.limitation_codes).toEqual([
        'out_of_pocket',
        'overtime',
        'third_party',
        'scope_change',
      ]);
    });

    it('handles empty client gracefully', () => {
      const values = createDefaultWhiteLabelValues(today);
      expect(values.client_id).toBe('');
      expect(values.client_company_name).toBe('');
    });

    it('merges entry identity into default white label values', () => {
      const base = createDefaultWhiteLabelValues(today);
      const withEntry = applyEntryIdentityToSchemeDefaults(base, {
        project_name: 'White Label POS System',
        client_id: 'client-wl-1',
        client_company_name: 'PT Ritel Modern',
        pic_name: 'Dewi Sartika',
      });

      expect(withEntry.subject).toBe('White Label POS System');
      expect(withEntry.client_id).toBe('client-wl-1');
      expect(withEntry.client_company_name).toBe('PT Ritel Modern');
      expect(withEntry.client_name).toBe('Dewi Sartika');
    });
  });

  describe('line total calculation helpers', () => {
    describe('licenseLineTotal', () => {
      it('calculates unit_rate * quantity', () => {
        expect(licenseLineTotal({ name: 'POS', unit_rate: 35_000_000, quantity: 1 })).toBe(
          35_000_000
        );
        expect(licenseLineTotal({ name: 'POS', unit_rate: 15_000_000, quantity: 2 })).toBe(
          30_000_000
        );
      });

      it('returns null for negative or unsafe amounts', () => {
        expect(licenseLineTotal({ name: 'POS', unit_rate: -100, quantity: 1 })).toBeNull();
        expect(licenseLineTotal({ name: 'POS', unit_rate: 100, quantity: -1 })).toBeNull();
        expect(
          licenseLineTotal({ name: 'POS', unit_rate: MAX_WHITE_LABEL_SAFE_AMOUNT + 1, quantity: 1 })
        ).toBeNull();
      });
    });

    describe('maintenanceLineTotal', () => {
      it('calculates (monthly_rate * fte_quarters * period_months) / 4 for whole amounts', () => {
        // Ponpes example: 8.085.000 * 2 * 6 / 4 = 24.255.000
        expect(
          maintenanceLineTotal({
            name: 'Maintenance',
            monthly_rate: 8_085_000,
            fte_quarters: 2,
            period_months: 6,
          })
        ).toBe(24_255_000);

        // 1 FTE (4 quarters), 12 months, 10.000.000/mo -> 10.000.000 * 4 * 12 / 4 = 120.000.000
        expect(
          maintenanceLineTotal({
            name: 'Maintenance',
            monthly_rate: 10_000_000,
            fte_quarters: 4,
            period_months: 12,
          })
        ).toBe(120_000_000);
      });

      it('returns null if numerator is not divisible by 4 (not whole rupiah)', () => {
        // 10.001 * 1 * 1 = 10.001 % 4 === 1
        expect(
          maintenanceLineTotal({
            name: 'Maintenance',
            monthly_rate: 10_001,
            fte_quarters: 1,
            period_months: 1,
          })
        ).toBeNull();
      });

      it('returns null for invalid/negative values or overflowing amounts', () => {
        expect(
          maintenanceLineTotal({
            name: 'Maintenance',
            monthly_rate: -5000,
            fte_quarters: 2,
            period_months: 6,
          })
        ).toBeNull();
        expect(
          maintenanceLineTotal({
            name: 'Maintenance',
            monthly_rate: 5000,
            fte_quarters: 0,
            period_months: 6,
          })
        ).toBeNull();
      });
    });

    describe('hostingLineTotal', () => {
      it('calculates monthly_rate * quantity * period_months', () => {
        // Ponpes example: 175.000 * 1 * 6 = 1.050.000
        expect(
          hostingLineTotal({
            name: 'Cloud Server',
            monthly_rate: 175_000,
            quantity: 1,
            period_months: 6,
          })
        ).toBe(1_050_000);
      });

      it('returns null for negative or unsafe amounts', () => {
        expect(
          hostingLineTotal({
            name: 'Cloud Server',
            monthly_rate: -100,
            quantity: 1,
            period_months: 6,
          })
        ).toBeNull();
      });
    });
  });

  describe('calculateWhiteLabelDraftTotals', () => {
    it('calculates exact Ponpes totals, subtotals, and zero deltas', () => {
      const totals = calculateWhiteLabelDraftTotals(samplePonpesInput);

      expect(totals.license_subtotal).toBe(35_000_000);
      expect(totals.maintenance_subtotal).toBe(24_255_000);
      expect(totals.hosting_subtotal).toBe(1_050_000);
      expect(totals.maintenance_hosting_subtotal).toBe(25_305_000);
      expect(totals.total_investment).toBe(60_305_000);

      expect(totals.license_payment_total).toBe(35_000_000);
      expect(totals.maintenance_hosting_payment_total).toBe(25_305_000);
      expect(totals.payment_total).toBe(60_305_000);

      expect(totals.license_delta).toBe(0);
      expect(totals.maintenance_hosting_delta).toBe(0);
      expect(totals.total_investment_delta).toBe(0);
      expect(totals.is_balanced).toBe(true);
    });

    it('calculates license-only totals when maintenance & hosting items are absent', () => {
      const licenseOnlyInput: WhiteLabelInput = {
        product_name: 'Standalone App',
        quotation_date: '2026-09-08',
        tax_treatment: 'exclusive_ppn',
        license_items: [
          { name: 'Core License', unit_rate: 50_000_000, quantity: 1 },
          { name: 'Extra Branch Addon', unit_rate: 10_000_000, quantity: 2 },
        ],
        payment_schedule: [
          {
            work_period: 'Full Payment',
            terms: '100% di muka',
            invoice_date_label: 'Saat SPK',
            due_date_label: 'H+7',
            component: 'license',
            nominal: 70_000_000,
          },
        ],
        limitation_codes: ['out_of_pocket', 'overtime'],
      };

      const totals = calculateWhiteLabelDraftTotals(licenseOnlyInput);

      expect(totals.license_subtotal).toBe(70_000_000);
      expect(totals.maintenance_subtotal).toBe(0);
      expect(totals.hosting_subtotal).toBe(0);
      expect(totals.maintenance_hosting_subtotal).toBe(0);
      expect(totals.total_investment).toBe(70_000_000);
      expect(totals.license_payment_total).toBe(70_000_000);
      expect(totals.maintenance_hosting_payment_total).toBe(0);
      expect(totals.payment_total).toBe(70_000_000);
      expect(totals.is_balanced).toBe(true);
    });

    it('computes non-zero deltas when payment components do not reconcile with line subtotals', () => {
      const unbalancedInput: WhiteLabelInput = {
        ...samplePonpesInput,
        payment_schedule: [
          // License payment total is 30M instead of 35M
          {
            work_period: 'Tahap 1',
            terms: 'DP',
            invoice_date_label: 'Saat SPK',
            due_date_label: 'H+7',
            component: 'license',
            nominal: 30_000_000,
          },
          // Maintenance & hosting payment total is 20M instead of 25.305M
          {
            work_period: 'Bulan 1',
            terms: 'Maintenance',
            invoice_date_label: 'Bulan 1',
            due_date_label: 'H+14',
            component: 'maintenance_hosting',
            nominal: 20_000_000,
          },
        ],
      };

      const totals = calculateWhiteLabelDraftTotals(unbalancedInput);

      expect(totals.license_subtotal).toBe(35_000_000);
      expect(totals.license_payment_total).toBe(30_000_000);
      expect(totals.license_delta).toBe(5_000_000);

      expect(totals.maintenance_hosting_subtotal).toBe(25_305_000);
      expect(totals.maintenance_hosting_payment_total).toBe(20_000_000);
      expect(totals.maintenance_hosting_delta).toBe(5_305_000);

      expect(totals.total_investment).toBe(60_305_000);
      expect(totals.payment_total).toBe(50_000_000);
      expect(totals.total_investment_delta).toBe(10_305_000);

      expect(totals.is_balanced).toBe(false);
    });
  });

  describe('normalizeWhiteLabel', () => {
    it('trims string properties, filters empty features and rights, and deep clones arrays', () => {
      const rawInput: WhiteLabelInput = {
        product_name: '  POS Minimarket Plus  ',
        quotation_date: '2026-09-08',
        tax_treatment: 'exclusive_ppn',
        license_items: [{ name: '  Lisensi POS  ', unit_rate: 35_000_000, quantity: 1 }],
        maintenance_items: [
          {
            name: '  Support Bulanan  ',
            monthly_rate: 8_000_000,
            fte_quarters: 2,
            period_months: 6,
          },
        ],
        hosting_items: [
          { name: '  Cloud VPS  ', monthly_rate: 200_000, quantity: 1, period_months: 6 },
        ],
        module_groups: [
          {
            name: '  Master Data  ',
            features: ['  Katalog Produk  ', '', '   ', 'Stok Realtime'],
          },
        ],
        timeline_rows: [{ description: '  Setup Server  ', timeline: '  Minggu 1  ' }],
        payment_schedule: [
          {
            work_period: '  Tahap 1  ',
            terms: '  DP 50%  ',
            invoice_date_label: '  Saat SPK  ',
            due_date_label: '  H+7  ',
            component: 'license',
            nominal: 35_000_000,
          },
        ],
        rights_statements: ['  Hak pakai lisensi internal  ', '', '   '],
        limitation_codes: ['out_of_pocket', 'overtime'],
      };

      const normalized = normalizeWhiteLabel(rawInput);

      expect(normalized.product_name).toBe('POS Minimarket Plus');
      expect(normalized.license_items[0].name).toBe('Lisensi POS');
      expect(normalized.maintenance_items?.[0].name).toBe('Support Bulanan');
      expect(normalized.hosting_items?.[0].name).toBe('Cloud VPS');
      expect(normalized.module_groups?.[0].name).toBe('Master Data');
      expect(normalized.module_groups?.[0].features).toEqual(['Katalog Produk', 'Stok Realtime']);
      expect(normalized.timeline_rows?.[0].description).toBe('Setup Server');
      expect(normalized.timeline_rows?.[0].timeline).toBe('Minggu 1');
      expect(normalized.payment_schedule[0].work_period).toBe('Tahap 1');
      expect(normalized.payment_schedule[0].terms).toBe('DP 50%');
      expect(normalized.payment_schedule[0].invoice_date_label).toBe('Saat SPK');
      expect(normalized.payment_schedule[0].due_date_label).toBe('H+7');
      expect(normalized.rights_statements).toEqual(['Hak pakai lisensi internal']);

      // Deep clone isolation assertions
      expect(normalized.license_items).not.toBe(rawInput.license_items);
      expect(normalized.maintenance_items).not.toBe(rawInput.maintenance_items);
      expect(normalized.hosting_items).not.toBe(rawInput.hosting_items);
      expect(normalized.module_groups).not.toBe(rawInput.module_groups);
      expect(normalized.module_groups?.[0].features).not.toBe(rawInput.module_groups?.[0].features);
      expect(normalized.timeline_rows).not.toBe(rawInput.timeline_rows);
      expect(normalized.payment_schedule).not.toBe(rawInput.payment_schedule);
      expect(normalized.rights_statements).not.toBe(rawInput.rights_statements);
      expect(normalized.limitation_codes).not.toBe(rawInput.limitation_codes);

      // Mutate original and assert normalized is unaffected
      rawInput.license_items[0].name = 'Mutated License';
      rawInput.license_items.push({ name: 'Second License', unit_rate: 10_000_000, quantity: 1 });
      expect(normalized.license_items).toHaveLength(1);
      expect(normalized.license_items[0].name).toBe('Lisensi POS');
    });
  });

  describe('toWhiteLabelPayload', () => {
    it('converts form values to GenerateQuotationPayload with white_label scheme and resolved skill_id', () => {
      const formValues = createDefaultWhiteLabelValues(today, mockClient);
      formValues.subject = 'Penawaran Lisensi POS Ponpes';
      formValues.white_label = samplePonpesInput;

      const skills: ActiveSkill[] = [
        { id: 'skill-uuid-default', name: 'Master Skill', command: '/quotation', is_active: true },
      ];

      const payload = toWhiteLabelPayload(formValues, null, skills);

      expect(payload.commercial_scheme).toBe('white_label');
      if (payload.commercial_scheme !== 'white_label') return;

      expect(payload.skill_id).toBe('skill-uuid-default');
      expect(payload.client_id).toBe('client-uuid-ponpes-1');
      expect(payload.client_name).toBe('Pimpinan Perusahaan');
      expect(payload.client_company_name).toBe('Ponpes Al Hidayat 5');
      expect(payload.subject).toBe('Penawaran Lisensi POS Ponpes');
      expect(payload.solution_type).toBe('Web Application');
      expect(payload.white_label.product_name).toBe('POS Minimarket');
      expect(payload.white_label.license_items).toHaveLength(1);
      expect(payload.white_label.license_items[0].unit_rate).toBe(35_000_000);
      expect(payload.white_label.payment_schedule).toHaveLength(8);
    });
  });
});
