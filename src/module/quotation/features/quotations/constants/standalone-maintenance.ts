import type { StandaloneMaintenanceFormValues } from '../components/standalone-maintenance-form-model';
import type {
  ActiveSkill,
  ClientSummary,
  HourlyCostItem,
  RetainerCostItem,
  GenerateQuotationPayload,
  StandaloneMaintenanceMode,
  StandaloneMaintenanceInput,
  StandaloneMaintenancePriority,
  StandaloneMaintenanceTaxTreatment,
} from '../types';

import { resolveQuotationSkillId } from '../utils/generation';

export const MAX_STANDALONE_MAINTENANCE_MONEY = 9_000_000_000_000_000;

export const MAX_STANDALONE_MAINTENANCE_RETAINER_ITEMS = 50;
export const MAX_STANDALONE_MAINTENANCE_HOURLY_COST_ITEMS = 50;
export const MAX_STANDALONE_MAINTENANCE_DEFECT_GROUPS = 30;
export const MAX_STANDALONE_MAINTENANCE_DEFECT_ITEMS = 100;
export const MAX_STANDALONE_MAINTENANCE_HOURLY_TASKS = 100;
export const MAX_STANDALONE_MAINTENANCE_PAYMENT_ROWS = 60;
export const MAX_STANDALONE_MAINTENANCE_RIGHTS_STATEMENTS = 20;

export const MAX_STANDALONE_MAINTENANCE_PERIOD_MONTHS = 60;
export const MAX_STANDALONE_MAINTENANCE_HOURS_HALF_UNITS = 2000;
export const MAX_STANDALONE_MAINTENANCE_HEADCOUNT = 100;

export const MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES = 200;
export const MAX_STANDALONE_MAINTENANCE_LONG_TEXT_RUNES = 4000;

export const STANDALONE_MAINTENANCE_MODE_OPTIONS: Array<{
  value: StandaloneMaintenanceMode;
  label: string;
}> = [
  { value: 'retainer', label: 'Retainer Squad' },
  { value: 'hourly_task', label: 'Hourly Task' },
];

export const STANDALONE_MAINTENANCE_PRIORITY_OPTIONS: Array<{
  value: StandaloneMaintenancePriority;
  label: string;
}> = [
  { value: 'P0', label: 'P0' },
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
];

export const STANDALONE_MAINTENANCE_TAX_OPTIONS: Array<{
  value: StandaloneMaintenanceTaxTreatment;
  label: string;
}> = [
  { value: 'exclusive_ppn', label: 'Belum Termasuk PPN' },
  { value: 'inclusive_ppn', label: 'Sudah Termasuk PPN' },
  { value: 'not_stated', label: 'Tidak Dicantumkan' },
];

export const FTE_QUARTER_OPTIONS = [
  { value: 1, label: '0,25 FTE' },
  { value: 2, label: '0,5 FTE' },
  { value: 3, label: '0,75 FTE' },
  { value: 4, label: '1 FTE' },
] as const;

export const DEFAULT_STANDALONE_MAINTENANCE_FORM: StandaloneMaintenanceInput = {
  system_name: '',
  quotation_date: '',
  mode: 'retainer',
  tax_treatment: 'exclusive_ppn',
  retainer_items: [
    {
      name: '',
      monthly_rate: 0,
      fte_quarters: 4,
      period_months: 1,
    },
  ],
  hourly_cost_items: [],
  defect_groups: [
    {
      title: '',
      items: [
        {
          item_number: '',
          priority: 'P0',
          function: '',
          screen_flow: '',
          existing: '',
          improvement: '',
          reference: '',
        },
      ],
    },
  ],
  hourly_tasks: [],
  discount_amount: 0,
  show_discount_row: true,
  payment_schedule: [
    {
      work_period: '',
      terms: '',
      invoice_date_label: '',
      due_date_label: '',
      nominal: 0,
    },
  ],
  rights_statements: [],
};

export type { StandaloneMaintenanceFormValues };

export function createDefaultStandaloneMaintenanceValues(
  today: string,
  client?: ClientSummary
): StandaloneMaintenanceFormValues {
  return {
    client_id: client?.id ?? '',
    client_company_name: client?.name ?? '',
    client_name: 'Pimpinan Perusahaan',
    subject: '',
    solution_type: 'Web Application',
    commercial_scheme: 'standalone_maintenance',
    standalone_maintenance: {
      ...DEFAULT_STANDALONE_MAINTENANCE_FORM,
      quotation_date: today,
      retainer_items: [
        {
          name: '',
          monthly_rate: 0,
          fte_quarters: 4,
          period_months: 1,
        },
      ],
      hourly_cost_items: [],
      defect_groups: [
        {
          title: '',
          items: [
            {
              item_number: '',
              priority: 'P0',
              function: '',
              screen_flow: '',
              existing: '',
              improvement: '',
              reference: '',
            },
          ],
        },
      ],
      hourly_tasks: [],
      payment_schedule: [
        {
          work_period: '',
          terms: '',
          invoice_date_label: '',
          due_date_label: '',
          nominal: 0,
        },
      ],
      rights_statements: [],
    },
  };
}

export function formatHalfHours(halfUnits: number): string {
  if (!Number.isFinite(halfUnits) || halfUnits <= 0) {
    return '0';
  }
  if (halfUnits % 2 === 0) {
    return `${halfUnits / 2}`;
  }
  const whole = Math.floor(halfUnits / 2);
  return `${whole},5`;
}

export function retainerLineTotal(row: RetainerCostItem): number | null {
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
  if (!Number.isSafeInteger(total) || total > MAX_STANDALONE_MAINTENANCE_MONEY) {
    return null;
  }
  return total;
}

export function hourlyCostLineTotal(row: HourlyCostItem): number | null {
  if (
    !Number.isSafeInteger(row.quoted_line_total) ||
    row.quoted_line_total < 0 ||
    row.quoted_line_total > MAX_STANDALONE_MAINTENANCE_MONEY
  ) {
    return null;
  }
  return row.quoted_line_total;
}

export type StandaloneMaintenanceDraftTotals = {
  mode: StandaloneMaintenanceMode;
  subtotal: number;
  discount_amount: number;
  total_investment: number;
  payment_total: number;
  payment_delta: number;
  is_balanced: boolean;
};

export function calculateStandaloneMaintenanceDraftTotals(
  input: StandaloneMaintenanceInput
): StandaloneMaintenanceDraftTotals {
  let subtotal = 0;

  if (input.mode === 'retainer') {
    for (const item of input.retainer_items || []) {
      const line = retainerLineTotal(item);
      if (line !== null) {
        subtotal += line;
      }
    }
  } else if (input.mode === 'hourly_task') {
    for (const item of input.hourly_cost_items || []) {
      const line = hourlyCostLineTotal(item);
      if (line !== null) {
        subtotal += line;
      }
    }
  }

  const discountAmount =
    Number.isSafeInteger(input.discount_amount) && input.discount_amount >= 0
      ? input.discount_amount
      : 0;

  const totalInvestment = Math.max(0, subtotal - discountAmount);

  let paymentTotal = 0;
  for (const row of input.payment_schedule || []) {
    const nominal = Number.isSafeInteger(row.nominal) && row.nominal >= 0 ? row.nominal : 0;
    paymentTotal += nominal;
  }

  const paymentDelta = totalInvestment - paymentTotal;
  const isBalanced = paymentDelta === 0;

  return {
    mode: input.mode,
    subtotal,
    discount_amount: discountAmount,
    total_investment: totalInvestment,
    payment_total: paymentTotal,
    payment_delta: paymentDelta,
    is_balanced: isBalanced,
  };
}

export function normalizeStandaloneMaintenance(
  input: StandaloneMaintenanceInput
): StandaloneMaintenanceInput {
  const isRetainer = input.mode === 'retainer';

  return {
    system_name: input.system_name.trim(),
    quotation_date: input.quotation_date.trim(),
    mode: input.mode,
    tax_treatment: input.tax_treatment,
    retainer_items: isRetainer
      ? (input.retainer_items || []).map((item) => ({
          name: item.name.trim(),
          monthly_rate: item.monthly_rate,
          fte_quarters: item.fte_quarters,
          period_months: item.period_months,
        }))
      : [],
    hourly_cost_items: isRetainer
      ? []
      : (input.hourly_cost_items || []).map((item) => ({
          name: item.name.trim(),
          display_monthly_rate: item.display_monthly_rate,
          headcount: item.headcount,
          hours_half_units: item.hours_half_units,
          quoted_line_total: item.quoted_line_total,
        })),
    defect_groups: isRetainer
      ? (input.defect_groups || []).map((group) => ({
          title: group.title.trim(),
          items: (group.items || []).map((item) => ({
            item_number: item.item_number.trim(),
            priority: item.priority,
            function: item.function.trim(),
            screen_flow: item.screen_flow.trim(),
            existing: item.existing.trim(),
            improvement: item.improvement.trim(),
            ...(item.reference?.trim() ? { reference: item.reference.trim() } : {}),
          })),
        }))
      : [],
    hourly_tasks: isRetainer
      ? []
      : (input.hourly_tasks || []).map((task) => ({
          description: task.description.trim(),
          platform: task.platform.trim(),
          hours_half_units: task.hours_half_units,
        })),
    discount_amount: input.discount_amount,
    show_discount_row: Boolean(input.show_discount_row),
    payment_schedule: (input.payment_schedule || []).map((row) => ({
      work_period: row.work_period.trim(),
      terms: row.terms.trim(),
      invoice_date_label: row.invoice_date_label.trim(),
      due_date_label: row.due_date_label.trim(),
      nominal: row.nominal,
    })),
    rights_statements: (input.rights_statements || []).map((s) => s.trim()).filter(Boolean),
  };
}

export function toStandaloneMaintenancePayload(
  values: StandaloneMaintenanceFormValues,
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
    commercial_scheme: 'standalone_maintenance',
    standalone_maintenance: normalizeStandaloneMaintenance(values.standalone_maintenance),
  };
}
