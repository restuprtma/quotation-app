import type { KioskQueueSystemInput } from '../types';

import { it, expect, describe } from 'vitest';

import {
  kioskQuarterLineTotal,
  kioskHardwareLineTotal,
  calculateKioskQueueLocal,
} from '../constants/kiosk-queue-system';
import {
  formatIDR,
  displayMonthsToQuarters,
  quartersToDisplayMonths,
  calculatePaymentReconciliation,
} from './kiosk-queue-cost-editor';

describe('kiosk-queue-cost-editor calculation and quarter conversions', () => {
  it('converts period quarters to display months and back accurately', () => {
    // 1 quarter = 0.25 month
    expect(quartersToDisplayMonths(1)).toBe(0.25);
    expect(quartersToDisplayMonths(2)).toBe(0.5);
    expect(quartersToDisplayMonths(3)).toBe(0.75);
    expect(quartersToDisplayMonths(4)).toBe(1);
    expect(quartersToDisplayMonths(10)).toBe(2.5);

    // Back to integer quarters
    expect(displayMonthsToQuarters(0.25)).toBe(1);
    expect(displayMonthsToQuarters(0.5)).toBe(2);
    expect(displayMonthsToQuarters(0.75)).toBe(3);
    expect(displayMonthsToQuarters(1)).toBe(4);
    expect(displayMonthsToQuarters(2.5)).toBe(10);
  });

  it('computes integer rupiah whole numbers for quarter periods', () => {
    // 20.000.000 * 1 * 4 quarters / 4 = 20.000.000
    expect(kioskQuarterLineTotal(20_000_000, 1, 4)).toBe(20_000_000);

    // 20.000.000 * 1 * 1 quarter / 4 = 5.000.000
    expect(kioskQuarterLineTotal(20_000_000, 1, 1)).toBe(5_000_000);

    // 15.000.000 * 2 * 2 quarters / 4 = 15.000.000
    expect(kioskQuarterLineTotal(15_000_000, 2, 2)).toBe(15_000_000);
  });

  it('computes hardware line total accurately', () => {
    expect(kioskHardwareLineTotal(12_500_000, 2)).toBe(25_000_000);
    expect(kioskHardwareLineTotal(3_500_000, 4)).toBe(14_000_000);
  });

  it('reconciles payment calculation with status and formatted delta', () => {
    // Balanced
    const balanced = calculatePaymentReconciliation(50_000_000, 50_000_000);
    expect(balanced.matches).toBe(true);
    expect(balanced.severity).toBe('success');
    expect(balanced.delta).toBe(0);

    // Mismatch (target > payment: shortage)
    const mismatch = calculatePaymentReconciliation(55_000_000, 50_000_000);
    expect(mismatch.matches).toBe(false);
    expect(mismatch.severity).toBe('error');
    expect(mismatch.delta).toBe(5_000_000);
    expect(mismatch.formattedDelta).toContain('5.000.000');
  });

  it('calculates full government totals with PPN 11% and venturo-supplied hardware', () => {
    const govInput: Partial<KioskQueueSystemInput> = {
      variant: 'government_mpp',
      hardware_provision: 'venturo_supplied',
      tax_treatment: 'inclusive_ppn_11',
      service_groups: [
        {
          title: 'Pengembangan Software Kiosk',
          items: [
            { name: 'Senior Dev', monthly_rate: 20_000_000, headcount: 1, period_quarters: 4 },
          ],
        },
      ],
      service_discount_amount: 2_000_000,
      hardware_items: [{ name: 'Kiosk Enclosure 21.5"', unit_price: 15_000_000, quantity: 2 }],
      government_payment_schedule: [
        { stage: 'Termin 1', billing_basis: 'SPMK', nominal: 26_000_000 },
        { stage: 'Termin 2', billing_basis: 'BAST', nominal: 27_500_000 },
      ],
    };

    const totals = calculateKioskQueueLocal(govInput);
    // Service subtotal: 20.000.000
    expect(totals.serviceSubtotal).toBe(20_000_000);
    // Service after discount: 18.000.000
    // Service tax (11% of subtotal 20.000.000): 2.200.000
    expect(totals.serviceTaxAmount).toBe(2_200_000);
    // Service total: 18.000.000 + 2.200.000 = 20.200.000
    expect(totals.serviceTotal).toBe(20_200_000);

    // Hardware subtotal: 30.000.000
    expect(totals.hardwareSubtotal).toBe(30_000_000);
    // Hardware tax: 3.300.000
    expect(totals.hardwareTaxAmount).toBe(3_300_000);
    // Hardware total: 33.300.000
    expect(totals.hardwareTotal).toBe(33_300_000);

    // Target = 20.200.000 + 33.300.000 = 53.500.000
    expect(totals.paymentTargetTotal).toBe(53_500_000);
    // Payment total: 26.000.000 + 27.500.000 = 53.500.000
    expect(totals.paymentTotal).toBe(53_500_000);
    expect(totals.isBalanced).toBe(true);
  });

  it('formats Indonesian currency cleanly', () => {
    expect(formatIDR(15_000_000)).toContain('15.000.000');
    expect(formatIDR(0)).toContain('0');
  });
});
