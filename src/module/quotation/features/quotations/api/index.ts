import type {
  Quotation,
  PaginationMeta,
  QuotationListParams,
  CreateQuotationPayload,
  UpdateQuotationPayload,
} from '../types';

import axios, { endpoints } from 'src/shared/lib/axios';

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  errors?: string | { detail?: string[] } | null;
  meta?: { pagination?: Partial<PaginationMeta> };
};

function extractError(payload: ApiEnvelope<unknown>) {
  if (!payload.errors) return payload.message ?? 'Empty response';
  if (typeof payload.errors === 'string') return payload.errors;
  return payload.errors.detail?.[0] ?? payload.message ?? 'Request failed';
}

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>) {
  const response = await promise;
  if (response.data.data === undefined || response.data.data === null) {
    throw new Error(extractError(response.data));
  }
  return response.data.data;
}

export async function listQuotations(params: QuotationListParams) {
  const response = await axios.get<ApiEnvelope<Quotation[]>>(endpoints.quotation.quotations.list, {
    params,
  });
  const payload = response.data;
  const data = payload.data ?? [];
  const pagination = payload.meta?.pagination;

  return {
    data,
    meta: {
      page: pagination?.page ?? params.page ?? 1,
      limit: pagination?.limit ?? params.limit ?? data.length,
      total: pagination?.total ?? data.length,
      total_pages: pagination?.total_pages ?? 1,
    } satisfies PaginationMeta,
  };
}

export function getQuotation(id: string) {
  return unwrap<Quotation>(axios.get(endpoints.quotation.quotations.byId(id)));
}

export function createQuotation(payload: CreateQuotationPayload) {
  return unwrap<Quotation>(axios.post(endpoints.quotation.quotations.create, payload));
}

export function updateQuotation(id: string, payload: UpdateQuotationPayload) {
  return unwrap<Quotation>(axios.put(endpoints.quotation.quotations.update(id), payload));
}

export * from './generation';
