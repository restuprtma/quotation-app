export type QuotationStatus = 'draft' | 'shared' | 'signed' | 'contract_created';

export type ProjectType = 'product_based' | 'project_based';

export type PricingItem = {
  id?: string;
  item_name: string;
  description?: string | null;
  features?: Record<string, unknown> | null;
  pricing_mode: 'unit' | 'resource' | 'fixed';
  unit_label?: string | null;
  unit_price: number;
  quantity: number;
  employee_count: number;
  duration: number;
  duration_unit?: string | null;
  billing_period: 'one_time' | 'monthly' | 'yearly' | 'custom';
  line_total?: number;
  manual_override_reason?: string | null;
  sort_order: number;
};

export type PricingSection = {
  id?: string;
  section_name: string;
  section_type: 'package' | 'service' | 'phase' | 'resource_group' | 'other';
  description?: string | null;
  sort_order: number;
  items: PricingItem[];
};

export type QuotationItem = {
  id: string;
  item_name: string;
  description?: string | null;
  amount: number;
  sort_order: number;
};

export type AINarrative = {
  introduction: string;
  scope: string[];
};

export type AIModuleDetail = {
  name: string;
  features: string[];
};

export type AIProductOrProjectDetail = {
  mode: string;
  modules?: AIModuleDetail[];
  goals?: string[];
  deliverables?: string[];
  milestones?: Record<string, unknown>[];
  team?: Record<string, unknown>[];
};

export type AIDiagram = {
  type: string;
  title: string;
  description?: string;
  columns?: Record<string, unknown>[];
  nodes?: Record<string, unknown>[];
  edges?: Record<string, unknown>[];
  states?: Record<string, unknown>[];
  transitions?: Record<string, unknown>[];
  steps?: Record<string, unknown>[];
  events?: Record<string, unknown>[];
  comparison?: Record<string, unknown>[];
};

export type AIBlueprint = {
  title: string;
  summary: string;
  actors: Record<string, unknown>[];
  diagrams: AIDiagram[];
  rules: string[];
  assumptions: string[];
  edge_cases: string[];
  outputs: string[];
};

export type QuotationRevision = {
  id: string;
  revision_number: number;
  public_token: string;
  budget: number;
  project_description?: string | null;
  scope_of_work?: string | null;
  maintenance_info?: string | null;
  hosting_info?: string | null;
  notes?: string | null;
  client_snapshot?: Record<string, unknown> | null;
  narrative_data?: AINarrative | null;
  product_detail_data?: AIProductOrProjectDetail | null;
  blueprint_data?: AIBlueprint | null;
  signature_image_url?: string | null;
  signed_at?: string | null;
  items?: QuotationItem[];
  sections?: PricingSection[];
};

export type Quotation = {
  id: string;
  company_id?: string;
  client_id: string;
  client_name?: string | null;
  quotation_number: string;
  project_type: ProjectType;
  status: QuotationStatus;
  current_revision: number;
  created_at: string;
  updated_at: string;
  revision?: QuotationRevision | null;
};

export type PublicQuotation = {
  quotation_number: string;
  client_name?: string | null;
  project_type: ProjectType;
  status: QuotationStatus;
  created_at: string;
  revision?: {
    revision_number: number;
    public_token: string;
    budget: number;
    project_description?: string | null;
    scope_of_work?: string | null;
    maintenance_info?: string | null;
    hosting_info?: string | null;
    notes?: string | null;
    client_snapshot?: Record<string, unknown> | null;
    narrative_data?: AINarrative | null;
    signature_image_url?: string | null;
    signed_at?: string | null;
    items?: QuotationItem[];
    sections?: PricingSection[];
  } | null;
};

export type PublicBlueprintResponse = {
  quotation_number: string;
  client_name?: string | null;
  subject?: string | null;
  blueprint_data: AIBlueprint;
};

export type PublicDetailResponse = {
  quotation_number: string;
  client_name?: string | null;
  subject?: string | null;
  narrative_data?: AINarrative | null;
  product_detail_data?: AIProductOrProjectDetail | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type QuotationListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: QuotationStatus | '';
};

export type CreateQuotationItemPayload = {
  item_name: string;
  description?: string;
  amount: number;
  sort_order: number;
};

export type CreateQuotationPayload = {
  client_id: string;
  project_type: ProjectType;
  budget: number;
  items?: CreateQuotationItemPayload[];
  sections?: PricingSection[];
};

export type UpdateQuotationPayload = {
  budget?: number;
  project_description?: string;
  scope_of_work?: string;
  maintenance_info?: string;
  hosting_info?: string;
  notes?: string;
  client_snapshot?: Record<string, unknown>;
  narrative_data?: AINarrative;
  product_detail_data?: AIProductOrProjectDetail;
  blueprint_data?: AIBlueprint;
  sections?: PricingSection[];
};

export type AIGeneratePayload = {
  project_type: ProjectType;
  client_name: string;
  client_industry: string;
  budget: number;
  client_requirements: string[];
  user_notes?: string;
};

export type AIGenerateResponse = {
  schema_version: string;
  narrative: AINarrative;
  product_or_project_detail: AIProductOrProjectDetail;
  blueprint: AIBlueprint;
  pricing_labels?: string[];
};

export type SignPublicQuotationPayload = {
  signature_image: string;
};
