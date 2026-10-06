import axios, { endpoints } from 'src/shared/lib/axios';

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  errors?: string | { detail?: string[] } | null;
};

function extractError(payload: ApiEnvelope<unknown>): string {
  if (!payload.errors) return payload.message ?? 'Request failed';
  if (typeof payload.errors === 'string') return payload.errors;
  return payload.errors.detail?.[0] ?? payload.message ?? 'Request failed';
}

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const response = await promise;
  if (response.data.data === undefined || response.data.data === null) {
    throw new Error(extractError(response.data));
  }
  return response.data.data;
}

export type PublishQuotationRequest = {
  revision_id: string;
  content_version: number;
  confirm_legal_modified: boolean;
  confirm_commercial_modified: boolean;
};

export type QuotationRevisionResponse = {
  id: string;
  quotation_id: string;
  revision_number: number;
  publication_status: 'draft' | 'published' | 'superseded';
  content_version: number;
  [key: string]: any;
};

export type QuotationRevisionHistoryItem = {
  id: string;
  revision_number: number;
  publication_status: 'draft' | 'published' | 'superseded';
  is_signed: boolean;
  legal_content_modified: boolean;
  commercial_content_modified: boolean;
  created_at: string;
  generated_at?: string | null;
  published_at?: string | null;
  signed_at?: string | null;
  created_by?: string | null;
  rate_card_version?: string | null;
  legal_template_version?: string | null;
  prompt_version?: string | null;
  safety_envelope_version?: string | null;
  [key: string]: any;
};

export async function publishQuotation(
  id: string,
  req: PublishQuotationRequest
): Promise<{ status: string }> {
  return unwrap<{ status: string }>(axios.post(endpoints.quotation.quotations.publish(id), req));
}

export async function createQuotationRevision(id: string): Promise<QuotationRevisionResponse> {
  return unwrap<QuotationRevisionResponse>(
    axios.post(endpoints.quotation.quotations.revisions(id))
  );
}

export async function getQuotationHistory(id: string): Promise<QuotationRevisionHistoryItem[]> {
  return unwrap<QuotationRevisionHistoryItem[]>(
    axios.get(endpoints.quotation.quotations.revisions(id), {
      params: { view: 'history' },
    })
  );
}
