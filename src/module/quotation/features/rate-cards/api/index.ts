import type {
  RateCardListParams,
  CreateRateCardPayload,
  RateCardDetailResponse,
  RateCardSummaryResponse,
} from '../types';

import axios, { endpoints } from 'src/shared/lib/axios';

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  errors?: string | { detail?: string[] } | null;
};

function extractError(payload: ApiEnvelope<unknown>): string {
  if (!payload.errors) return payload.message ?? 'Empty response';
  if (typeof payload.errors === 'string') return payload.errors;
  return payload.errors.detail?.[0] ?? payload.message ?? 'Request failed';
}

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> | T }>): Promise<T> {
  const response = await promise;
  const payload = response.data;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.data === undefined || envelope.data === null) {
      throw new Error(extractError(envelope));
    }
    return envelope.data;
  }
  return payload as T;
}

export async function getRateCards(
  params?: RateCardListParams
): Promise<RateCardSummaryResponse[]> {
  const queryParams: Record<string, unknown> = {};
  if (params?.active_only !== undefined) {
    queryParams.active_only = params.active_only;
  }
  if (params?.status) {
    queryParams.status = params.status;
  }
  if (params?.search) {
    queryParams.search = params.search;
  }

  const result = await unwrap<RateCardSummaryResponse[] | { items: RateCardSummaryResponse[] }>(
    axios.get(endpoints.quotation.rateCards.list, { params: queryParams })
  );

  if (Array.isArray(result)) {
    return result;
  }
  if (result && Array.isArray((result as any).items)) {
    return (result as any).items;
  }
  return [];
}

export function getRateCardDetail(id: string): Promise<RateCardDetailResponse> {
  return unwrap<RateCardDetailResponse>(axios.get(endpoints.quotation.rateCards.details(id)));
}

export function createRateCard(payload: CreateRateCardPayload): Promise<RateCardDetailResponse> {
  return unwrap<RateCardDetailResponse>(axios.post(endpoints.quotation.rateCards.create, payload));
}

export async function deleteRateCard(id: string): Promise<void> {
  await axios.delete(endpoints.quotation.rateCards.delete(id));
}
