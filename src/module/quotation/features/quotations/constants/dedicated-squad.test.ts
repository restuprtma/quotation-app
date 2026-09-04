import { it, expect, describe } from 'vitest';

import {
  getDefaultPaymentCount,
  isGeneratorRateCardCode,
  GENERATOR_RATE_CARD_CODES,
  getDedicatedSquadVisibility,
} from './dedicated-squad';

describe('dedicated squad visibility', () => {
  it('only exposes maintenance and timeline for 1A', () => {
    expect(getDedicatedSquadVisibility('1A')).toMatchObject({
      includeMaintenance: true,
      includeTimeline: true,
      includeTimelineMode: true,
      includePeriod: true,
      includeWorkdayCount: false,
      includeKickoffDiscount: false,
    });
  });

  it('hides maintenance for 1B and uses a project timeline', () => {
    expect(getDedicatedSquadVisibility('1B')).toMatchObject({
      includeMaintenance: false,
      includeTimeline: true,
      includeTimelineMode: true,
      includeCalendarDates: true,
    });
  });

  it('shows only kickoff discount for 1C', () => {
    expect(getDedicatedSquadVisibility('1C')).toMatchObject({
      includeMaintenance: false,
      includeTimeline: false,
      includeTimelineMode: false,
      includeKickoffDiscount: true,
      includePeriod: true,
    });
  });

  it('uses dates and workdays for 1D', () => {
    expect(getDedicatedSquadVisibility('1D')).toMatchObject({
      includeMaintenance: false,
      includeTimeline: true,
      includeTimelineMode: false,
      includeSprintDates: true,
      includeWorkdayCount: true,
      includePeriod: false,
    });
  });
});

describe('dedicated squad constants', () => {
  it('restricts generator cards to the four seeded cards', () => {
    expect(GENERATOR_RATE_CARD_CODES).toEqual([
      'DEFAULT',
      'VENTURO-STD-2026',
      'VENTURO-BUMN-2026',
      'VENTURO-INTL-2026',
    ]);
    expect(isGeneratorRateCardCode('DEFAULT')).toBe(true);
    expect(isGeneratorRateCardCode('CUSTOM-CARD')).toBe(false);
  });

  it('defaults sprint to one payment and projects to three', () => {
    expect(getDefaultPaymentCount('1D')).toBe(1);
    expect(getDefaultPaymentCount('1A')).toBe(3);
  });
});

