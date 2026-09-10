import { z } from 'zod';

import {
  MAX_KIOSK_QUEUE_MONEY,
  MAX_KIOSK_QUEUE_HEADCOUNT,
  MAX_KIOSK_QUEUE_SCOPE_PHASES,
  MAX_KIOSK_QUEUE_TIMELINE_ROWS,
  MAX_KIOSK_QUEUE_HARDWARE_ITEMS,
  MAX_KIOSK_QUEUE_SERVICE_GROUPS,
  MAX_KIOSK_QUEUE_LONG_TEXT_RUNES,
  MAX_KIOSK_QUEUE_PERIOD_QUARTERS,
  MAX_KIOSK_QUEUE_PAYMENT_DUE_DAYS,
  MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES,
  MAX_KIOSK_QUEUE_MAINTENANCE_ITEMS,
  MAX_KIOSK_QUEUE_HARDWARE_QUANTITY,
  MAX_KIOSK_QUEUE_RIGHTS_STATEMENTS,
  MAX_KIOSK_QUEUE_EXPERT_REQUIREMENTS,
  MAX_KIOSK_QUEUE_PRIVATE_PAYMENT_ROWS,
  GOVERNMENT_MPP_DOCUMENT_NUMBER_REGEX,
  MAX_KIOSK_QUEUE_DOCUMENT_NUMBER_RUNES,
  MAX_KIOSK_QUEUE_ADDITIONAL_LIMITATIONS,
  MAX_KIOSK_QUEUE_DELIVERABLES_PER_PHASE,
  MAX_KIOSK_QUEUE_SERVICE_ITEMS_PER_GROUP,
  MAX_KIOSK_QUEUE_GOVERNMENT_PAYMENT_ROWS,
} from '../constants/kiosk-queue-system';

export const kioskQueueScopePhaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul fase wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Judul fase maksimal 200 karakter'),
  deliverables: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Deliverable tidak boleh kosong')
        .max(MAX_KIOSK_QUEUE_LONG_TEXT_RUNES, 'Deliverable maksimal 4000 karakter')
    )
    .min(1, 'Minimal satu deliverable dalam fase')
    .max(MAX_KIOSK_QUEUE_DELIVERABLES_PER_PHASE, 'Maksimal 100 deliverable per fase'),
});

export const kioskQueueExpertSchema = z.object({
  role: z
    .string()
    .trim()
    .min(1, 'Peran tenaga ahli wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Peran tenaga ahli maksimal 200 karakter'),
  headcount: z
    .number()
    .int('Jumlah personel harus berupa bilangan bulat')
    .min(1, 'Minimal 1 personel')
    .max(MAX_KIOSK_QUEUE_HEADCOUNT, 'Maksimal 100 personel'),
  duration_label: z
    .string()
    .trim()
    .min(1, 'Durasi penugasan wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Durasi maksimal 200 karakter'),
  minimum_qualification: z
    .string()
    .trim()
    .min(1, 'Kualifikasi minimal wajib diisi')
    .max(MAX_KIOSK_QUEUE_LONG_TEXT_RUNES, 'Kualifikasi maksimal 4000 karakter'),
});

export const kioskQueueServiceItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama item jasa wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Nama item jasa maksimal 200 karakter'),
  monthly_rate: z
    .number()
    .int('Tarif bulanan harus berupa bilangan bulat rupiah')
    .min(0, 'Tarif tidak boleh negatif')
    .max(MAX_KIOSK_QUEUE_MONEY, 'Tarif melebihi batas aman'),
  headcount: z
    .number()
    .int('Jumlah personel harus berupa bilangan bulat')
    .min(1, 'Minimal 1 personel')
    .max(MAX_KIOSK_QUEUE_HEADCOUNT, 'Maksimal 100 personel'),
  period_quarters: z
    .number()
    .int('Periode kuartal harus berupa bilangan bulat')
    .min(1, 'Minimal 1 periode (0,25 bulan)')
    .max(MAX_KIOSK_QUEUE_PERIOD_QUARTERS, 'Maksimal 240 periode'),
});

export const kioskQueueServiceGroupSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul kelompok jasa wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Judul kelompok jasa maksimal 200 karakter'),
  items: z
    .array(kioskQueueServiceItemSchema)
    .min(1, 'Minimal satu item jasa dalam kelompok')
    .max(MAX_KIOSK_QUEUE_SERVICE_ITEMS_PER_GROUP, 'Maksimal 100 item jasa per kelompok'),
});

export const kioskQueueHardwareItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama perangkat wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Nama perangkat maksimal 200 karakter'),
  unit_price: z
    .number()
    .int('Harga satuan harus berupa bilangan bulat')
    .min(0, 'Harga satuan tidak boleh negatif')
    .max(MAX_KIOSK_QUEUE_MONEY, 'Harga satuan melebihi batas aman'),
  quantity: z
    .number()
    .int('Jumlah perangkat harus berupa bilangan bulat')
    .min(1, 'Minimal 1 unit')
    .max(MAX_KIOSK_QUEUE_HARDWARE_QUANTITY, 'Maksimal 10.000 unit'),
});

export const kioskQueueTimelineRowSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Deskripsi timeline wajib diisi')
    .max(MAX_KIOSK_QUEUE_LONG_TEXT_RUNES, 'Deskripsi timeline maksimal 4000 karakter'),
  timeline: z
    .string()
    .trim()
    .min(1, 'Target waktu wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Target waktu maksimal 200 karakter'),
});

export const kioskQueueGovernmentPaymentSchema = z.object({
  stage: z
    .string()
    .trim()
    .min(1, 'Tahap pembayaran wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Tahap pembayaran maksimal 200 karakter'),
  billing_basis: z
    .string()
    .trim()
    .min(1, 'Dasar penagihan wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Dasar penagihan maksimal 200 karakter'),
  nominal: z
    .number()
    .int('Nominal pembayaran harus berupa bilangan bulat')
    .min(1, 'Nominal pembayaran harus lebih dari 0')
    .max(MAX_KIOSK_QUEUE_MONEY, 'Nominal pembayaran melebihi batas aman'),
});

export const kioskQueuePrivatePaymentSchema = z.object({
  work_period: z
    .string()
    .trim()
    .min(1, 'Periode kerja/tahap wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Periode kerja maksimal 200 karakter'),
  terms: z
    .string()
    .trim()
    .min(1, 'Termin pembayaran wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Termin pembayaran maksimal 200 karakter'),
  invoice_date_label: z
    .string()
    .trim()
    .min(1, 'Label tanggal invoice wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Label invoice maksimal 200 karakter'),
  due_date_label: z
    .string()
    .trim()
    .min(1, 'Label jatuh tempo wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Label jatuh tempo maksimal 200 karakter'),
  nominal: z
    .number()
    .int('Nominal pembayaran harus berupa bilangan bulat')
    .min(1, 'Nominal pembayaran harus lebih dari 0')
    .max(MAX_KIOSK_QUEUE_MONEY, 'Nominal pembayaran melebihi batas aman'),
});

export const kioskQueueBaseSchema = z.object({
  variant: z.enum(['government_mpp', 'private_food_court']),
  document_number: z
    .string()
    .trim()
    .min(1, 'Nomor dokumen wajib diisi')
    .max(MAX_KIOSK_QUEUE_DOCUMENT_NUMBER_RUNES, 'Nomor dokumen maksimal 50 karakter'),
  system_name: z
    .string()
    .trim()
    .min(1, 'Nama sistem wajib diisi')
    .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES, 'Nama sistem maksimal 200 karakter'),
  quotation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  hardware_provision: z.enum(['venturo_supplied', 'client_supplied']),
  tax_treatment: z.enum(['inclusive_ppn_11', 'exclusive_ppn']),
  government_scope_phases: z
    .array(kioskQueueScopePhaseSchema)
    .max(MAX_KIOSK_QUEUE_SCOPE_PHASES, 'Maksimal 30 fase lingkup')
    .default([]),
  expert_requirements: z
    .array(kioskQueueExpertSchema)
    .max(MAX_KIOSK_QUEUE_EXPERT_REQUIREMENTS, 'Maksimal 50 tenaga ahli')
    .default([]),
  service_groups: z
    .array(kioskQueueServiceGroupSchema)
    .min(1, 'Minimal satu kelompok biaya jasa')
    .max(MAX_KIOSK_QUEUE_SERVICE_GROUPS, 'Maksimal 30 kelompok jasa'),
  service_discount_amount: z
    .number()
    .int('Nilai diskon harus berupa bilangan bulat')
    .min(0, 'Diskon tidak boleh negatif')
    .max(MAX_KIOSK_QUEUE_MONEY, 'Diskon melebihi batas aman')
    .default(0),
  show_service_discount_row: z.boolean().default(false),
  hardware_items: z
    .array(kioskQueueHardwareItemSchema)
    .max(MAX_KIOSK_QUEUE_HARDWARE_ITEMS, 'Maksimal 100 perangkat')
    .default([]),
  maintenance_items: z
    .array(kioskQueueServiceItemSchema)
    .max(MAX_KIOSK_QUEUE_MAINTENANCE_ITEMS, 'Maksimal 50 item maintenance')
    .default([]),
  private_timeline_rows: z
    .array(kioskQueueTimelineRowSchema)
    .max(MAX_KIOSK_QUEUE_TIMELINE_ROWS, 'Maksimal 100 baris timeline')
    .default([]),
  government_payment_schedule: z
    .array(kioskQueueGovernmentPaymentSchema)
    .max(MAX_KIOSK_QUEUE_GOVERNMENT_PAYMENT_ROWS, 'Maksimal 60 jadwal pembayaran')
    .default([]),
  private_payment_schedule: z
    .array(kioskQueuePrivatePaymentSchema)
    .max(MAX_KIOSK_QUEUE_PRIVATE_PAYMENT_ROWS, 'Maksimal 60 jadwal pembayaran')
    .default([]),
  payment_due_days: z
    .number()
    .int('Jatuh tempo hari harus berupa bilangan bulat')
    .min(0, 'Jatuh tempo minimal 0 hari')
    .max(MAX_KIOSK_QUEUE_PAYMENT_DUE_DAYS, 'Jatuh tempo maksimal 365 hari'),
  limitation_codes: z
    .array(
      z.enum([
        'civil_electrical',
        'client_hardware',
        'extra_hardware',
        'hardware_warranty',
        'out_of_pocket',
        'overtime',
        'third_party',
        'scope_change',
      ])
    )
    .default([]),
  additional_limitations: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Batasan tambahan tidak boleh kosong')
        .max(MAX_KIOSK_QUEUE_LONG_TEXT_RUNES, 'Batasan tambahan maksimal 4000 karakter')
    )
    .max(MAX_KIOSK_QUEUE_ADDITIONAL_LIMITATIONS, 'Maksimal 20 batasan tambahan')
    .default([]),
  rights_statements: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Pernyataan hak cipta tidak boleh kosong')
        .max(MAX_KIOSK_QUEUE_LONG_TEXT_RUNES, 'Pernyataan hak cipta maksimal 4000 karakter')
    )
    .max(MAX_KIOSK_QUEUE_RIGHTS_STATEMENTS, 'Maksimal 20 pernyataan hak cipta')
    .default([]),
});

export function validateKioskQueueCrossFields(
  data: z.infer<typeof kioskQueueBaseSchema>,
  ctx: z.RefinementCtx,
  _t?: (key: string) => string
) {
  // 1. Service subtotal & whole rupiah calculation
  let serviceSubtotal = 0;
  for (let gIdx = 0; gIdx < (data.service_groups || []).length; gIdx += 1) {
    const group = data.service_groups[gIdx];
    for (let iIdx = 0; iIdx < (group.items || []).length; iIdx += 1) {
      const item = group.items[iIdx];
      if (
        !Number.isSafeInteger(item.monthly_rate) ||
        !Number.isSafeInteger(item.headcount) ||
        !Number.isSafeInteger(item.period_quarters)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nilai item jasa harus bilangan bulat aman',
          path: ['service_groups', gIdx, 'items', iIdx],
        });
        continue;
      }
      const product = item.monthly_rate * item.headcount * item.period_quarters;
      if (!Number.isSafeInteger(product) || product > MAX_KIOSK_QUEUE_MONEY * 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Total biaya baris jasa melebihi batas aman',
          path: ['service_groups', gIdx, 'items', iIdx],
        });
        continue;
      }
      if (product % 4 !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Total baris jasa harus berupa bilangan bulat rupiah',
          path: ['service_groups', gIdx, 'items', iIdx],
        });
        continue;
      }
      const lineTotal = product / 4;
      if (lineTotal > MAX_KIOSK_QUEUE_MONEY - serviceSubtotal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Subtotal jasa melebihi batas aman',
          path: ['service_groups', gIdx, 'items', iIdx],
        });
        continue;
      }
      serviceSubtotal += lineTotal;
    }
  }

  // 2. Service discount validation
  if (data.service_discount_amount > serviceSubtotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Diskon jasa tidak boleh melebihi subtotal jasa',
      path: ['service_discount_amount'],
    });
  }

  if (data.service_discount_amount > 0 && !data.show_service_discount_row) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Diskon bernilai positif namun baris diskon disembunyikan',
      path: ['show_service_discount_row'],
    });
  }

  // 3. Unique limitation codes check
  const seenLimits = new Set<string>();
  for (let i = 0; i < (data.limitation_codes || []).length; i += 1) {
    const code = data.limitation_codes[i];
    if (seenLimits.has(code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Batasan "${code}" dipilih lebih dari satu kali`,
        path: ['limitation_codes', i],
      });
    }
    seenLimits.add(code);
  }

  // 4. Unique additional limitations check
  const seenAdditional = new Set<string>();
  for (let i = 0; i < (data.additional_limitations || []).length; i += 1) {
    const text = data.additional_limitations[i].trim().toLowerCase();
    if (seenAdditional.has(text)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Batasan tambahan tidak boleh duplikat',
        path: ['additional_limitations', i],
      });
    }
    seenAdditional.add(text);
  }

  // 5. Unique rights statements check
  const seenRights = new Set<string>();
  for (let i = 0; i < (data.rights_statements || []).length; i += 1) {
    const text = data.rights_statements[i].trim().toLowerCase();
    if (seenRights.has(text)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pernyataan hak cipta tidak boleh duplikat',
        path: ['rights_statements', i],
      });
    }
    seenRights.add(text);
  }

  // 6. Cross-variant rules
  if (data.variant === 'government_mpp') {
    // Document number format
    if (!GOVERNMENT_MPP_DOCUMENT_NUMBER_REGEX.test(data.document_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Format nomor dokumen pemerintah harus LANDA/MPP-Antrian/MMYY/NNN',
        path: ['document_number'],
      });
    }

    // Tax treatment must be inclusive_ppn_11
    if (data.tax_treatment !== 'inclusive_ppn_11') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Varian pemerintah MPP harus menggunakan perlakuan pajak inclusive_ppn_11',
        path: ['tax_treatment'],
      });
    }

    // Scope phases: 1..30
    if (!data.government_scope_phases || data.government_scope_phases.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Lingkup pekerjaan pemerintah wajib memiliki minimal satu fase',
        path: ['government_scope_phases'],
      });
    }

    // Expert requirements: 1..50
    if (!data.expert_requirements || data.expert_requirements.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kebutuhan tenaga ahli pemerintah wajib memiliki minimal satu tenaga ahli',
        path: ['expert_requirements'],
      });
    }

    // Prohibited fields for government
    if (data.maintenance_items && data.maintenance_items.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Item maintenance harus kosong untuk varian pemerintah',
        path: ['maintenance_items'],
      });
    }

    if (data.private_timeline_rows && data.private_timeline_rows.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Baris timeline swasta harus kosong untuk varian pemerintah',
        path: ['private_timeline_rows'],
      });
    }

    if (data.private_payment_schedule && data.private_payment_schedule.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Jadwal pembayaran swasta harus kosong untuk varian pemerintah',
        path: ['private_payment_schedule'],
      });
    }

    // Payment due days: 1..365
    if (data.payment_due_days < 1 || data.payment_due_days > MAX_KIOSK_QUEUE_PAYMENT_DUE_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Jatuh tempo pembayaran pemerintah harus antara 1 dan 365 hari',
        path: ['payment_due_days'],
      });
    }

    // Government payment schedule: 1..60
    if (!data.government_payment_schedule || data.government_payment_schedule.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tahapan pembayaran pemerintah wajib memiliki minimal satu termin',
        path: ['government_payment_schedule'],
      });
    }

    // Limitations: civil_electrical is required
    if (!seenLimits.has('civil_electrical')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Batasan pekerjaan sipil dan kelistrikan (civil_electrical) wajib dipilih untuk pemerintah',
        path: ['limitation_codes'],
      });
    }

    // Hardware provision validation
    let hardwareSubtotal = 0;
    if (data.hardware_provision === 'venturo_supplied') {
      if (!data.hardware_items || data.hardware_items.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Pengadaan perangkat Venturo wajib memiliki minimal satu item perangkat',
          path: ['hardware_items'],
        });
      } else {
        for (let hIdx = 0; hIdx < data.hardware_items.length; hIdx += 1) {
          const item = data.hardware_items[hIdx];
          const line = item.unit_price * item.quantity;
          if (!Number.isSafeInteger(line) || line > MAX_KIOSK_QUEUE_MONEY - hardwareSubtotal) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Total baris perangkat keras melebihi batas aman',
              path: ['hardware_items', hIdx],
            });
            continue;
          }
          hardwareSubtotal += line;
        }
      }
    } else {
      // client_supplied
      if (data.hardware_items && data.hardware_items.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Item perangkat harus kosong jika perangkat disediakan oleh klien',
          path: ['hardware_items'],
        });
      }
      if (!seenLimits.has('client_hardware')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Batasan perangkat disediakan klien (client_hardware) wajib dipilih jika hardware_provision adalah client_supplied',
          path: ['limitation_codes'],
        });
      }
    }

    // Government exact payment reconciliation
    const serviceTaxAmount = Math.floor((serviceSubtotal * 1100) / 10000);
    const serviceTotal = serviceSubtotal - data.service_discount_amount + serviceTaxAmount;

    const hardwareTaxAmount = Math.floor((hardwareSubtotal * 1100) / 10000);
    const hardwareTotal = hardwareSubtotal + hardwareTaxAmount;

    const paymentTargetTotal = serviceTotal + hardwareTotal;

    let paymentSum = 0;
    for (let pIdx = 0; pIdx < (data.government_payment_schedule || []).length; pIdx += 1) {
      paymentSum += data.government_payment_schedule[pIdx].nominal;
    }

    if (paymentSum !== paymentTargetTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total termin pembayaran pemerintah (${paymentSum}) harus sama dengan target investasi (${paymentTargetTotal})`,
        path: ['government_payment_schedule'],
      });
    }
  } else {
    // variant === 'private_food_court'
    // Hardware provision must be client_supplied
    if (data.hardware_provision !== 'client_supplied') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Varian korporasi swasta Food Court hanya menerima hardware_provision client_supplied',
        path: ['hardware_provision'],
      });
    }

    // Tax treatment must be exclusive_ppn
    if (data.tax_treatment !== 'exclusive_ppn') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Varian korporasi swasta Food Court harus menggunakan perlakuan pajak exclusive_ppn',
        path: ['tax_treatment'],
      });
    }

    // Prohibited fields for private
    if (data.government_scope_phases && data.government_scope_phases.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Lingkup pekerjaan pemerintah harus kosong untuk varian swasta',
        path: ['government_scope_phases'],
      });
    }

    if (data.expert_requirements && data.expert_requirements.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kebutuhan tenaga ahli harus kosong untuk varian swasta',
        path: ['expert_requirements'],
      });
    }

    if (data.hardware_items && data.hardware_items.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Item perangkat keras harus kosong untuk varian swasta',
        path: ['hardware_items'],
      });
    }

    if (data.government_payment_schedule && data.government_payment_schedule.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Jadwal pembayaran pemerintah harus kosong untuk varian swasta',
        path: ['government_payment_schedule'],
      });
    }

    // Payment due days must be 0
    if (data.payment_due_days !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'payment_due_days harus bernilai 0 untuk varian swasta',
        path: ['payment_due_days'],
      });
    }

    // Limitations: client_hardware is required
    if (!seenLimits.has('client_hardware')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Batasan perangkat disediakan klien (client_hardware) wajib dipilih untuk varian swasta',
        path: ['limitation_codes'],
      });
    }

    // Private timeline rows: 1..100
    if (!data.private_timeline_rows || data.private_timeline_rows.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Lingkup pekerjaan & timeline swasta wajib memiliki minimal satu baris',
        path: ['private_timeline_rows'],
      });
    }

    // Private payment schedule: 1..60
    if (!data.private_payment_schedule || data.private_payment_schedule.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Jadwal pembayaran swasta wajib memiliki minimal satu termin',
        path: ['private_payment_schedule'],
      });
    }

    // Maintenance items integer check
    let maintenanceSubtotal = 0;
    for (let mIdx = 0; mIdx < (data.maintenance_items || []).length; mIdx += 1) {
      const item = data.maintenance_items[mIdx];
      const product = item.monthly_rate * item.headcount * item.period_quarters;
      if (!Number.isSafeInteger(product) || product > MAX_KIOSK_QUEUE_MONEY * 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Total baris maintenance melebihi batas aman',
          path: ['maintenance_items', mIdx],
        });
        continue;
      }
      if (product % 4 !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Total baris maintenance harus berupa bilangan bulat rupiah',
          path: ['maintenance_items', mIdx],
        });
        continue;
      }
      const lineTotal = product / 4;
      if (lineTotal > MAX_KIOSK_QUEUE_MONEY - maintenanceSubtotal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Subtotal maintenance melebihi batas aman',
          path: ['maintenance_items', mIdx],
        });
        continue;
      }
      maintenanceSubtotal += lineTotal;
    }

    // Private payment target: covers service only (maintenance is separate)
    const paymentTargetTotal = serviceSubtotal - data.service_discount_amount;

    let paymentSum = 0;
    for (let pIdx = 0; pIdx < (data.private_payment_schedule || []).length; pIdx += 1) {
      paymentSum += data.private_payment_schedule[pIdx].nominal;
    }

    if (paymentSum !== paymentTargetTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total termin pembayaran swasta (${paymentSum}) harus sama dengan total investasi software (${paymentTargetTotal})`,
        path: ['private_payment_schedule'],
      });
    }
  }
}

export function makeKioskQueueSchema(t?: (key: string) => string) {
  return kioskQueueBaseSchema.superRefine((data, ctx) =>
    validateKioskQueueCrossFields(data, ctx, t)
  );
}

export const kioskQueueSchema = makeKioskQueueSchema();

export function makeKioskQueueFormSchema(t?: (key: string) => string) {
  return z.object({
    client_id: z.string().optional(),
    client_name: z
      .string()
      .trim()
      .min(1, 'Nama penanggung jawab wajib diisi')
      .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES),
    client_company_name: z.string().trim().max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES).optional(),
    subject: z
      .string()
      .trim()
      .min(1, 'Perihal quotation wajib diisi')
      .max(MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES),
    solution_type: z.string().trim().min(1, 'Tipe solusi wajib diisi').max(100),
    commercial_scheme: z.literal('kiosk_queue_system'),
    kiosk_queue_system: makeKioskQueueSchema(t),
  });
}

export const kioskQueueFormSchema = makeKioskQueueFormSchema();

export type KioskQueueFormValues = z.infer<typeof kioskQueueFormSchema>;
export type KioskQueueValidationValues = z.infer<typeof kioskQueueSchema>;

export function fieldId(path: string): string {
  return `field-${path.replace(/\./g, '-')}`;
}
