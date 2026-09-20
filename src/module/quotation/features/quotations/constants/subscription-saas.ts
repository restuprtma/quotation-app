import type {
  ActiveSkill,
  ClientSummary,
  SubscriptionSaaSInput,
  GenerateQuotationPayload,
  SubscriptionBillingCycle,
  SubscriptionSectionLayout,
  SubscriptionPaymentRowInput,
  SubscriptionFeatureGroupInput,
} from '../types';

import { resolveQuotationSkillId } from '../utils/generation';

export const MAX_SUBSCRIPTION_TERM_MONTHS = 60;
export const MAX_SUBSCRIPTION_PRICE_PERIODS = 10;
export const MAX_SUBSCRIPTION_ONE_TIME_ITEMS = 20;
export const MAX_SUBSCRIPTION_PAYMENT_ROWS = 60;
export const MAX_SUBSCRIPTION_FEATURE_GROUPS = 30;
export const MAX_SUBSCRIPTION_FEATURES_PER_GROUP = 50;
export const MAX_SUBSCRIPTION_SAFE_AMOUNT = 9_000_000_000_000_000;
export const MAX_SUBSCRIPTION_LABEL_RUNES = 200;
export const MAX_SUBSCRIPTION_ELIGIBLE_REVENUE_RUNES = 2_000;

export const RIGHTS_CLAUSE_VENTURO_SOFTWARE_OWNERSHIP_V1 = 'venturo_software_ownership_v1' as const;
export const SUBSCRIPTION_LEGAL_CATALOG_VERSION = 'subscription_saas_legal_v1' as const;

export const SECTION_LAYOUT_OPTIONS = [
  { value: 'subscription_development', label: 'Subscription & Development' },
  { value: 'development_maintenance', label: 'Development & Maintenance' },
] as const;

export const BILLING_CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

export const TAX_TREATMENT_OPTIONS = [
  { value: 'not_stated', label: 'Tidak Dicantumkan' },
  { value: 'exclusive_ppn', label: 'Belum Termasuk PPN' },
  { value: 'inclusive_ppn', label: 'Sudah Termasuk PPN' },
] as const;

import type { SubscriptionSaaSFormValues } from '../components/subscription-saas-form-model';

export type { SubscriptionSaaSFormValues };

export function createDefaultSubscriptionSaaSValues(
  today: string,
  client?: ClientSummary
): SubscriptionSaaSFormValues {
  return {
    client_id: client?.id ?? '',
    client_company_name: client?.name ?? '',
    client_name: 'Pimpinan Perusahaan',
    subject: '',
    solution_type: 'Web Application',
    commercial_scheme: 'subscription_saas',
    subscription_saas: {
      product_name: '',
      quotation_date: today,
      section_layout: 'subscription_development',
      billing_cycle: 'monthly',
      tax_treatment: 'not_stated',
      initial_term_months: 12,
      auto_renewal: false,
      price_periods: [
        {
          label: 'Subscription 12 bulan',
          start_month_offset: 0,
          duration_months: 12,
          monthly_rate: 0,
        },
      ],
      one_time_items: [],
      payment_schedule: [],
      feature_groups: [],
      rights_clause_code: '',
      is_partnership: false,
    },
  };
}

export function createDefaultHubungValues(
  today: string,
  client?: ClientSummary
): SubscriptionSaaSFormValues {
  const base = createDefaultSubscriptionSaaSValues(today, client);
  return {
    ...base,
    subscription_saas: {
      ...base.subscription_saas,
      rights_clause_code: RIGHTS_CLAUSE_VENTURO_SOFTWARE_OWNERSHIP_V1,
      auto_renewal: true,
    },
  };
}

export function buildPaymentRowSkeletons(
  initialTermMonths: number,
  billingCycle: SubscriptionBillingCycle
): SubscriptionPaymentRowInput[] {
  const rows: SubscriptionPaymentRowInput[] = [];
  let offset = 0;
  let cycleIndex = 1;

  while (offset < initialTermMonths) {
    let covered = 1;
    let label = '';

    switch (billingCycle) {
      case 'monthly': {
        covered = 1;
        label = `Bulan ${cycleIndex}`;
        break;
      }
      case 'quarterly': {
        covered = Math.min(3, initialTermMonths - offset);
        const startMonth = offset + 1;
        const endMonth = offset + covered;
        label = startMonth === endMonth ? `Bulan ${startMonth}` : `Bulan ${startMonth}-${endMonth}`;
        break;
      }
      case 'yearly': {
        covered = Math.min(12, initialTermMonths - offset);
        label = `Tahun ${cycleIndex}`;
        break;
      }
      default: {
        covered = 1;
        label = `Periode ${cycleIndex}`;
      }
    }

    rows.push({
      work_period: label,
      start_month_offset: offset,
      covered_months: covered,
      invoice_date_label: '',
      due_date_label: '',
      nominal: 0,
    });

    offset += covered;
    cycleIndex += 1;
  }

  return rows;
}

export function calculatePaymentScheduleTotal(payments: Array<{ nominal: number }>): number {
  let total = 0;
  for (const row of payments) {
    if (!Number.isSafeInteger(row.nominal) || row.nominal < 0) {
      throw new Error(`Invalid payment nominal: ${row.nominal}`);
    }
    total += row.nominal;
    if (!Number.isSafeInteger(total) || total > MAX_SUBSCRIPTION_SAFE_AMOUNT) {
      throw new Error('Payment schedule total exceeds safe limit');
    }
  }
  return total;
}

export function syncFeatureGroupsForLayout(
  layout: SubscriptionSectionLayout,
  currentGroups: SubscriptionFeatureGroupInput[]
): SubscriptionFeatureGroupInput[] {
  if (layout === 'development_maintenance' && currentGroups.length === 0) {
    return [{ name: 'Modul Utama', features: ['Fitur Utama'] }];
  }
  return currentGroups.map((g) => ({
    name: g.name,
    features: [...g.features],
  }));
}

export function normalizeSubscriptionSaaS(input: SubscriptionSaaSInput): SubscriptionSaaSInput {
  return {
    product_name: input.product_name.trim(),
    quotation_date: input.quotation_date.trim(),
    section_layout: input.section_layout,
    billing_cycle: input.billing_cycle,
    tax_treatment: input.tax_treatment,
    initial_term_months: input.initial_term_months,
    auto_renewal: Boolean(input.auto_renewal),
    price_periods: (input.price_periods || []).map((period) => ({
      label: period.label.trim(),
      start_month_offset: period.start_month_offset,
      duration_months: period.duration_months,
      monthly_rate: period.monthly_rate,
    })),
    one_time_items: (input.one_time_items || []).map((item) => ({
      name: item.name.trim(),
      amount: item.amount,
    })),
    payment_schedule: (input.payment_schedule || []).map((row) => ({
      work_period: row.work_period.trim(),
      start_month_offset: row.start_month_offset,
      covered_months: row.covered_months,
      invoice_date_label: row.invoice_date_label.trim(),
      due_date_label: row.due_date_label.trim(),
      nominal: row.nominal,
    })),
    feature_groups: (input.feature_groups || []).map((group) => ({
      name: group.name.trim(),
      features: (group.features || []).map((f) => f.trim()).filter(Boolean),
    })),
    rights_clause_code: input.rights_clause_code || '',
    is_partnership: Boolean(input.is_partnership),
    income_sharing:
      input.is_partnership && input.income_sharing
        ? {
            venturo_share_bps: input.income_sharing.venturo_share_bps,
            partner_share_bps: input.income_sharing.partner_share_bps,
            eligible_revenue_description: input.income_sharing.eligible_revenue_description.trim(),
            settlement_business_days: input.income_sharing.settlement_business_days,
            prohibit_unilateral_discount: Boolean(
              input.income_sharing.prohibit_unilateral_discount
            ),
          }
        : undefined,
  };
}

export function toSubscriptionSaaSPayload(
  values: SubscriptionSaaSFormValues,
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
    commercial_scheme: 'subscription_saas',
    subscription_saas: normalizeSubscriptionSaaS(values.subscription_saas),
  };
}
