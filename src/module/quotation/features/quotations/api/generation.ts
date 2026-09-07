import type {
  ActiveSkill,
  ClientSummary,
  RateCardSummary,
  SaveDraftPayload,
  SaveDraftResultResponse,
  GenerationStateResponse,
  GenerateQuotationPayload,
  QuotationGenerationDetail,
  GenerateQuotationResponse,
  DedicatedSquadPreviewResponse,
  SubscriptionSaaSPreviewResponse,
} from '../types';

import axios, { endpoints } from 'src/shared/lib/axios';

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  errors?: string | { detail?: string[] } | null;
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

export function generateQuotation(payload: GenerateQuotationPayload) {
  return unwrap<GenerateQuotationResponse>(
    axios.post(endpoints.quotation.quotations.generate, payload)
  );
}

/**
 * Calculate the dedicated squad preview. The server owns all money math and
 * visibility decisions; this request never persists a quotation or invokes
 * the AI provider.
 */
export function previewDedicatedSquad(payload: GenerateQuotationPayload, signal?: AbortSignal) {
  return unwrap<DedicatedSquadPreviewResponse>(
    axios.post(endpoints.quotation.quotations.preview, payload, { signal })
  );
}

/**
 * Calculate the subscription SaaS preview. The server owns all money math,
 * section planning, and profile resolutions without calling AI or persisting data.
 */
export function previewSubscriptionSaaS(payload: GenerateQuotationPayload, signal?: AbortSignal) {
  return unwrap<SubscriptionSaaSPreviewResponse>(
    axios.post(endpoints.quotation.quotations.subscriptionPreview, payload, { signal })
  );
}

export function getGenerationStatus(id: string) {
  return unwrap<GenerationStateResponse>(
    axios.get(endpoints.quotation.quotations.generationStatus(id))
  );
}

export function regenerateQuotation(id: string) {
  return unwrap<GenerationStateResponse>(
    axios.post(endpoints.quotation.quotations.regenerate(id))
  );
}

export function getQuotationDetail(id: string) {
  return unwrap<QuotationGenerationDetail>(axios.get(endpoints.quotation.quotations.byId(id)));
}

export function saveQuotationDraft(id: string, payload: SaveDraftPayload) {
  return unwrap<SaveDraftResultResponse>(
    axios.put(endpoints.quotation.quotations.saveDraft(id), payload)
  );
}

export function getActiveSkills() {
  return unwrap<ActiveSkill[]>(axios.get(endpoints.quotation.ai.skills));
}

export function getActiveRateCards() {
  return unwrap<RateCardSummary[]>(
    axios.get(endpoints.quotation.rateCards.list, { params: { status: 'active' } })
  );
}

export async function getClients(): Promise<ClientSummary[]> {
  const res = await unwrap<ClientSummary[] | { items: ClientSummary[]; total: number }>(
    axios.get(endpoints.core.clients)
  );
  if (Array.isArray(res)) {
    return res;
  }
  if (res && Array.isArray((res as any).items)) {
    return (res as any).items;
  }
  return [];
}

