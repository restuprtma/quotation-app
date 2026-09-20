import type { TalentOutsourcingFormValues } from '../components/talent-outsourcing-form-model';
import type {
  ActiveSkill,
  ClientSummary,
  TalentCostItemInput,
  TalentOutsourcingInput,
  TalentOutsourcingGeneratePayload,
} from '../types';

import { resolveQuotationSkillId } from '../utils/generation';

export const MAX_TALENT_MONEY = 9_000_000_000_000_000;
export const TALENT_LIMITATION_OPTIONS = [
  'out_of_pocket',
  'overtime',
  'third_party',
  'scope_change',
] as const;
export const DEFAULT_TALENT_OUTSOURCING: TalentOutsourcingInput = {
  engagement_mode: 'manpower_supply',
  document_number: '',
  service_name: '',
  quotation_date: '',
  tax_treatment: 'exclusive_ppn',
  cost_groups: [
    {
      category: 'personnel',
      title: 'Biaya Langsung Personil',
      items: [
        {
          name: '',
          quantity: 1,
          quantity_unit: 'Orang',
          period_count: 1,
          period_unit: 'month',
          unit_rate: 0,
        },
      ],
    },
  ],
  preparation_items: [],
  preparation_discount_amount: 0,
  show_preparation_discount_row: false,
  squad_items: [],
  scope_blocks: [
    {
      title: '',
      description: '',
      responsibilities: [],
      qualifications: [],
      deliverables: [],
      timeline: '',
    },
  ],
  payment_schedule: [
    { work_period: '', terms: '', invoice_date_label: '', due_date_label: '', nominal: 0 },
  ],
  payment_due_days: 14,
  limitation_codes: [...TALENT_LIMITATION_OPTIONS],
  additional_limitations: [],
  warranty_statements: [],
  rights_statements: [],
};

const validMoney = (value: number) =>
  Number.isSafeInteger(value) && value >= 0 && value <= MAX_TALENT_MONEY;
const add = (a: number, b: number): number | null =>
  validMoney(a) && validMoney(b) && Number.isSafeInteger(a + b) && a + b <= MAX_TALENT_MONEY
    ? a + b
    : null;
export function talentCostLineTotal(item: TalentCostItemInput): number | null {
  if (![item.unit_rate, item.quantity, item.period_count].every(validMoney)) return null;
  const product = item.unit_rate * item.quantity * item.period_count;
  if (!Number.isSafeInteger(product)) return null;
  if (item.period_unit === 'workday') return product % 20 === 0 ? product / 20 : null;
  return product <= MAX_TALENT_MONEY ? product : null;
}
export function calculateTalentDraftTotals(input: TalentOutsourcingInput) {
  let personnel = 0;
  let nonPersonnel = 0;
  let preparation = 0;
  let squad = 0;
  let invalid = false;
  for (const group of input.cost_groups || [])
    for (const item of group.items || []) {
      const total = talentCostLineTotal(item);
      if (total === null) invalid = true;
      else if (group.category === 'personnel')
        personnel = add(personnel, total) ?? ((invalid = true), 0);
      else nonPersonnel = add(nonPersonnel, total) ?? ((invalid = true), 0);
    }
  for (const item of input.preparation_items || []) {
    if (!validMoney(item.quoted_line_total)) invalid = true;
    else preparation = add(preparation, item.quoted_line_total) ?? ((invalid = true), 0);
  }
  for (const item of input.squad_items || []) {
    const total = item.monthly_rate * item.headcount * item.period_months;
    if (!Number.isSafeInteger(total) || !validMoney(total)) invalid = true;
    else squad = add(squad, total) ?? ((invalid = true), 0);
  }
  const discount = input.preparation_discount_amount;
  const managedBase = add(preparation, squad);
  const totalBeforeTax =
    input.engagement_mode === 'manpower_supply'
      ? add(personnel, nonPersonnel)
      : managedBase === null || discount > managedBase
        ? null
        : managedBase - discount;
  const dpp =
    input.tax_treatment === 'bpjs_dpp_ppn_12' && totalBeforeTax !== null
      ? Math.floor((totalBeforeTax * 11) / 12)
      : 0;
  const tax = input.tax_treatment === 'bpjs_dpp_ppn_12' ? Math.floor((dpp * 12 + 50) / 100) : 0;
  const grand = totalBeforeTax === null ? null : add(totalBeforeTax, tax);
  let payment = 0;
  for (const row of input.payment_schedule || []) {
    if (!validMoney(row.nominal)) invalid = true;
    else payment = add(payment, row.nominal) ?? ((invalid = true), 0);
  }
  return {
    personnel_subtotal: personnel,
    non_personnel_subtotal: nonPersonnel,
    preparation_subtotal: preparation,
    preparation_discount_amount: discount,
    squad_subtotal: squad,
    total_before_tax: totalBeforeTax,
    dpp_amount: dpp,
    tax_amount: tax,
    grand_total: grand,
    payment_total: payment,
    is_balanced:
      !invalid && grand !== null && payment === grand && discount >= 0 && discount <= preparation,
  };
}
const trimList = (items?: string[]) => (items || []).map((item) => item.trim()).filter(Boolean);
export function normalizeTalentOutsourcing(input: TalentOutsourcingInput): TalentOutsourcingInput {
  const common = {
    document_number: input.document_number.trim(),
    service_name: input.service_name.trim(),
    quotation_date: input.quotation_date.trim(),
    tax_treatment: input.tax_treatment,
    preparation_discount_amount: input.preparation_discount_amount,
    show_preparation_discount_row: input.show_preparation_discount_row,
    payment_due_days: input.payment_due_days,
    limitation_codes: [...input.limitation_codes],
    additional_limitations: trimList(input.additional_limitations),
    warranty_statements: trimList(input.warranty_statements),
    rights_statements: trimList(input.rights_statements),
    scope_blocks: input.scope_blocks.map((b) => ({
      title: b.title.trim(),
      description: b.description?.trim(),
      responsibilities: trimList(b.responsibilities),
      qualifications: trimList(b.qualifications),
      deliverables: trimList(b.deliverables),
      timeline: b.timeline?.trim(),
    })),
    payment_schedule: input.payment_schedule.map((p) => ({
      ...p,
      work_period: p.work_period.trim(),
      terms: p.terms.trim(),
      invoice_date_label: p.invoice_date_label.trim(),
      due_date_label: p.due_date_label.trim(),
    })),
  };
  if (input.engagement_mode === 'managed_squad')
    return {
      ...common,
      engagement_mode: input.engagement_mode,
      cost_groups: [],
      preparation_items: input.preparation_items?.map((x) => ({ ...x, name: x.name.trim() })) || [],
      squad_items: input.squad_items?.map((x) => ({ ...x, role: x.role.trim() })) || [],
    };
  return {
    ...common,
    engagement_mode: input.engagement_mode,
    cost_groups:
      input.cost_groups?.map((g) => ({
        ...g,
        title: g.title.trim(),
        items: g.items.map((i) => ({
          ...i,
          name: i.name.trim(),
          quantity_unit: i.quantity_unit.trim(),
        })),
      })) || [],
    preparation_items: [],
    preparation_discount_amount: 0,
    show_preparation_discount_row: false,
    squad_items: [],
  };
}
export function createDefaultTalentOutsourcingValues(
  today: string,
  client?: ClientSummary
): TalentOutsourcingFormValues {
  return {
    client_id: client?.id || '',
    client_name: '',
    client_company_name: client?.name || '',
    subject: '',
    solution_type: 'talent_outsourcing',
    commercial_scheme: 'talent_outsourcing',
    talent_outsourcing: {
      ...DEFAULT_TALENT_OUTSOURCING,
      quotation_date: today,
      cost_groups: DEFAULT_TALENT_OUTSOURCING.cost_groups!.map((g) => ({
        ...g,
        items: g.items.map((i) => ({ ...i })),
      })),
      scope_blocks: DEFAULT_TALENT_OUTSOURCING.scope_blocks.map((x) => ({ ...x })),
      payment_schedule: DEFAULT_TALENT_OUTSOURCING.payment_schedule.map((x) => ({ ...x })),
    },
  } as unknown as TalentOutsourcingFormValues;
}
export function toTalentOutsourcingPayload(
  values: TalentOutsourcingFormValues,
  selectedSkill: ActiveSkill | null | undefined,
  activeSkills: ActiveSkill[]
): TalentOutsourcingGeneratePayload {
  return {
    skill_id: resolveQuotationSkillId(selectedSkill, activeSkills),
    client_id: values.client_id || undefined,
    client_name: values.client_name.trim(),
    client_company_name: values.client_company_name?.trim() || undefined,
    subject: values.subject.trim(),
    solution_type: values.solution_type,
    commercial_scheme: 'talent_outsourcing',
    talent_outsourcing: normalizeTalentOutsourcing(values.talent_outsourcing),
  };
}
