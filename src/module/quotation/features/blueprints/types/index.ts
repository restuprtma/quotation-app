export type ProviderSection = 'journey' | 'architecture' | 'state_machine' | 'workflow' | 'wbs';

export type SectionType = 'context' | ProviderSection | 'cross_validation';

export type GenerationStatus =
  | 'pending'
  | 'in_progress'
  | 'partial_failed'
  | 'completed'
  | 'failed';

export type SectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

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

export type BlueprintDetail = {
  status: BlueprintStatus;
  quotation_id: string;
  source_quotation_revision_id?: string | null;
  content_json: Record<string, any>;
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
};

export type ManualRequest<T = unknown> = {
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

export * from './bundle';
