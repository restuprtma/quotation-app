import { z } from 'zod';

import {
  MAX_CUSTOM_DEVELOPMENT_MONEY,
  MAX_CUSTOM_DEVELOPMENT_GROUPS,
  MAX_CUSTOM_DEVELOPMENT_HEADCOUNT,
  MAX_CUSTOM_DEVELOPMENT_PERIOD_RUNES,
  MAX_CUSTOM_DEVELOPMENT_PAYMENT_ROWS,
  MAX_CUSTOM_DEVELOPMENT_MONTHLY_ITEMS,
  MAX_CUSTOM_DEVELOPMENT_MONTHLY_NOTES,
  MAX_CUSTOM_DEVELOPMENT_MODULE_GROUPS,
  MAX_CUSTOM_DEVELOPMENT_TIMELINE_ROWS,
  MAX_CUSTOM_DEVELOPMENT_LONG_TEXT_RUNES,
  MAX_CUSTOM_DEVELOPMENT_ITEMS_PER_GROUP,
  MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES,
  MAX_CUSTOM_DEVELOPMENT_MONTHLY_QUANTITY,
  MAX_CUSTOM_DEVELOPMENT_LIMITATION_CODES,
  MAX_CUSTOM_DEVELOPMENT_RIGHTS_STATEMENTS,
  MAX_CUSTOM_DEVELOPMENT_ADDITIONAL_LIMITATIONS,
} from '../constants/custom-development';

export const customDevelopmentCostItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama item wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES, 'Nama item maksimal 200 karakter'),
  display_rate: z
    .number()
    .int()
    .min(1, 'Display rate harus lebih dari 0')
    .max(MAX_CUSTOM_DEVELOPMENT_MONEY, 'Display rate melebihi batas aman')
    .nullable()
    .optional(),
  headcount: z
    .number()
    .int()
    .min(1, 'Headcount minimal 1')
    .max(MAX_CUSTOM_DEVELOPMENT_HEADCOUNT, 'Headcount maksimal 100'),
  period_label: z
    .string()
    .trim()
    .min(1, 'Label periode wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_PERIOD_RUNES, 'Label periode maksimal 50 karakter'),
  quoted_line_total: z
    .number()
    .int()
    .min(1, 'Total harga baris harus lebih dari 0')
    .max(MAX_CUSTOM_DEVELOPMENT_MONEY, 'Total harga baris melebihi batas aman')
    .nullable()
    .optional(),
});

export const customDevelopmentCostGroupSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul kelompok biaya wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES, 'Judul kelompok biaya maksimal 200 karakter'),
  items: z
    .array(customDevelopmentCostItemSchema)
    .min(1, 'Minimal satu item biaya dalam kelompok')
    .max(MAX_CUSTOM_DEVELOPMENT_ITEMS_PER_GROUP, 'Maksimal 100 item per kelompok'),
});

export const customDevelopmentMonthlyItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama item bulanan wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES, 'Nama item bulanan maksimal 200 karakter'),
  specification: z
    .string()
    .trim()
    .max(MAX_CUSTOM_DEVELOPMENT_LONG_TEXT_RUNES, 'Spesifikasi maksimal 4000 karakter')
    .default(''),
  unit_rate: z
    .number()
    .int()
    .min(1, 'Harga satuan bulanan harus lebih dari 0')
    .max(MAX_CUSTOM_DEVELOPMENT_MONEY, 'Harga satuan melebihi batas aman'),
  quantity: z
    .number()
    .int()
    .min(1, 'Jumlah minimal 1')
    .max(MAX_CUSTOM_DEVELOPMENT_MONTHLY_QUANTITY, 'Jumlah maksimal 10.000'),
});

export const customDevelopmentModuleGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama kelompok modul wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES, 'Nama kelompok modul maksimal 200 karakter'),
  features: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Nama fitur tidak boleh kosong')
        .max(MAX_CUSTOM_DEVELOPMENT_LONG_TEXT_RUNES, 'Nama fitur maksimal 4000 karakter')
    )
    .min(1, 'Minimal satu fitur dalam kelompok modul')
    .max(MAX_CUSTOM_DEVELOPMENT_ITEMS_PER_GROUP, 'Maksimal 100 fitur per kelompok modul'),
});

export const customDevelopmentTimelineRowSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Deskripsi timeline wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_LONG_TEXT_RUNES, 'Deskripsi timeline maksimal 4000 karakter'),
  timeline: z
    .string()
    .trim()
    .min(1, 'Target timeline wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES, 'Target timeline maksimal 200 karakter'),
});

export const customDevelopmentPaymentRowSchema = z.object({
  work_period: z
    .string()
    .trim()
    .min(1, 'Periode kerja/tahap wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES, 'Periode kerja maksimal 200 karakter'),
  terms: z
    .string()
    .trim()
    .min(1, 'Termin pembayaran wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES, 'Termin pembayaran maksimal 200 karakter'),
  invoice_date_label: z
    .string()
    .trim()
    .min(1, 'Label tanggal invoice wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES, 'Label invoice maksimal 200 karakter'),
  due_date_label: z
    .string()
    .trim()
    .min(1, 'Label jatuh tempo wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES, 'Label jatuh tempo maksimal 200 karakter'),
  component: z.enum(['development', 'monthly_recurring']),
  nominal: z
    .number()
    .int()
    .min(1, 'Nominal pembayaran harus lebih dari 0')
    .max(MAX_CUSTOM_DEVELOPMENT_MONEY, 'Nominal pembayaran melebihi batas aman'),
});

export const customDevelopmentBaseSchema = z.object({
  system_name: z
    .string()
    .trim()
    .min(1, 'Nama sistem wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES, 'Nama sistem maksimal 200 karakter'),
  quotation_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  development_table_mode: z.enum(['monthly_period', 'daily_period', 'fixed_days']),
  tax_treatment: z.enum(['not_stated', 'exclusive_ppn', 'inclusive_ppn']),
  development_groups: z
    .array(customDevelopmentCostGroupSchema)
    .min(1, 'Minimal satu kelompok biaya')
    .max(MAX_CUSTOM_DEVELOPMENT_GROUPS, 'Maksimal 30 kelompok biaya'),
  discount_label: z
    .string()
    .trim()
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES, 'Label diskon maksimal 200 karakter')
    .optional(),
  discount_amount: z
    .number()
    .int()
    .min(0, 'Diskon tidak boleh negatif')
    .max(MAX_CUSTOM_DEVELOPMENT_MONEY, 'Diskon melebihi batas aman')
    .default(0),
  show_discount_row: z.boolean().default(false),
  monthly_items: z
    .array(customDevelopmentMonthlyItemSchema)
    .max(MAX_CUSTOM_DEVELOPMENT_MONTHLY_ITEMS, 'Maksimal 50 item bulanan')
    .default([]),
  monthly_notes: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Catatan bulanan tidak boleh kosong')
        .max(MAX_CUSTOM_DEVELOPMENT_LONG_TEXT_RUNES, 'Catatan bulanan maksimal 4000 karakter')
    )
    .max(MAX_CUSTOM_DEVELOPMENT_MONTHLY_NOTES, 'Maksimal 20 catatan bulanan')
    .default([]),
  module_groups: z
    .array(customDevelopmentModuleGroupSchema)
    .min(1, 'Minimal satu kelompok modul')
    .max(MAX_CUSTOM_DEVELOPMENT_MODULE_GROUPS, 'Maksimal 30 kelompok modul'),
  timeline_rows: z
    .array(customDevelopmentTimelineRowSchema)
    .min(1, 'Minimal satu baris timeline')
    .max(MAX_CUSTOM_DEVELOPMENT_TIMELINE_ROWS, 'Maksimal 100 baris timeline'),
  payment_schedule: z
    .array(customDevelopmentPaymentRowSchema)
    .min(1, 'Minimal satu jadwal pembayaran')
    .max(MAX_CUSTOM_DEVELOPMENT_PAYMENT_ROWS, 'Maksimal 60 jadwal pembayaran'),
  rights_statements: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Pernyataan hak cipta tidak boleh kosong')
        .max(MAX_CUSTOM_DEVELOPMENT_LONG_TEXT_RUNES, 'Pernyataan hak cipta maksimal 4000 karakter')
    )
    .max(MAX_CUSTOM_DEVELOPMENT_RIGHTS_STATEMENTS, 'Maksimal 20 pernyataan hak cipta')
    .default([]),
  limitation_codes: z
    .array(z.enum(['out_of_pocket', 'overtime', 'third_party', 'scope_change']))
    .min(1, 'Minimal satu batasan dipilih')
    .max(MAX_CUSTOM_DEVELOPMENT_LIMITATION_CODES, 'Maksimal 4 batasan dipilih'),
  additional_limitations: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Batasan tambahan tidak boleh kosong')
        .max(MAX_CUSTOM_DEVELOPMENT_LONG_TEXT_RUNES, 'Batasan tambahan maksimal 4000 karakter')
    )
    .max(MAX_CUSTOM_DEVELOPMENT_ADDITIONAL_LIMITATIONS, 'Maksimal 20 batasan tambahan')
    .default([]),
});

export function validateCustomDevelopmentCrossFields(
  data: z.infer<typeof customDevelopmentBaseSchema>,
  ctx: z.RefinementCtx
) {
  // 1. Check priced lines globally
  let pricedCount = 0;
  let subtotal = 0;

  for (let gIdx = 0; gIdx < (data.development_groups || []).length; gIdx += 1) {
    const group = data.development_groups[gIdx];
    for (let iIdx = 0; iIdx < (group.items || []).length; iIdx += 1) {
      const item = group.items[iIdx];

      if (item.quoted_line_total !== null && item.quoted_line_total !== undefined) {
        if (item.quoted_line_total > 0) {
          pricedCount += 1;
        }
        subtotal += item.quoted_line_total;
      }
    }
  }

  if (pricedCount === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Minimal harus ada satu baris dengan total harga (priced line)',
      path: ['development_groups'],
    });
  }

  if (subtotal > MAX_CUSTOM_DEVELOPMENT_MONEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Subtotal biaya pengembangan melebihi batas aman',
      path: ['development_groups'],
    });
  }

  // 2. Discount checks
  if (data.discount_amount > subtotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Nominal diskon tidak boleh melebihi subtotal biaya pengembangan',
      path: ['discount_amount'],
    });
  }

  if (data.discount_amount > 0 && !data.show_discount_row) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tampilkan baris diskon harus dicentang jika diskon lebih dari 0',
      path: ['show_discount_row'],
    });
  }

  // 3. Monthly items and notes checks
  let monthlyTotal = 0;
  for (let mIdx = 0; mIdx < (data.monthly_items || []).length; mIdx += 1) {
    const mItem = data.monthly_items[mIdx];
    const line = mItem.unit_rate * mItem.quantity;
    if (line > MAX_CUSTOM_DEVELOPMENT_MONEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total baris item bulanan melebihi batas aman',
        path: ['monthly_items', mIdx],
      });
    }
    monthlyTotal += line;
  }

  if (monthlyTotal > MAX_CUSTOM_DEVELOPMENT_MONEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Total biaya bulanan melebihi batas aman',
      path: ['monthly_items'],
    });
  }

  if ((data.monthly_items || []).length === 0 && (data.monthly_notes || []).length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Catatan bulanan hanya diperbolehkan jika ada item bulanan',
      path: ['monthly_notes'],
    });
  }

  // 4. Unique module group names (case-insensitive)
  const seenModuleNames = new Set<string>();
  for (let i = 0; i < (data.module_groups || []).length; i += 1) {
    const g = data.module_groups[i];
    const key = g.name.trim().toLowerCase();
    if (seenModuleNames.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate module name "${g.name}"`,
        path: ['module_groups', i, 'name'],
      });
    }
    seenModuleNames.add(key);
  }

  // 5. Unique limitation codes
  const seenLimitationCodes = new Set<string>();
  for (let i = 0; i < (data.limitation_codes || []).length; i += 1) {
    const code = data.limitation_codes[i];
    if (seenLimitationCodes.has(code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate limitation code "${code}"`,
        path: ['limitation_codes', i],
      });
    }
    seenLimitationCodes.add(code);
  }

  // 6. Unique additional limitations (case-insensitive after trim)
  const seenAdditional = new Set<string>();
  for (let i = 0; i < (data.additional_limitations || []).length; i += 1) {
    const stmt = data.additional_limitations[i];
    const key = stmt.trim().toLowerCase();
    if (seenAdditional.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate additional limitation "${stmt}"`,
        path: ['additional_limitations', i],
      });
    }
    seenAdditional.add(key);
  }

  // 7. Payment schedule reconciliation
  const totalInvestment = Math.max(0, subtotal - data.discount_amount);
  let devPaymentTotal = 0;
  const monthlyRows: typeof data.payment_schedule = [];

  for (let i = 0; i < (data.payment_schedule || []).length; i += 1) {
    const row = data.payment_schedule[i];
    if (row.component === 'development') {
      devPaymentTotal += row.nominal;
    } else if (row.component === 'monthly_recurring') {
      monthlyRows.push(row);
    }
  }

  if (devPaymentTotal !== totalInvestment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total termin pembayaran pengembangan (${devPaymentTotal}) harus sama dengan total investasi pengembangan (${totalInvestment})`,
      path: ['payment_schedule'],
    });
  }

  if ((data.monthly_items || []).length > 0) {
    if (monthlyRows.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Wajib mencantumkan minimal satu baris termin operasional bulanan`,
        path: ['payment_schedule'],
      });
    } else {
      for (const mRow of monthlyRows) {
        if (mRow.nominal !== monthlyTotal) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Nominal pembayaran bulanan (${mRow.nominal}) harus sama dengan total biaya bulanan (${monthlyTotal})`,
            path: ['payment_schedule'],
          });
        }
      }
    }
  } else if (monthlyRows.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Jadwal pembayaran tidak boleh memiliki komponen bulanan jika tidak ada item bulanan',
      path: ['payment_schedule'],
    });
  }
}

export const customDevelopmentSchema = customDevelopmentBaseSchema.superRefine(
  validateCustomDevelopmentCrossFields
);

export const customDevelopmentFormSchema = z.object({
  client_id: z.string().optional(),
  client_name: z
    .string()
    .trim()
    .min(1, 'Nama penanggung jawab wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES),
  client_company_name: z
    .string()
    .trim()
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES)
    .optional(),
  subject: z
    .string()
    .trim()
    .min(1, 'Perihal quotation wajib diisi')
    .max(MAX_CUSTOM_DEVELOPMENT_SHORT_TEXT_RUNES),
  solution_type: z.string().trim().min(1, 'Tipe solusi wajib diisi').max(100),
  commercial_scheme: z.literal('custom_development'),
  custom_development: customDevelopmentSchema,
});

export type CustomDevelopmentFormValues = z.infer<typeof customDevelopmentFormSchema>;
export type CustomDevelopmentValidationValues = z.infer<typeof customDevelopmentSchema>;
