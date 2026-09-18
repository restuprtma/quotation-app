import { it, expect, describe } from 'vitest';

import enBlueprint from './en/blueprint.json';
import idBlueprint from './id/blueprint.json';
import enQuotation from './en/quotation.json';
import idQuotation from './id/quotation.json';

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
});
