import { it, expect, describe } from 'vitest';

import en from './en/quotation.json';
import id from './id/quotation.json';

const flattenKeys = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [prefix];

  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key)
  );
};

describe('quotation locale parity', () => {
  it('keeps Indonesian and English quotation keys identical', () => {
    expect(flattenKeys(id).sort()).toEqual(flattenKeys(en).sort());
  });
});
