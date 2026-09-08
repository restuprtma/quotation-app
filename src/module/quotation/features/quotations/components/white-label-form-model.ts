import { z } from 'zod';

import { MAX_WHITE_LABEL_SAFE_AMOUNT } from '../constants/white-label';

export const licenseItemSchema = z.object({
  name: z.string().trim().min(1, 'Nama lisensi wajib diisi').max(200),
  unit_rate: z
    .number()
    .int()
    .min(1, 'Harga satuan harus lebih dari 0')
    .max(MAX_WHITE_LABEL_SAFE_AMOUNT),
  quantity: z.number().int().min(1, 'Jumlah harus minimal 1').max(1_000_000),
});

export const maintenanceItemSchema = z.object({
  name: z.string().trim().min(1, 'Nama paket maintenance wajib diisi').max(200),
  monthly_rate: z
    .number()
    .int()
    .min(1, 'Biaya bulanan harus lebih dari 0')
    .max(MAX_WHITE_LABEL_SAFE_AMOUNT),
  fte_quarters: z.number().int().min(1).max(4),
  period_months: z.number().int().min(1, 'Durasi bulan minimal 1').max(120),
});

export const hostingItemSchema = z.object({
  name: z.string().trim().min(1, 'Nama layanan hosting wajib diisi').max(200),
  monthly_rate: z
    .number()
    .int()
    .min(1, 'Biaya bulanan harus lebih dari 0')
    .max(MAX_WHITE_LABEL_SAFE_AMOUNT),
  quantity: z.number().int().min(1, 'Jumlah unit minimal 1').max(1_000_000),
  period_months: z.number().int().min(1, 'Durasi bulan minimal 1').max(120),
});

export const moduleGroupSchema = z.object({
  name: z.string().trim().min(1, 'Nama kelompok modul wajib diisi').max(200),
  features: z
    .array(z.string().trim().min(1, 'Nama fitur tidak boleh kosong').max(200))
    .min(1, 'Minimal satu fitur dalam kelompok modul')
    .max(100),
});

export const timelineRowSchema = z.object({
  description: z.string().trim().min(1, 'Deskripsi timeline wajib diisi').max(200),
  timeline: z.string().trim().min(1, 'Target timeline wajib diisi').max(200),
});

export const paymentRowSchema = z.object({
  work_period: z.string().trim().min(1, 'Periode kerja/tahap wajib diisi').max(200),
  terms: z.string().trim().min(1, 'Termin pembayaran wajib diisi').max(200),
  invoice_date_label: z.string().trim().min(1, 'Label tanggal invoice wajib diisi').max(200),
  due_date_label: z.string().trim().min(1, 'Label jatuh tempo wajib diisi').max(200),
  component: z.enum(['license', 'maintenance_hosting']),
  nominal: z
    .number()
    .int()
    .min(1, 'Nominal pembayaran harus lebih dari 0')
    .max(MAX_WHITE_LABEL_SAFE_AMOUNT),
});

export const whiteLabelBaseSchema = z.object({
  product_name: z.string().trim().min(1, 'Nama produk software wajib diisi').max(200),
  quotation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  tax_treatment: z.enum(['not_stated', 'exclusive_ppn', 'inclusive_ppn']),
  license_items: z.array(licenseItemSchema).min(1, 'Minimal satu item lisensi').max(50),
  maintenance_items: z.array(maintenanceItemSchema).max(50).default([]),
  hosting_items: z.array(hostingItemSchema).max(50).default([]),
  module_groups: z.array(moduleGroupSchema).max(30).default([]),
  timeline_rows: z.array(timelineRowSchema).max(100).default([]),
  payment_schedule: z.array(paymentRowSchema).min(1, 'Minimal satu jadwal pembayaran').max(60),
  rights_statements: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
  limitation_codes: z
    .array(z.enum(['out_of_pocket', 'overtime', 'third_party', 'scope_change']))
    .min(1, 'Minimal satu batasan dipilih')
    .max(4),
});

export function validateWhiteLabelCrossFields(
  data: z.infer<typeof whiteLabelBaseSchema>,
  ctx: z.RefinementCtx
) {
  // 1. Module groups duplicate names check (case-insensitive)
  const seenGroupNames = new Set<string>();
  for (let i = 0; i < (data.module_groups || []).length; i += 1) {
    const g = data.module_groups[i];
    const key = g.name.trim().toLowerCase();
    if (seenGroupNames.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate module name "${g.name}"`,
        path: ['module_groups', i, 'name'],
      });
    }
    seenGroupNames.add(key);
  }

  // 2. Limitation codes duplicate check
  const seenCodes = new Set<string>();
  for (let i = 0; i < (data.limitation_codes || []).length; i += 1) {
    const code = data.limitation_codes[i];
    if (seenCodes.has(code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate limitation code "${code}"`,
        path: ['limitation_codes', i],
      });
    }
    seenCodes.add(code);
  }

  // 3. License subtotal calculation
  let licenseSubtotal = 0;
  for (let i = 0; i < (data.license_items || []).length; i += 1) {
    const item = data.license_items[i];
    const total = item.unit_rate * item.quantity;
    if (total > MAX_WHITE_LABEL_SAFE_AMOUNT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'License line calculation exceeds maximum safe amount',
        path: ['license_items', i],
      });
    }
    licenseSubtotal += total;
  }

  // 4. Maintenance subtotal calculation and whole rupiah / divisible by 4 check
  let maintenanceSubtotal = 0;
  for (let i = 0; i < (data.maintenance_items || []).length; i += 1) {
    const item = data.maintenance_items[i];
    const numerator = item.monthly_rate * item.fte_quarters * item.period_months;
    if (numerator > MAX_WHITE_LABEL_SAFE_AMOUNT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maintenance line calculation exceeds maximum safe amount',
        path: ['maintenance_items', i],
      });
    }
    if (numerator % 4 !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Line calculation must be a whole rupiah amount (divisible by 4)',
        path: ['maintenance_items', i],
      });
    } else {
      maintenanceSubtotal += numerator / 4;
    }
  }

  // 5. Hosting subtotal calculation
  let hostingSubtotal = 0;
  for (let i = 0; i < (data.hosting_items || []).length; i += 1) {
    const item = data.hosting_items[i];
    const total = item.monthly_rate * item.quantity * item.period_months;
    if (total > MAX_WHITE_LABEL_SAFE_AMOUNT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hosting line calculation exceeds maximum safe amount',
        path: ['hosting_items', i],
      });
    }
    hostingSubtotal += total;
  }

  const maintenanceHostingSubtotal = maintenanceSubtotal + hostingSubtotal;
  const totalInvestment = licenseSubtotal + maintenanceHostingSubtotal;

  if (totalInvestment > MAX_WHITE_LABEL_SAFE_AMOUNT) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Total investment exceeds maximum safe amount',
      path: ['license_items'],
    });
  }

  // 6. Payment schedule reconciliation by component
  let licensePaymentTotal = 0;
  let maintenanceHostingPaymentTotal = 0;

  for (let i = 0; i < (data.payment_schedule || []).length; i += 1) {
    const row = data.payment_schedule[i];
    if (row.component === 'license') {
      licensePaymentTotal += row.nominal;
    } else if (row.component === 'maintenance_hosting') {
      maintenanceHostingPaymentTotal += row.nominal;
    }
  }

  if (licensePaymentTotal !== licenseSubtotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total license payment (${licensePaymentTotal}) must equal license subtotal (${licenseSubtotal})`,
      path: ['payment_schedule'],
    });
  }

  if (maintenanceHostingPaymentTotal !== maintenanceHostingSubtotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total maintenance and hosting payment (${maintenanceHostingPaymentTotal}) must equal maintenance and hosting subtotal (${maintenanceHostingSubtotal})`,
      path: ['payment_schedule'],
    });
  }

  const totalPayment = licensePaymentTotal + maintenanceHostingPaymentTotal;
  if (totalPayment !== totalInvestment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total payment schedule (${totalPayment}) must equal total investment (${totalInvestment})`,
      path: ['payment_schedule'],
    });
  }
}

export const whiteLabelSchema = whiteLabelBaseSchema.superRefine(validateWhiteLabelCrossFields);

export const whiteLabelFormSchema = z.object({
  client_id: z.string().optional(),
  client_name: z.string().trim().min(1, 'Nama penanggung jawab wajib diisi').max(200),
  client_company_name: z.string().trim().max(200).optional(),
  subject: z.string().trim().min(1, 'Perihal quotation wajib diisi').max(200),
  solution_type: z.string().trim().min(1, 'Tipe solusi wajib diisi').max(100),
  commercial_scheme: z.literal('white_label'),
  white_label: whiteLabelSchema,
});

export type WhiteLabelFormValues = z.infer<typeof whiteLabelFormSchema>;
export type WhiteLabelValidationValues = z.infer<typeof whiteLabelSchema>;
