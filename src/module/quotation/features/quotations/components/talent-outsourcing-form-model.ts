import type { TalentOutsourcingInput } from '../types';

import { z } from 'zod';

import { MAX_TALENT_MONEY, calculateTalentDraftTotals } from '../constants/talent-outsourcing';

const htmlLike = /<\/?[a-z][^>]*>|<!--|javascript:/iu;
const message = (t: ((key: string) => string) | undefined, key: string) => t?.(`validation.${key}`) || key;
const text = (max: number, t?: (key: string) => string) => z.string().trim().min(1, message(t, 'required')).refine((v) => [...v].length <= max, message(t, 'length')).refine((v) => !htmlLike.test(v), message(t, 'plainText'));
const optionalText = (max: number, t?: (key: string) => string) => z.string().trim().refine((v) => [...v].length <= max, message(t, 'length')).refine((v) => !htmlLike.test(v), message(t, 'plainText'));
const money = (t?: (key: string) => string) => z.number().int(message(t, 'integer')).min(0).max(MAX_TALENT_MONEY).refine(Number.isSafeInteger, message(t, 'safeInteger'));

export function makeTalentOutsourcingSchema(t?: (key: string) => string) {
  const list = optionalText(4_000, t).refine((v) => Boolean(v), message(t, 'required'));
  const scope = z.object({ title: text(200, t), description: optionalText(20_000, t).optional(), responsibilities: z.array(list).max(100).default([]), qualifications: z.array(list).max(100).default([]), deliverables: z.array(list).max(100).default([]), timeline: optionalText(200, t).optional() });
  const payment = z.object({ work_period: text(200, t), terms: text(200, t), invoice_date_label: text(200, t), due_date_label: text(200, t), nominal: money(t).min(1) });
  const common = { document_number: text(50, t), service_name: text(200, t), quotation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message(t, 'date')).refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), message(t, 'date')), tax_treatment: z.enum(['bpjs_dpp_ppn_12', 'exclusive_ppn', 'not_stated']), scope_blocks: z.array(scope).min(1).max(50), payment_schedule: z.array(payment).min(1).max(60), payment_due_days: z.number().int().min(1).max(365), limitation_codes: z.array(z.enum(['out_of_pocket', 'overtime', 'third_party', 'scope_change'])).min(1).max(4), additional_limitations: z.array(list).max(20).default([]), warranty_statements: z.array(list).max(20).default([]), rights_statements: z.array(list).max(20).default([]) };
  const costGroup = z.object({ category: z.enum(['personnel', 'non_personnel']), title: text(200, t), items: z.array(z.object({ name: text(200, t), quantity: z.number().int().min(1).max(10_000), quantity_unit: text(200, t), period_count: z.number().int().min(1).max(10_000), period_unit: z.enum(['month', 'workday']), unit_rate: money(t).min(1) })).min(1).max(100) });
  const manpower = z.object({ engagement_mode: z.literal('manpower_supply'), ...common, cost_groups: z.array(costGroup).min(1).max(2), preparation_items: z.array(z.never()).max(0).default([]), preparation_discount_amount: z.literal(0), show_preparation_discount_row: z.literal(false), squad_items: z.array(z.never()).max(0).default([]) });
  const managed = z.object({ engagement_mode: z.literal('managed_squad'), ...common, cost_groups: z.array(z.never()).max(0).default([]), preparation_items: z.array(z.object({ name: text(200, t), headcount: z.number().int().min(1).max(10_000), quoted_line_total: money(t).min(1) })).max(20).default([]), preparation_discount_amount: money(t), show_preparation_discount_row: z.boolean(), squad_items: z.array(z.object({ role: text(200, t), monthly_rate: money(t).min(1), headcount: z.number().int().min(1).max(10_000), period_months: z.number().int().min(1).max(240) })).min(1).max(100) });
  return z.discriminatedUnion('engagement_mode', [manpower, managed]).superRefine((value, ctx) => {
    const seen = new Set<string>(); value.limitation_codes.forEach((code, index) => { if (seen.has(code)) ctx.addIssue({ code: 'custom', path: ['limitation_codes', index], message: message(t, 'duplicate') }); seen.add(code); });
    if (!value.scope_blocks.some((b) => b.description || b.responsibilities.length || b.qualifications.length || b.deliverables.length || b.timeline)) ctx.addIssue({ code: 'custom', path: ['scope_blocks'], message: message(t, 'scopeContent') });
    if (!value.scope_blocks.some((b) => b.timeline)) ctx.addIssue({ code: 'custom', path: ['scope_blocks'], message: message(t, 'timeline') });
    if (value.engagement_mode === 'manpower_supply') { const categories = value.cost_groups.map((g) => g.category); if (!categories.includes('personnel') || new Set(categories).size !== categories.length) ctx.addIssue({ code: 'custom', path: ['cost_groups'], message: message(t, 'costGroups') }); }
    if (value.engagement_mode === 'managed_squad' && value.preparation_discount_amount > 0 && !value.show_preparation_discount_row) ctx.addIssue({ code: 'custom', path: ['show_preparation_discount_row'], message: message(t, 'discountVisible') });
    const totals = calculateTalentDraftTotals(value as TalentOutsourcingInput); if (!totals.is_balanced) ctx.addIssue({ code: 'custom', path: ['payment_schedule'], message: message(t, 'paymentMismatch') });
  });
}
export const talentOutsourcingSchema = makeTalentOutsourcingSchema();
export function makeTalentOutsourcingFormSchema(t?: (key: string) => string) { return z.object({ client_id: z.string().optional(), client_name: text(200, t), client_company_name: optionalText(200, t).optional(), subject: text(200, t), solution_type: z.literal('talent_outsourcing'), commercial_scheme: z.literal('talent_outsourcing'), talent_outsourcing: makeTalentOutsourcingSchema(t) }); }
export const talentOutsourcingFormSchema = makeTalentOutsourcingFormSchema();
export type TalentOutsourcingFormValues = z.infer<typeof talentOutsourcingFormSchema>;
