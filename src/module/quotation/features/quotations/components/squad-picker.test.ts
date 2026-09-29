import { it, expect, describe } from 'vitest';

import { getDefaultSquadLine } from './squad-picker';
import { resolvePromptRole, type CatalogRoleOption } from '../types/prompt-first';

const catalogOptions: CatalogRoleOption[] = [
  {
    rate_item_id: 'item-backend-programmer',
    role: 'backend_programmer',
    display_name: 'Back End Programmer',
    seniority: 'senior',
    term_type: 'monthly',
  },
];

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

  it('keeps the legacy role default only when no catalog options are supplied', () => {
    expect(getDefaultSquadLine('1A').role).toBe('frontend_programmer');
    expect(getDefaultSquadLine('1A', catalogOptions)).toMatchObject({
      role: 'backend_programmer',
      seniority: 'senior',
    });
  });

  it('does not choose a role when the prompt catalog is empty or ambiguous', () => {
    expect(getDefaultSquadLine('1A', []).role).toBe('');
    expect(
      getDefaultSquadLine('1A', [
        catalogOptions[0],
        { ...catalogOptions[0], rate_item_id: 'item-2' },
      ]).role
    ).toBe('');
  });
});

describe('prompt-first role resolution', () => {
  it('resolves only an exact catalog role', () => {
    expect(resolvePromptRole('backend_programmer', catalogOptions)).toMatchObject({
      status: 'resolved',
      options: catalogOptions,
    });
    expect(resolvePromptRole('frontend_programmer', catalogOptions).status).toBe('unresolved');
  });

  it('leaves duplicate catalog matches ambiguous', () => {
    expect(
      resolvePromptRole('backend_programmer', [
        catalogOptions[0],
        { ...catalogOptions[0], rate_item_id: 'item-2' },
      ]).status
    ).toBe('ambiguous');
  });
});
