import { z } from 'zod';

import {
  MAX_STANDALONE_MAINTENANCE_MONEY,
  MAX_STANDALONE_MAINTENANCE_HEADCOUNT,
  MAX_STANDALONE_MAINTENANCE_DEFECT_ITEMS,
  MAX_STANDALONE_MAINTENANCE_HOURLY_TASKS,
  MAX_STANDALONE_MAINTENANCE_PAYMENT_ROWS,
  MAX_STANDALONE_MAINTENANCE_DEFECT_GROUPS,
  MAX_STANDALONE_MAINTENANCE_PERIOD_MONTHS,
  MAX_STANDALONE_MAINTENANCE_RETAINER_ITEMS,
  MAX_STANDALONE_MAINTENANCE_LONG_TEXT_RUNES,
  MAX_STANDALONE_MAINTENANCE_HOURS_HALF_UNITS,
  MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES,
  MAX_STANDALONE_MAINTENANCE_HOURLY_COST_ITEMS,
  MAX_STANDALONE_MAINTENANCE_RIGHTS_STATEMENTS,
} from '../constants/standalone-maintenance';

export const retainerItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama peran retainer wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES),
  monthly_rate: z
    .number()
    .int()
    .min(1, 'Tarif bulanan harus lebih dari 0')
    .max(MAX_STANDALONE_MAINTENANCE_MONEY),
  fte_quarters: z
    .number()
    .int()
    .min(1, 'FTE minimal 1 (0,25 FTE)')
    .max(4, 'FTE maksimal 4 (1 FTE)'),
  period_months: z
    .number()
    .int()
    .min(1, 'Durasi bulan minimal 1')
    .max(MAX_STANDALONE_MAINTENANCE_PERIOD_MONTHS),
});

export const hourlyCostItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama peran cost wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES),
  display_monthly_rate: z
    .number()
    .int()
    .min(1, 'Tarif bulanan harus lebih dari 0')
    .max(MAX_STANDALONE_MAINTENANCE_MONEY),
  headcount: z
    .number()
    .int()
    .min(1, 'Jumlah personel minimal 1')
    .max(MAX_STANDALONE_MAINTENANCE_HEADCOUNT),
  hours_half_units: z
    .number()
    .int()
    .min(1, 'Jam kerja minimal 1 (0,5 jam)')
    .max(MAX_STANDALONE_MAINTENANCE_HOURS_HALF_UNITS),
  quoted_line_total: z
    .number()
    .int()
    .min(1, 'Total biaya baris harus lebih dari 0')
    .max(MAX_STANDALONE_MAINTENANCE_MONEY),
});

export const defectItemSchema = z.object({
  item_number: z
    .string()
    .trim()
    .min(1, 'Nomor item wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES),
  priority: z.enum(['P0', 'P1', 'P2']),
  function: z
    .string()
    .trim()
    .min(1, 'Fungsi sistem wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_LONG_TEXT_RUNES),
  screen_flow: z
    .string()
    .trim()
    .min(1, 'Alur layar wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_LONG_TEXT_RUNES),
  existing: z
    .string()
    .trim()
    .min(1, 'Kondisi eksisting wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_LONG_TEXT_RUNES),
  improvement: z
    .string()
    .trim()
    .min(1, 'Penyempurnaan yang diharapkan wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_LONG_TEXT_RUNES),
  reference: z
    .string()
    .trim()
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES)
    .optional()
    .or(z.literal('')),
});

export const defectGroupSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul kelompok defect wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES),
  items: z
    .array(defectItemSchema)
    .min(1, 'Minimal satu item defect dalam kelompok')
    .max(MAX_STANDALONE_MAINTENANCE_DEFECT_ITEMS),
});

export const hourlyTaskSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Deskripsi task wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_LONG_TEXT_RUNES),
  platform: z
    .string()
    .trim()
    .min(1, 'Platform wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES),
  hours_half_units: z
    .number()
    .int()
    .min(1, 'Jam kerja minimal 1 (0,5 jam)')
    .max(MAX_STANDALONE_MAINTENANCE_HOURS_HALF_UNITS),
});

export const paymentRowSchema = z.object({
  work_period: z
    .string()
    .trim()
    .min(1, 'Periode kerja/tahap wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES),
  terms: z
    .string()
    .trim()
    .min(1, 'Termin pembayaran wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES),
  invoice_date_label: z
    .string()
    .trim()
    .min(1, 'Label tanggal invoice wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES),
  due_date_label: z
    .string()
    .trim()
    .min(1, 'Label jatuh tempo wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES),
  nominal: z
    .number()
    .int()
    .min(1, 'Nominal pembayaran harus lebih dari 0')
    .max(MAX_STANDALONE_MAINTENANCE_MONEY),
});

const retainerBaseSchema = z.object({
  mode: z.literal('retainer'),
  system_name: z
    .string()
    .trim()
    .min(1, 'Nama sistem wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES),
  quotation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  tax_treatment: z.enum(['not_stated', 'exclusive_ppn', 'inclusive_ppn']),
  retainer_items: z
    .array(retainerItemSchema)
    .min(1, 'Minimal satu item retainer')
    .max(MAX_STANDALONE_MAINTENANCE_RETAINER_ITEMS),
  defect_groups: z
    .array(defectGroupSchema)
    .min(1, 'Minimal satu kelompok defect')
    .max(MAX_STANDALONE_MAINTENANCE_DEFECT_GROUPS),
  hourly_cost_items: z
    .array(z.any())
    .max(0, 'Hourly cost items must be empty for retainer mode')
    .optional()
    .default([]),
  hourly_tasks: z
    .array(z.any())
    .max(0, 'Hourly tasks must be empty for retainer mode')
    .optional()
    .default([]),
  discount_amount: z.number().int().min(0).max(MAX_STANDALONE_MAINTENANCE_MONEY),
  show_discount_row: z.boolean(),
  payment_schedule: z
    .array(paymentRowSchema)
    .min(1, 'Minimal satu jadwal pembayaran')
    .max(MAX_STANDALONE_MAINTENANCE_PAYMENT_ROWS),
  rights_statements: z
    .array(z.string().trim().min(1).max(MAX_STANDALONE_MAINTENANCE_LONG_TEXT_RUNES))
    .max(MAX_STANDALONE_MAINTENANCE_RIGHTS_STATEMENTS)
    .optional()
    .default([]),
});

const hourlyTaskBaseSchema = z.object({
  mode: z.literal('hourly_task'),
  system_name: z
    .string()
    .trim()
    .min(1, 'Nama sistem wajib diisi')
    .max(MAX_STANDALONE_MAINTENANCE_SHORT_TEXT_RUNES),
  quotation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  tax_treatment: z.enum(['not_stated', 'exclusive_ppn', 'inclusive_ppn']),
  retainer_items: z
    .array(z.any())
    .max(0, 'Retainer items must be empty for hourly_task mode')
    .optional()
    .default([]),
  defect_groups: z
    .array(z.any())
    .max(0, 'Defect groups must be empty for hourly_task mode')
    .optional()
    .default([]),
  hourly_cost_items: z
    .array(hourlyCostItemSchema)
    .min(1, 'Minimal satu item biaya')
    .max(MAX_STANDALONE_MAINTENANCE_HOURLY_COST_ITEMS),
  hourly_tasks: z
    .array(hourlyTaskSchema)
    .min(1, 'Minimal satu task')
    .max(MAX_STANDALONE_MAINTENANCE_HOURLY_TASKS),
  discount_amount: z.number().int().min(0).max(MAX_STANDALONE_MAINTENANCE_MONEY),
  show_discount_row: z.boolean(),
  payment_schedule: z
    .array(paymentRowSchema)
    .min(1, 'Minimal satu jadwal pembayaran')
    .max(MAX_STANDALONE_MAINTENANCE_PAYMENT_ROWS),
  rights_statements: z
    .array(z.string().trim().min(1).max(MAX_STANDALONE_MAINTENANCE_LONG_TEXT_RUNES))
    .max(MAX_STANDALONE_MAINTENANCE_RIGHTS_STATEMENTS)
    .optional()
    .default([]),
});

export const standaloneMaintenanceBaseSchema = z.discriminatedUnion('mode', [
  retainerBaseSchema,
  hourlyTaskBaseSchema,
]);

export function validateStandaloneMaintenanceCrossFields(
  data: z.infer<typeof standaloneMaintenanceBaseSchema>,
  ctx: z.RefinementCtx
) {
  let subtotal = 0;

  if (data.mode === 'retainer') {
    // 1. Defect groups item_number uniqueness across all groups
    const seenItemNumbers = new Set<string>();
    for (let gIdx = 0; gIdx < (data.defect_groups || []).length; gIdx += 1) {
      const group = data.defect_groups[gIdx];
      for (let iIdx = 0; iIdx < (group.items || []).length; iIdx += 1) {
        const item = group.items[iIdx];
        const trimmedNumber = item.item_number.trim();
        if (seenItemNumbers.has(trimmedNumber)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate item number "${trimmedNumber}"`,
            path: ['defect_groups', gIdx, 'items', iIdx, 'item_number'],
          });
        }
        seenItemNumbers.add(trimmedNumber);
      }
    }

    // 2. Retainer items line total, safe integer and whole-rupiah division check
    for (let i = 0; i < (data.retainer_items || []).length; i += 1) {
      const item = data.retainer_items[i];
      const numerator = item.monthly_rate * item.fte_quarters * item.period_months;
      if (!Number.isSafeInteger(numerator) || numerator > MAX_STANDALONE_MAINTENANCE_MONEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Retainer line calculation exceeds maximum safe amount',
          path: ['retainer_items', i],
        });
      }
      if (numerator % 4 !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Line calculation must be a whole rupiah amount (divisible by 4)',
          path: ['retainer_items', i],
        });
      } else {
        const lineTotal = numerator / 4;
        if (lineTotal > MAX_STANDALONE_MAINTENANCE_MONEY - subtotal) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Subtotal exceeds maximum safe amount',
            path: ['retainer_items', i],
          });
        }
        subtotal += lineTotal;
      }
    }
  } else if (data.mode === 'hourly_task') {
    // Hourly cost items line total sum check
    for (let i = 0; i < (data.hourly_cost_items || []).length; i += 1) {
      const item = data.hourly_cost_items[i];
      if (item.quoted_line_total > MAX_STANDALONE_MAINTENANCE_MONEY - subtotal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Subtotal exceeds maximum safe amount',
          path: ['hourly_cost_items', i],
        });
      }
      subtotal += item.quoted_line_total;
    }
  }

  // 3. Discount validations
  if (data.discount_amount > subtotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Diskon tidak boleh melebihi subtotal',
      path: ['discount_amount'],
    });
  }

  if (data.discount_amount > 0 && !data.show_discount_row) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Diskon tidak boleh positif jika baris diskon disembunyikan',
      path: ['discount_amount'],
    });
  }

  const totalInvestment = Math.max(0, subtotal - data.discount_amount);
  if (totalInvestment > MAX_STANDALONE_MAINTENANCE_MONEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Total investment exceeds maximum safe amount',
      path: ['discount_amount'],
    });
  }

  // 4. Payment schedule reconciliation
  let paymentSum = 0;
  for (let i = 0; i < (data.payment_schedule || []).length; i += 1) {
    const row = data.payment_schedule[i];
    if (row.nominal > MAX_STANDALONE_MAINTENANCE_MONEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payment nominal exceeds maximum safe amount',
        path: ['payment_schedule', i, 'nominal'],
      });
    }
    if (row.nominal > MAX_STANDALONE_MAINTENANCE_MONEY - paymentSum) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total payment schedule exceeds maximum safe amount',
        path: ['payment_schedule', i, 'nominal'],
      });
    }
    paymentSum += row.nominal;
  }

  if (paymentSum !== totalInvestment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total payment schedule (${paymentSum}) must equal total investment (${totalInvestment})`,
      path: ['payment_schedule'],
    });
  }
}

export const standaloneMaintenanceSchema = standaloneMaintenanceBaseSchema.superRefine(
  validateStandaloneMaintenanceCrossFields
);

export const standaloneMaintenanceFormSchema = z.object({
  client_id: z.string().optional(),
  client_name: z.string().trim().min(1, 'Nama penanggung jawab wajib diisi').max(200),
  client_company_name: z.string().trim().max(200).optional(),
  subject: z.string().trim().min(1, 'Perihal quotation wajib diisi').max(200),
  solution_type: z.string().trim().min(1, 'Tipe solusi wajib diisi').max(100),
  commercial_scheme: z.literal('standalone_maintenance'),
  standalone_maintenance: standaloneMaintenanceSchema,
});

export type StandaloneMaintenanceFormValues = z.infer<typeof standaloneMaintenanceFormSchema>;
export type StandaloneMaintenanceValidationValues = z.infer<typeof standaloneMaintenanceSchema>;
