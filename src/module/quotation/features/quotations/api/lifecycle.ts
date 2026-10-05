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

export async function publishQuotation(
  id: string,
  req: PublishQuotationRequest
): Promise<{ status: string }> {
  return unwrap<{ status: string }>(
    axios.post(endpoints.quotation.quotations.publish(id), req)
  );
}

export async function createQuotationRevision(
  id: string
): Promise<QuotationRevisionResponse> {
  return unwrap<QuotationRevisionResponse>(
    axios.post(endpoints.quotation.quotations.revisions(id))
  );
}
