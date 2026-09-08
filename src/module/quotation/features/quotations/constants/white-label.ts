import type {
  ActiveSkill,
  ClientSummary,
  WhiteLabelInput,
  GenerateQuotationPayload,
  WhiteLabelLimitationCode,
  WhiteLabelHostingItemInput,
  WhiteLabelLicenseItemInput,
  WhiteLabelMaintenanceItemInput,
} from '../types';

import { resolveQuotationSkillId } from '../utils/generation';

export const MAX_WHITE_LABEL_SAFE_AMOUNT = 9_000_000_000_000_000;
export const MAX_WHITE_LABEL_NAME_RUNES = 200;
export const MAX_WHITE_LABEL_TEXT_RUNES = 1_000;
export const MAX_WHITE_LABEL_LICENSE_ITEMS = 50;
export const MAX_WHITE_LABEL_COMPONENT_ITEMS = 50;
export const MAX_WHITE_LABEL_PAYMENT_ROWS = 60;
export const MAX_WHITE_LABEL_MODULE_GROUPS = 30;
export const MAX_WHITE_LABEL_FEATURES_PER_GROUP = 100;
export const MAX_WHITE_LABEL_TIMELINE_ROWS = 100;
export const MAX_WHITE_LABEL_RIGHTS_STATEMENTS = 20;
export const MAX_WHITE_LABEL_LIMITATION_CODES = 10;

export const TAX_TREATMENT_OPTIONS = [
  { value: 'not_stated', label: 'Tidak Dicantumkan' },
  { value: 'exclusive_ppn', label: 'Belum Termasuk PPN' },
  { value: 'inclusive_ppn', label: 'Sudah Termasuk PPN' },
] as const;

export const FTE_OPTIONS = [
  { value: 1, label: '0,25 FTE' },
  { value: 2, label: '0,5 FTE' },
  { value: 3, label: '0,75 FTE' },
  { value: 4, label: '1 FTE' },
] as const;

export const PAYMENT_COMPONENT_OPTIONS = [
  { value: 'license', label: 'Lisensi' },
  { value: 'maintenance_hosting', label: 'Maintenance & Hosting' },
] as const;

export const LIMITATION_OPTIONS = [
  {
    value: 'out_of_pocket',
    label: 'Biaya Out-of-Pocket (akomodasi, transportasi, dinas luar kota)',
  },
  {
    value: 'overtime',
    label: 'Pekerjaan di luar jam kerja normal (lembur/overtime)',
  },
  {
    value: 'third_party',
    label: 'Lisensi pihak ketiga berbayar (API, payment gateway, cloud luar paket)',
  },
  {
    value: 'scope_change',
    label: 'Penambahan fitur baru di luar lingkup yang disepakati (Change Request)',
  },
] as const;

export const DEFAULT_LIMITATION_CODES: WhiteLabelLimitationCode[] = [
  'out_of_pocket',
  'overtime',
  'third_party',
  'scope_change',
];

import type { WhiteLabelFormValues } from '../components/white-label-form-model';

export type { WhiteLabelFormValues };

export function createDefaultWhiteLabelValues(
  today: string,
  client?: ClientSummary
): WhiteLabelFormValues {
  return {
    client_id: client?.id ?? '',
    client_company_name: client?.name ?? '',
    client_name: 'Pimpinan Perusahaan',
    subject: '',
    solution_type: 'Web Application',
    commercial_scheme: 'white_label',
    white_label: {
      product_name: '',
      quotation_date: today,
      tax_treatment: 'not_stated',
      license_items: [
        {
          name: '',
          unit_rate: 0,
          quantity: 1,
        },
      ],
      maintenance_items: [],
      hosting_items: [],
      module_groups: [],
      timeline_rows: [],
      payment_schedule: [],
      rights_statements: [],
      limitation_codes: ['out_of_pocket', 'overtime', 'third_party', 'scope_change'],
    },
  };
}

export function licenseLineTotal(row: WhiteLabelLicenseItemInput): number | null {
  if (
    !Number.isSafeInteger(row.unit_rate) ||
    !Number.isSafeInteger(row.quantity) ||
    row.unit_rate < 0 ||
    row.quantity < 0
  ) {
    return null;
  }
  const total = row.unit_rate * row.quantity;
  if (!Number.isSafeInteger(total) || total > MAX_WHITE_LABEL_SAFE_AMOUNT) {
    return null;
  }
  return total;
}

export function maintenanceLineTotal(row: WhiteLabelMaintenanceItemInput): number | null {
  if (
    !Number.isSafeInteger(row.monthly_rate) ||
    !Number.isSafeInteger(row.fte_quarters) ||
    !Number.isSafeInteger(row.period_months) ||
    row.monthly_rate < 0 ||
    row.fte_quarters < 1 ||
    row.fte_quarters > 4 ||
    row.period_months < 0
  ) {
    return null;
  }
  const numerator = row.monthly_rate * row.fte_quarters * row.period_months;
  if (!Number.isSafeInteger(numerator) || numerator % 4 !== 0 || numerator < 0) {
    return null;
  }
  const total = numerator / 4;
  if (!Number.isSafeInteger(total) || total > MAX_WHITE_LABEL_SAFE_AMOUNT) {
    return null;
  }
  return total;
}

export function hostingLineTotal(row: WhiteLabelHostingItemInput): number | null {
  if (
    !Number.isSafeInteger(row.monthly_rate) ||
    !Number.isSafeInteger(row.quantity) ||
    !Number.isSafeInteger(row.period_months) ||
    row.monthly_rate < 0 ||
    row.quantity < 0 ||
    row.period_months < 0
  ) {
    return null;
  }
  const total = row.monthly_rate * row.quantity * row.period_months;
  if (!Number.isSafeInteger(total) || total > MAX_WHITE_LABEL_SAFE_AMOUNT) {
    return null;
  }
  return total;
}

export type WhiteLabelDraftTotals = {
  license_subtotal: number;
  maintenance_subtotal: number;
  hosting_subtotal: number;
  maintenance_hosting_subtotal: number;
  total_investment: number;
  license_payment_total: number;
  maintenance_hosting_payment_total: number;
  payment_total: number;
  license_delta: number;
  maintenance_hosting_delta: number;
  total_investment_delta: number;
  is_balanced: boolean;
};

export function calculateWhiteLabelDraftTotals(input: WhiteLabelInput): WhiteLabelDraftTotals {
  let licenseSubtotal = 0;
  for (const item of input.license_items || []) {
    const total = licenseLineTotal(item);
    if (total !== null) {
      licenseSubtotal += total;
    }
  }

  let maintenanceSubtotal = 0;
  for (const item of input.maintenance_items || []) {
    const total = maintenanceLineTotal(item);
    if (total !== null) {
      maintenanceSubtotal += total;
    }
  }

  let hostingSubtotal = 0;
  for (const item of input.hosting_items || []) {
    const total = hostingLineTotal(item);
    if (total !== null) {
      hostingSubtotal += total;
    }
  }

  const maintenanceHostingSubtotal = maintenanceSubtotal + hostingSubtotal;
  const totalInvestment = licenseSubtotal + maintenanceHostingSubtotal;

  let licensePaymentTotal = 0;
  let maintenanceHostingPaymentTotal = 0;

  for (const row of input.payment_schedule || []) {
    const nominal = Number.isSafeInteger(row.nominal) && row.nominal >= 0 ? row.nominal : 0;
    if (row.component === 'license') {
      licensePaymentTotal += nominal;
    } else if (row.component === 'maintenance_hosting') {
      maintenanceHostingPaymentTotal += nominal;
    }
  }

  const paymentTotal = licensePaymentTotal + maintenanceHostingPaymentTotal;
  const licenseDelta = licenseSubtotal - licensePaymentTotal;
  const maintenanceHostingDelta = maintenanceHostingSubtotal - maintenanceHostingPaymentTotal;
  const totalInvestmentDelta = totalInvestment - paymentTotal;

  const isBalanced =
    licenseDelta === 0 && maintenanceHostingDelta === 0 && totalInvestmentDelta === 0;

  return {
    license_subtotal: licenseSubtotal,
    maintenance_subtotal: maintenanceSubtotal,
    hosting_subtotal: hostingSubtotal,
    maintenance_hosting_subtotal: maintenanceHostingSubtotal,
    total_investment: totalInvestment,
    license_payment_total: licensePaymentTotal,
    maintenance_hosting_payment_total: maintenanceHostingPaymentTotal,
    payment_total: paymentTotal,
    license_delta: licenseDelta,
    maintenance_hosting_delta: maintenanceHostingDelta,
    total_investment_delta: totalInvestmentDelta,
    is_balanced: isBalanced,
  };
}

export function normalizeWhiteLabel(input: WhiteLabelInput): WhiteLabelInput {
  return {
    product_name: input.product_name.trim(),
    quotation_date: input.quotation_date.trim(),
    tax_treatment: input.tax_treatment,
    license_items: (input.license_items || []).map((item) => ({
      name: item.name.trim(),
      unit_rate: item.unit_rate,
      quantity: item.quantity,
    })),
    maintenance_items: (input.maintenance_items || []).map((item) => ({
      name: item.name.trim(),
      monthly_rate: item.monthly_rate,
      fte_quarters: item.fte_quarters,
      period_months: item.period_months,
    })),
    hosting_items: (input.hosting_items || []).map((item) => ({
      name: item.name.trim(),
      monthly_rate: item.monthly_rate,
      quantity: item.quantity,
      period_months: item.period_months,
    })),
    module_groups: (input.module_groups || []).map((group) => ({
      name: group.name.trim(),
      features: (group.features || []).map((f) => f.trim()).filter(Boolean),
    })),
    timeline_rows: (input.timeline_rows || []).map((row) => ({
      description: row.description.trim(),
      timeline: row.timeline.trim(),
    })),
    payment_schedule: (input.payment_schedule || []).map((row) => ({
      work_period: row.work_period.trim(),
      terms: row.terms.trim(),
      invoice_date_label: row.invoice_date_label.trim(),
      due_date_label: row.due_date_label.trim(),
      component: row.component,
      nominal: row.nominal,
    })),
    rights_statements: (input.rights_statements || []).map((s) => s.trim()).filter(Boolean),
    limitation_codes: [...(input.limitation_codes || [])],
  };
}

export function toWhiteLabelPayload(
  values: WhiteLabelFormValues,
  selectedSkill: ActiveSkill | null | undefined,
  activeSkills: ActiveSkill[]
): GenerateQuotationPayload {
  return {
    skill_id: resolveQuotationSkillId(selectedSkill, activeSkills),
    client_id: values.client_id || undefined,
    client_name: values.client_name.trim(),
    client_company_name: values.client_company_name?.trim() || undefined,
    subject: values.subject.trim(),
    solution_type: values.solution_type,
    commercial_scheme: 'white_label',
    white_label: normalizeWhiteLabel(values.white_label),
  };
}
