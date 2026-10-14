import { it, expect, describe } from 'vitest';

import {
  getDefaultPaymentCount,
  isGeneratorRateCardCode,
  GENERATOR_RATE_CARD_CODES,
  getDedicatedSquadVisibility,
  getQuotationProfileVisibility,
  normalizeQuotationProfileForMode,
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

describe('quotation profile helpers', () => {
  it('reveals only controls required by the selected modes', () => {
    expect(
      getQuotationProfileVisibility({ preparation_mode: 'hiring', payment_mode: 'explicit_rows' })
    ).toMatchObject({
      showDiscount: true,
      showPaymentRows: true,
      showMaintenanceSquad: false,
    });
  });

  it('removes dependent fields before payload serialization', () => {
    expect(
      normalizeQuotationProfileForMode({
        preparation_mode: 'none',
        preparation_discount_bps: 2500,
        scope_timeline_mode: 'none',
        included_phases: ['development'],
        payment_mode: 'preset',
        payment_rows: [
          {
            work_period: 'Kick off',
            terms: 'DP',
            allocation_kind: 'investment_bps',
            allocation_bps: 10_000,
          },
        ],
      })
    ).toEqual({ preparation_mode: 'none', scope_timeline_mode: 'none', payment_mode: 'preset' });
  });
});

describe('dedicated squad constants', () => {
  it('allows all rate card codes in generator', () => {
    expect(GENERATOR_RATE_CARD_CODES).toEqual([
      'DEFAULT',
      'VENTURO-STD-2026',
      'VENTURO-BUMN-2026',
      'VENTURO-INTL-2026',
    ]);
    expect(isGeneratorRateCardCode('DEFAULT')).toBe(true);
    expect(isGeneratorRateCardCode('CUSTOM-CARD')).toBe(true);
  });

  it('defaults sprint to one payment and projects to three', () => {
    expect(getDefaultPaymentCount('1D')).toBe(1);
    expect(getDefaultPaymentCount('1A')).toBe(3);
  });
});
