export type PaymentTermItem = {
  milestone_name: string;
  percentage: number;
  description?: string;
};

export type PaymentTermsInput = {
  mode: 'milestone';
  items: PaymentTermItem[];
};

export type GenerateQuotationPayload = {
  idempotency_key?: string;
  skill_id: string;
  client_id: string;
  subject: string;
  solution_type: string;
  commercial_scheme: 'dedicated_squad';
  rate_card_id: string;
  rate_card_code?: string;
  project_duration_months: number;
  budget_maximum: number;
  summary: string;
  mandatory_scope: string[];
  optional_scope?: string[];
  allowed_standard_activities?: string[];
  payment_terms: PaymentTermsInput;
  additional_notes?: string;
};

export type GenerateQuotationResponse = {
  quotation_id: string;
};

export type GenerationProgressStage =
  | 'validating_input'
  | 'creating_draft'
  | 'preparing_allocation'
  | 'checking_rate_card'
  | 'composing_quotation'
  | 'sanitizing_document'
  | 'completed'
  | 'failed';

export type GenerationRevisionStatus = 'queued' | 'pending' | 'completed' | 'failed';

export type GenerationStateResponse = {
  generation_status: GenerationRevisionStatus;
  content_version: number;
  content_html: string;
  generated_at?: string;
  updated_at: string;
};

export type QuotationGenerationDetail = {
  quotation_id: string;
  company_id: string;
  client_id: string;
  quotation_number: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  generation_status: GenerationRevisionStatus;
  content_version: number;
  content_html: string;
  generated_at?: string;
};

export type SaveDraftPayload = {
  revision_id: string;
  content_html: string;
  content_version: number;
};

export type SaveDraftResultResponse = {
  quotation_id: string;
  revision_id: string;
  content_version: number;
  content_html: string;
  legal_content_modified: boolean;
  commercial_content_modified: boolean;
  updated_at: string;
};

export type ActiveSkill = {
  id: string;
  name: string;
  command: string;
  content_instruction?: string;
  is_active: boolean;
};

export type RateCardSummary = {
  id: string;
  code: string;
  name: string;
  market: string;
  currency: string;
  is_active: boolean;
};
