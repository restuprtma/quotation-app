import { it, expect, describe } from 'vitest';

import { formatDedicatedSquadCurrency } from './quotation-calculation-preview';

describe('dedicated squad calculation preview formatting', () => {
  it('formats integer IDR values without decimal drift', () => {
    expect(formatDedicatedSquadCurrency(150000000)).toContain('150.000.000');
    expect(formatDedicatedSquadCurrency(0)).toContain('0');
  });
});

