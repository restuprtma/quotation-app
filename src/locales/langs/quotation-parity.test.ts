import { it, expect, describe } from 'vitest';

import enBlueprint from './en/blueprint.json';
import idBlueprint from './id/blueprint.json';
import enQuotation from './en/quotation.json';
import idQuotation from './id/quotation.json';
import enNavigation from './en/navigation.json';
import idNavigation from './id/navigation.json';

const flattenKeys = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [prefix];

  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key)
  );
};

describe('locale parity', () => {
  it('keeps Indonesian and English quotation keys identical', () => {
    expect(flattenKeys(idQuotation).sort()).toEqual(flattenKeys(enQuotation).sort());
  });

  it('keeps Indonesian and English blueprint keys identical', () => {
    expect(flattenKeys(idBlueprint).sort()).toEqual(flattenKeys(enBlueprint).sort());
  });

  it('keeps Indonesian and English navigation keys identical', () => {
    expect(flattenKeys(idNavigation).sort()).toEqual(flattenKeys(enNavigation).sort());
  });
});

describe('Quotation Status & Scheme Translations Parity', () => {
  it('contains published, failed, and queued in statuses for both en and id', () => {
    expect((enQuotation.statuses as Record<string, string>).published).toBe('Published');
    expect((idQuotation.statuses as Record<string, string>).published).toBe('Dipublikasikan');

    expect((enQuotation.statuses as Record<string, string>).failed).toBe('Failed');
    expect((idQuotation.statuses as Record<string, string>).failed).toBe('Gagal');

    expect((enQuotation.statuses as Record<string, string>).queued).toBe('Queued');
    expect((idQuotation.statuses as Record<string, string>).queued).toBe('Dalam antrean');
  });

  it('contains commercialSchemes for all active schemes', () => {
    expect((enQuotation.commercialSchemes as Record<string, string>).dedicated_squad).toBe('Dedicated Squad');
    expect((idQuotation.commercialSchemes as Record<string, string>).dedicated_squad).toBe('Dedicated Squad');

    expect((enQuotation.commercialSchemes as Record<string, string>).custom_development).toBe('Custom Software');
    expect((idQuotation.commercialSchemes as Record<string, string>).custom_development).toBe('Custom Software');
  });
});

