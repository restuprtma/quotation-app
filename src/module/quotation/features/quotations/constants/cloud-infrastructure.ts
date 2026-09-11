import type { InfrastructurePackage } from 'src/module/quotation/features/rate-cards/types';

import dayjs from 'dayjs';

import type {
  CloudInfrastructureCalculation,
  CloudInfrastructureGeneratePayload,
  CloudInfrastructureInput,
  CloudPackageItemInput,
} from '../types';

export const MAX_CLOUD_MONEY = 9_000_000_000_000_000;
export const CLOUD_LIMITATION_CODES = ['out_of_pocket', 'overtime', 'third_party', 'scope_change'] as const;

type InfrastructurePackageSource = Pick<InfrastructurePackage, 'category' | 'vcpu' | 'ram_gb' | 'storage_gb'> & {
  package_name?: string;
  name?: string;
  amount_per_month?: number;
  unit_rate?: number;
};

const assertSafeMoney = (value: number): number => {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_CLOUD_MONEY) {
    throw new Error('Cloud calculation requires a safe integer amount');
  }
  return value;
};

const add = (left: number, right: number) => assertSafeMoney(assertSafeMoney(left) + assertSafeMoney(right));

export function copyInfrastructurePackage(source: InfrastructurePackageSource): CloudPackageItemInput {
  if (source.category !== 'shared_hosting' && source.category !== 'vps_cloud') {
    throw new Error('Unsupported infrastructure package category');
  }
  const name = source.package_name ?? source.name;
  const unitRate = source.amount_per_month ?? source.unit_rate;
  if (typeof name !== 'string' || typeof unitRate !== 'number') {
    throw new Error('Infrastructure package is missing its name or monthly amount');
  }
  return { category: source.category, name, vcpu: source.vcpu, ram_gb: source.ram_gb, storage_gb: source.storage_gb, unit_rate: unitRate };
}

const trimList = (items?: string[]) => (items ?? []).map((item) => item.trim());

/** Trims textual input while copying every ordered array; it never sorts or mutates. */
export function normalizeCloudInfrastructure(input: CloudInfrastructureInput): CloudInfrastructureInput {
  return {
    ...input,
    document_number: input.document_number.trim(), service_name: input.service_name.trim(), quotation_date: input.quotation_date.trim(),
    package_items: input.package_items.map((item) => ({ ...item, name: item.name.trim() })),
    setup_items: (input.setup_items ?? []).map((item) => ({ ...item, name: item.name.trim() })),
    scope_rows: (input.scope_rows ?? []).map((row) => ({ timeline: row.timeline.trim(), sections: row.sections.map((section) => ({ title: section.title.trim(), activities: trimList(section.activities) })) })),
    payment_schedule: input.payment_schedule.map((row) => ({ ...row, work_period: row.work_period.trim(), terms: row.terms.trim(), invoice_date_label: row.invoice_date_label.trim(), due_date_label: row.due_date_label.trim() })),
    limitation_codes: [...input.limitation_codes], additional_limitations: trimList(input.additional_limitations),
  };
}

export function projectCloudCalculation(input: CloudInfrastructureInput): CloudInfrastructureCalculation {
  let monthlySubtotal = 0; let setupSubtotal = 0; let setupPaymentTotal = 0; let monthlyPaymentRows = 0;
  const packages = input.package_items.map((item) => { const line_total = assertSafeMoney(item.unit_rate); monthlySubtotal = add(monthlySubtotal, line_total); return { ...item, line_total }; });
  const setup = (input.setup_items ?? []).map((item) => { const line_total = assertSafeMoney(item.amount); setupSubtotal = add(setupSubtotal, line_total); return { ...item, line_total }; });
  for (const row of input.payment_schedule) {
    const nominal = assertSafeMoney(row.nominal);
    if (row.component === 'setup') setupPaymentTotal = add(setupPaymentTotal, nominal);
    if (row.component === 'monthly_service') monthlyPaymentRows += 1;
  }
  const scheduled_recurring_total = assertSafeMoney(monthlySubtotal * monthlyPaymentRows);
  return { packages, setup, monthly_subtotal: monthlySubtotal, setup_subtotal: setupSubtotal, setup_payment_total: setupPaymentTotal, monthly_payment_rows: monthlyPaymentRows, scheduled_recurring_total, payment_total: add(setupPaymentTotal, scheduled_recurring_total) };
}

export function makeDefaultCloudInfrastructureValues(): CloudInfrastructureGeneratePayload {
  return {
    commercial_scheme: 'cloud_infrastructure', skill_id: '', subject: 'Penawaran Layanan Venturo Cloud', solution_type: 'cloud_infrastructure',
    cloud_infrastructure: { document_number: '', service_name: 'Venturo Cloud', quotation_date: dayjs().format('YYYY-MM-DD'), tax_treatment: 'exclusive_ppn', package_items: [], setup_items: [], scope_rows: [], payment_schedule: [], payment_due_days: 14, limitation_codes: [...CLOUD_LIMITATION_CODES], additional_limitations: [] },
  };
}
