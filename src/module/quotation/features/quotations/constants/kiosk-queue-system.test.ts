import type { KioskQueueSystemInput } from '../types';

import { it, expect, describe } from 'vitest';

import {
  calculateKioskQueueLocal,
  normalizeKioskQueueSystem,
  KIOSK_QUEUE_DEFAULT_VALUES,
  createDefaultKioskQueueValues,
} from './kiosk-queue-system';

export const governmentHardwareValues: KioskQueueSystemInput = {
  variant: 'government_mpp',
  document_number: 'LANDA/MPP-Antrian/0726/001',
  system_name: 'Sistem Antrian Terpadu MPP',
  quotation_date: '2026-07-30',
  hardware_provision: 'venturo_supplied',
  tax_treatment: 'inclusive_ppn_11',
  government_scope_phases: [
    {
      title: 'Fase 1: Persiapan & Desain',
      deliverables: ['Dokumen Analisis Kebutuhan', 'UI/UX Design Mockup'],
    },
  ],
  expert_requirements: [
    {
      role: 'Project Manager',
      headcount: 1,
      duration_label: '3 Bulan',
      minimum_qualification: 'S1 Sistem Informasi, pengalaman 5 tahun',
    },
  ],
  service_groups: [
    {
      title: 'Requirement, Design & Development',
      items: [
        { name: 'UI UX', monthly_rate: 13_370_000, headcount: 1, period_quarters: 1 },
        { name: 'Senior Programmer', monthly_rate: 16_170_000, headcount: 1, period_quarters: 4 },
        { name: 'Quality Assurance', monthly_rate: 13_370_000, headcount: 1, period_quarters: 3 },
      ],
    },
    {
      title: 'SIT, UAT & Go-Live Beta Release',
      items: [
        { name: 'Senior Programmer', monthly_rate: 16_170_000, headcount: 1, period_quarters: 2 },
        { name: 'Quality Assurance', monthly_rate: 13_370_000, headcount: 1, period_quarters: 2 },
      ],
    },
  ],
  service_discount_amount: 799_100,
  show_service_discount_row: true,
  hardware_items: [
    { name: 'Mesin Kiosk Touchscreen 21.5 inch', unit_price: 24_500_000, quantity: 1 },
    { name: 'Printer Thermal & Audio Master', unit_price: 4_500_000, quantity: 1 },
    { name: 'TV Display 43 Inch', unit_price: 3_500_000, quantity: 3 },
    { name: 'Bracket TV', unit_price: 300_000, quantity: 3 },
    { name: 'HDMI Switch', unit_price: 100_000, quantity: 1 },
    { name: 'Mini PC Core i5', unit_price: 6_000_000, quantity: 1 },
  ],
  government_payment_schedule: [
    {
      stage: 'Uang Muka 50%',
      billing_basis: 'Kontrak ditandatangani & SPMK terbit',
      nominal: 51_615_000,
    },
    {
      stage: 'Pelunasan 50%',
      billing_basis: 'Pekerjaan selesai 100%\nBerita Acara Serah Terima (BAST)',
      nominal: 48_385_000,
    },
  ],
  payment_due_days: 14,
  limitation_codes: ['civil_electrical'],
  additional_limitations: ['Pekerjaan sipil dan perkabelan tidak termasuk penawaran ini.'],
  rights_statements: [],
};

export const governmentServiceOnlyValues: KioskQueueSystemInput = {
  variant: 'government_mpp',
  document_number: 'LANDA/MPP-Antrian/0726/002',
  system_name: 'Sistem Antrian Terpadu MPP (Jasa Saja)',
  quotation_date: '2026-07-30',
  hardware_provision: 'client_supplied',
  tax_treatment: 'inclusive_ppn_11',
  government_scope_phases: [
    {
      title: 'Fase 1: Persiapan & Desain',
      deliverables: ['Dokumen Analisis Kebutuhan', 'UI/UX Design Mockup'],
    },
  ],
  expert_requirements: [
    {
      role: 'Project Manager',
      headcount: 1,
      duration_label: '3 Bulan',
      minimum_qualification: 'S1 Sistem Informasi, pengalaman 5 tahun',
    },
  ],
  service_groups: [
    {
      title: 'Requirement, Design & Development',
      items: [
        { name: 'UI UX', monthly_rate: 13_370_000, headcount: 1, period_quarters: 1 },
        { name: 'Senior Programmer', monthly_rate: 16_170_000, headcount: 1, period_quarters: 4 },
        {
          name: 'Intermediate Web Programmer',
          monthly_rate: 13_370_000,
          headcount: 1,
          period_quarters: 4,
        },
        { name: 'Quality Assurance', monthly_rate: 13_370_000, headcount: 1, period_quarters: 3 },
      ],
    },
    {
      title: 'SIT, UAT & Go-Live Beta Release',
      items: [
        { name: 'Senior Programmer', monthly_rate: 16_170_000, headcount: 1, period_quarters: 2 },
        { name: 'Quality Assurance', monthly_rate: 13_370_000, headcount: 1, period_quarters: 2 },
      ],
    },
  ],
  service_discount_amount: 2_024_800,
  show_service_discount_row: true,
  hardware_items: [],
  government_payment_schedule: [
    {
      stage: 'Uang Muka 50%',
      billing_basis: 'Kontrak ditandatangani & SPMK terbit',
      nominal: 31_000_000,
    },
    {
      stage: 'Pelunasan 50%',
      billing_basis: 'Pekerjaan selesai 100%\nBerita Acara Serah Terima (BAST)',
      nominal: 31_000_000,
    },
  ],
  payment_due_days: 14,
  limitation_codes: ['civil_electrical', 'client_hardware', 'hardware_warranty'],
  additional_limitations: [],
  rights_statements: [],
};

export const privateFoodCourtValues: KioskQueueSystemInput = {
  variant: 'private_food_court',
  document_number: 'VEN/Kiosk-FoodCourt/0826/007',
  system_name: 'Self-Ordering Kiosk Food Court',
  quotation_date: '2026-08-01',
  hardware_provision: 'client_supplied',
  tax_treatment: 'exclusive_ppn',
  service_groups: [
    {
      title: 'Engineering Kick-off',
      items: [
        {
          name: 'Senior Web Developer',
          monthly_rate: 11_550_000,
          headcount: 1,
          period_quarters: 4,
        },
        {
          name: 'Senior Mobile Developer',
          monthly_rate: 11_550_000,
          headcount: 1,
          period_quarters: 4,
        },
        { name: 'UI/UX Designer', monthly_rate: 9_550_000, headcount: 1, period_quarters: 4 },
        { name: 'Quality Assurance', monthly_rate: 9_550_000, headcount: 1, period_quarters: 4 },
      ],
    },
    {
      title: 'Requirement & Design',
      items: [
        { name: 'System Analyst', monthly_rate: 13_370_000, headcount: 1, period_quarters: 4 },
      ],
    },
    {
      title: 'Development',
      items: [
        {
          name: 'Senior Web Developer',
          monthly_rate: 11_550_000,
          headcount: 1,
          period_quarters: 4,
        },
        { name: 'Quality Assurance', monthly_rate: 9_550_000, headcount: 1, period_quarters: 4 },
        {
          name: 'Senior Mobile Developer',
          monthly_rate: 11_550_000,
          headcount: 1,
          period_quarters: 4,
        },
        { name: 'Frontend Developer', monthly_rate: 9_550_000, headcount: 1, period_quarters: 4 },
      ],
    },
    {
      title: 'SIT, UAT & Go-Live',
      items: [
        {
          name: 'Senior Web Developer',
          monthly_rate: 11_550_000,
          headcount: 1,
          period_quarters: 4,
        },
        {
          name: 'Senior Mobile Developer',
          monthly_rate: 11_550_000,
          headcount: 1,
          period_quarters: 4,
        },
        { name: 'UI/UX Designer', monthly_rate: 9_550_000, headcount: 1, period_quarters: 4 },
        { name: 'Quality Assurance', monthly_rate: 16_170_000, headcount: 1, period_quarters: 2 },
      ],
    },
  ],
  service_discount_amount: 42_200_000,
  show_service_discount_row: true,
  maintenance_items: [
    { name: 'Senior Web Programmer', monthly_rate: 11_550_000, headcount: 1, period_quarters: 12 },
    {
      name: 'Senior Mobile Programmer',
      monthly_rate: 11_550_000,
      headcount: 1,
      period_quarters: 12,
    },
    { name: 'Quality Assurance', monthly_rate: 9_550_000, headcount: 1, period_quarters: 6 },
  ],
  private_timeline_rows: [
    { description: 'Requirement Analysis & System Design', timeline: 'Bulan 1' },
    { description: 'Development', timeline: 'Bulan 2' },
    { description: 'Performance / Load Test dan Penetration Test', timeline: 'Bulan 2-3' },
    { description: 'System Integration Testing (SIT)', timeline: 'Bulan 3' },
    { description: 'User Acceptance Testing (UAT)', timeline: 'Bulan 3' },
    { description: 'Go-Live', timeline: 'Bulan 3' },
  ],
  private_payment_schedule: [
    {
      work_period: 'Termin 1',
      terms: 'DP Kick Off',
      invoice_date_label: '01/08/2026',
      due_date_label: '15/08/2026',
      nominal: 6_685_000,
    },
    {
      work_period: 'Termin 2',
      terms: 'Desain Selesai',
      invoice_date_label: '01/09/2026',
      due_date_label: '15/09/2026',
      nominal: 6_685_000,
    },
    {
      work_period: 'Termin 3',
      terms: 'Development',
      invoice_date_label: '01/10/2026',
      due_date_label: '15/10/2026',
      nominal: 42_200_000,
    },
    {
      work_period: 'Termin 4',
      terms: 'Pelunasan UAT',
      invoice_date_label: '01/11/2026',
      due_date_label: '15/11/2026',
      nominal: 40_735_000,
    },
  ],
  payment_due_days: 0,
  limitation_codes: ['client_hardware'],
  additional_limitations: [],
  rights_statements: [],
};

describe('kiosk-queue-system constants & pure helpers', () => {
  it('reproduces government hardware totals with integer math', () => {
    expect(calculateKioskQueueLocal(governmentHardwareValues)).toMatchObject({
      serviceTotal: 48_385_000,
      hardwareTotal: 51_615_000,
      paymentTargetTotal: 100_000_000,
    });
  });

  it('keeps private maintenance outside payment target', () => {
    expect(calculateKioskQueueLocal(privateFoodCourtValues)).toMatchObject({
      serviceTotal: 96_305_000,
      maintenanceTotal: 83_625_000,
      paymentTargetTotal: 96_305_000,
    });
  });

  it('normalizes text without reordering rows', () => {
    const normalized = normalizeKioskQueueSystem(privateFoodCourtValues);
    expect(normalized.private_timeline_rows.map((row) => row.description)).toEqual([
      'Requirement Analysis & System Design',
      'Development',
      'Performance / Load Test dan Penetration Test',
      'System Integration Testing (SIT)',
      'User Acceptance Testing (UAT)',
      'Go-Live',
    ]);
  });

  it('handles government service-only without hardware', () => {
    expect(calculateKioskQueueLocal(governmentServiceOnlyValues)).toMatchObject({
      serviceSubtotal: 57_680_000,
      serviceDiscountAmount: 2_024_800,
      serviceTaxAmount: 6_344_800,
      serviceTotal: 62_000_000,
      hardwareTotal: 0,
      paymentTargetTotal: 62_000_000,
    });
  });

  it('provides safe default values', () => {
    expect(KIOSK_QUEUE_DEFAULT_VALUES.variant).toBe('government_mpp');
    expect(KIOSK_QUEUE_DEFAULT_VALUES.hardware_provision).toBe('client_supplied');
    expect(KIOSK_QUEUE_DEFAULT_VALUES.tax_treatment).toBe('inclusive_ppn_11');
    expect(KIOSK_QUEUE_DEFAULT_VALUES.payment_due_days).toBe(14);
    expect(KIOSK_QUEUE_DEFAULT_VALUES.limitation_codes).toContain('civil_electrical');
  });

  it('creates default values with valid solution_type aligned to variant', () => {
    const gov = createDefaultKioskQueueValues('2026-09-14', undefined, 'government_mpp');
    expect(gov.solution_type).toBe('Sistem Antrian (Queue Management)');

    const priv = createDefaultKioskQueueValues('2026-09-14', undefined, 'private_food_court');
    expect(priv.solution_type).toBe('Kiosk Application');
  });
});
