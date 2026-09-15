import type { KioskQueueFormValues } from '../components/kiosk-queue-form-model';
import type {
  ActiveSkill,
  ClientSummary,
  KioskQueueVariant,
  KioskQueueSystemInput,
  KioskQueueExpertInput,
  KioskQueueLimitationCode,
  KioskQueueGeneratePayload,
  KioskQueueScopePhaseInput,
  KioskQueueTimelineRowInput,
  KioskQueueServiceItemInput,
  KioskQueueHardwareItemInput,
  KioskQueueServiceGroupInput,
  KioskQueuePrivatePaymentInput,
  KioskQueueGovernmentPaymentInput,
} from '../types';

import dayjs from 'dayjs';

import { resolveQuotationSkillId } from '../utils/generation';

export const MAX_KIOSK_QUEUE_MONEY = 9_000_000_000_000_000;
export const MAX_KIOSK_QUEUE_SHORT_TEXT_RUNES = 200;
export const MAX_KIOSK_QUEUE_LONG_TEXT_RUNES = 4_000;
export const MAX_KIOSK_QUEUE_DOCUMENT_NUMBER_RUNES = 50;
export const MAX_KIOSK_QUEUE_SCOPE_PHASES = 30;
export const MAX_KIOSK_QUEUE_DELIVERABLES_PER_PHASE = 100;
export const MAX_KIOSK_QUEUE_EXPERT_REQUIREMENTS = 50;
export const MAX_KIOSK_QUEUE_HEADCOUNT = 100;
export const MAX_KIOSK_QUEUE_PERIOD_QUARTERS = 240;
export const MAX_KIOSK_QUEUE_SERVICE_GROUPS = 30;
export const MAX_KIOSK_QUEUE_SERVICE_ITEMS_PER_GROUP = 100;
export const MAX_KIOSK_QUEUE_HARDWARE_ITEMS = 100;
export const MAX_KIOSK_QUEUE_HARDWARE_QUANTITY = 10_000;
export const MAX_KIOSK_QUEUE_MAINTENANCE_ITEMS = 50;
export const MAX_KIOSK_QUEUE_TIMELINE_ROWS = 100;
export const MAX_KIOSK_QUEUE_GOVERNMENT_PAYMENT_ROWS = 60;
export const MAX_KIOSK_QUEUE_PRIVATE_PAYMENT_ROWS = 60;
export const MAX_KIOSK_QUEUE_PAYMENT_DUE_DAYS = 365;
export const MAX_KIOSK_QUEUE_ADDITIONAL_LIMITATIONS = 20;
export const MAX_KIOSK_QUEUE_RIGHTS_STATEMENTS = 20;

export const GOVERNMENT_MPP_DOCUMENT_NUMBER_REGEX =
  /^LANDA\/MPP-Antrian\/((0[1-9]|1[0-2])[0-9]{2})\/[0-9]{3,6}$/;

export const KIOSK_QUEUE_VARIANT_OPTIONS = [
  { value: 'government_mpp', label: 'Pemerintah (MPP)' },
  { value: 'private_food_court', label: 'Korporasi Swasta (Food Court)' },
] as const;

export const HARDWARE_PROVISION_OPTIONS = [
  { value: 'venturo_supplied', label: 'Disediakan Venturo' },
  { value: 'client_supplied', label: 'Disediakan Klien' },
] as const;

export const KIOSK_QUEUE_TAX_TREATMENT_OPTIONS = [
  { value: 'inclusive_ppn_11', label: 'Sudah Termasuk PPN 11%' },
  { value: 'exclusive_ppn', label: 'Belum Termasuk PPN' },
] as const;

export const KIOSK_QUEUE_LIMITATION_OPTIONS = [
  {
    value: 'civil_electrical',
    label: 'Pekerjaan sipil, instalasi listrik, dan pengkabelan lokasi',
  },
  {
    value: 'client_hardware',
    label: 'Pengadaan dan jaminan fungsi perangkat keras (hardware) dari pihak klien',
  },
  {
    value: 'extra_hardware',
    label: 'Perangkat tambahan di luar rincian penawaran',
  },
  {
    value: 'hardware_warranty',
    label: 'Garansi kerusakan fisik hardware menjadi tanggung jawab vendor perangkat',
  },
  {
    value: 'out_of_pocket',
    label: 'Biaya akomodasi, transportasi, dan konsumsi untuk penugasan luar kota',
  },
  {
    value: 'overtime',
    label: 'Permintaan pengerjaan di luar jam kerja efektif',
  },
  {
    value: 'third_party',
    label: 'Integrasi pihak ketiga berbayar (payment gateway, SMS gateway, API eksternal)',
  },
  {
    value: 'scope_change',
    label: 'Perubahan spesifikasi dan alur di luar lingkup yang telah disepakati',
  },
] as const;

export const DEFAULT_GOVERNMENT_LIMITATION_CODES: KioskQueueLimitationCode[] = ['civil_electrical'];

export const DEFAULT_PRIVATE_LIMITATION_CODES: KioskQueueLimitationCode[] = ['client_hardware'];

export const KIOSK_QUEUE_DEFAULT_VALUES: KioskQueueSystemInput = {
  variant: 'government_mpp',
  document_number: '',
  system_name: '',
  quotation_date: dayjs().format('YYYY-MM-DD'),
  hardware_provision: 'client_supplied',
  tax_treatment: 'inclusive_ppn_11',
  government_scope_phases: [{ title: '', deliverables: [''] }],
  expert_requirements: [{ role: '', headcount: 1, duration_label: '', minimum_qualification: '' }],
  service_groups: [
    {
      title: '',
      items: [{ name: '', monthly_rate: 0, headcount: 1, period_quarters: 4 }],
    },
  ],
  service_discount_amount: 0,
  show_service_discount_row: false,
  hardware_items: [],
  maintenance_items: [],
  private_timeline_rows: [],
  government_payment_schedule: [{ stage: '', billing_basis: '', nominal: 0 }],
  private_payment_schedule: [],
  payment_due_days: 14,
  limitation_codes: ['civil_electrical', 'client_hardware'],
  additional_limitations: [],
  rights_statements: [],
};

export type KioskQueueLocalTotals = {
  serviceSubtotal: number;
  serviceDiscountAmount: number;
  serviceTaxAmount: number;
  serviceTotal: number;
  hardwareSubtotal: number;
  hardwareTaxAmount: number;
  hardwareTotal: number;
  maintenanceTotal: number;
  paymentTargetTotal: number;
  paymentTotal: number;
  paymentDelta: number;
  isBalanced: boolean;
};

export function kioskQuarterLineTotal(
  monthlyRate: number,
  headcount: number,
  periodQuarters: number
): number {
  if (
    !Number.isSafeInteger(monthlyRate) ||
    !Number.isSafeInteger(headcount) ||
    !Number.isSafeInteger(periodQuarters) ||
    monthlyRate < 0 ||
    headcount < 0 ||
    periodQuarters < 0
  ) {
    return 0;
  }
  const product = monthlyRate * headcount * periodQuarters;
  if (!Number.isSafeInteger(product)) {
    return 0;
  }
  return Math.floor(product / 4);
}

export function kioskHardwareLineTotal(unitPrice: number, quantity: number): number {
  if (
    !Number.isSafeInteger(unitPrice) ||
    !Number.isSafeInteger(quantity) ||
    unitPrice < 0 ||
    quantity < 0
  ) {
    return 0;
  }
  const total = unitPrice * quantity;
  if (!Number.isSafeInteger(total)) {
    return 0;
  }
  return total;
}

export function calculateKioskQueueLocal(
  input: Partial<KioskQueueSystemInput>
): KioskQueueLocalTotals {
  let serviceSubtotal = 0;
  for (const group of input.service_groups || []) {
    for (const item of group.items || []) {
      const line = kioskQuarterLineTotal(item.monthly_rate, item.headcount, item.period_quarters);
      serviceSubtotal += line;
    }
  }

  const serviceDiscountAmount =
    Number.isSafeInteger(input.service_discount_amount) && input.service_discount_amount! >= 0
      ? input.service_discount_amount!
      : 0;

  const serviceAfterDiscount = Math.max(0, serviceSubtotal - serviceDiscountAmount);

  let serviceTaxAmount = 0;
  let serviceTotal = 0;
  let hardwareSubtotal = 0;
  let hardwareTaxAmount = 0;
  let hardwareTotal = 0;
  let maintenanceTotal = 0;
  let paymentTargetTotal = 0;
  let paymentTotal = 0;

  if (input.variant === 'government_mpp') {
    serviceTaxAmount = Math.floor((serviceSubtotal * 1100) / 10000);
    serviceTotal = serviceAfterDiscount + serviceTaxAmount;

    if (input.hardware_provision === 'venturo_supplied' && Array.isArray(input.hardware_items)) {
      for (const item of input.hardware_items) {
        hardwareSubtotal += kioskHardwareLineTotal(item.unit_price, item.quantity);
      }
      hardwareTaxAmount = Math.floor((hardwareSubtotal * 1100) / 10000);
      hardwareTotal = hardwareSubtotal + hardwareTaxAmount;
    }

    paymentTargetTotal = serviceTotal + hardwareTotal;

    for (const p of input.government_payment_schedule || []) {
      if (Number.isSafeInteger(p.nominal) && p.nominal > 0) {
        paymentTotal += p.nominal;
      }
    }
  } else {
    // private_food_court
    serviceTaxAmount = 0;
    serviceTotal = serviceAfterDiscount;

    for (const item of input.maintenance_items || []) {
      maintenanceTotal += kioskQuarterLineTotal(
        item.monthly_rate,
        item.headcount,
        item.period_quarters
      );
    }

    // Maintenance is standalone, payment target only covers development/service
    paymentTargetTotal = serviceTotal;

    for (const p of input.private_payment_schedule || []) {
      if (Number.isSafeInteger(p.nominal) && p.nominal > 0) {
        paymentTotal += p.nominal;
      }
    }
  }

  const paymentDelta = paymentTargetTotal - paymentTotal;
  const isBalanced =
    paymentDelta === 0 &&
    serviceDiscountAmount <= serviceSubtotal &&
    (paymentTargetTotal > 0 || serviceSubtotal === 0);

  return {
    serviceSubtotal,
    serviceDiscountAmount,
    serviceTaxAmount,
    serviceTotal,
    hardwareSubtotal,
    hardwareTaxAmount,
    hardwareTotal,
    maintenanceTotal,
    paymentTargetTotal,
    paymentTotal,
    paymentDelta,
    isBalanced,
  };
}

export function normalizeKioskQueueSystem(input: KioskQueueSystemInput): KioskQueueSystemInput {
  return {
    variant: input.variant,
    document_number: input.document_number.trim(),
    system_name: input.system_name.trim(),
    quotation_date: input.quotation_date.trim(),
    hardware_provision: input.hardware_provision,
    tax_treatment: input.tax_treatment,
    government_scope_phases: input.government_scope_phases
      ? input.government_scope_phases.map((phase: KioskQueueScopePhaseInput) => ({
          title: phase.title.trim(),
          deliverables: (phase.deliverables || []).map((d: string) => d.trim()),
        }))
      : undefined,
    expert_requirements: input.expert_requirements
      ? input.expert_requirements.map((exp: KioskQueueExpertInput) => ({
          role: exp.role.trim(),
          headcount: exp.headcount,
          duration_label: exp.duration_label.trim(),
          minimum_qualification: exp.minimum_qualification.trim(),
        }))
      : undefined,
    service_groups: (input.service_groups || []).map((group: KioskQueueServiceGroupInput) => ({
      title: group.title.trim(),
      items: (group.items || []).map((item: KioskQueueServiceItemInput) => ({
        name: item.name.trim(),
        monthly_rate: item.monthly_rate,
        headcount: item.headcount,
        period_quarters: item.period_quarters,
      })),
    })),
    service_discount_amount: input.service_discount_amount || 0,
    show_service_discount_row: Boolean(input.show_service_discount_row),
    hardware_items: input.hardware_items
      ? input.hardware_items.map((item: KioskQueueHardwareItemInput) => ({
          name: item.name.trim(),
          unit_price: item.unit_price,
          quantity: item.quantity,
        }))
      : undefined,
    maintenance_items: input.maintenance_items
      ? input.maintenance_items.map((item: KioskQueueServiceItemInput) => ({
          name: item.name.trim(),
          monthly_rate: item.monthly_rate,
          headcount: item.headcount,
          period_quarters: item.period_quarters,
        }))
      : undefined,
    private_timeline_rows: input.private_timeline_rows
      ? input.private_timeline_rows.map((row: KioskQueueTimelineRowInput) => ({
          description: row.description.trim(),
          timeline: row.timeline.trim(),
        }))
      : undefined,
    government_payment_schedule: input.government_payment_schedule
      ? input.government_payment_schedule.map((p: KioskQueueGovernmentPaymentInput) => ({
          stage: p.stage.trim(),
          billing_basis: p.billing_basis.trim(),
          nominal: p.nominal,
        }))
      : undefined,
    private_payment_schedule: input.private_payment_schedule
      ? input.private_payment_schedule.map((p: KioskQueuePrivatePaymentInput) => ({
          work_period: p.work_period.trim(),
          terms: p.terms.trim(),
          invoice_date_label: p.invoice_date_label.trim(),
          due_date_label: p.due_date_label.trim(),
          nominal: p.nominal,
        }))
      : undefined,
    payment_due_days: input.payment_due_days ?? (input.variant === 'government_mpp' ? 14 : 0),
    limitation_codes: input.limitation_codes ? [...input.limitation_codes] : [],
    additional_limitations: input.additional_limitations
      ? input.additional_limitations.map((a: string) => a.trim()).filter(Boolean)
      : undefined,
    rights_statements: input.rights_statements
      ? input.rights_statements.map((r: string) => r.trim()).filter(Boolean)
      : undefined,
  };
}

export function toKioskQueuePayload(
  values: KioskQueueFormValues,
  selectedSkill: ActiveSkill | null | undefined,
  activeSkills: ActiveSkill[]
): KioskQueueGeneratePayload {
  return {
    skill_id: resolveQuotationSkillId(selectedSkill, activeSkills),
    client_id: values.client_id || undefined,
    client_name: values.client_name.trim(),
    client_company_name: values.client_company_name?.trim() || undefined,
    subject: values.subject.trim(),
    solution_type: values.solution_type,
    commercial_scheme: 'kiosk_queue_system',
    kiosk_queue_system: normalizeKioskQueueSystem(values.kiosk_queue_system),
  };
}

export function createDefaultKioskQueueValues(
  today: string,
  client?: ClientSummary,
  variant: KioskQueueVariant = 'government_mpp'
): KioskQueueFormValues {
  const isGov = variant === 'government_mpp';
  return {
    client_id: client?.id ?? '',
    client_company_name: client?.name ?? '',
    client_name: isGov ? 'Pejabat Pembuat Komitmen (PPK)' : 'Pimpinan Perusahaan',
    subject: isGov
      ? 'Penawaran Pengadaan Sistem Antrian Terpadu MPP'
      : 'Penawaran Self-Ordering Kiosk Food Court',
    solution_type: isGov ? 'Sistem Antrian (Queue Management)' : 'Kiosk Application',
    commercial_scheme: 'kiosk_queue_system',
    kiosk_queue_system: {
      ...KIOSK_QUEUE_DEFAULT_VALUES,
      variant,
      quotation_date: today,
      document_number: '',
      system_name: isGov ? 'Sistem Antrian Terpadu MPP' : 'Self-Ordering Kiosk Food Court',
      hardware_provision: isGov ? 'venturo_supplied' : 'client_supplied',
      tax_treatment: isGov ? 'inclusive_ppn_11' : 'exclusive_ppn',
      payment_due_days: isGov ? 14 : 0,
      limitation_codes: isGov ? ['civil_electrical'] : ['client_hardware'],
      additional_limitations: [],
      rights_statements: [],
      government_scope_phases: isGov
        ? [{ title: 'Fase 1: Persiapan & Desain', deliverables: ['Dokumen Analisis Kebutuhan'] }]
        : [],
      expert_requirements: isGov
        ? [
            {
              role: 'Project Manager',
              headcount: 1,
              duration_label: '3 Bulan',
              minimum_qualification: 'S1 Sistem Informasi',
            },
          ]
        : [],
      hardware_items: isGov ? [] : [],
      maintenance_items: isGov ? [] : [],
      private_timeline_rows: isGov
        ? []
        : [{ description: 'Requirement Analysis & System Design', timeline: 'Bulan 1' }],
      government_payment_schedule: isGov
        ? [{ stage: 'Uang Muka 50%', billing_basis: 'Kontrak & SPMK', nominal: 0 }]
        : [],
      private_payment_schedule: isGov
        ? []
        : [
            {
              work_period: 'Termin 1',
              terms: 'DP Kick Off',
              invoice_date_label: today,
              due_date_label: 'H+14',
              nominal: 0,
            },
          ],
    },
  };
}
