import { describe, expect, it } from 'vitest';

import { getDefaultSquadLine } from './squad-picker';

describe('dedicated squad picker defaults', () => {
  it('uses quarter units for project lines', () => {
    expect(getDefaultSquadLine('1A')).toMatchObject({
      headcount_quarters: 4,
      period_quarters: 24,
      workday_count: 0,
    });
  });

  it('uses weekday units for sprint lines', () => {
    expect(getDefaultSquadLine('1D')).toMatchObject({
      headcount_quarters: 4,
      period_quarters: 0,
      workday_count: 5,
    });
  });
});
