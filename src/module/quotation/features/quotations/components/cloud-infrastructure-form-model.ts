import { z } from 'zod';

import { MAX_CLOUD_MONEY, projectCloudCalculation } from '../constants/cloud-infrastructure';

const plain = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), 'HTML-like text is not allowed');
const cloudMoney = z.number().int().positive().max(MAX_CLOUD_MONEY).refine(Number.isSafeInteger, 'Nominal must be a safe integer');
const cloudSpec = z.number().int().min(1).max(1_000);
const isValidIsoDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= (month === 2 && isLeapYear ? 29 : daysInMonth);
};

const inputSchema = z.object({
  document_number: plain(50), service_name: plain(200), quotation_date: z.string().refine(isValidIsoDate, 'Invalid date'), tax_treatment: z.enum(['exclusive_ppn', 'inclusive_ppn', 'not_stated']),
  package_items: z.array(z.object({ category: z.enum(['shared_hosting', 'vps_cloud']), name: plain(200), vcpu: cloudSpec, ram_gb: cloudSpec, storage_gb: cloudSpec, unit_rate: cloudMoney })).min(1).max(100),
  setup_items: z.array(z.object({ name: plain(200), amount: cloudMoney })).max(30).default([]),
  scope_rows: z.array(z.object({ sections: z.array(z.object({ title: plain(200), activities: z.array(plain(4_000)).min(1).max(30) })).min(1).max(10), timeline: plain(200) })).max(30).default([]),
  payment_schedule: z.array(z.object({ work_period: plain(200), terms: plain(200), invoice_date_label: plain(200), due_date_label: plain(200), component: z.enum(['setup', 'monthly_service']), nominal: cloudMoney })).min(1).max(120),
  payment_due_days: z.number().int().min(1).max(365), limitation_codes: z.array(z.enum(['out_of_pocket', 'overtime', 'third_party', 'scope_change'])).min(1).max(4), additional_limitations: z.array(plain(4_000)).max(30).default([]),
}).superRefine((value, ctx) => {
  const seen = new Set<string>(); value.limitation_codes.forEach((code, index) => { if (seen.has(code)) ctx.addIssue({ code: 'custom', path: ['limitation_codes', index], message: 'Limitation codes must be unique' }); seen.add(code); });
  let calculation;
  try { calculation = projectCloudCalculation(value); }
  catch { ctx.addIssue({ code: 'custom', path: ['package_items'], message: 'Amounts exceed the supported integer range' }); return; }
  let hasMonthly = false;
  value.payment_schedule.forEach((row, index) => {
    if (row.component === 'monthly_service') { hasMonthly = true; if (row.nominal !== calculation.monthly_subtotal) ctx.addIssue({ code: 'custom', path: ['payment_schedule', index, 'nominal'], message: 'Monthly service payment must equal monthly subtotal' }); }
  });
  if (!hasMonthly) ctx.addIssue({ code: 'custom', path: ['payment_schedule'], message: 'At least one monthly service payment is required' });
  if (calculation.setup_payment_total !== calculation.setup_subtotal) ctx.addIssue({ code: 'custom', path: ['payment_schedule'], message: 'Setup payments must equal setup subtotal' });
});

export const cloudInfrastructureFormSchema = z.object({ client_id: z.string().optional(), client_name: plain(200), client_company_name: z.string().trim().max(200).refine((value) => !/[<>]/.test(value), 'HTML-like text is not allowed').optional(), subject: plain(200), solution_type: z.literal('cloud_infrastructure'), commercial_scheme: z.literal('cloud_infrastructure'), cloud_infrastructure: inputSchema });
export type CloudInfrastructureFormValues = z.infer<typeof cloudInfrastructureFormSchema>;
