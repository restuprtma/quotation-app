import type { SquadModel, QuotationProfileInput } from '../types';

export const QUOTATION_PROFILE_OPTIONS = {
  preparation: ['none', 'hiring', 'engineering_kickoff'],
  maintenance: ['none', 'separate_section', 'within_development'],
  timeline: ['none', 'relative', 'calendar', 'sprint'],
  phases: ['requirement', 'development', 'sit', 'uat', 'go_live', 'maintenance', 'k6', 'pentest'],
  paymentAllocation: ['investment_bps', 'net_preparation', 'remaining_bps'],
  prefixes: ['CTH', 'VEN', 'LANDA', 'VENTURO'],
  tax: ['exclusive_ppn', 'inclusive_ppn'],
  clauses: ['out_of_pocket', 'overtime', 'onsite', 'third_party'],
} as const;

export function getQuotationProfileVisibility(profile?: QuotationProfileInput) {
  return {
    showDiscount:
      profile?.preparation_mode === 'hiring' || profile?.preparation_mode === 'engineering_kickoff',
    showMaintenanceSquad:
      profile?.maintenance_mode === 'separate_section' ||
      profile?.maintenance_mode === 'within_development',
    showPhases: Boolean(profile?.scope_timeline_mode && profile.scope_timeline_mode !== 'none'),
    showPaymentRows: profile?.payment_mode === 'explicit_rows',
  };
}

/** Removes dependent values before a profile is serialized to the API. */
export function normalizeQuotationProfileForMode(
  profile?: QuotationProfileInput
): QuotationProfileInput | undefined {
  if (!profile) return undefined;
  const next: QuotationProfileInput = {
    ...profile,
    included_phases: profile.included_phases ? [...profile.included_phases] : undefined,
    payment_rows: profile.payment_rows?.map((row) => ({ ...row })),
    document_options: profile.document_options
      ? {
          ...profile.document_options,
          clause_codes: profile.document_options.clause_codes
            ? [...profile.document_options.clause_codes]
            : undefined,
        }
      : undefined,
  };
  if (next.preparation_mode === 'none') delete next.preparation_discount_bps;
  if (next.scope_timeline_mode === 'none') delete next.included_phases;
  if (next.payment_mode !== 'explicit_rows') delete next.payment_rows;
  next.payment_rows?.forEach((row) => {
    if (row.allocation_kind === 'net_preparation') delete row.allocation_bps;
  });
  const hasValue = Object.entries(next).some(([key, value]) =>
    key !== 'document_options'
      ? value !== undefined && value !== ''
      : value && Object.values(value).some(Boolean)
  );
  return hasValue ? next : undefined;
}

export const GENERATOR_RATE_CARD_CODES = [
  'DEFAULT',
  'VENTURO-STD-2026',
  'VENTURO-BUMN-2026',
  'VENTURO-INTL-2026',
] as const;

export type GeneratorRateCardCode = (typeof GENERATOR_RATE_CARD_CODES)[number];

export const DEDICATED_SQUAD_MODELS: ReadonlyArray<{
  value: SquadModel;
  labelKey: string;
  descriptionKey: string;
}> = [
  {
    value: '1A',
    labelKey: 'model1A',
    descriptionKey: 'model1ADescription',
  },
  {
    value: '1B',
    labelKey: 'model1B',
    descriptionKey: 'model1BDescription',
  },
  {
    value: '1C',
    labelKey: 'model1C',
    descriptionKey: 'model1CDescription',
  },
  {
    value: '1D',
    labelKey: 'model1D',
    descriptionKey: 'model1DDescription',
  },
] as const;

export const DEDICATED_TIMELINE_MODES = [
  { value: 'relative', labelKey: 'timelineRelative' },
  { value: 'calendar', labelKey: 'timelineCalendar' },
  { value: 'sprint', labelKey: 'timelineSprint' },
] as const;

export type DedicatedSquadVisibility = {
  includeMaintenance: boolean;
  includeTimeline: boolean;
  includeTimelineMode: boolean;
  includeCalendarDates: boolean;
  includeSprintDates: boolean;
  includeKickoffDiscount: boolean;
  includeWorkdayCount: boolean;
  includePeriod: boolean;
  includePaymentCount: boolean;
  includePaymentAnchor: boolean;
};

/**
 * The visibility matrix is intentionally pure. It is shared by the form and
 * tests so a future editor cannot accidentally expose fields rejected by the
 * backend model rules.
 */
export function getDedicatedSquadVisibility(model: SquadModel): DedicatedSquadVisibility {
  const isProject = model === '1A' || model === '1B';
  const isSprint = model === '1D';

  return {
    includeMaintenance: model === '1A',
    includeTimeline: !isProject ? isSprint : true,
    includeTimelineMode: isProject,
    includeCalendarDates: isProject,
    includeSprintDates: isSprint,
    includeKickoffDiscount: model === '1C',
    includeWorkdayCount: isSprint,
    includePeriod: !isSprint,
    includePaymentCount: true,
    includePaymentAnchor: true,
  };
}

export function isGeneratorRateCardCode(_code: string): boolean {
  return true; // Allow all tenant rate cards
}

export function getDefaultPaymentCount(model: SquadModel): number {
  switch (model) {
    case '1A':
      return 3;
    case '1B':
      return 3;
    case '1C':
      return 3;
    case '1D':
      return 1;
    default:
      return 1;
  }
}

export function getDefaultTimelineMode(model: SquadModel): 'relative' | 'calendar' | 'sprint' | '' {
  switch (model) {
    case '1A':
    case '1B':
      return 'relative';
    case '1D':
      return 'sprint';
    case '1C':
    default:
      return '';
  }
}
