import { it, expect, describe } from 'vitest';

import { whiteLabelSchema, whiteLabelFormSchema } from './white-label-form-model';

describe('whiteLabelSchema & whiteLabelFormSchema', () => {
  const validPonpesInput = {
    product_name: 'POS Minimarket',
    quotation_date: '2026-09-08',
    tax_treatment: 'not_stated' as const,
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
        component: 'license' as const,
        nominal: 17_500_000,
      },
      {
        work_period: 'Tahap 2',
        terms: 'Pelunasan Lisensi (50%)',
        invoice_date_label: 'Setelah serah terima sistem',
        due_date_label: 'H+7 setelah invoice',
        component: 'license' as const,
        nominal: 17_500_000,
      },
      {
        work_period: 'Bulan 1',
        terms: 'Retainer Bulan 1',
        invoice_date_label: 'Awal bulan 1',
        due_date_label: 'H+14',
        component: 'maintenance_hosting' as const,
        nominal: 4_217_500,
      },
      {
        work_period: 'Bulan 2',
        terms: 'Retainer Bulan 2',
        invoice_date_label: 'Awal bulan 2',
        due_date_label: 'H+14',
        component: 'maintenance_hosting' as const,
        nominal: 4_217_500,
      },
      {
        work_period: 'Bulan 3',
        terms: 'Retainer Bulan 3',
        invoice_date_label: 'Awal bulan 3',
        due_date_label: 'H+14',
        component: 'maintenance_hosting' as const,
        nominal: 4_217_500,
      },
      {
        work_period: 'Bulan 4',
        terms: 'Retainer Bulan 4',
        invoice_date_label: 'Awal bulan 4',
        due_date_label: 'H+14',
        component: 'maintenance_hosting' as const,
        nominal: 4_217_500,
      },
      {
        work_period: 'Bulan 5',
        terms: 'Retainer Bulan 5',
        invoice_date_label: 'Awal bulan 5',
        due_date_label: 'H+14',
        component: 'maintenance_hosting' as const,
        nominal: 4_217_500,
      },
      {
        work_period: 'Bulan 6',
        terms: 'Retainer Bulan 6',
        invoice_date_label: 'Awal bulan 6',
        due_date_label: 'H+14',
        component: 'maintenance_hosting' as const,
        nominal: 4_217_500,
      },
    ],
    rights_statements: [],
    limitation_codes: [
      'out_of_pocket' as const,
      'overtime' as const,
      'third_party' as const,
      'scope_change' as const,
    ],
  };

  it('validates a valid Ponpes Al Hidayat 5 quotation structure', () => {
    const result = whiteLabelSchema.safeParse(validPonpesInput);
    expect(result.success).toBe(true);
  });

  it('validates full form schema with client and metadata', () => {
    const fullForm = {
      client_id: 'client-ponpes-1',
      client_name: 'Pimpinan Yayasan',
      client_company_name: 'Ponpes Al Hidayat 5',
      subject: 'Penawaran Pengadaan Software POS Minimarket',
      solution_type: 'Web Application',
      commercial_scheme: 'white_label' as const,
      white_label: validPonpesInput,
    };

    const result = whiteLabelFormSchema.safeParse(fullForm);
    expect(result.success).toBe(true);
  });

  describe('license items validations', () => {
    it('fails when license_items is empty', () => {
      const invalid = { ...validPonpesInput, license_items: [] };
      const result = whiteLabelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path[0] === 'license_items')).toBe(true);
      }
    });

    it('fails when license item name is blank', () => {
      const invalid = {
        ...validPonpesInput,
        license_items: [{ name: '   ', unit_rate: 35_000_000, quantity: 1 }],
      };
      const result = whiteLabelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path[0] === 'license_items' && i.path[2] === 'name')
        ).toBe(true);
      }
    });

    it('fails when license item unit_rate is zero or negative', () => {
      const invalidZero = {
        ...validPonpesInput,
        license_items: [{ name: 'POS', unit_rate: 0, quantity: 1 }],
      };
      expect(whiteLabelSchema.safeParse(invalidZero).success).toBe(false);

      const invalidNegative = {
        ...validPonpesInput,
        license_items: [{ name: 'POS', unit_rate: -5000, quantity: 1 }],
      };
      expect(whiteLabelSchema.safeParse(invalidNegative).success).toBe(false);
    });

    it('fails when license item quantity is zero or negative', () => {
      const invalid = {
        ...validPonpesInput,
        license_items: [{ name: 'POS', unit_rate: 35_000_000, quantity: 0 }],
      };
      expect(whiteLabelSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('maintenance items validations', () => {
    it('fails when fte_quarters is outside 1..4 range', () => {
      const invalidUnder = {
        ...validPonpesInput,
        maintenance_items: [
          { name: 'Support', monthly_rate: 8_000_000, fte_quarters: 0, period_months: 6 },
        ],
      };
      expect(whiteLabelSchema.safeParse(invalidUnder).success).toBe(false);

      const invalidOver = {
        ...validPonpesInput,
        maintenance_items: [
          { name: 'Support', monthly_rate: 8_000_000, fte_quarters: 5, period_months: 6 },
        ],
      };
      expect(whiteLabelSchema.safeParse(invalidOver).success).toBe(false);
    });

    it('fails when maintenance item calculation is not divisible by 4 (not whole rupiah)', () => {
      // 10.001 * 1 * 1 = 10001 % 4 !== 0
      const indivisibleInput = {
        ...validPonpesInput,
        maintenance_items: [
          { name: 'Support', monthly_rate: 10_001, fte_quarters: 1, period_months: 1 },
        ],
        payment_schedule: [
          ...validPonpesInput.payment_schedule.filter((p) => p.component === 'license'),
          {
            work_period: 'Bulan 1',
            terms: 'Retainer',
            invoice_date_label: 'Awal bulan',
            due_date_label: 'H+14',
            component: 'maintenance_hosting' as const,
            nominal: 2500,
          },
        ],
      };

      const result = whiteLabelSchema.safeParse(indivisibleInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'maintenance_items' && i.path[1] === 0
        );
        expect(issue).toBeDefined();
        expect(issue?.message).toMatch(/divisible by 4|whole rupiah/i);
      }
    });
  });

  describe('module groups validations', () => {
    it('fails when module group features array is empty', () => {
      const invalid = {
        ...validPonpesInput,
        module_groups: [{ name: 'Empty Module', features: [] }],
      };
      const result = whiteLabelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.path[0] === 'module_groups' && i.path[2] === 'features')
        ).toBe(true);
      }
    });

    it('fails when module group names have duplicates (case-insensitive)', () => {
      const invalid = {
        ...validPonpesInput,
        module_groups: [
          { name: 'Master Data', features: ['Feature 1'] },
          { name: 'master data', features: ['Feature 2'] },
        ],
      };
      const result = whiteLabelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const dupIssue = result.error.issues.find(
          (i) => i.path[0] === 'module_groups' && i.path[1] === 1 && i.path[2] === 'name'
        );
        expect(dupIssue).toBeDefined();
        expect(dupIssue?.message).toMatch(/duplicate/i);
      }
    });
  });

  describe('payment schedule reconciliation validations', () => {
    it('fails when license payment total does not equal license subtotal', () => {
      const invalid = {
        ...validPonpesInput,
        // License subtotal is 35M, but payments sum to 30M
        payment_schedule: validPonpesInput.payment_schedule.map((row, idx) =>
          idx === 0 ? { ...row, nominal: 12_500_000 } : row
        ),
      };

      const result = whiteLabelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'payment_schedule');
        expect(issue).toBeDefined();
        expect(issue?.message).toMatch(/license subtotal/i);
      }
    });

    it('fails when maintenance & hosting payment total does not equal maintenance & hosting subtotal', () => {
      const invalid = {
        ...validPonpesInput,
        // Maintenance subtotal 24.255M + Hosting 1.050M = 25.305M, but payments changed
        payment_schedule: validPonpesInput.payment_schedule.map((row, idx) =>
          idx === 2 ? { ...row, nominal: 1_000_000 } : row
        ),
      };

      const result = whiteLabelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'payment_schedule');
        expect(issue).toBeDefined();
        expect(issue?.message).toMatch(/maintenance and hosting subtotal/i);
      }
    });
  });

  describe('limitation codes validations', () => {
    it('fails when limitation_codes is empty', () => {
      const invalid = { ...validPonpesInput, limitation_codes: [] };
      const result = whiteLabelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path[0] === 'limitation_codes')).toBe(true);
      }
    });

    it('fails when duplicate limitation codes are provided', () => {
      const invalid = {
        ...validPonpesInput,
        limitation_codes: ['out_of_pocket' as const, 'out_of_pocket' as const],
      };
      const result = whiteLabelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'limitation_codes' && i.path[1] === 1
        );
        expect(issue).toBeDefined();
        expect(issue?.message).toMatch(/duplicate/i);
      }
    });
  });
});
