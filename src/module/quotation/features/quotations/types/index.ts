export type QuotationStatus =
  | 'draft'
  | 'published'
  | 'signed'
  | 'queued'
  | 'failed'
  | 'shared'
  | 'contract_created';

export type ProjectType = 'product_based' | 'project_based';

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
  signature_image_url?: string | null;
  signed_at?: string | null;
};

export type Quotation = {
  id: string;
  company_id?: string;
  client_id: string;
  client_name?: string | null;
  pic_name?: string | null;
  quotation_number: string;
  solution_type: string;
  commercial_scheme?: string | null;
  status: QuotationStatus;
  current_revision: number;
  created_at: string;
  updated_at: string;
  budget_maximum?: number | null;
  total_investment?: number | null;
  revision?: QuotationRevision | null;
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

export type CreateQuotationPayload = {
  client_id: string;
  project_type: ProjectType;
  budget: number;
};

export type UpdateQuotationPayload = {
  budget?: number;
  project_description?: string;
  scope_of_work?: string;
  maintenance_info?: string;
  hosting_info?: string;
  notes?: string;
  client_snapshot?: Record<string, unknown>;
};

export * from './generation';
export * from './prompt-first';
export * from './quotation-entry';
