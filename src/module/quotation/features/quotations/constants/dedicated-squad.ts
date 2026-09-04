import type { SquadModel } from '../types';

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

export function isGeneratorRateCardCode(code: string): code is GeneratorRateCardCode {
  return (GENERATOR_RATE_CARD_CODES as readonly string[]).includes(code);
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

