export type PaymentTermItem = {
  milestone_name: string;
  percentage: number;
  description?: string;
};

export type PaymentTermsInput = {
  mode: 'milestone';
  items: PaymentTermItem[];
};

export type SquadModel = '1A' | '1B' | '1C' | '1D';

export type DedicatedTimelineMode = 'relative' | 'calendar' | 'sprint';

/**
 * Values in headcount_quarters and period_quarters are quarter-units. The
 * backend deliberately uses integers (1 = 0.25 FTE/month) so preview and
 * generation cannot drift because of floating point arithmetic.
 */
export type SquadLineInput = {
  role: string;
  seniority: string;
  headcount_quarters: number;
  period_quarters: number;
  workday_count?: number;
};

export type DedicatedTimelineInput = {
  mode: DedicatedTimelineMode | '';
  start_date?: string;
  sprint_end_date?: string;
};

export type DedicatedSquadInput = {
  model: SquadModel;
  requirement: string;
  development_squad: SquadLineInput[];
  maintenance_enabled: boolean;
  maintenance_squad: SquadLineInput[];
  kickoff_discount_bps: number;
  payment_count: number;
  /** ISO calendar date used by the backend for invoices and H+14 due dates. */
  payment_anchor_date: string;
  timeline: DedicatedTimelineInput;
};

export type GenerateQuotationPayload = {
  idempotency_key?: string;
  skill_id: string;
  client_id?: string;
  client_name?: string;
  client_company_name?: string;
  subject: string;
  solution_type: string;
  commercial_scheme: 'dedicated_squad';
  rate_card_id: string;
  rate_card_code?: string;
  dedicated_squad: DedicatedSquadInput;
  /** Legacy fields remain optional for old revisions and compatibility. */
  project_duration_months?: number;
  budget_maximum?: number;
  summary?: string;
  mandatory_scope?: string[];
  optional_scope?: string[];
  allowed_standard_activities?: string[];
  payment_terms?: PaymentTermsInput;
  additional_notes?: string;
  discount_type?: 'none' | 'round_to_target' | 'fixed_amount' | 'percent';
  discount_input?: number;
  discount_name?: string;
  discount_reason?: string;
};

export type GenerateQuotationResponse = {
  quotation_id: string;
};

export type SquadLineCalculation = SquadLineInput & {
  term_type: 'short_term' | 'long_term' | string;
  amount_per_unit: number;
  line_total: number;
};

export type PreparationCalculation = {
  kind: 'hiring' | 'engineering_kickoff' | 'none' | string;
  gross: number;
  discount: number;
  net: number;
};

export type PaymentRow = {
  work_period: string;
  terms: string;
  invoice_date: string;
  due_date: string;
  nominal: number;
};

export type DedicatedSquadCalculation = {
  model: SquadModel;
  development: SquadLineCalculation[];
  development_subtotal: number;
  maintenance: SquadLineCalculation[];
  maintenance_subtotal: number;
  preparation: PreparationCalculation;
  total: number;
  discount: number;
  total_investment: number;
  payments: PaymentRow[];
};

export type DedicatedSquadDocumentSection = {
  number: number;
  code: string;
  title: string;
};

export type DedicatedSquadPreviewResponse = {
  calculation: DedicatedSquadCalculation;
  visible_sections: DedicatedSquadDocumentSection[];
  include_k6: boolean;
  include_pentest: boolean;
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

export type LegalTemplateSnapshot = {
  code?: string;
  version?: number;
  content_html?: string;
};

export type QuotationGenerationDetail = {
  quotation_id: string;
  company_id: string;
  client_id: string;
  quotation_number: string;
  subject: string;
  status: string;
  revision_id: string;
  created_at: string;
  updated_at: string;
  generation_status: GenerationRevisionStatus;
  content_version: number;
  content_html: string;
  legal_template_snapshot?: LegalTemplateSnapshot | string;
  legal_content_modified?: boolean;
  commercial_content_modified?: boolean;
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
  client_tier?: string;
  currency: string;
  is_active: boolean;
  item_count?: number;
};

export type ClientSummary = {
  id: string;
  name: string;
  slug?: string;
  is_active?: boolean;
};

