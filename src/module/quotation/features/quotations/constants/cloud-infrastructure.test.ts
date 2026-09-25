import { it, expect, describe } from 'vitest';
import {
  projectCloudCalculation,
  copyInfrastructurePackage,
  normalizeCloudInfrastructure,
  makeDefaultCloudInfrastructureValues,
} from './cloud-infrastructure';
import { applyEntryIdentityToSchemeDefaults } from '../utils/quotation-entry-state';

const authen = {
  document_number: ' CTH/Authen ',
  service_name: ' Venturo Cloud ',
  quotation_date: '2026-06-24',
  tax_treatment: 'exclusive_ppn' as const,
  package_items: [
    {
      category: 'vps_cloud' as const,
      name: ' VM Small ',
      vcpu: 4,
      ram_gb: 4,
      storage_gb: 32,
      unit_rate: 900_000,
    },
    {
      category: 'vps_cloud' as const,
      name: ' VM Small ',
      vcpu: 4,
      ram_gb: 4,
      storage_gb: 32,
      unit_rate: 900_000,
    },
  ],
  setup_items: [],
  scope_rows: [],
  payment_schedule: [
    {
      work_period: ' Bulan 1 ',
      terms: ' Pelunasan ',
      invoice_date_label: ' 30 Jun ',
      due_date_label: ' 14 Jul ',
      component: 'monthly_service' as const,
      nominal: 1_800_000,
    },
  ],
  payment_due_days: 14,
  limitation_codes: ['out_of_pocket'] as const,
  additional_limitations: [],
};

describe('cloud infrastructure pure rules', () => {
  it('defaults to the cloud infrastructure scheme', () =>
    expect(makeDefaultCloudInfrastructureValues().commercial_scheme).toBe('cloud_infrastructure'));
  it('copies package catalog values without retaining catalog identity', () =>
    expect(
      copyInfrastructurePackage({
        category: 'vps_cloud',
        package_name: 'Cloud VPS Small',
        vcpu: 4,
        ram_gb: 4,
        storage_gb: 32,
        amount_per_month: 900_000,
      })
    ).toEqual({
      category: 'vps_cloud',
      name: 'Cloud VPS Small',
      vcpu: 4,
      ram_gb: 4,
      storage_gb: 32,
      unit_rate: 900_000,
    }));
  it('projects recurring totals with integer-only arithmetic', () =>
    expect(projectCloudCalculation(authen)).toMatchObject({
      monthly_subtotal: 1_800_000,
      setup_subtotal: 0,
      scheduled_recurring_total: 1_800_000,
    }));
  it('rejects unsafe numeric inputs and preserves normalized nested ordering', () => {
    expect(() =>
      projectCloudCalculation({
        ...authen,
        package_items: [{ ...authen.package_items[0], unit_rate: Number.MAX_SAFE_INTEGER + 1 }],
      })
    ).toThrow(/safe integer/i);
    const normalized = normalizeCloudInfrastructure(authen);
    expect(normalized.document_number).toBe('CTH/Authen');
    expect(normalized.package_items.map((item) => item.name)).toEqual(['VM Small', 'VM Small']);
    expect(authen.package_items[0].name).toBe(' VM Small ');
  });

  it('merges entry identity into default cloud infrastructure values', () => {
    const base = {
      ...makeDefaultCloudInfrastructureValues(),
      client_id: '',
      client_company_name: '',
      client_name: '',
    };
    const withEntry = applyEntryIdentityToSchemeDefaults(base, {
      project_name: 'Cloud Infrastructure Server',
      client_id: 'client-ci-1',
      client_company_name: 'PT Awan Nusantara',
      pic_name: 'Rian Pratama',
    });

    expect(withEntry.subject).toBe('Cloud Infrastructure Server');
    expect(withEntry.client_id).toBe('client-ci-1');
    expect(withEntry.client_company_name).toBe('PT Awan Nusantara');
    expect(withEntry.client_name).toBe('Rian Pratama');
  });
});
