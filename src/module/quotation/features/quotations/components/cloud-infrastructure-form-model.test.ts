import { describe, expect, it } from 'vitest';

import { cloudInfrastructureFormSchema } from './cloud-infrastructure-form-model';

const valid = { client_name: 'PIC', client_company_name: 'Company', subject: 'Cloud', solution_type: 'cloud_infrastructure' as const, commercial_scheme: 'cloud_infrastructure' as const, cloud_infrastructure: { document_number: 'CTH/1', service_name: 'Venturo Cloud', quotation_date: '2026-09-09', tax_treatment: 'exclusive_ppn' as const, package_items: [{ category: 'vps_cloud' as const, name: 'VM Small', vcpu: 4, ram_gb: 4, storage_gb: 32, unit_rate: 900_000 }], setup_items: [], scope_rows: [], payment_schedule: [{ work_period: 'Bulan 1', terms: 'Monthly', invoice_date_label: '1 Sep', due_date_label: '15 Sep', component: 'monthly_service' as const, nominal: 900_000 }], payment_due_days: 14, limitation_codes: ['out_of_pocket' as const], additional_limitations: [] } };

describe('cloud infrastructure form model', () => {
  it('returns a validation failure rather than throwing for aggregate overflow', () => {
    const invalid = structuredClone(valid);
    invalid.cloud_infrastructure.package_items = [
      { ...invalid.cloud_infrastructure.package_items[0], unit_rate: 9_000_000_000_000_000 },
      { ...invalid.cloud_infrastructure.package_items[0], unit_rate: 9_000_000_000_000_000 },
    ];
    expect(() => cloudInfrastructureFormSchema.safeParse(invalid)).not.toThrow();
    expect(cloudInfrastructureFormSchema.safeParse(invalid).success).toBe(false);
  });
  it('accepts an exact cloud contract', () => expect(cloudInfrastructureFormSchema.safeParse(valid).success).toBe(true));
  it.each(['2026-02-29', '2026-04-31', '2026-02-31', '2026-13-01', '2026-00-01', '2026-01-00'])('rejects impossible quotation date %s', (quotation_date) => {
    const invalid = structuredClone(valid);
    invalid.cloud_infrastructure.quotation_date = quotation_date;
    expect(cloudInfrastructureFormSchema.safeParse(invalid).success).toBe(false);
  });
  it('accepts leap day only in leap years', () => {
    const leapYear = structuredClone(valid);
    leapYear.cloud_infrastructure.quotation_date = '2024-02-29';
    expect(cloudInfrastructureFormSchema.safeParse(leapYear).success).toBe(true);
  });
  it('rejects payment mismatch, duplicate limitations and HTML-like text', () => { const invalid = structuredClone(valid); invalid.cloud_infrastructure.payment_schedule[0].nominal = 1; invalid.cloud_infrastructure.limitation_codes = ['out_of_pocket', 'out_of_pocket']; invalid.cloud_infrastructure.package_items[0].name = '<script>'; expect(cloudInfrastructureFormSchema.safeParse(invalid).success).toBe(false); });
});
