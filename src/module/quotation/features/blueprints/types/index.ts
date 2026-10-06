import type { BundlePartial } from './bundle';

export type ProviderSection = 'journey' | 'architecture' | 'state_machine' | 'workflow' | 'wbs';

export type SectionType = 'context' | ProviderSection | 'cross_validation';

export type BlueprintRunnerError = {
  code: string | null;
  httpStatus: number | null;
  section: ProviderSection | null;
  message: string;
};

export type GenerationStatus =
  | 'pending'
  | 'in_progress'
  | 'partial_failed'
  | 'completed'
  | 'failed';

export type SectionStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'manual_edit'
  | 'validated'
  | 'interrupted';

export type PublicationStatus = 'draft' | 'published' | 'superseded' | string;

export type CompletenessStatus = 'incomplete' | 'complete' | string;

export type CreateBlueprintInput = {
  idempotency_key: string;
  quotation_id: string;
  source_quotation_revision_id: string;
  title: string;
  business_goals: string[];
  actors: string[];
  channels?: string[];
  business_phases: string[];
  business_rules?: string[];
  known_states?: string[];
  integrations?: string[];
  technology_preferences?: string[];
  operational_constraints?: string[];
  additional_notes?: string;
};

export type BlueprintSectionStatus = {
  type: SectionType;
  status: SectionStatus;
  attempts: number;
  error_code?: string | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string;
};

export type BlueprintStatus = {
  blueprint_id: string;
  revision_id: string;
  title: string;
  generation_status: GenerationStatus;
  publication_status: string;
  completeness_status: string;
  content_version: number;
  sections: BlueprintSectionStatus[];
  created_at: string;
  updated_at: string;
};

export type BlueprintDetail<TContent = BundlePartial> = {
  status: BlueprintStatus;
  quotation_id: string;
  source_quotation_revision_id?: string | null;
  content_json: TContent;
  validation_result: Record<string, any>;
  cross_validation_result: Record<string, any>;
};

export type BlueprintListItem = {
  blueprint_id: string;
  quotation_id: string;
  title: string;
  generation_status: GenerationStatus;
  updated_at: string;
};

export type BlueprintListResponse = {
  items: BlueprintListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export const PROCESS_BLUEPRINT_STATUSES: GenerationStatus[] = [
  'pending',
  'in_progress',
  'partial_failed',
  'failed',
];

export type ManualRequest<T = unknown> = {
  revision_id: string;
  content_version: number;
  content: T;
};

export type SaveBlueprintSectionDraftRequest<T = unknown> = {
  revision_id: string;
  content_version: number;
  content: T;
};

export type QuotationOption = {
  id: string;
  quotation_number: string;
  subject?: string | null;
  status: string;
  commercial_scheme: string;
};

export type QuotationRevisionOption = {
  id: string;
  version_number: number;
  status: string;
  blueprint_eligible?: boolean;
  blueprint_ineligible_reason?: string | null;
};

export function parseBundlePartial(content: unknown): BundlePartial {
  if (!content || typeof content !== 'object') {
    return {};
  }
  const obj = content as Record<string, any>;
  return {
    schema_version: typeof obj.schema_version === 'string' ? obj.schema_version : undefined,
    title: typeof obj.title === 'string' ? obj.title : undefined,
    summary: typeof obj.summary === 'string' ? obj.summary : undefined,
    journey: obj.journey && typeof obj.journey === 'object' ? obj.journey : undefined,
    architecture:
      obj.architecture && typeof obj.architecture === 'object' ? obj.architecture : undefined,
    state_machine:
      obj.state_machine && typeof obj.state_machine === 'object' ? obj.state_machine : undefined,
    workflows: Array.isArray(obj.workflows) ? obj.workflows : undefined,
    wbs: obj.wbs && typeof obj.wbs === 'object' ? obj.wbs : undefined,
    assumptions: Array.isArray(obj.assumptions) ? obj.assumptions : undefined,
    open_questions: Array.isArray(obj.open_questions) ? obj.open_questions : undefined,
  };
}

export type CanonicalIssue = {
  section: string;
  code?: string;
  message: string;
  field?: string;
  path?: string;
  target_id?: string;
  severity: 'error' | 'warning';
  blocking?: boolean;
  remediation?: string;
};

export * from './bundle';
export * from './share-links';
