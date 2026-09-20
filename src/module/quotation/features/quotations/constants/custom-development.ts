import type { CustomDevelopmentFormValues } from '../components/custom-development-form-model';
import type {
  ActiveSkill,
  ClientSummary,
  CustomDevelopmentInput,
  GenerateQuotationPayload,
  CustomDevelopmentCostItemInput,
  CustomDevelopmentPaymentRowInput,
  CustomDevelopmentMonthlyItemInput,
} from '../types';

import { resolveQuotationSkillId } from '../utils/generation';

export const MAX_CUSTOM_DEVELOPMENT_MONEY = 9_000_000_000_000_000;
export const MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES = 200;
export const MAX_CUSTOM_DEVELOPMENT_LONG_TEXT_RUNES = 4_000;
export const MAX_CUSTOM_DEVELOPMENT_PERIOD_RUNES = 50;
export const MAX_CUSTOM_DEVELOPMENT_GROUPS = 30;
export const MAX_CUSTOM_DEVELOPMENT_ITEMS_PER_GROUP = 100;
export const MAX_CUSTOM_DEVELOPMENT_HEADCOUNT = 100;
export const MAX_CUSTOM_DEVELOPMENT_MONTHLY_ITEMS = 50;
export const MAX_CUSTOM_DEVELOPMENT_MONTHLY_QUANTITY = 10_000;
export const MAX_CUSTOM_DEVELOPMENT_MONTHLY_NOTES = 20;
export const MAX_CUSTOM_DEVELOPMENT_MODULE_GROUPS = 30;
export const MAX_CUSTOM_DEVELOPMENT_FEATURES_PER_GROUP = 100;
export const MAX_CUSTOM_DEVELOPMENT_TIMELINE_ROWS = 100;
export const MAX_CUSTOM_DEVELOPMENT_PAYMENT_ROWS = 60;
export const MAX_CUSTOM_DEVELOPMENT_RIGHTS_STATEMENTS = 20;
export const MAX_CUSTOM_DEVELOPMENT_LIMITATION_CODES = 4;
export const MAX_CUSTOM_DEVELOPMENT_ADDITIONAL_LIMITATIONS = 20;

export const CUSTOM_DEVELOPMENT_TABLE_MODE_OPTIONS = [
  { value: 'monthly_period', label: 'Periode Bulanan' },
  { value: 'daily_period', label: 'Periode Harian' },
  { value: 'fixed_days', label: 'Hari Kerja Tetap (Fixed Days)' },
] as const;

export const CUSTOM_DEVELOPMENT_TAX_TREATMENT_OPTIONS = [
  { value: 'not_stated', label: 'Tidak Dicantumkan' },
  { value: 'exclusive_ppn', label: 'Belum Termasuk PPN' },
  { value: 'inclusive_ppn', label: 'Sudah Termasuk PPN' },
] as const;

export const CUSTOM_DEVELOPMENT_PAYMENT_COMPONENT_OPTIONS = [
  { value: 'development', label: 'Biaya Pengembangan' },
  { value: 'monthly_recurring', label: 'Biaya Operasional Bulanan' },
] as const;

export const CUSTOM_DEVELOPMENT_LIMITATION_OPTIONS = [
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

export const DEFAULT_CUSTOM_DEVELOPMENT_LIMITATION_CODES = [
  'out_of_pocket',
  'overtime',
  'third_party',
  'scope_change',
] as const;

export type CustomDevelopmentDraftTotals = {
  development_subtotal: number;
  discount_amount: number;
  total_investment: number;
  monthly_total: number;
  development_payment_total: number;
  development_delta: number;
  monthly_rows_valid: boolean;
  is_balanced: boolean;
};

export function customDevelopmentCostLineTotal(
  item: CustomDevelopmentCostItemInput
): number | null {
  if (item.quoted_line_total === null || item.quoted_line_total === undefined) {
    return null;
  }
  if (
    !Number.isSafeInteger(item.quoted_line_total) ||
    item.quoted_line_total < 0 ||
    item.quoted_line_total > MAX_CUSTOM_DEVELOPMENT_MONEY
  ) {
    return null;
  }
  return item.quoted_line_total;
}

export function customDevelopmentMonthlyLineTotal(
  item: CustomDevelopmentMonthlyItemInput
): number | null {
  if (
    !Number.isSafeInteger(item.unit_rate) ||
    !Number.isSafeInteger(item.quantity) ||
    item.unit_rate < 0 ||
    item.quantity < 0
  ) {
    return null;
  }
  const total = item.unit_rate * item.quantity;
  if (!Number.isSafeInteger(total) || total > MAX_CUSTOM_DEVELOPMENT_MONEY) {
    return null;
  }
  return total;
}

export function calculateCustomDevelopmentDraftTotals(
  input: Partial<CustomDevelopmentInput>
): CustomDevelopmentDraftTotals {
  let developmentSubtotal = 0;
  let hasOverflow = false;
  let hasPricedItem = false;

  for (const group of input.development_groups || []) {
    for (const item of group.items || []) {
      if (item.quoted_line_total !== null && item.quoted_line_total !== undefined) {
        if (
          !Number.isSafeInteger(item.quoted_line_total) ||
          item.quoted_line_total < 0 ||
          item.quoted_line_total > MAX_CUSTOM_DEVELOPMENT_MONEY
        ) {
          hasOverflow = true;
        } else {
          developmentSubtotal += item.quoted_line_total;
          if (
            !Number.isSafeInteger(developmentSubtotal) ||
            developmentSubtotal > MAX_CUSTOM_DEVELOPMENT_MONEY
          ) {
            hasOverflow = true;
          }
          if (item.quoted_line_total > 0) {
            hasPricedItem = true;
          }
        }
      }
    }
  }

  const discountAmount =
    Number.isSafeInteger(input.discount_amount) && input.discount_amount! >= 0
      ? input.discount_amount!
      : 0;

  if (
    input.discount_amount !== undefined &&
    input.discount_amount !== null &&
    (!Number.isSafeInteger(input.discount_amount) ||
      input.discount_amount > MAX_CUSTOM_DEVELOPMENT_MONEY ||
      input.discount_amount > developmentSubtotal)
  ) {
    hasOverflow = true;
  }

  const totalInvestment = Math.max(0, developmentSubtotal - discountAmount);
  if (!Number.isSafeInteger(totalInvestment) || totalInvestment > MAX_CUSTOM_DEVELOPMENT_MONEY) {
    hasOverflow = true;
  }

  let monthlyTotal = 0;
  for (const item of input.monthly_items || []) {
    if (
      !Number.isSafeInteger(item.unit_rate) ||
      !Number.isSafeInteger(item.quantity) ||
      item.unit_rate < 0 ||
      item.quantity < 0 ||
      item.unit_rate > MAX_CUSTOM_DEVELOPMENT_MONEY
    ) {
      hasOverflow = true;
    } else {
      const line = item.unit_rate * item.quantity;
      if (!Number.isSafeInteger(line) || line > MAX_CUSTOM_DEVELOPMENT_MONEY) {
        hasOverflow = true;
      } else {
        monthlyTotal += line;
        if (!Number.isSafeInteger(monthlyTotal) || monthlyTotal > MAX_CUSTOM_DEVELOPMENT_MONEY) {
          hasOverflow = true;
        }
      }
    }
  }

  let developmentPaymentTotal = 0;
  const monthlyPaymentRows: CustomDevelopmentPaymentRowInput[] = [];

  for (const row of input.payment_schedule || []) {
    const nominal = Number.isSafeInteger(row.nominal) && row.nominal >= 0 ? row.nominal : 0;
    if (
      !Number.isSafeInteger(row.nominal) ||
      row.nominal < 0 ||
      row.nominal > MAX_CUSTOM_DEVELOPMENT_MONEY
    ) {
      hasOverflow = true;
    }

    if (row.component === 'development') {
      developmentPaymentTotal += nominal;
      if (
        !Number.isSafeInteger(developmentPaymentTotal) ||
        developmentPaymentTotal > MAX_CUSTOM_DEVELOPMENT_MONEY
      ) {
        hasOverflow = true;
      }
    } else if (row.component === 'monthly_recurring') {
      monthlyPaymentRows.push(row);
    }
  }

  const developmentDelta = totalInvestment - developmentPaymentTotal;

  let monthlyRowsValid = true;
  if (monthlyTotal === 0) {
    monthlyRowsValid = monthlyPaymentRows.length === 0;
  } else {
    monthlyRowsValid =
      monthlyPaymentRows.length > 0 && monthlyPaymentRows.every((r) => r.nominal === monthlyTotal);
  }

  const isBalanced =
    !hasOverflow &&
    hasPricedItem &&
    developmentDelta === 0 &&
    monthlyRowsValid &&
    discountAmount <= developmentSubtotal;

  return {
    development_subtotal: developmentSubtotal,
    discount_amount: discountAmount,
    total_investment: totalInvestment,
    monthly_total: monthlyTotal,
    development_payment_total: developmentPaymentTotal,
    development_delta: developmentDelta,
    monthly_rows_valid: monthlyRowsValid,
    is_balanced: isBalanced,
  };
}

export function normalizeCustomDevelopment(input: CustomDevelopmentInput): CustomDevelopmentInput {
  return {
    system_name: input.system_name.trim(),
    quotation_date: input.quotation_date.trim(),
    development_table_mode: input.development_table_mode,
    tax_treatment: input.tax_treatment,
    development_groups: (input.development_groups || []).map((group) => ({
      title: group.title.trim(),
      items: (group.items || []).map((item) => ({
        name: item.name.trim(),
        display_rate:
          item.display_rate !== null && item.display_rate !== undefined ? item.display_rate : null,
        headcount: item.headcount,
        period_label: item.period_label.trim(),
        quoted_line_total:
          item.quoted_line_total !== null && item.quoted_line_total !== undefined
            ? item.quoted_line_total
            : null,
      })),
    })),
    discount_label: input.discount_label ? input.discount_label.trim() : undefined,
    discount_amount: input.discount_amount || 0,
    show_discount_row: Boolean(input.show_discount_row),
    monthly_items: input.monthly_items
      ? input.monthly_items.map((item) => ({
          name: item.name.trim(),
          specification: item.specification ? item.specification.trim() : '',
          unit_rate: item.unit_rate,
          quantity: item.quantity,
        }))
      : undefined,
    monthly_notes: input.monthly_notes
      ? input.monthly_notes.map((n) => n.trim()).filter(Boolean)
      : undefined,
    module_groups: (input.module_groups || []).map((mg) => ({
      name: mg.name.trim(),
      features: (mg.features || []).map((f) => f.trim()).filter(Boolean),
    })),
    timeline_rows: (input.timeline_rows || []).map((tr) => ({
      description: tr.description.trim(),
      timeline: tr.timeline.trim(),
    })),
    payment_schedule: (input.payment_schedule || []).map((ps) => ({
      work_period: ps.work_period.trim(),
      terms: ps.terms.trim(),
      invoice_date_label: ps.invoice_date_label.trim(),
      due_date_label: ps.due_date_label.trim(),
      component: ps.component,
      nominal: ps.nominal,
    })),
    rights_statements: input.rights_statements
      ? input.rights_statements.map((r) => r.trim()).filter(Boolean)
      : undefined,
    limitation_codes: input.limitation_codes ? [...input.limitation_codes] : [],
    additional_limitations: input.additional_limitations
      ? input.additional_limitations.map((a) => a.trim()).filter(Boolean)
      : undefined,
  };
}

export function toCustomDevelopmentPayload(
  values: CustomDevelopmentFormValues,
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
    commercial_scheme: 'custom_development',
    custom_development: normalizeCustomDevelopment(values.custom_development),
  };
}

export function createDefaultCustomDevelopmentValues(
  today: string,
  client?: ClientSummary
): CustomDevelopmentFormValues {
  return {
    client_id: client?.id ?? '',
    client_company_name: client?.name ?? '',
    client_name: 'Pimpinan Perusahaan',
    subject: '',
    solution_type: 'Web Application',
    commercial_scheme: 'custom_development',
    custom_development: {
      system_name: '',
      quotation_date: today,
      development_table_mode: 'monthly_period',
      tax_treatment: 'not_stated',
      development_groups: [
        {
          title: 'Pengembangan Sistem Utama',
          items: [
            {
              name: 'Senior Fullstack Developer',
              display_rate: null,
              headcount: 1,
              period_label: '1 Bulan',
              quoted_line_total: 0,
            },
          ],
        },
      ],
      discount_label: 'DISCOUNT',
      discount_amount: 0,
      show_discount_row: false,
      monthly_items: [],
      monthly_notes: [],
      module_groups: [
        {
          name: 'Modul Utama',
          features: ['Fitur Utama'],
        },
      ],
      timeline_rows: [
        {
          description: 'Fase 1: Pengembangan dan Testing',
          timeline: '1 Bulan',
        },
      ],
      payment_schedule: [],
      rights_statements: [],
      limitation_codes: ['out_of_pocket', 'overtime', 'third_party', 'scope_change'],
      additional_limitations: [],
    },
  };
}
