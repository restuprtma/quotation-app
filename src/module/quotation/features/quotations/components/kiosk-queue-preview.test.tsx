import type { KioskQueuePreviewResponse } from '../types';

import { it, expect, describe } from 'vitest';

import {
  isKioskQueueSubmitReady,
  formatKioskQueueCurrency,
  toKioskQueuePreviewViewModel,
} from './kiosk-queue-preview';

describe('kiosk-queue-preview view-model and authoritative gate', () => {
  const mockGovernmentPreview: KioskQueuePreviewResponse = {
    calculation: {
      variant: 'government_mpp',
      service_groups: [
        {
          title: 'Pengembangan Sistem Antrian MPP',
          items: [
            {
              name: 'Senior Programmer',
              monthly_rate: 15_000_000,
              headcount: 1,
              period_quarters: 4,
              line_total: 15_000_000,
            },
          ],
        },
      ],
      service_subtotal: 15_000_000,
      service_discount_amount: 1_000_000,
      service_tax_amount: 1_650_000,
      service_total: 15_650_000,
      hardware: [
        {
          name: 'Kiosk Enclosure & Thermal Printer',
          unit_price: 20_000_000,
          quantity: 2,
          line_total: 40_000_000,
        },
      ],
      hardware_subtotal: 40_000_000,
      hardware_tax_amount: 4_400_000,
      hardware_total: 44_400_000,
      maintenance_total: 0,
      payment_target_total: 60_050_000,
      payment_total: 60_050_000,
    },
    resolved_profile: {
      variant: 'government_mpp',
      hardware_provision: 'venturo_supplied',
      tax_treatment: 'inclusive_ppn_11',
      tax_clause_text: 'Harga penawaran sudah termasuk PPN 11%',
      show_hardware: true,
      show_maintenance: false,
      show_rights: false,
      payment_due_days: 14,
      limitation_texts: ['Pekerjaan sipil & kelistrikan bukan tanggung jawab Venturo'],
      sections: [
        { number: 1, code: 'service_cost', title: 'Biaya Jasa Pengembangan' },
        { number: 2, code: 'hardware_cost', title: 'Biaya Pengadaan Perangkat Keras' },
        { number: 3, code: 'scope_phases', title: 'Fase Lingkup Pekerjaan' },
        { number: 4, code: 'experts', title: 'Kebutuhan Tenaga Ahli' },
        { number: 5, code: 'payment', title: 'Tahapan Pembayaran' },
        { number: 6, code: 'limitations', title: 'Batasan dan Pengecualian' },
      ],
    },
  };

  const mockPrivatePreview: KioskQueuePreviewResponse = {
    calculation: {
      variant: 'private_food_court',
      service_groups: [
        {
          title: 'Pengembangan Kiosk Self-Ordering',
          items: [
            {
              name: 'Fullstack Developer',
              monthly_rate: 18_000_000,
              headcount: 1,
              period_quarters: 4,
              line_total: 18_000_000,
            },
          ],
        },
      ],
      service_subtotal: 18_000_000,
      service_discount_amount: 0,
      service_tax_amount: 0,
      service_total: 18_000_000,
      maintenance: [
        {
          name: 'Maintenance Support Squad',
          monthly_rate: 5_000_000,
          headcount: 1,
          period_quarters: 12,
          line_total: 15_000_000,
        },
      ],
      hardware_subtotal: 0,
      hardware_tax_amount: 0,
      hardware_total: 0,
      maintenance_total: 15_000_000,
      payment_target_total: 18_000_000,
      payment_total: 18_000_000,
    },
    resolved_profile: {
      variant: 'private_food_court',
      hardware_provision: 'client_supplied',
      tax_treatment: 'exclusive_ppn',
      tax_clause_text: 'Harga penawaran belum termasuk PPN',
      show_hardware: false,
      show_maintenance: true,
      show_rights: true,
      payment_due_days: 0,
      limitation_texts: ['Perangkat keras disediakan klien'],
      sections: [
        { number: 1, code: 'service_cost', title: 'Biaya Pengembangan Software' },
        { number: 2, code: 'maintenance_cost', title: 'Biaya Pemeliharaan & Support' },
        { number: 3, code: 'timeline', title: 'Lingkup Pekerjaan & Timeline' },
        { number: 4, code: 'payment', title: 'Termin Pembayaran' },
        { number: 5, code: 'limitations', title: 'Batasan dan Ketentuan' },
      ],
    },
  };

  it('transforms government preview into authoritative view model with PPN 11% and hardware breakdown', () => {
    const vm = toKioskQueuePreviewViewModel(mockGovernmentPreview);

    expect(vm.isGovernment).toBe(true);
    expect(vm.serviceSubtotal).toBe(15_000_000);
    expect(vm.serviceDiscountAmount).toBe(1_000_000);
    expect(vm.serviceTaxAmount).toBe(1_650_000);
    expect(vm.serviceTotal).toBe(15_650_000);

    expect(vm.showHardware).toBe(true);
    expect(vm.hardwareSubtotal).toBe(40_000_000);
    expect(vm.hardwareTaxAmount).toBe(4_400_000);
    expect(vm.hardwareTotal).toBe(44_400_000);

    expect(vm.showMaintenance).toBe(false);
    expect(vm.paymentTargetTotal).toBe(60_050_000);
    expect(vm.paymentTotal).toBe(60_050_000);
    expect(vm.isBalanced).toBe(true);
    expect(vm.visibleSections).toHaveLength(6);
  });

  it('transforms private preview into authoritative view model with separate development and maintenance totals', () => {
    const vm = toKioskQueuePreviewViewModel(mockPrivatePreview);

    expect(vm.isGovernment).toBe(false);
    expect(vm.serviceTotal).toBe(18_000_000);
    expect(vm.showHardware).toBe(false);
    expect(vm.showMaintenance).toBe(true);
    expect(vm.maintenanceTotal).toBe(15_000_000);

    // In private, payment target covers development (maintenance is invoiced separately)
    expect(vm.paymentTargetTotal).toBe(18_000_000);
    expect(vm.paymentTotal).toBe(18_000_000);
    expect(vm.isBalanced).toBe(true);
  });

  it('evaluates authoritative submit gate strictly', () => {
    const validParams = {
      isValid: true,
      isDebouncing: false,
      isFetching: false,
      isSuccess: true,
      error: null,
      preview: mockGovernmentPreview,
      previewPayloadHash: 'hash-matching-123',
      currentNormalizedPayloadHash: 'hash-matching-123',
    };

    expect(isKioskQueueSubmitReady(validParams)).toBe(true);

    // Stale: hash mismatch
    expect(
      isKioskQueueSubmitReady({
        ...validParams,
        previewPayloadHash: 'stale-hash',
        currentNormalizedPayloadHash: 'latest-hash',
      })
    ).toBe(false);

    // Debouncing or fetching
    expect(isKioskQueueSubmitReady({ ...validParams, isDebouncing: true })).toBe(false);
    expect(isKioskQueueSubmitReady({ ...validParams, isFetching: true })).toBe(false);

    // Error
    expect(isKioskQueueSubmitReady({ ...validParams, error: new Error('Network error') })).toBe(
      false
    );
  });

  it('formats currency IDR without decimal drift', () => {
    expect(formatKioskQueueCurrency(60_050_000)).toContain('60.050.000');
    expect(formatKioskQueueCurrency(0)).toContain('0');
    expect(formatKioskQueueCurrency(null)).toBe('-');
  });
});
