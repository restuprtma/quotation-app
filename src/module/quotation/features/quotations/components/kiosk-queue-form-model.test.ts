import { it, expect, describe } from 'vitest';

import {
  makeKioskQueueSchema,
  kioskQueueFormSchema,
} from './kiosk-queue-form-model';
import {
  privateFoodCourtValues,
  governmentHardwareValues,
  governmentServiceOnlyValues,
} from '../constants/kiosk-queue-system.test';

const t = (key: string) => key;

describe('kiosk-queue-form-model Zod validation', () => {
  const governmentWithPrivateTimeline = {
    ...governmentHardwareValues,
    private_timeline_rows: [{ description: 'Timeline Swasta', timeline: '1 Bulan' }],
  };

  const privateWithExperts = {
    ...privateFoodCourtValues,
    expert_requirements: [
      {
        role: 'Expert',
        headcount: 1,
        duration_label: '1 Bulan',
        minimum_qualification: 'S1 Komputer',
      },
    ],
  };

  const privateWithVenturoHardware = {
    ...privateFoodCourtValues,
    hardware_provision: 'venturo_supplied' as any,
    hardware_items: [{ name: 'Mesin Kiosk', unit_price: 25_000_000, quantity: 1 }],
  };

  const governmentWithoutCivil = {
    ...governmentHardwareValues,
    limitation_codes: ['client_hardware'] as any,
  };

  const clientSuppliedWithHardware = {
    ...governmentServiceOnlyValues,
    hardware_items: [{ name: 'Mesin Kiosk Klien', unit_price: 10_000_000, quantity: 1 }],
  };

  const hiddenPositiveDiscount = {
    ...governmentHardwareValues,
    service_discount_amount: 500_000,
    show_service_discount_row: false,
    government_payment_schedule: [
      {
        stage: 'Uang Muka 50%',
        billing_basis: 'SPMK',
        nominal: 51_764_550,
      },
      {
        stage: 'Pelunasan 50%',
        billing_basis: 'BAST',
        nominal: 48_534_550,
      },
    ],
  };

  const paymentMismatch = {
    ...governmentHardwareValues,
    government_payment_schedule: [
      {
        stage: 'Uang Muka 50%',
        billing_basis: 'SPMK',
        nominal: 50_000_000,
      },
      {
        stage: 'Pelunasan 50%',
        billing_basis: 'BAST',
        nominal: 40_000_000, // Total 90jt vs target 100jt
      },
    ],
  };

  it.each([
    ['government rejects private timeline', governmentWithPrivateTimeline],
    ['private rejects experts', privateWithExperts],
    ['private rejects Venturo hardware', privateWithVenturoHardware],
    ['government requires civil exclusion', governmentWithoutCivil],
    ['client-supplied rejects hardware rows', clientSuppliedWithHardware],
    ['positive discount must be visible', hiddenPositiveDiscount],
    ['payment must match backend target', paymentMismatch],
  ])('%s', (_name, values) => {
    expect(makeKioskQueueSchema(t).safeParse(values).success).toBe(false);
  });

  it('accepts valid government hardware quotation', () => {
    const result = makeKioskQueueSchema(t).safeParse(governmentHardwareValues);
    expect(result.success).toBe(true);
  });

  it('accepts valid government service-only quotation', () => {
    const result = makeKioskQueueSchema(t).safeParse(governmentServiceOnlyValues);
    expect(result.success).toBe(true);
  });

  it('accepts valid private food court quotation', () => {
    const result = makeKioskQueueSchema(t).safeParse(privateFoodCourtValues);
    expect(result.success).toBe(true);
  });

  it('validates entire form schema wrapping kiosk_queue_system', () => {
    const formValues = {
      client_name: 'Pejabat Pembuat Komitmen',
      subject: 'Penawaran MPP',
      solution_type: 'Kiosk & Hardware System',
      commercial_scheme: 'kiosk_queue_system',
      kiosk_queue_system: governmentHardwareValues,
    };
    const result = kioskQueueFormSchema.safeParse(formValues);
    expect(result.success).toBe(true);
  });
});
