import type {
  Quotation,
  PaginationMeta,
  PublicQuotation,
  AIGeneratePayload,
  AIGenerateResponse,
  QuotationListParams,
  PublicDetailResponse,
  CreateQuotationPayload,
  UpdateQuotationPayload,
  PublicBlueprintResponse,
  SignPublicQuotationPayload,
} from '../types';

import axios, { endpoints, withoutAuthRefresh } from 'src/shared/lib/axios';

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

export function generateQuotationAI(payload: AIGeneratePayload) {
  return unwrap<AIGenerateResponse>(axios.post(endpoints.quotation.ai.generate, payload));
}

export function getPublicQuotation(token: string) {
  return unwrap<PublicQuotation>(axios.get(endpoints.quotation.public.byToken(token), withoutAuthRefresh()));
}

export function signPublicQuotation(token: string, payload: SignPublicQuotationPayload) {
  return unwrap<PublicQuotation>(axios.post(endpoints.quotation.public.sign(token), payload, withoutAuthRefresh()));
}

export function getPublicBlueprint(token: string) {
  return unwrap<PublicBlueprintResponse>(axios.get(endpoints.quotation.public.blueprint(token), withoutAuthRefresh()));
}

export function getPublicDetail(token: string) {
  return unwrap<PublicDetailResponse>(axios.get(endpoints.quotation.public.detail(token), withoutAuthRefresh()));
}
