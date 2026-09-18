import { it, expect, describe } from 'vitest';

import {
  blueprintSourceSchema,
  toCreateBlueprintInput,
  type BlueprintSourceFormValues,
} from './source-schema';

describe('blueprintSourceSchema', () => {
  const validFormValues: BlueprintSourceFormValues = {
    quotation_id: '11111111-1111-4111-8111-111111111111',
    source_quotation_revision_id: '22222222-2222-4222-8222-222222222222',
    title: 'Hospital Core System Blueprint',
    business_goals: ['Automate patient admission', 'Integrate BPJS claims'],
    actors: ['Patient', 'Doctor', 'Admin'],
    channels: ['Web Portal', 'Mobile App'],
    business_phases: ['Registration', 'Consultation', 'Billing'],
    business_rules: ['Patient must have valid ID'],
    known_states: ['registered', 'in_consultation', 'discharged'],
    integrations: ['BPJS VClaim API', 'LIS Integration'],
    technology_preferences: ['PostgreSQL', 'Golang', 'React'],
    operational_constraints: ['High availability 99.9%'],
    additional_notes: 'Urgent deployment required',
  };

  it('validates a complete valid form payload', () => {
    const result = blueprintSourceSchema.safeParse(validFormValues);
    expect(result.success).toBe(true);
  });

  it('rejects empty or whitespace-only title, goals, actors, phases', () => {
    const invalid = {
      ...validFormValues,
      title: '   ',
      business_goals: ['   '],
      actors: ['   '],
      business_phases: ['   '],
    };
    const result = blueprintSourceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      expect(errorMap.title).toBeDefined();
      expect(errorMap.business_goals).toBeDefined();
      expect(errorMap.actors).toBeDefined();
      expect(errorMap.business_phases).toBeDefined();
    }
  });

  it('enforces string length boundaries without truncation', () => {
    const overflowTitle = { ...validFormValues, title: 'a'.repeat(161) };
    expect(blueprintSourceSchema.safeParse(overflowTitle).success).toBe(false);

    const overflowGoal = { ...validFormValues, business_goals: ['a'.repeat(201)] };
    expect(blueprintSourceSchema.safeParse(overflowGoal).success).toBe(false);

    const overflowActor = { ...validFormValues, actors: ['a'.repeat(121)] };
    expect(blueprintSourceSchema.safeParse(overflowActor).success).toBe(false);

    const overflowPhase = { ...validFormValues, business_phases: ['a'.repeat(161)] };
    expect(blueprintSourceSchema.safeParse(overflowPhase).success).toBe(false);

    const overflowNotes = { ...validFormValues, additional_notes: 'a'.repeat(2001) };
    expect(blueprintSourceSchema.safeParse(overflowNotes).success).toBe(false);
  });

  it('enforces maximum array item count for phases (30)', () => {
    const tooManyPhases = {
      ...validFormValues,
      business_phases: Array.from({ length: 31 }, (_, i) => `Phase ${i + 1}`),
    };
    expect(blueprintSourceSchema.safeParse(tooManyPhases).success).toBe(false);
  });

  it('allows empty optional fields and normalizes correctly', () => {
    const minimal: BlueprintSourceFormValues = {
      quotation_id: '11111111-1111-4111-8111-111111111111',
      source_quotation_revision_id: '22222222-2222-4222-8222-222222222222',
      title: 'Minimal Blueprint',
      business_goals: ['Goal 1'],
      actors: ['Actor 1'],
      channels: [],
      business_phases: ['Phase 1'],
      business_rules: [],
      known_states: [],
      integrations: [],
      technology_preferences: [],
      operational_constraints: [],
      additional_notes: '',
    };

    const parsed = blueprintSourceSchema.safeParse(minimal);
    expect(parsed.success).toBe(true);

    const payload = toCreateBlueprintInput(minimal, 'idem-key-123');
    expect(payload.idempotency_key).toBe('idem-key-123');
    expect(payload.title).toBe('Minimal Blueprint');
    expect(payload.channels).toEqual([]);
    expect(payload.additional_notes).toBe('');
  });

  it('trims whitespace and ignores blank entries in optional lists during normalization', () => {
    const withWhitespace: BlueprintSourceFormValues = {
      ...validFormValues,
      title: '  Trimmed Title  ',
      business_goals: ['  Goal 1  ', '  Goal 2  '],
      channels: ['  Web  ', '   ', 'Mobile'],
      additional_notes: '  Some notes  ',
    };

    const payload = toCreateBlueprintInput(withWhitespace, 'idem-key-123');
    expect(payload.title).toBe('Trimmed Title');
    expect(payload.business_goals).toEqual(['Goal 1', 'Goal 2']);
    expect(payload.channels).toEqual(['Web', 'Mobile']);
    expect(payload.additional_notes).toBe('Some notes');
  });
});
