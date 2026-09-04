import { it, expect, describe } from 'vitest';

import {
  toDedicatedSquadPayload,
  quotationGenerationSchema,
  createDefaultDedicatedSquadValues,
} from './quotation-generation-form';

describe('dedicated squad generation form contract', () => {
  it('creates a 1D form with sprint dates and workday units', () => {
    const values = createDefaultDedicatedSquadValues('1D', 'rate-card-id');

    expect(values.dedicated_squad.timeline.mode).toBe('sprint');
    expect(values.dedicated_squad.timeline.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(values.dedicated_squad.timeline.sprint_end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(values.dedicated_squad.development_squad[0].period_quarters).toBe(0);
    expect(values.dedicated_squad.development_squad[0].workday_count).toBeGreaterThan(0);
  });

  it('creates 1C without a timeline and with a selectable kickoff discount', () => {
    const values = createDefaultDedicatedSquadValues('1C', 'rate-card-id');

    expect(values.dedicated_squad.timeline).toEqual({ mode: '' });
    expect(values.dedicated_squad.kickoff_discount_bps).toBe(5_000);
    expect(values.dedicated_squad.maintenance_squad).toEqual([]);
  });

  it('includes backend-approved payment anchor and workday fields in payload', () => {
    const values = createDefaultDedicatedSquadValues('1D', 'rate-card-id');
    values.subject = 'Sprint delivery';
    values.dedicated_squad.requirement = 'Build the customer portal';

    const parsed = quotationGenerationSchema.safeParse(values);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const payload = toDedicatedSquadPayload(parsed.data, null, []);
    expect(payload.dedicated_squad.payment_anchor_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.dedicated_squad.development_squad[0].workday_count).toBeGreaterThan(0);
    expect(payload.dedicated_squad.development_squad[0].period_quarters).toBe(0);
  });
});

