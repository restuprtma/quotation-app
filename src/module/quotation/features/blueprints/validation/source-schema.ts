import type { CreateBlueprintInput } from '../types';

import { z } from 'zod';

const trimmedNonEmptyString = (max: number, fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} cannot be empty`)
    .max(max, `${fieldName} cannot exceed ${max} characters`);

export const blueprintSourceSchema = z.object({
  quotation_id: z.string().trim().min(1, 'Quotation is required'),
  source_quotation_revision_id: z.string().trim().min(1, 'Quotation revision is required'),
  title: trimmedNonEmptyString(160, 'Title'),
  business_goals: z
    .array(trimmedNonEmptyString(200, 'Goal'))
    .min(1, 'At least 1 business goal is required'),
  actors: z.array(trimmedNonEmptyString(120, 'Actor')).min(1, 'At least 1 actor is required'),
  channels: z
    .array(trimmedNonEmptyString(120, 'Channel'))
    .max(20, 'Maximum 20 channels')
    .optional()
    .default([]),
  business_phases: z
    .array(trimmedNonEmptyString(160, 'Phase'))
    .min(1, 'At least 1 business phase is required')
    .max(30, 'Maximum 30 business phases'),
  business_rules: z
    .array(trimmedNonEmptyString(300, 'Rule'))
    .max(50, 'Maximum 50 business rules')
    .optional()
    .default([]),
  known_states: z
    .array(trimmedNonEmptyString(100, 'State'))
    .max(100, 'Maximum 100 known states')
    .optional()
    .default([]),
  integrations: z
    .array(trimmedNonEmptyString(160, 'Integration'))
    .max(50, 'Maximum 50 integrations')
    .optional()
    .default([]),
  technology_preferences: z
    .array(trimmedNonEmptyString(160, 'Technology preference'))
    .max(30, 'Maximum 30 technology preferences')
    .optional()
    .default([]),
  operational_constraints: z
    .array(trimmedNonEmptyString(300, 'Constraint'))
    .max(50, 'Maximum 50 operational constraints')
    .optional()
    .default([]),
  additional_notes: z
    .string()
    .trim()
    .max(2000, 'Additional notes cannot exceed 2000 characters')
    .optional()
    .default(''),
});

export type BlueprintSourceFormValues = z.infer<typeof blueprintSourceSchema>;

export const defaultBlueprintSourceValues: BlueprintSourceFormValues = {
  quotation_id: '',
  source_quotation_revision_id: '',
  title: '',
  business_goals: [''],
  actors: [''],
  channels: [],
  business_phases: [''],
  business_rules: [],
  known_states: [],
  integrations: [],
  technology_preferences: [],
  operational_constraints: [],
  additional_notes: '',
};

export function toCreateBlueprintInput(
  values: BlueprintSourceFormValues,
  idempotencyKey: string
): CreateBlueprintInput {
  const cleanArray = (arr?: string[]) =>
    (arr || []).map((item) => item.trim()).filter((item) => item.length > 0);

  return {
    idempotency_key: idempotencyKey,
    quotation_id: values.quotation_id.trim(),
    source_quotation_revision_id: values.source_quotation_revision_id.trim(),
    title: values.title.trim(),
    business_goals: cleanArray(values.business_goals),
    actors: cleanArray(values.actors),
    channels: cleanArray(values.channels),
    business_phases: cleanArray(values.business_phases),
    business_rules: cleanArray(values.business_rules),
    known_states: cleanArray(values.known_states),
    integrations: cleanArray(values.integrations),
    technology_preferences: cleanArray(values.technology_preferences),
    operational_constraints: cleanArray(values.operational_constraints),
    additional_notes: values.additional_notes?.trim() || '',
  };
}
